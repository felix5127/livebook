/**
 * 统一错误处理和重试逻辑模块
 */

// 错误类型枚举
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_KEY_INVALID = 'API_KEY_INVALID',
  RATE_LIMIT = 'RATE_LIMIT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
  TASK_FAILED = 'TASK_FAILED',
  PARSE_ERROR = 'PARSE_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// 自定义错误类
export class TranscriptionError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly retryable: boolean;
  public readonly code?: string;
  public readonly requestId?: string;
  public readonly details?: any;

  constructor(
    type: ErrorType,
    message: string,
    options: {
      severity?: ErrorSeverity;
      retryable?: boolean;
      code?: string;
      requestId?: string;
      details?: any;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'TranscriptionError';
    this.type = type;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.retryable = options.retryable !== undefined ? options.retryable : this.isRetryableByType(type);
    this.code = options.code;
    this.requestId = options.requestId;
    this.details = options.details;
    
    if (options.cause) {
      (this as any).cause = options.cause;
    }
  }

  private isRetryableByType(type: ErrorType): boolean {
    const retryableTypes = [
      ErrorType.NETWORK_ERROR,
      ErrorType.RATE_LIMIT,
      ErrorType.SERVER_ERROR,
      ErrorType.TIMEOUT
    ];
    return retryableTypes.includes(type);
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      severity: this.severity,
      retryable: this.retryable,
      code: this.code,
      requestId: this.requestId,
      details: this.details,
      stack: this.stack
    };
  }
}

// 错误分类器
export class ErrorClassifier {
  static classify(error: any): TranscriptionError {
    // 如果已经是 TranscriptionError，直接返回
    if (error instanceof TranscriptionError) {
      return error;
    }

    // Axios/网络错误
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          if (data?.code === 'FileSizeExceeded') {
            return new TranscriptionError(
              ErrorType.FILE_TOO_LARGE,
              data.message || '文件大小超出限制',
              { 
                severity: ErrorSeverity.LOW,
                retryable: false,
                code: data.code,
                requestId: data.request_id,
                details: data
              }
            );
          }
          if (data?.code === 'UnsupportedFileFormat') {
            return new TranscriptionError(
              ErrorType.UNSUPPORTED_FORMAT,
              data.message || '不支持的文件格式',
              { 
                severity: ErrorSeverity.LOW,
                retryable: false,
                code: data.code,
                requestId: data.request_id,
                details: data
              }
            );
          }
          break;

        case 401:
          return new TranscriptionError(
            ErrorType.API_KEY_INVALID,
            '无效的 API Key',
            { 
              severity: ErrorSeverity.CRITICAL,
              retryable: false,
              code: data?.code,
              requestId: data?.request_id,
              details: data
            }
          );

        case 403:
          return new TranscriptionError(
            ErrorType.QUOTA_EXCEEDED,
            '配额已用完或权限不足',
            { 
              severity: ErrorSeverity.HIGH,
              retryable: false,
              code: data?.code,
              requestId: data?.request_id,
              details: data
            }
          );

        case 404:
          return new TranscriptionError(
            ErrorType.TASK_NOT_FOUND,
            '任务不存在',
            { 
              severity: ErrorSeverity.LOW,
              retryable: false,
              code: data?.code,
              requestId: data?.request_id,
              details: data
            }
          );

        case 429:
          return new TranscriptionError(
            ErrorType.RATE_LIMIT,
            '请求频率超出限制',
            { 
              severity: ErrorSeverity.MEDIUM,
              retryable: true,
              code: data?.code,
              requestId: data?.request_id,
              details: data
            }
          );

        case 500:
        case 502:
        case 503:
        case 504:
          return new TranscriptionError(
            ErrorType.SERVER_ERROR,
            '服务器错误',
            { 
              severity: ErrorSeverity.HIGH,
              retryable: true,
              code: data?.code,
              requestId: data?.request_id,
              details: data
            }
          );
      }
    }

    // 网络连接错误
    if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new TranscriptionError(
        ErrorType.NETWORK_ERROR,
        '网络连接失败',
        { 
          severity: ErrorSeverity.MEDIUM,
          retryable: true,
          code: error.code,
          details: { originalMessage: error.message }
        }
      );
    }

    // 超时错误
    if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      return new TranscriptionError(
        ErrorType.TIMEOUT,
        '请求超时',
        { 
          severity: ErrorSeverity.MEDIUM,
          retryable: true,
          code: error.code,
          details: { originalMessage: error.message }
        }
      );
    }

    // 解析错误
    if (error.message?.includes('parse') || error.message?.includes('JSON')) {
      return new TranscriptionError(
        ErrorType.PARSE_ERROR,
        '数据解析失败',
        { 
          severity: ErrorSeverity.MEDIUM,
          retryable: false,
          details: { originalMessage: error.message }
        }
      );
    }

    // 默认未知错误
    return new TranscriptionError(
      ErrorType.UNKNOWN_ERROR,
      error.message || '未知错误',
      { 
        severity: ErrorSeverity.MEDIUM,
        retryable: false,
        details: { 
          originalError: error,
          originalMessage: error.message
        }
      }
    );
  }
}

// 重试配置接口
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: TranscriptionError) => boolean;
}

// 默认重试配置
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  retryCondition: (error) => error.retryable
};

// 重试器类
export class RetryHandler {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * 执行带重试的操作
   * @param operation 要执行的操作
   * @param context 操作上下文 (用于日志)
   * @returns 操作结果
   */
  async execute<T>(
    operation: () => Promise<T>,
    context: string = 'unknown'
  ): Promise<T> {
    let lastError: TranscriptionError;
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      try {
        console.log(`[RetryHandler] 执行操作: ${context} (尝试 ${attempt + 1}/${this.config.maxRetries + 1})`);
        return await operation();
      } catch (error) {
        const classifiedError = ErrorClassifier.classify(error);
        lastError = classifiedError;

        console.warn(`[RetryHandler] 操作失败: ${context} (尝试 ${attempt + 1}/${this.config.maxRetries + 1})`, {
          type: classifiedError.type,
          message: classifiedError.message,
          retryable: classifiedError.retryable
        });

        // 检查是否应该重试
        if (attempt >= this.config.maxRetries || !this.shouldRetry(classifiedError)) {
          console.error(`[RetryHandler] 停止重试: ${context}`, {
            finalAttempt: attempt + 1,
            maxRetries: this.config.maxRetries,
            retryable: classifiedError.retryable,
            errorType: classifiedError.type
          });
          throw classifiedError;
        }

        // 计算延迟时间
        const delay = this.calculateDelay(attempt);
        console.log(`[RetryHandler] 等待 ${delay}ms 后重试...`);
        await this.sleep(delay);
        
        attempt++;
      }
    }

    throw lastError!;
  }

  /**
   * 检查是否应该重试
   */
  private shouldRetry(error: TranscriptionError): boolean {
    if (this.config.retryCondition) {
      return this.config.retryCondition(error);
    }
    return error.retryable;
  }

  /**
   * 计算延迟时间 (带指数退避和抖动)
   */
  private calculateDelay(attempt: number): number {
    let delay = this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attempt);
    
    // 限制最大延迟时间
    delay = Math.min(delay, this.config.maxDelay);
    
    // 添加抖动减少冲突
    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(delay);
  }

  /**
   * 等待指定时间
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 错误日志记录器
export class ErrorLogger {
  static log(error: TranscriptionError, context?: string) {
    const logData = {
      timestamp: new Date().toISOString(),
      context: context || 'unknown',
      ...error.toJSON()
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        console.info('[ErrorLogger] Low severity error:', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('[ErrorLogger] Medium severity error:', logData);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        console.error('[ErrorLogger] High/Critical severity error:', logData);
        break;
    }

    // 这里可以集成外部日志服务 (如 Sentry, LogRocket 等)
    // if (error.severity >= ErrorSeverity.HIGH) {
    //   Sentry.captureException(error, { extra: logData });
    // }
  }

  static logSuccess(operation: string, duration: number, details?: any) {
    console.log(`[ErrorLogger] Operation successful: ${operation}`, {
      timestamp: new Date().toISOString(),
      operation,
      duration: `${duration}ms`,
      details
    });
  }
}

// 导出便捷函数
export const createRetryHandler = (config?: Partial<RetryConfig>) => new RetryHandler(config);
export const classifyError = ErrorClassifier.classify;
export const logError = ErrorLogger.log;
export const logSuccess = ErrorLogger.logSuccess;