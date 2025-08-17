import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';

/**
 * 认证测试接口
 * 此接口需要认证保护，用于测试中间件功能
 */
export async function GET(request: NextRequest) {
  try {
    // 获取认证信息（由中间件添加）
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const userEmail = request.headers.get('x-user-email') || '';
    const authMethod = request.headers.get('x-auth-method') || 'none';

    console.log(`[Test Auth] 认证信息: 用户ID=${userId}, 邮箱=${userEmail}, 认证方式=${authMethod}`);

    return ApiResponseBuilder.success({
      message: '认证成功！您可以访问受保护的API',
      user: {
        id: userId,
        email: userEmail,
        authMethod
      },
      timestamp: new Date().toISOString(),
      protectedEndpoint: true
    });

  } catch (error: any) {
    console.error('[Test Auth] 处理请求失败:', error);
    return ApiResponseBuilder.serverError('测试接口异常');
  }
}

/**
 * 测试POST请求认证
 */
export async function POST(request: NextRequest) {
  try {
    // 获取认证信息
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const userEmail = request.headers.get('x-user-email') || '';
    const authMethod = request.headers.get('x-auth-method') || 'none';

    const body = await request.json();

    return ApiResponseBuilder.success({
      message: 'POST请求认证成功',
      receivedData: body,
      user: {
        id: userId,
        email: userEmail,
        authMethod
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Test Auth POST] 处理请求失败:', error);
    return ApiResponseBuilder.serverError('POST测试接口异常');
  }
}