import { NextRequest, NextResponse } from 'next/server';
import { getRateLimiterStats, RATE_LIMIT_CONFIG } from '@/lib/rate-limiter';

/**
 * 管理员API - 速率限制统计信息
 * 需要管理员权限
 */
export async function GET(request: NextRequest) {
  try {
    // 检查管理员权限
    const apiKey = request.headers.get('x-api-key');
    const adminApiKey = process.env.ADMIN_API_KEY;

    if (!adminApiKey) {
      return NextResponse.json(
        { error: '管理员API未配置' },
        { status: 500 }
      );
    }

    if (apiKey !== adminApiKey) {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      );
    }

    // 获取统计信息
    const stats = getRateLimiterStats();

    // 获取配置信息
    const config = {
      endpoints: Object.keys(RATE_LIMIT_CONFIG),
      totalRules: Object.values(RATE_LIMIT_CONFIG).reduce(
        (total, endpoint) => total + Object.keys(endpoint).length,
        0
      )
    };

    return NextResponse.json({
      success: true,
      data: {
        stats,
        config,
        rateLimitConfig: RATE_LIMIT_CONFIG,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }
    });

  } catch (error: any) {
    console.error('[Admin Rate Limit Stats] 错误:', error);

    return NextResponse.json(
      {
        error: '获取统计信息失败',
        details: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
      },
      { status: 500 }
    );
  }
}

/**
 * 清理速率限制记录（管理员功能）
 */
export async function DELETE(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const adminApiKey = process.env.ADMIN_API_KEY;

    if (apiKey !== adminApiKey) {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      );
    }

    // 动态导入以避免在生产环境中暴露清理功能
    if (process.env.NODE_ENV === 'development') {
      const { clearRateLimiter } = await import('@/lib/rate-limiter');
      clearRateLimiter();

      return NextResponse.json({
        success: true,
        message: '速率限制记录已清理',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { error: '生产环境不支持此操作' },
        { status: 403 }
      );
    }

  } catch (error: any) {
    console.error('[Admin Rate Limit Clear] 错误:', error);

    return NextResponse.json(
      {
        error: '清理操作失败',
        details: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
      },
      { status: 500 }
    );
  }
}