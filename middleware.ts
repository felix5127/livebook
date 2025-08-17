import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { checkRateLimit, AuthMethod } from '@/lib/rate-limiter';

// 需要认证保护的API路径
const PROTECTED_PATHS = [
  '/api/transcribe',
  '/api/ai/',
  '/api/tasks/',
  '/api/test-auth',
  '/api/rate-limit-test'
];

// 开发环境跳过认证的路径
const DEV_BYPASS_PATHS = [
  '/api/health',
  '/api/status',
];

/**
 * API认证中间件
 * 支持JWT Token和API Key两种认证方式
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只处理API路由
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 检查是否需要认证保护
  const needsAuth = PROTECTED_PATHS.some(path => pathname.startsWith(path));
  
  if (!needsAuth) {
    return NextResponse.next();
  }

  // 开发环境便利性设置
  if (process.env.NODE_ENV === 'development') {
    const skipAuth = process.env.SKIP_API_AUTH === 'true';
    const isBypassPath = DEV_BYPASS_PATHS.some(path => pathname.startsWith(path));
    
    if (skipAuth || isBypassPath) {
      return NextResponse.next();
    }
  }

  try {
    // 认证检查
    const authResult = await authenticateRequest(request);
    
    if (!authResult.success) {
      return createErrorResponse(authResult.error || 'Authentication failed', authResult.status || 401);
    }

    // 速率限制检查
    const authMethod = (authResult.method as AuthMethod) || 'anonymous';
    const userId = authResult.user?.id;
    
    const rateLimitResult = await checkRateLimit(request, authMethod, userId);
    
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    // 认证成功，将用户信息添加到请求头
    const requestHeaders = new Headers(request.headers);
    if (authResult.user) {
      requestHeaders.set('x-user-id', authResult.user.id);
      requestHeaders.set('x-user-email', authResult.user.email ? authResult.user.email : '');
      requestHeaders.set('x-auth-method', authResult.method || 'unknown');
    }

    // 添加速率限制响应头
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // 设置速率限制响应头
    response.headers.set('X-RateLimit-Limit', rateLimitResult.rule.max.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
    response.headers.set('X-RateLimit-Window', rateLimitResult.rule.window.toString());

    return response;

  } catch (error: any) {
    console.error('[Auth Middleware] 认证错误:', error);
    return createErrorResponse('认证服务异常', 500);
  }
}

/**
 * 认证请求
 * 支持JWT Token和API Key两种方式
 */
async function authenticateRequest(request: NextRequest): Promise<{
  success: boolean;
  error?: string;
  status?: number;
  user?: any;
  method?: string;
}> {
  const authorization = request.headers.get('authorization');
  const apiKey = request.headers.get('x-api-key');

  // 方式1：JWT Token认证
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice(7);
    return await verifyJWTToken(token);
  }

  // 方式2：API Key认证
  if (apiKey) {
    return await verifyAPIKey(apiKey);
  }

  return {
    success: false,
    error: '缺少认证信息。请提供Bearer Token或API Key',
    status: 401
  };
}

/**
 * 验证JWT Token
 */
async function verifyJWTToken(token: string): Promise<{
  success: boolean;
  error?: string;
  status?: number;
  user?: any;
  method?: string;
}> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return {
        success: false,
        error: 'JWT配置错误',
        status: 500
      };
    }

    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);

    // 检查token是否过期
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return {
        success: false,
        error: 'Token已过期',
        status: 401
      };
    }

    return {
      success: true,
      user: {
        id: payload.sub as string,
        email: payload.email as string,
        role: payload.role as string
      },
      method: 'JWT'
    };

  } catch (error: any) {
    console.error('[Auth] JWT验证失败:', error);
    return {
      success: false,
      error: 'Token无效',
      status: 401
    };
  }
}

/**
 * 验证API Key
 */
async function verifyAPIKey(apiKey: string): Promise<{
  success: boolean;
  error?: string;
  status?: number;
  user?: any;
  method?: string;
}> {
  try {
    // 获取配置的API密钥
    const validApiKeys = (process.env.VALID_API_KEYS || '').split(',').filter(Boolean);
    
    if (validApiKeys.length === 0) {
      return {
        success: false,
        error: 'API Key认证未配置',
        status: 500
      };
    }

    // 检查API Key是否有效
    if (!validApiKeys.includes(apiKey)) {
      return {
        success: false,
        error: 'API Key无效',
        status: 401
      };
    }

    // API Key认证成功
    return {
      success: true,
      user: {
        id: 'api-user',
        email: 'api@system.local',
        role: 'api'
      },
      method: 'API_KEY'
    };

  } catch (error: any) {
    console.error('[Auth] API Key验证失败:', error);
    return {
      success: false,
      error: 'API Key验证异常',
      status: 500
    };
  }
}

/**
 * 创建错误响应
 */
function createErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: '认证失败',
      message,
      code: 'AUTH_ERROR',
      timestamp: new Date().toISOString()
    },
    { 
      status,
      headers: status === 401 ? {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="api"'
      } : {
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * 创建速率限制响应
 */
function createRateLimitResponse(rateLimitResult: {
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  rule: { max: number; window: number };
}): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: '请求频率超出限制',
      message: `请求过于频繁，请稍后重试`,
      code: 'RATE_LIMIT_EXCEEDED',
      details: {
        limit: rateLimitResult.rule.max,
        window: rateLimitResult.rule.window,
        remaining: rateLimitResult.remaining,
        resetTime: new Date(rateLimitResult.resetTime).toISOString(),
        retryAfter: rateLimitResult.retryAfter
      },
      timestamp: new Date().toISOString()
    },
    { 
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': rateLimitResult.rule.max.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        'X-RateLimit-Window': rateLimitResult.rule.window.toString(),
        'Retry-After': rateLimitResult.retryAfter?.toString() || rateLimitResult.rule.window.toString()
      }
    }
  );

  return response;
}

// 中间件配置
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|public/).*)'
  ]
};