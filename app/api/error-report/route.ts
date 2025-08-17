import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { ApiResponseBuilder } from '@/lib/api-response';

interface ErrorReportData {
  errorId: string;
  error: {
    name?: string;
    message?: string;
    stack?: string;
  };
  errorInfo?: any;
  context?: any;
  url?: string;
  userAgent?: string;
  timestamp: string;
  retryCount?: number;
  userId?: string;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 获取用户信息（如果有的话）
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const userEmail = request.headers.get('x-user-email') || '';
    const userAgent = request.headers.get('user-agent') || '';
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    const reportData: ErrorReportData = await request.json();

    // 验证必需字段
    if (!reportData.errorId || !reportData.error) {
      return ApiResponseBuilder.clientError(
        '错误报告数据不完整',
        'INVALID_ERROR_REPORT'
      );
    }

    // 增强错误报告数据
    const enhancedReport = {
      ...reportData,
      userId,
      userEmail,
      userAgent: userAgent || reportData.userAgent,
      clientIP,
      serverTimestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || 'unknown'
    };

    // 记录错误报告到日志系统
    logger.error('Client Error Report Received', new Error(reportData.error.message), {
      component: 'ErrorReportAPI',
      action: 'submitErrorReport',
      errorId: reportData.errorId,
      userId,
      userEmail,
      url: reportData.url,
      userAgent,
      clientIP,
      retryCount: reportData.retryCount,
      originalStack: reportData.error.stack,
      context: reportData.context
    });

    // 增加错误报告指标
    logger.incrementCounter('error_reports_received', 1, {
      component: reportData.context?.component,
      errorType: reportData.error.name,
      level: reportData.context?.level
    });

    // 检查是否是高频错误（同一错误ID在短时间内多次报告）
    const errorFrequency = await checkErrorFrequency(reportData.errorId);
    if (errorFrequency > 5) {
      logger.warn('High Frequency Error Detected', undefined, {
        component: 'ErrorReportAPI',
        action: 'highFrequencyDetection',
        errorId: reportData.errorId,
        frequency: errorFrequency
      });
      
      // 可以在这里触发警报或自动处理
    }

    // 如果是生产环境，可以发送到外部错误监控服务
    if (process.env.NODE_ENV === 'production') {
      await sendToExternalMonitoring(enhancedReport);
    }

    // 存储错误报告到数据库（如果需要）
    // await storeErrorReport(enhancedReport);

    return ApiResponseBuilder.success({
      reportId: reportData.errorId,
      status: 'received',
      message: '错误报告已收到，感谢您的反馈'
    });

  } catch (error: any) {
    logger.error('Error Report API Failed', error, {
      component: 'ErrorReportAPI',
      action: 'processErrorReport'
    });

    return ApiResponseBuilder.serverError(
      '处理错误报告失败',
      'ERROR_REPORT_PROCESSING_FAILED',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
}

// 检查错误频率（简单的内存存储，生产环境应使用Redis等）
const errorFrequencyMap = new Map<string, { count: number; lastSeen: number }>();

async function checkErrorFrequency(errorId: string): Promise<number> {
  const now = Date.now();
  const timeWindow = 5 * 60 * 1000; // 5分钟窗口
  
  const existing = errorFrequencyMap.get(errorId);
  if (existing && now - existing.lastSeen < timeWindow) {
    existing.count += 1;
    existing.lastSeen = now;
    return existing.count;
  } else {
    errorFrequencyMap.set(errorId, { count: 1, lastSeen: now });
    return 1;
  }
}

// 发送到外部监控服务
async function sendToExternalMonitoring(reportData: any) {
  try {
    // 示例：发送到 Sentry
    // if (process.env.SENTRY_DSN) {
    //   await fetch(`${process.env.SENTRY_API_ENDPOINT}/errors`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${process.env.SENTRY_AUTH_TOKEN}`
    //     },
    //     body: JSON.stringify(reportData)
    //   });
    // }

    // 示例：发送到自定义监控服务
    if (process.env.CUSTOM_MONITORING_ENDPOINT) {
      await fetch(process.env.CUSTOM_MONITORING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MONITORING_AUTH_TOKEN}`
        },
        body: JSON.stringify(reportData)
      });
    }

    logger.info('Error Report Sent to External Monitoring', undefined, {
      component: 'ErrorReportAPI',
      action: 'sendToExternalMonitoring',
      errorId: reportData.errorId
    });

  } catch (error) {
    logger.error('Failed to Send to External Monitoring', error, {
      component: 'ErrorReportAPI',
      action: 'sendToExternalMonitoring',
      errorId: reportData.errorId
    });
  }
}

// 获取错误统计信息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    
    // 这里应该从数据库查询错误统计
    // 目前返回模拟数据
    const stats = {
      totalErrors: 0,
      errorsByType: {},
      errorsByComponent: {},
      errorFrequency: Array.from(errorFrequencyMap.entries()).map(([errorId, data]) => ({
        errorId,
        count: data.count,
        lastSeen: new Date(data.lastSeen).toISOString()
      })),
      timeRange,
      generatedAt: new Date().toISOString()
    };

    return ApiResponseBuilder.success(stats);

  } catch (error: any) {
    logger.error('Error Stats API Failed', error, {
      component: 'ErrorReportAPI',
      action: 'getErrorStats'
    });

    return ApiResponseBuilder.serverError(
      '获取错误统计失败',
      'ERROR_STATS_FAILED'
    );
  }
}