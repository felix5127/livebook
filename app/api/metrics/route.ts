import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { ApiResponseBuilder } from '@/lib/api-response';
import type { APICallMetrics, PagePerformanceMetrics, UserInteractionMetrics } from '@/lib/performance-monitor';

interface MetricsPayload {
  type: 'api-metrics' | 'page-metrics' | 'interaction-metrics';
  metrics: any[];
  timestamp: string;
}

// 简单的内存存储（生产环境应使用数据库）
const metricsStore = {
  apiMetrics: [] as APICallMetrics[],
  pageMetrics: [] as PagePerformanceMetrics[],
  interactionMetrics: [] as UserInteractionMetrics[]
};

// 最大存储数量（防止内存泄漏）
const MAX_STORED_METRICS = 1000;

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const userAgent = request.headers.get('user-agent') || '';
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    const payload: MetricsPayload = await request.json();

    // 验证数据格式
    if (!payload.type || !Array.isArray(payload.metrics)) {
      return ApiResponseBuilder.clientError(
        '指标数据格式错误',
        'INVALID_METRICS_FORMAT'
      );
    }

    // 增强指标数据
    const enhancedMetrics = payload.metrics.map(metric => ({
      ...metric,
      userId,
      userAgent,
      clientIP,
      serverTimestamp: new Date().toISOString()
    }));

    // 存储指标数据
    await storeMetrics(payload.type, enhancedMetrics);

    // 分析异常指标
    await analyzeMetrics(payload.type, enhancedMetrics);

    // 记录收到的指标
    logger.info('Performance Metrics Received', {
      type: payload.type,
      count: enhancedMetrics.length,
      userId,
      clientIP
    }, {
      component: 'MetricsAPI',
      action: 'receiveMetrics'
    });

    // 更新指标计数器
    logger.incrementCounter(`metrics_received_${payload.type}`, enhancedMetrics.length);

    return ApiResponseBuilder.success({
      received: enhancedMetrics.length,
      type: payload.type,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Metrics API Error', error, {
      component: 'MetricsAPI',
      action: 'receiveMetrics'
    });

    return ApiResponseBuilder.serverError(
      '处理性能指标失败',
      'METRICS_PROCESSING_FAILED',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
}

// 获取指标统计和分析
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as keyof typeof metricsStore;
    const timeRange = searchParams.get('timeRange') || '1h';
    const limit = parseInt(searchParams.get('limit') || '100');

    // 计算时间范围
    const now = new Date();
    const timeRangeMs = parseTimeRange(timeRange);
    const startTime = new Date(now.getTime() - timeRangeMs);

    let result: any = {};

    if (type && metricsStore[type]) {
      // 获取特定类型的指标
      const metrics = metricsStore[type]
        .filter(metric => new Date(metric.timestamp) >= startTime)
        .slice(-limit);
      
      result = {
        type,
        metrics,
        count: metrics.length,
        timeRange,
        analysis: await analyzeSpecificMetrics(type, metrics)
      };
    } else {
      // 获取所有指标的汇总
      result = {
        summary: {
          apiMetrics: {
            count: metricsStore.apiMetrics.length,
            recent: getRecentMetricsStats('apiMetrics', startTime)
          },
          pageMetrics: {
            count: metricsStore.pageMetrics.length,
            recent: getRecentMetricsStats('pageMetrics', startTime)
          },
          interactionMetrics: {
            count: metricsStore.interactionMetrics.length,
            recent: getRecentMetricsStats('interactionMetrics', startTime)
          }
        },
        timeRange,
        generatedAt: new Date().toISOString()
      };
    }

    return ApiResponseBuilder.success(result);

  } catch (error: any) {
    logger.error('Metrics Stats API Error', error, {
      component: 'MetricsAPI',
      action: 'getMetricsStats'
    });

    return ApiResponseBuilder.serverError(
      '获取指标统计失败',
      'METRICS_STATS_FAILED'
    );
  }
}

// 存储指标数据
async function storeMetrics(type: MetricsPayload['type'], metrics: any[]) {
  switch (type) {
    case 'api-metrics':
      metricsStore.apiMetrics.push(...metrics);
      // 限制存储数量
      if (metricsStore.apiMetrics.length > MAX_STORED_METRICS) {
        metricsStore.apiMetrics = metricsStore.apiMetrics.slice(-MAX_STORED_METRICS);
      }
      break;
      
    case 'page-metrics':
      metricsStore.pageMetrics.push(...metrics);
      if (metricsStore.pageMetrics.length > MAX_STORED_METRICS) {
        metricsStore.pageMetrics = metricsStore.pageMetrics.slice(-MAX_STORED_METRICS);
      }
      break;
      
    case 'interaction-metrics':
      metricsStore.interactionMetrics.push(...metrics);
      if (metricsStore.interactionMetrics.length > MAX_STORED_METRICS) {
        metricsStore.interactionMetrics = metricsStore.interactionMetrics.slice(-MAX_STORED_METRICS);
      }
      break;
  }
  
  // 在生产环境中，这里应该保存到数据库
  // await saveMetricsToDatabase(type, metrics);
}

// 分析异常指标
async function analyzeMetrics(type: MetricsPayload['type'], metrics: any[]) {
  switch (type) {
    case 'api-metrics':
      await analyzeAPIMetrics(metrics as APICallMetrics[]);
      break;
    case 'page-metrics':
      await analyzePageMetrics(metrics as PagePerformanceMetrics[]);
      break;
    case 'interaction-metrics':
      await analyzeInteractionMetrics(metrics as UserInteractionMetrics[]);
      break;
  }
}

// 分析API指标异常
async function analyzeAPIMetrics(metrics: APICallMetrics[]) {
  metrics.forEach(metric => {
    // 检查慢查询
    if (metric.duration > 5000) {
      logger.warn('Slow API Call Detected', undefined, {
        component: 'MetricsAnalyzer',
        action: 'analyzeAPIMetrics',
        url: metric.url,
        duration: metric.duration,
        status: metric.status
      });
    }
    
    // 检查错误率
    if (metric.status >= 500) {
      logger.error('API Server Error in Metrics', undefined, {
        component: 'MetricsAnalyzer',
        action: 'analyzeAPIMetrics',
        url: metric.url,
        status: metric.status,
        duration: metric.duration
      });
    }
    
    // 检查重试次数
    if (metric.retryCount && metric.retryCount > 2) {
      logger.warn('High Retry Count Detected', undefined, {
        component: 'MetricsAnalyzer',
        action: 'analyzeAPIMetrics',
        url: metric.url,
        retryCount: metric.retryCount
      });
    }
  });
}

// 分析页面性能指标
async function analyzePageMetrics(metrics: PagePerformanceMetrics[]) {
  metrics.forEach(metric => {
    // 检查加载时间
    if (metric.loadTime > 6000) {
      logger.warn('Slow Page Load Detected', undefined, {
        component: 'MetricsAnalyzer',
        action: 'analyzePageMetrics',
        url: metric.url,
        loadTime: metric.loadTime
      });
    }
    
    // 检查Core Web Vitals
    if (metric.largestContentfulPaint && metric.largestContentfulPaint > 4000) {
      logger.warn('Poor LCP Score', undefined, {
        component: 'MetricsAnalyzer',
        action: 'analyzePageMetrics',
        url: metric.url,
        lcp: metric.largestContentfulPaint
      });
    }
    
    if (metric.cumulativeLayoutShift && metric.cumulativeLayoutShift > 0.25) {
      logger.warn('Poor CLS Score', undefined, {
        component: 'MetricsAnalyzer',
        action: 'analyzePageMetrics',
        url: metric.url,
        cls: metric.cumulativeLayoutShift
      });
    }
  });
}

// 分析用户交互指标
async function analyzeInteractionMetrics(metrics: UserInteractionMetrics[]) {
  const failedInteractions = metrics.filter(m => !m.success);
  
  if (failedInteractions.length > 0) {
    logger.warn('Failed User Interactions Detected', {
      count: failedInteractions.length,
      interactions: failedInteractions.map(i => ({
        action: i.action,
        component: i.component,
        error: i.errorMessage
      }))
    }, {
      component: 'MetricsAnalyzer',
      action: 'analyzeInteractionMetrics'
    });
  }
  
  // 检查慢交互
  const slowInteractions = metrics.filter(m => m.duration > 300);
  if (slowInteractions.length > 0) {
    logger.warn('Slow User Interactions Detected', {
      count: slowInteractions.length,
      interactions: slowInteractions.map(i => ({
        action: i.action,
        component: i.component,
        duration: i.duration
      }))
    }, {
      component: 'MetricsAnalyzer',
      action: 'analyzeInteractionMetrics'
    });
  }
}

// 分析特定类型的指标
async function analyzeSpecificMetrics(type: keyof typeof metricsStore, metrics: any[]) {
  switch (type) {
    case 'apiMetrics':
      return analyzeAPIMetricsStats(metrics as APICallMetrics[]);
    case 'pageMetrics':
      return analyzePageMetricsStats(metrics as PagePerformanceMetrics[]);
    case 'interactionMetrics':
      return analyzeInteractionMetricsStats(metrics as UserInteractionMetrics[]);
    default:
      return {};
  }
}

// API指标统计分析
function analyzeAPIMetricsStats(metrics: APICallMetrics[]) {
  if (metrics.length === 0) return {};
  
  const durations = metrics.map(m => m.duration);
  const errors = metrics.filter(m => m.status >= 400);
  const urlStats = metrics.reduce((acc, m) => {
    acc[m.url] = (acc[m.url] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalCalls: metrics.length,
    averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    maxDuration: Math.max(...durations),
    minDuration: Math.min(...durations),
    errorRate: errors.length / metrics.length,
    errors: errors.length,
    topEndpoints: Object.entries(urlStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([url, count]) => ({ url, count }))
  };
}

// 页面指标统计分析
function analyzePageMetricsStats(metrics: PagePerformanceMetrics[]) {
  if (metrics.length === 0) return {};
  
  const loadTimes = metrics.map(m => m.loadTime);
  const lcpValues = metrics.filter(m => m.largestContentfulPaint).map(m => m.largestContentfulPaint!);
  
  return {
    totalPageViews: metrics.length,
    averageLoadTime: loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length,
    maxLoadTime: Math.max(...loadTimes),
    minLoadTime: Math.min(...loadTimes),
    averageLCP: lcpValues.length > 0 ? lcpValues.reduce((a, b) => a + b, 0) / lcpValues.length : null,
    slowPages: metrics.filter(m => m.loadTime > 6000).length
  };
}

// 交互指标统计分析
function analyzeInteractionMetricsStats(metrics: UserInteractionMetrics[]) {
  if (metrics.length === 0) return {};
  
  const durations = metrics.map(m => m.duration);
  const failures = metrics.filter(m => !m.success);
  
  return {
    totalInteractions: metrics.length,
    averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    maxDuration: Math.max(...durations),
    successRate: (metrics.length - failures.length) / metrics.length,
    failures: failures.length,
    slowInteractions: metrics.filter(m => m.duration > 300).length
  };
}

// 获取最近指标统计
function getRecentMetricsStats(type: keyof typeof metricsStore, startTime: Date) {
  const metrics = metricsStore[type].filter(metric => 
    new Date(metric.timestamp) >= startTime
  );
  
  return {
    count: metrics.length,
    timeWindow: `${((Date.now() - startTime.getTime()) / 1000 / 60).toFixed(0)}分钟`
  };
}

// 解析时间范围
function parseTimeRange(timeRange: string): number {
  const unit = timeRange.slice(-1);
  const value = parseInt(timeRange.slice(0, -1));
  
  switch (unit) {
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    default: return 60 * 60 * 1000; // 默认1小时
  }
}