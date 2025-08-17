import { NextRequest, NextResponse } from 'next/server';
import { JWTManager, APIKeyManager, AuthUtils } from '@/lib/auth';

/**
 * 生成JWT Token
 * POST /api/auth/token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, apiKey } = body;

    // 方式1: 使用邮箱密码登录（简化版，实际项目中应该验证数据库）
    if (email && password) {
      // 简化的用户验证逻辑
      const isValidUser = await validateUser(email, password);
      
      if (!isValidUser) {
        return NextResponse.json(
          AuthUtils.createAuthErrorResponse('邮箱或密码错误', 'INVALID_CREDENTIALS'),
          { status: 401 }
        );
      }

      // 生成JWT Token
      const user = {
        id: 'user_' + Math.random().toString(36).substring(2),
        email,
        role: 'user',
        name: email.split('@')[0]
      };

      const token = await JWTManager.generateToken(user);

      return NextResponse.json({
        success: true,
        data: {
          token,
          user,
          expiresIn: '24h',
          tokenType: 'Bearer'
        }
      });
    }

    // 方式2: 使用管理员API Key生成Token
    if (apiKey) {
      const adminApiKey = process.env.ADMIN_API_KEY;
      
      if (!adminApiKey || apiKey !== adminApiKey) {
        return NextResponse.json(
          AuthUtils.createAuthErrorResponse('管理员API Key无效', 'INVALID_ADMIN_KEY'),
          { status: 401 }
        );
      }

      // 生成系统管理员Token
      const adminUser = {
        id: 'admin',
        email: 'admin@system.local',
        role: 'admin',
        name: 'System Admin'
      };

      const token = await JWTManager.generateToken(adminUser, '7d'); // 管理员Token 7天有效

      return NextResponse.json({
        success: true,
        data: {
          token,
          user: adminUser,
          expiresIn: '7d',
          tokenType: 'Bearer'
        }
      });
    }

    return NextResponse.json(
      AuthUtils.createAuthErrorResponse('缺少必需的认证参数', 'MISSING_CREDENTIALS'),
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Auth Token] 生成Token失败:', error);

    return NextResponse.json(
      AuthUtils.createAuthErrorResponse('Token生成失败', 'TOKEN_GENERATION_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * 验证Token
 * GET /api/auth/token
 */
export async function GET(request: NextRequest) {
  try {
    const { bearerToken } = AuthUtils.extractAuthFromHeaders(request.headers);

    if (!bearerToken) {
      return NextResponse.json(
        AuthUtils.createAuthErrorResponse('缺少Token', 'MISSING_TOKEN'),
        { status: 401 }
      );
    }

    // 验证Token
    const payload = await JWTManager.verifyToken(bearerToken);

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        user: {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          name: payload.name
        },
        expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
        issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : null
      }
    });

  } catch (error: any) {
    console.error('[Auth Token] Token验证失败:', error);

    return NextResponse.json(
      AuthUtils.createAuthErrorResponse('Token无效', 'INVALID_TOKEN'),
      { status: 401 }
    );
  }
}

/**
 * 刷新Token
 * PUT /api/auth/token
 */
export async function PUT(request: NextRequest) {
  try {
    const { bearerToken } = AuthUtils.extractAuthFromHeaders(request.headers);

    if (!bearerToken) {
      return NextResponse.json(
        AuthUtils.createAuthErrorResponse('缺少Token', 'MISSING_TOKEN'),
        { status: 401 }
      );
    }

    // 刷新Token
    const newToken = await JWTManager.refreshToken(bearerToken);

    // 如果返回的是原Token，说明不需要刷新
    const isRefreshed = newToken !== bearerToken;

    return NextResponse.json({
      success: true,
      data: {
        token: newToken,
        refreshed: isRefreshed,
        message: isRefreshed ? 'Token已刷新' : 'Token仍然有效，无需刷新'
      }
    });

  } catch (error: any) {
    console.error('[Auth Token] Token刷新失败:', error);

    return NextResponse.json(
      AuthUtils.createAuthErrorResponse('Token刷新失败', 'TOKEN_REFRESH_ERROR'),
      { status: 401 }
    );
  }
}

/**
 * 简化的用户验证逻辑
 * 实际项目中应该连接数据库进行验证
 */
async function validateUser(email: string, password: string): Promise<boolean> {
  // 开发环境的测试账号
  const testAccounts = [
    { email: 'admin@test.com', password: 'admin123' },
    { email: 'user@test.com', password: 'user123' },
    { email: 'demo@livebook.com', password: 'demo123' }
  ];

  return testAccounts.some(account => 
    account.email === email && account.password === password
  );
}