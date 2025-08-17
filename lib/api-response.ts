import { NextResponse } from 'next/server';

/**
 * 标准API响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

/**
 * 认证错误响应格式
 */
export interface AuthErrorResponse extends ApiResponse {
  success: false;
  error: string;
  code: string;
  details?: string;
}

/**
 * API响应构建器
 */
export class ApiResponseBuilder {
  /**
   * 成功响应
   */
  static success<T>(data: T, message?: string): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 200 });
  }

  /**
   * 创建的资源响应
   */
  static created<T>(data: T, message?: string): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message: message || '资源创建成功',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 201 });
  }

  /**
   * 无内容响应
   */
  static noContent(message?: string): NextResponse {
    const response: ApiResponse = {
      success: true,
      message: message || '操作成功完成',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 204 });
  }

  /**
   * 客户端错误响应
   */
  static clientError(
    message: string, 
    code: string = 'CLIENT_ERROR',
    details?: string,
    status: number = 400
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: message,
      code,
      details,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status });
  }

  /**
   * 认证错误响应
   */
  static authError(
    message: string,
    code: string = 'AUTH_ERROR',
    details?: string,
    status: number = 401
  ): NextResponse {
    const response: AuthErrorResponse = {
      success: false,
      error: message,
      code,
      details,
      timestamp: new Date().toISOString()
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // 添加WWW-Authenticate头
    if (status === 401) {
      headers['WWW-Authenticate'] = 'Bearer realm="api", error="invalid_token"';
    }

    return NextResponse.json(response, { status, headers });
  }

  /**
   * 服务器错误响应
   */
  static serverError(
    message: string = '内部服务器错误',
    code: string = 'SERVER_ERROR',
    details?: string,
    status: number = 500
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: message,
      code,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status });
  }

  /**
   * 验证错误响应
   */
  static validationError(
    message: string,
    validationErrors?: Record<string, string[]>
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: message,
      code: 'VALIDATION_ERROR',
      data: validationErrors,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 422 });
  }

  /**
   * 限流错误响应
   */
  static rateLimitError(
    message: string = '请求过于频繁，请稍后重试',
    retryAfter?: number
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: message,
      code: 'RATE_LIMIT_ERROR',
      timestamp: new Date().toISOString()
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (retryAfter) {
      headers['Retry-After'] = retryAfter.toString();
    }

    return NextResponse.json(response, { status: 429, headers });
  }

  /**
   * 资源未找到错误响应
   */
  static notFound(
    resource: string = '资源',
    id?: string
  ): NextResponse {
    const message = id ? `${resource} (ID: ${id}) 未找到` : `${resource}未找到`;
    
    const response: ApiResponse = {
      success: false,
      error: message,
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 404 });
  }

  /**
   * 冲突错误响应
   */
  static conflict(
    message: string,
    details?: string
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: message,
      code: 'CONFLICT',
      details,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 409 });
  }

  /**
   * 权限不足错误响应
   */
  static forbidden(
    message: string = '权限不足',
    details?: string
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: message,
      code: 'FORBIDDEN',
      details,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 403 });
  }
}

/**
 * 常用认证错误代码
 */
export const AUTH_ERROR_CODES = {
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  MISSING_API_KEY: 'MISSING_API_KEY',
  INVALID_API_KEY: 'INVALID_API_KEY',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  AUTH_SERVICE_ERROR: 'AUTH_SERVICE_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  TOKEN_REFRESH_ERROR: 'TOKEN_REFRESH_ERROR'
} as const;

/**
 * 常用业务错误代码
 */
export const BUSINESS_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED'
} as const;

/**
 * HTTP状态码枚举
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;

/**
 * 创建标准化错误处理中间件
 */
export function createErrorHandler() {
  return (error: any, context?: string) => {
    console.error(`[${context || 'API'}] 错误:`, error);

    // 解析不同类型的错误
    if (error.name === 'ValidationError') {
      return ApiResponseBuilder.validationError(
        '输入数据验证失败',
        error.details
      );
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return ApiResponseBuilder.serverError(
        '外部服务连接失败',
        'EXTERNAL_SERVICE_ERROR',
        error.message
      );
    }

    if (error.status && error.status < 500) {
      return ApiResponseBuilder.clientError(
        error.message || '客户端请求错误',
        error.code || 'CLIENT_ERROR',
        undefined,
        error.status
      );
    }

    // 默认服务器错误
    return ApiResponseBuilder.serverError(
      '服务暂时不可用',
      'SERVER_ERROR',
      error.message
    );
  };
}