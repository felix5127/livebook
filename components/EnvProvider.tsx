'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeEnv, getServiceStatus, type ValidatedEnv } from '../lib/env-init';

interface EnvContextType {
  env: ValidatedEnv | null;
  isLoading: boolean;
  error: string | null;
  serviceStatus: ReturnType<typeof getServiceStatus>;
  initialized: boolean;
}

const EnvContext = createContext<EnvContextType | undefined>(undefined);

interface EnvProviderProps {
  children: ReactNode;
}

/**
 * 环境变量提供器组件
 * 在应用启动时验证和初始化环境变量
 */
export function EnvProvider({ children }: EnvProviderProps) {
  const [state, setState] = useState<EnvContextType>({
    env: null,
    isLoading: true,
    error: null,
    serviceStatus: { supabase: false, dashscope: false, auth: false, initialized: false },
    initialized: false
  });

  useEffect(() => {
    async function initEnv() {
      try {
        console.log('🔧 EnvProvider: Initializing environment variables...');
        
        // 在客户端初始化环境变量
        const validatedEnv = initializeEnv();
        const serviceStatus = getServiceStatus();
        
        setState(prev => ({
          ...prev,
          env: validatedEnv,
          serviceStatus,
          initialized: true,
          isLoading: false,
          error: null
        }));
        
        console.log('✅ EnvProvider: Environment initialized successfully');
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ EnvProvider: Environment initialization failed:', errorMessage);
        
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
          initialized: false
        }));
      }
    }

    initEnv();
  }, []);

  // 在开发环境下显示环境配置错误
  if (state.error && process.env.NODE_ENV === 'development') {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="max-w-2xl bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.828 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-red-600">环境配置错误</h1>
              <p className="text-gray-600">应用无法启动，请检查环境变量配置</p>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <pre className="text-sm text-red-800 whitespace-pre-wrap overflow-x-auto">
              {state.error}
            </pre>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>解决步骤：</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>检查项目根目录下的 <code className="bg-gray-100 px-1 rounded">.env.local</code> 文件</li>
              <li>参考 <code className="bg-gray-100 px-1 rounded">.env.example</code> 设置必需的环境变量</li>
              <li>确保环境变量格式正确（特别是URL和密钥长度）</li>
              <li>重启开发服务器</li>
            </ol>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 在生产环境下，即使有配置错误也继续运行（但功能可能受限）
  return (
    <EnvContext.Provider value={state}>
      {children}
    </EnvContext.Provider>
  );
}

/**
 * 使用环境变量上下文的Hook
 */
export function useEnv(): EnvContextType {
  const context = useContext(EnvContext);
  if (context === undefined) {
    throw new Error('useEnv must be used within an EnvProvider');
  }
  return context;
}

/**
 * 检查特定服务是否可用的Hook
 */
export function useServiceAvailable(service: 'supabase' | 'dashscope' | 'auth'): boolean {
  const { serviceStatus } = useEnv();
  return serviceStatus[service];
}

/**
 * 环境状态显示组件（调试用）
 */
export function EnvStatus() {
  const { env, serviceStatus, initialized, error } = useEnv();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">环境状态</h3>
      <div className="space-y-1 text-xs">
        <div className={`flex items-center ${initialized ? 'text-green-600' : 'text-red-600'}`}>
          <span className={`w-2 h-2 rounded-full mr-2 ${initialized ? 'bg-green-500' : 'bg-red-500'}`}></span>
          初始化: {initialized ? '完成' : '失败'}
        </div>
        <div className={`flex items-center ${serviceStatus.supabase ? 'text-green-600' : 'text-gray-500'}`}>
          <span className={`w-2 h-2 rounded-full mr-2 ${serviceStatus.supabase ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          Supabase: {serviceStatus.supabase ? '已配置' : '未配置'}
        </div>
        <div className={`flex items-center ${serviceStatus.dashscope ? 'text-green-600' : 'text-gray-500'}`}>
          <span className={`w-2 h-2 rounded-full mr-2 ${serviceStatus.dashscope ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          DashScope: {serviceStatus.dashscope ? '已配置' : '未配置'}
        </div>
        <div className={`flex items-center ${serviceStatus.auth ? 'text-green-600' : 'text-gray-500'}`}>
          <span className={`w-2 h-2 rounded-full mr-2 ${serviceStatus.auth ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          认证: {serviceStatus.auth ? '已配置' : '未配置'}
        </div>
        {env && (
          <div className="text-gray-600 mt-2 pt-2 border-t border-gray-200">
            环境: {env.NODE_ENV}
          </div>
        )}
        {error && (
          <div className="text-red-600 mt-2 pt-2 border-t border-gray-200 text-xs">
            错误: {error.substring(0, 50)}...
          </div>
        )}
      </div>
    </div>
  );
}