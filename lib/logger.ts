/**
 * 统一日志记录系统
 * 支持结构化日志、不同环境策略、性能监控和错误追踪
 */

// 日志等级枚举
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

// 日志上下文类型
export interface LogContext {
  requestId?: string;
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  route?: string;
  action?: string;
  component?: string;
  [key: string]: any;
}

// 日志条目结构
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  data?: any;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
    cause?: any;
  };
  performance?: {
    duration: number;
    memory?: number;
    operation: string;
  };
  metrics?: {
    [key: string]: number | string;
  };
}

// 日志输出配置
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  enableMetrics: boolean;
  enablePerformance: boolean;
  maxBatchSize: number;
  flushInterval: number;
  environment: 'development' | 'production' | 'test';
}

// 默认配置
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production',
  enableMetrics: true,
  enablePerformance: true,
  maxBatchSize: 50,
  flushInterval: 5000,
  environment: (process.env.NODE_ENV as any) || 'development'
};

// 日志格式化器
class LogFormatter {
  static formatConsole(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleString('zh-CN');
    const level = LogLevel[entry.level].padEnd(5);
    const context = entry.context ? ` [${entry.context.component || entry.context.route || 'APP'}]` : '';
    
    let message = `${timestamp} ${level}${context} ${entry.message}`;
    
    if (entry.data) {
      message += `\n📊 Data: ${JSON.stringify(entry.data, null, 2)}`;
    }
    
    if (entry.error) {
      message += `\n❌ Error: ${entry.error.message}`;
      if (entry.error.stack && DEFAULT_CONFIG.environment === 'development') {
        message += `\n${entry.error.stack}`;
      }
    }
    
    if (entry.performance) {
      message += `\n⏱️  Performance: ${entry.performance.operation} took ${entry.performance.duration}ms`;
      if (entry.performance.memory) {
        message += ` (Memory: ${(entry.performance.memory / 1024 / 1024).toFixed(2)}MB)`;
      }
    }
    
    if (entry.metrics) {
      message += `\n📈 Metrics: ${JSON.stringify(entry.metrics)}`;
    }
    
    return message;
  }
  
  static formatJSON(entry: LogEntry): string {
    return JSON.stringify(entry);
  }
}

// 远程日志发送器
class RemoteLogger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;
  
  constructor(config: LoggerConfig) {
    this.config = config;
    this.startFlushTimer();
  }
  
  add(entry: LogEntry) {
    if (!this.config.enableRemote) return;
    
    this.buffer.push(entry);
    
    if (this.buffer.length >= this.config.maxBatchSize) {
      this.flush();
    }
  }
  
  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }
  
  private async flush() {
    if (this.buffer.length === 0) return;
    
    const entries = [...this.buffer];
    this.buffer = [];
    
    try {
      if (this.config.remoteEndpoint) {
        // 发送到远程日志服务
        await fetch(this.config.remoteEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ logs: entries })
        });
      }
      
      // 如果有其他日志服务（如 Sentry, LogRocket），在这里集成
      // if (window.Sentry) {
      //   entries.forEach(entry => {
      //     if (entry.level >= LogLevel.ERROR) {
      //       window.Sentry.captureException(new Error(entry.message), {
      //         extra: entry
      //       });
      //     }
      //   });
      // }
      
    } catch (error) {
      console.error('[Logger] Failed to send logs to remote:', error);
      // 重新加入缓冲区以便重试
      this.buffer.unshift(...entries);
    }
  }
  
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// 性能监控器
class PerformanceTracker {
  private marks: Map<string, number> = new Map();
  
  start(operation: string): void {
    this.marks.set(operation, performance.now());
  }
  
  end(operation: string): number {
    const startTime = this.marks.get(operation);
    if (!startTime) {
      console.warn(`[PerformanceTracker] No start mark found for operation: ${operation}`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.marks.delete(operation);
    return duration;
  }
  
  measure(operation: string): number | null {
    const startTime = this.marks.get(operation);
    if (!startTime) return null;
    
    return performance.now() - startTime;
  }
}

// 指标收集器
class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  
  incrementCounter(name: string, value: number = 1) {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }
  
  setGauge(name: string, value: number) {
    this.gauges.set(name, value);
  }
  
  recordHistogram(name: string, value: number) {
    const values = this.histograms.get(name) || [];
    values.push(value);
    this.histograms.set(name, values);
    
    // 保持最近1000个值
    if (values.length > 1000) {
      values.shift();
    }
  }
  
  getMetrics() {
    const histogramStats: {[key: string]: any} = {};
    
    this.histograms.forEach((values, name) => {
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        histogramStats[name] = {
          count: values.length,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          p50: sorted[Math.floor(sorted.length * 0.5)],
          p90: sorted[Math.floor(sorted.length * 0.9)],
          p99: sorted[Math.floor(sorted.length * 0.99)]
        };
      }
    });
    
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: histogramStats,
      timestamp: new Date().toISOString()
    };
  }
  
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

// 主要日志记录器类
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private remoteLogger: RemoteLogger;
  private performanceTracker: PerformanceTracker;
  private metricsCollector: MetricsCollector;
  private globalContext: LogContext = {};
  
  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.remoteLogger = new RemoteLogger(this.config);
    this.performanceTracker = new PerformanceTracker();
    this.metricsCollector = new MetricsCollector();
    
    // 监听页面卸载事件，确保日志被发送
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.remoteLogger.destroy();
      });
    }
  }
  
  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }
  
  // 设置全局上下文
  setGlobalContext(context: LogContext) {
    this.globalContext = { ...this.globalContext, ...context };
  }
  
  // 基础日志方法
  private log(level: LogLevel, message: string, data?: any, context?: LogContext) {
    if (level < this.config.level) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.globalContext, ...context },
      data
    };
    
    // 添加内存使用信息（仅在性能监控开启时）
    if (this.config.enablePerformance && typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage();
      entry.performance = {
        duration: 0,
        memory: memory.heapUsed,
        operation: 'log'
      };
    }
    
    // 控制台输出
    if (this.config.enableConsole) {
      const formattedMessage = LogFormatter.formatConsole(entry);
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(formattedMessage);
          break;
      }
    }
    
    // 发送到远程
    this.remoteLogger.add(entry);
    
    // 更新指标
    if (this.config.enableMetrics) {
      this.metricsCollector.incrementCounter(`log_${LogLevel[level].toLowerCase()}`);
      if (level >= LogLevel.ERROR) {
        this.metricsCollector.incrementCounter('errors_total');
      }
    }
  }
  
  // 公共日志方法
  debug(message: string, data?: any, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, data, context);
  }
  
  info(message: string, data?: any, context?: LogContext) {
    this.log(LogLevel.INFO, message, data, context);
  }
  
  warn(message: string, data?: any, context?: LogContext) {
    this.log(LogLevel.WARN, message, data, context);
  }
  
  error(message: string, error?: Error | any, context?: LogContext) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context: { ...this.globalContext, ...context }
    };
    
    if (error) {
      if (error instanceof Error) {
        entry.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
          cause: (error as any).cause
        };
      } else {
        entry.error = {
          name: 'UnknownError',
          message: String(error),
          code: error.code || error.type
        };
      }
    }
    
    // 控制台输出
    if (this.config.enableConsole) {
      console.error(LogFormatter.formatConsole(entry));
    }
    
    // 发送到远程
    this.remoteLogger.add(entry);
    
    // 更新错误指标
    if (this.config.enableMetrics) {
      this.metricsCollector.incrementCounter('log_error');
      this.metricsCollector.incrementCounter('errors_total');
    }
  }
  
  fatal(message: string, error?: Error | any, context?: LogContext) {
    this.log(LogLevel.FATAL, message, error, context);
    
    // 立即刷新远程日志
    if (this.config.enableRemote) {
      this.remoteLogger.destroy();
    }
  }
  
  // 性能监控方法
  startTimer(operation: string): void {
    this.performanceTracker.start(operation);
  }
  
  endTimer(operation: string, context?: LogContext): number {
    const duration = this.performanceTracker.end(operation);
    
    if (this.config.enablePerformance) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `Performance: ${operation} completed`,
        context: { ...this.globalContext, ...context },
        performance: {
          duration,
          operation,
          memory: typeof process !== 'undefined' && process.memoryUsage ? 
            process.memoryUsage().heapUsed : undefined
        }
      };
      
      if (this.config.enableConsole && duration > 1000) {
        console.info(LogFormatter.formatConsole(entry));
      }
      
      this.remoteLogger.add(entry);
      
      // 记录性能指标
      this.metricsCollector.recordHistogram(`performance_${operation}`, duration);
    }
    
    return duration;
  }
  
  // 指标方法
  incrementCounter(name: string, value?: number, context?: LogContext) {
    this.metricsCollector.incrementCounter(name, value);
    
    if (this.config.enableMetrics) {
      this.debug(`Metric: ${name} incremented by ${value || 1}`, { value }, context);
    }
  }
  
  setGauge(name: string, value: number, context?: LogContext) {
    this.metricsCollector.setGauge(name, value);
    
    if (this.config.enableMetrics) {
      this.debug(`Metric: ${name} set to ${value}`, { value }, context);
    }
  }
  
  // API 调用追踪
  async traceApiCall<T>(
    operation: string,
    apiCall: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = Date.now();
    const operationId = `${operation}_${startTime}`;
    
    this.startTimer(operationId);
    this.info(`API Call Started: ${operation}`, undefined, context);
    
    try {
      const result = await apiCall();
      const duration = this.endTimer(operationId, context);
      
      this.info(`API Call Success: ${operation}`, { duration }, context);
      this.incrementCounter(`api_success_${operation}`);
      
      return result;
    } catch (error) {
      const duration = this.endTimer(operationId, context);
      
      this.error(`API Call Failed: ${operation}`, error, { ...context, duration });
      this.incrementCounter(`api_error_${operation}`);
      
      throw error;
    }
  }
  
  // 获取当前指标
  getMetrics() {
    return this.metricsCollector.getMetrics();
  }
  
  // 重置指标
  resetMetrics() {
    this.metricsCollector.reset();
  }
  
  // 健康检查
  getHealthStatus() {
    const metrics = this.getMetrics();
    const uptime = typeof process !== 'undefined' ? process.uptime() : 0;
    
    return {
      status: 'healthy',
      uptime,
      metrics,
      timestamp: new Date().toISOString(),
      environment: this.config.environment
    };
  }
}

// 导出便捷实例和工具函数
export const logger = Logger.getInstance();

// 便捷函数
export const logDebug = (message: string, data?: any, context?: LogContext) => 
  logger.debug(message, data, context);

export const logInfo = (message: string, data?: any, context?: LogContext) => 
  logger.info(message, data, context);

export const logWarn = (message: string, data?: any, context?: LogContext) => 
  logger.warn(message, data, context);

export const logError = (message: string, error?: Error | any, context?: LogContext) => 
  logger.error(message, error, context);

export const logFatal = (message: string, error?: Error | any, context?: LogContext) => 
  logger.fatal(message, error, context);

// API 追踪装饰器
export const traceApi = <T>(operation: string, context?: LogContext) => 
  (apiCall: () => Promise<T>) => logger.traceApiCall(operation, apiCall, context);

// 性能测量装饰器
export const measurePerformance = (operation: string, context?: LogContext) => 
  <T extends (...args: any[]) => any>(target: T): T => {
    return ((...args: any[]) => {
      logger.startTimer(operation);
      try {
        const result = target(...args);
        if (result instanceof Promise) {
          return result.finally(() => logger.endTimer(operation, context));
        } else {
          logger.endTimer(operation, context);
          return result;
        }
      } catch (error) {
        logger.endTimer(operation, context);
        throw error;
      }
    }) as T;
  };

// 设置全局错误处理
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Uncaught Error', event.error, {
      component: 'window',
      action: 'error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', event.reason, {
      component: 'window',
      action: 'unhandledrejection'
    });
  });
}

// Node.js 环境的未捕获异常处理
if (typeof process !== 'undefined') {
  process.on('uncaughtException', (error) => {
    logger.fatal('Uncaught Exception', error, {
      component: 'process',
      action: 'uncaughtException'
    });
  });
  
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', reason, {
      component: 'process',
      action: 'unhandledRejection'
    });
  });
}