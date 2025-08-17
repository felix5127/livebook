/**
 * 性能监控系统
 * 监控API调用、页面加载、用户交互等性能指标
 */

import { logger } from './logger';

// 性能指标类型
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: string;
  tags?: Record<string, string>;
  threshold?: {
    warning: number;
    critical: number;
  };
}

// API 调用性能数据
export interface APICallMetrics {
  url: string;
  method: string;
  status: number;
  duration: number;
  requestSize?: number;
  responseSize?: number;
  retryCount?: number;
  errorType?: string;
  timestamp: string;
  userAgent?: string;
  userId?: string;
}

// 页面性能数据
export interface PagePerformanceMetrics {
  url: string;
  loadTime: number;
  domContentLoaded: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  memoryUsage?: number;
  connectionType?: string;
  timestamp: string;
}

// 用户交互性能数据
export interface UserInteractionMetrics {
  action: string;
  component: string;
  duration: number;
  success: boolean;
  errorMessage?: string;
  timestamp: string;
  userId?: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private apiCallBuffer: APICallMetrics[] = [];
  private pageMetricsBuffer: PagePerformanceMetrics[] = [];
  private interactionBuffer: UserInteractionMetrics[] = [];
  private flushInterval = 30000; // 30秒刷新一次
  private maxBufferSize = 100;
  private isEnabled = true;
  
  private constructor() {
    this.initializeWebVitals();
    this.startPeriodicFlush();
    this.setupUnloadHandler();
  }
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  // 启用/禁用监控
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
  
  // 记录API调用性能
  recordAPICall(metrics: Omit<APICallMetrics, 'timestamp'>) {
    if (!this.isEnabled) return;
    
    const fullMetrics: APICallMetrics = {
      ...metrics,
      timestamp: new Date().toISOString()
    };
    
    this.apiCallBuffer.push(fullMetrics);
    
    // 检查性能阈值
    this.checkAPIPerformanceThresholds(fullMetrics);
    
    // 记录到日志
    logger.info('API Call Performance', fullMetrics, {
      component: 'PerformanceMonitor',
      action: 'recordAPICall'
    });
    
    // 缓冲区管理
    if (this.apiCallBuffer.length >= this.maxBufferSize) {
      this.flushAPIMetrics();
    }
  }
  
  // 记录页面性能
  recordPagePerformance(metrics: Omit<PagePerformanceMetrics, 'timestamp'>) {
    if (!this.isEnabled) return;
    
    const fullMetrics: PagePerformanceMetrics = {
      ...metrics,
      timestamp: new Date().toISOString()
    };
    
    this.pageMetricsBuffer.push(fullMetrics);
    
    // 检查性能阈值
    this.checkPagePerformanceThresholds(fullMetrics);
    
    // 记录到日志
    logger.info('Page Performance', fullMetrics, {
      component: 'PerformanceMonitor',
      action: 'recordPagePerformance'
    });
    
    if (this.pageMetricsBuffer.length >= this.maxBufferSize) {
      this.flushPageMetrics();
    }
  }
  
  // 记录用户交互性能
  recordUserInteraction(metrics: Omit<UserInteractionMetrics, 'timestamp'>) {
    if (!this.isEnabled) return;
    
    const fullMetrics: UserInteractionMetrics = {
      ...metrics,
      timestamp: new Date().toISOString()
    };
    
    this.interactionBuffer.push(fullMetrics);
    
    // 检查交互性能阈值
    this.checkInteractionPerformanceThresholds(fullMetrics);
    
    logger.debug('User Interaction Performance', fullMetrics, {
      component: 'PerformanceMonitor',
      action: 'recordUserInteraction'
    });
    
    if (this.interactionBuffer.length >= this.maxBufferSize) {
      this.flushInteractionMetrics();
    }
  }
  
  // 检查API性能阈值
  private checkAPIPerformanceThresholds(metrics: APICallMetrics) {
    const thresholds = {
      duration: { warning: 2000, critical: 5000 }, // 2秒警告，5秒严重
      errorRate: { warning: 0.05, critical: 0.10 }  // 5%警告，10%严重
    };
    
    if (metrics.duration > thresholds.duration.critical) {
      logger.error('API Call Critical Performance Issue', undefined, {
        component: 'PerformanceMonitor',
        action: 'performanceThresholdCheck',
        url: metrics.url,
        duration: metrics.duration,
        threshold: 'critical'
      });
    } else if (metrics.duration > thresholds.duration.warning) {
      logger.warn('API Call Performance Warning', undefined, {
        component: 'PerformanceMonitor',
        action: 'performanceThresholdCheck',
        url: metrics.url,
        duration: metrics.duration,
        threshold: 'warning'
      });
    }
    
    // 检查错误状态
    if (metrics.status >= 500) {
      logger.error('API Server Error Detected', undefined, {
        component: 'PerformanceMonitor',
        action: 'errorDetection',
        url: metrics.url,
        status: metrics.status,
        duration: metrics.duration
      });
    } else if (metrics.status >= 400) {
      logger.warn('API Client Error Detected', undefined, {
        component: 'PerformanceMonitor',
        action: 'errorDetection',
        url: metrics.url,
        status: metrics.status,
        duration: metrics.duration
      });
    }
  }
  
  // 检查页面性能阈值
  private checkPagePerformanceThresholds(metrics: PagePerformanceMetrics) {
    const thresholds = {
      loadTime: { warning: 3000, critical: 6000 },
      firstContentfulPaint: { warning: 2000, critical: 4000 },
      largestContentfulPaint: { warning: 2500, critical: 4000 },
      cumulativeLayoutShift: { warning: 0.1, critical: 0.25 }
    };
    
    // 检查加载时间
    if (metrics.loadTime > thresholds.loadTime.critical) {
      logger.error('Page Load Critical Performance Issue', undefined, {
        component: 'PerformanceMonitor',
        action: 'pagePerformanceCheck',
        url: metrics.url,
        loadTime: metrics.loadTime,
        threshold: 'critical'
      });
    } else if (metrics.loadTime > thresholds.loadTime.warning) {
      logger.warn('Page Load Performance Warning', undefined, {
        component: 'PerformanceMonitor',
        action: 'pagePerformanceCheck',
        url: metrics.url,
        loadTime: metrics.loadTime,
        threshold: 'warning'
      });
    }
    
    // 检查Core Web Vitals
    if (metrics.largestContentfulPaint && 
        metrics.largestContentfulPaint > thresholds.largestContentfulPaint.critical) {
      logger.warn('LCP Performance Issue', undefined, {
        component: 'PerformanceMonitor',
        action: 'webVitalsCheck',
        url: metrics.url,
        lcp: metrics.largestContentfulPaint
      });
    }
    
    if (metrics.cumulativeLayoutShift && 
        metrics.cumulativeLayoutShift > thresholds.cumulativeLayoutShift.critical) {
      logger.warn('CLS Performance Issue', undefined, {
        component: 'PerformanceMonitor',
        action: 'webVitalsCheck',
        url: metrics.url,
        cls: metrics.cumulativeLayoutShift
      });
    }
  }
  
  // 检查用户交互性能阈值
  private checkInteractionPerformanceThresholds(metrics: UserInteractionMetrics) {
    const thresholds = {
      interaction: { warning: 100, critical: 300 } // 100ms警告，300ms严重
    };
    
    if (metrics.duration > thresholds.interaction.critical) {
      logger.warn('User Interaction Performance Issue', undefined, {
        component: 'PerformanceMonitor',
        action: 'interactionPerformanceCheck',
        interaction: metrics.action,
        targetComponent: metrics.component,
        duration: metrics.duration,
        threshold: 'critical'
      });
    }
    
    if (!metrics.success) {
      logger.error('User Interaction Failed', undefined, {
        component: 'PerformanceMonitor',
        action: 'interactionFailure',
        interaction: metrics.action,
        targetComponent: metrics.component,
        errorMessage: metrics.errorMessage
      });
    }
  }
  
  // 初始化Web Vitals监控
  private initializeWebVitals() {
    if (typeof window === 'undefined') return;
    
    // 监控页面加载性能
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        const metrics: Omit<PagePerformanceMetrics, 'timestamp'> = {
          url: window.location.href,
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime,
          firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime,
          connectionType: (navigator as any).connection?.effectiveType
        };
        
        // 获取内存使用情况（如果支持）
        if ((performance as any).memory) {
          metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
        }
        
        this.recordPagePerformance(metrics);
      }, 1000);
    });
    
    // 监控LCP
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          logger.setGauge('lcp_value', lastEntry.startTime);
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        
        // 监控FID
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            logger.setGauge('fid_value', (entry as any).processingStart - entry.startTime);
          }
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        
        // 监控CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          logger.setGauge('cls_value', clsValue);
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        
      } catch (error) {
        logger.warn('Performance Observer not fully supported', error);
      }
    }
  }
  
  // 设置页面卸载处理器
  private setupUnloadHandler() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('beforeunload', () => {
      this.flushAllMetrics();
    });
    
    // 页面可见性变化时也刷新数据
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushAllMetrics();
      }
    });
  }
  
  // 定期刷新数据
  private startPeriodicFlush() {
    setInterval(() => {
      this.flushAllMetrics();
    }, this.flushInterval);
  }
  
  // 刷新API指标
  private async flushAPIMetrics() {
    if (this.apiCallBuffer.length === 0) return;
    
    const metrics = [...this.apiCallBuffer];
    this.apiCallBuffer = [];
    
    try {
      await this.sendMetricsToServer('api-metrics', metrics);
    } catch (error) {
      logger.error('Failed to flush API metrics', error);
      // 重新加入缓冲区
      this.apiCallBuffer.unshift(...metrics);
    }
  }
  
  // 刷新页面指标
  private async flushPageMetrics() {
    if (this.pageMetricsBuffer.length === 0) return;
    
    const metrics = [...this.pageMetricsBuffer];
    this.pageMetricsBuffer = [];
    
    try {
      await this.sendMetricsToServer('page-metrics', metrics);
    } catch (error) {
      logger.error('Failed to flush page metrics', error);
      this.pageMetricsBuffer.unshift(...metrics);
    }
  }
  
  // 刷新交互指标
  private async flushInteractionMetrics() {
    if (this.interactionBuffer.length === 0) return;
    
    const metrics = [...this.interactionBuffer];
    this.interactionBuffer = [];
    
    try {
      await this.sendMetricsToServer('interaction-metrics', metrics);
    } catch (error) {
      logger.error('Failed to flush interaction metrics', error);
      this.interactionBuffer.unshift(...metrics);
    }
  }
  
  // 刷新所有指标
  private flushAllMetrics() {
    this.flushAPIMetrics();
    this.flushPageMetrics();
    this.flushInteractionMetrics();
  }
  
  // 发送指标到服务器
  private async sendMetricsToServer(type: string, metrics: any[]) {
    if (metrics.length === 0) return;
    
    try {
      const response = await fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          metrics,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      logger.debug(`Successfully sent ${metrics.length} ${type} to server`);
      
    } catch (error) {
      logger.error(`Failed to send ${type} to server`, error);
      throw error;
    }
  }
  
  // 获取当前性能统计
  getPerformanceStats() {
    return {
      apiCallsCount: this.apiCallBuffer.length,
      pageMetricsCount: this.pageMetricsBuffer.length,
      interactionCount: this.interactionBuffer.length,
      isEnabled: this.isEnabled,
      timestamp: new Date().toISOString()
    };
  }
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance();

// API调用追踪装饰器
export function trackAPICall(url: string, method: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method_orig = descriptor.value!;
    
    descriptor.value = async function (this: any, ...args: any[]) {
      const startTime = performance.now();
      let status = 0;
      let errorType: string | undefined;
      
      try {
        const result = await method_orig.apply(this, args);
        status = result.status || 200;
        return result;
      } catch (error: any) {
        status = error.status || 500;
        errorType = error.name || error.constructor.name;
        throw error;
      } finally {
        const duration = performance.now() - startTime;
        
        performanceMonitor.recordAPICall({
          url,
          method,
          status,
          duration,
          errorType
        });
      }
    } as T;
    
    return descriptor;
  };
}

// 用户交互追踪
export function trackUserInteraction(action: string, component: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method_orig = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const startTime = performance.now();
      let success = true;
      let errorMessage: string | undefined;
      
      try {
        const result = method_orig.apply(this, args);
        
        if (result instanceof Promise) {
          return result.catch((error: any) => {
            success = false;
            errorMessage = error.message;
            throw error;
          }).finally(() => {
            const duration = performance.now() - startTime;
            performanceMonitor.recordUserInteraction({
              action,
              component,
              duration,
              success,
              errorMessage
            });
          });
        } else {
          const duration = performance.now() - startTime;
          performanceMonitor.recordUserInteraction({
            action,
            component,
            duration,
            success,
            errorMessage
          });
          return result;
        }
      } catch (error: any) {
        success = false;
        errorMessage = error.message;
        const duration = performance.now() - startTime;
        performanceMonitor.recordUserInteraction({
          action,
          component,
          duration,
          success,
          errorMessage
        });
        throw error;
      }
    };
    
    return descriptor;
  };
}

// 便捷函数
export const trackAPI = (url: string, method: string, fn: () => Promise<any>) => {
  return performanceMonitor.recordAPICall.bind(performanceMonitor);
};

export const trackPage = (url: string, metrics: Omit<PagePerformanceMetrics, 'url' | 'timestamp'>) => {
  performanceMonitor.recordPagePerformance({ url, ...metrics });
};

export const trackInteraction = (action: string, component: string, fn: () => any) => {
  const startTime = performance.now();
  let success = true;
  let errorMessage: string | undefined;
  
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.catch((error: any) => {
        success = false;
        errorMessage = error.message;
        throw error;
      }).finally(() => {
        const duration = performance.now() - startTime;
        performanceMonitor.recordUserInteraction({
          action,
          component,
          duration,
          success,
          errorMessage
        });
      });
    } else {
      const duration = performance.now() - startTime;
      performanceMonitor.recordUserInteraction({
        action,
        component,
        duration,
        success,
        errorMessage
      });
      return result;
    }
  } catch (error: any) {
    success = false;
    errorMessage = error.message;
    const duration = performance.now() - startTime;
    performanceMonitor.recordUserInteraction({
      action,
      component,
      duration,
      success,
      errorMessage
    });
    throw error;
  }
};