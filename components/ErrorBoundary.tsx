'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger, LogContext } from '@/lib/logger';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: LogContext;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showReportButton?: boolean;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  retryCount: number;
  isReporting: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];
  
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      isReporting: false
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 记录错误到日志系统
    logger.error('React Error Boundary Caught Error', error, {
      ...this.props.context,
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      errorId,
      level: this.props.level || 'component',
      retryCount: this.state.retryCount,
      errorInfo: {
        componentStack: errorInfo.componentStack,
        stack: error.stack
      }
    });
    
    // 更新状态
    this.setState({
      error,
      errorInfo,
      errorId
    });
    
    // 调用自定义错误处理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // 增加错误计数指标
    logger.incrementCounter('react_error_boundary_triggered', 1, {
      level: this.props.level,
      component: this.props.context?.component
    });
  }
  
  componentWillUnmount() {
    // 清理定时器
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }
  
  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    logger.info('Error Boundary Retry Attempted', {
      errorId: this.state.errorId,
      retryCount: newRetryCount
    }, {
      ...this.props.context,
      component: 'ErrorBoundary',
      action: 'retry'
    });
    
    // 限制重试次数
    if (newRetryCount <= 3) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: newRetryCount
      });
      
      // 记录重试指标
      logger.incrementCounter('error_boundary_retry', 1, {
        level: this.props.level,
        retryCount: newRetryCount
      });
    } else {
      logger.warn('Error Boundary Max Retries Reached', {
        errorId: this.state.errorId,
        maxRetries: 3
      }, this.props.context);
    }
  };
  
  handleReportError = async () => {
    if (this.state.isReporting) return;
    
    this.setState({ isReporting: true });
    
    try {
      const reportData = {
        errorId: this.state.errorId,
        error: {
          name: this.state.error?.name,
          message: this.state.error?.message,
          stack: this.state.error?.stack
        },
        errorInfo: this.state.errorInfo,
        context: this.props.context,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: new Date().toISOString(),
        retryCount: this.state.retryCount
      };
      
      // 发送错误报告到服务器
      await fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });
      
      logger.info('Error Report Sent Successfully', {
        errorId: this.state.errorId
      }, {
        ...this.props.context,
        component: 'ErrorBoundary',
        action: 'reportError'
      });
      
      // 显示成功消息
      alert('错误报告已发送，感谢您的反馈！');
      
    } catch (reportError) {
      logger.error('Failed to Send Error Report', reportError, {
        ...this.props.context,
        component: 'ErrorBoundary',
        action: 'reportError',
        originalErrorId: this.state.errorId
      });
      
      alert('发送错误报告失败，请稍后重试');
    } finally {
      this.setState({ isReporting: false });
    }
  };
  
  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // 根据错误级别显示不同的错误页面
      return this.renderErrorUI();
    }
    
    return this.props.children;
  }
  
  private renderErrorUI() {
    const { level = 'component' } = this.props;
    const { error, errorId, retryCount, isReporting } = this.state;
    
    const isProductionBuild = process.env.NODE_ENV === 'production';
    const canRetry = retryCount < 3;
    
    // 关键错误 - 全屏错误页面
    if (level === 'critical') {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                <h2 className="mt-4 text-xl font-bold text-gray-900">
                  应用程序遇到严重错误
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  我们正在努力解决这个问题。请稍后重试。
                </p>
                
                {!isProductionBuild && (
                  <div className="mt-4 p-3 bg-red-50 rounded-md text-left">
                    <p className="text-xs text-red-700 font-mono">
                      错误ID: {errorId}
                    </p>
                    <p className="text-xs text-red-700 font-mono mt-1">
                      {error?.message}
                    </p>
                  </div>
                )}
                
                <div className="mt-6 flex flex-col space-y-3">
                  {canRetry && (
                    <button
                      onClick={this.handleRetry}
                      className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      重试 ({3 - retryCount} 次剩余)
                    </button>
                  )}
                  
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    返回首页
                  </button>
                  
                  {this.props.showReportButton && (
                    <button
                      onClick={this.handleReportError}
                      disabled={isReporting}
                      className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Bug className="w-4 h-4 mr-2" />
                      {isReporting ? '发送中...' : '报告错误'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // 页面级错误
    if (level === 'page') {
      return (
        <div className="min-h-96 flex flex-col justify-center items-center px-4 py-8">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-yellow-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              页面加载出现问题
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              抱歉，此页面暂时无法显示。
            </p>
            
            {!isProductionBuild && (
              <div className="mt-3 p-2 bg-yellow-50 rounded text-left">
                <p className="text-xs text-yellow-700 font-mono">
                  错误ID: {errorId}
                </p>
                <p className="text-xs text-yellow-700 font-mono">
                  {error?.message}
                </p>
              </div>
            )}
            
            <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  重试
                </button>
              )}
              
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                返回上页
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // 组件级错误 - 最小化影响
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              组件加载失败
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>该功能暂时不可用</p>
            </div>
            
            {!isProductionBuild && (
              <div className="mt-2 text-xs text-red-600 font-mono">
                {error?.message}
              </div>
            )}
            
            <div className="mt-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  重试
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// HOC 包装器，用于自动添加错误边界
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// 便捷的错误边界组件
export const ComponentErrorBoundary: React.FC<{
  children: ReactNode;
  name?: string;
}> = ({ children, name }) => (
  <ErrorBoundary
    level="component"
    context={{ component: name || 'Unknown' }}
    showReportButton={false}
  >
    {children}
  </ErrorBoundary>
);

export const PageErrorBoundary: React.FC<{
  children: ReactNode;
  pageName?: string;
}> = ({ children, pageName }) => (
  <ErrorBoundary
    level="page"
    context={{ component: pageName || 'Page', route: typeof window !== 'undefined' ? window.location.pathname : '' }}
    showReportButton={true}
  >
    {children}
  </ErrorBoundary>
);

export const CriticalErrorBoundary: React.FC<{
  children: ReactNode;
}> = ({ children }) => (
  <ErrorBoundary
    level="critical"
    context={{ component: 'App' }}
    showReportButton={true}
  >
    {children}
  </ErrorBoundary>
);