import { NextRequest, NextResponse } from 'next/server';
import { getRateLimiterStats } from '@/lib/rate-limiter';

/**
 * 速率限制测试API
 * 用于测试和调试速率限制功能
 */
export async function GET(request: NextRequest) {
  try {
    // 获取认证信息（由中间件添加）
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const userEmail = request.headers.get('x-user-email') || '';
    const authMethod = request.headers.get('x-auth-method') || 'none';

    // 获取速率限制响应头信息
    const rateLimitHeaders = {
      limit: request.headers.get('x-ratelimit-limit'),
      remaining: request.headers.get('x-ratelimit-remaining'),
      reset: request.headers.get('x-ratelimit-reset'),
      window: request.headers.get('x-ratelimit-window')
    };

    // 获取统计信息
    const stats = getRateLimiterStats();

    return NextResponse.json({
      success: true,
      message: '速率限制测试API',
      data: {
        timestamp: new Date().toISOString(),
        auth: {
          userId,
          userEmail,
          authMethod
        },
        rateLimit: rateLimitHeaders,
        stats
      }
    });

  } catch (error: any) {
    console.error('[RateLimit Test] 错误:', error);

    return NextResponse.json(
      {
        error: '测试API失败',
        details: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
      },
      { status: 500 }
    );
  }
}

/**
 * 批量测试API - 快速发送多个请求来测试速率限制
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count = 5 } = body;

    if (count > 20) {
      return NextResponse.json(
        { error: '测试请求数量不能超过20' },
        { status: 400 }
      );
    }

    // 获取认证信息
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const authMethod = request.headers.get('x-auth-method') || 'none';

    const results = [];
    
    for (let i = 0; i < count; i++) {
      results.push({
        request: i + 1,
        timestamp: new Date().toISOString(),
        message: `第 ${i + 1} 个测试请求`
      });
    }

    return NextResponse.json({
      success: true,
      message: `完成 ${count} 个测试请求`,
      data: {
        auth: { userId, authMethod },
        results,
        totalRequests: count
      }
    });

  } catch (error: any) {
    console.error('[RateLimit Batch Test] 错误:', error);

    return NextResponse.json(
      {
        error: '批量测试失败',
        details: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
      },
      { status: 500 }
    );
  }
}