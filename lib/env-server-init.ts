/**
 * 服务端环境变量初始化
 * 用于API路由、中间件和服务端组件
 */

import { initializeEnv, type ValidatedEnv } from './env-init';

// 服务端环境变量缓存
let serverEnv: ValidatedEnv | null = null;
let serverInitError: Error | null = null;

/**
 * 初始化服务端环境变量
 * 只在服务端执行，确保环境变量在服务启动时验证
 */
export function initializeServerEnv(): ValidatedEnv {
  // 只在服务端执行
  if (typeof window !== 'undefined') {
    throw new Error('initializeServerEnv should only be called on the server');
  }

  // 如果已经初始化过且成功，直接返回缓存
  if (serverEnv) {
    return serverEnv;
  }
  
  // 如果之前初始化失败，重新抛出错误
  if (serverInitError) {
    throw serverInitError;
  }
  
  try {
    console.log('🔧 [Server] Initializing environment variables...');
    
    // 验证环境变量
    const validatedEnv = initializeEnv();
    
    // 缓存验证结果
    serverEnv = validatedEnv;
    
    console.log('✅ [Server] Environment initialization completed successfully');
    return validatedEnv;
    
  } catch (error) {
    serverInitError = error as Error;
    
    // 输出详细错误信息
    console.error('❌ [Server] Environment initialization failed:');
    console.error(error);
    
    throw error;
  }
}

/**
 * 获取服务端已验证的环境变量
 * 如果尚未初始化，则先进行初始化
 */
export function getServerEnv(): ValidatedEnv {
  if (!serverEnv) {
    return initializeServerEnv();
  }
  return serverEnv;
}

/**
 * 检查服务端环境变量是否已正确初始化
 */
export function isServerEnvInitialized(): boolean {
  return serverEnv !== null && serverInitError === null;
}

/**
 * 重置服务端环境变量缓存
 * 用于测试或重新加载配置
 */
export function resetServerEnvCache(): void {
  serverEnv = null;
  serverInitError = null;
}

/**
 * 安全获取环境变量
 * 如果初始化失败，返回默认值而不抛出错误
 */
export function safeGetServerEnv(): ValidatedEnv | null {
  try {
    return getServerEnv();
  } catch (error) {
    console.warn('[Server] Failed to get environment variables:', error);
    return null;
  }
}

/**
 * 中间件专用的环境变量获取函数
 * 为中间件提供更宽松的错误处理
 */
export function getEnvForMiddleware() {
  const env = safeGetServerEnv();
  
  return {
    env,
    isAvailable: env !== null,
    // 为中间件提供安全的访问器
    getJwtSecret: () => env?.JWT_SECRET || null,
    getValidApiKeys: () => {
      if (!env?.VALID_API_KEYS) return [];
      return env.VALID_API_KEYS.split(',').filter(Boolean).map((key: string) => key.trim());
    },
    getNodeEnv: () => env?.NODE_ENV || 'development',
    shouldSkipAuth: () => env?.SKIP_API_AUTH === true
  };
}

/**
 * API路由专用的环境变量获取函数
 * 为API路由提供严格的验证
 */
export function getEnvForAPI() {
  const env = getServerEnv(); // 这里使用严格验证，失败会抛出错误
  
  return {
    env,
    // API相关的安全访问器
    getDashScopeConfig: () => ({
      apiKey: env.DASHSCOPE_API_KEY || env.BAILIAN_API_KEY || '',
      apiUrl: env.DASHSCOPE_API_URL || 'https://dashscope.aliyuncs.com/api/v1/services/audio/asr',
      hasApiKey: !!(env.DASHSCOPE_API_KEY || env.BAILIAN_API_KEY)
    }),
    getSupabaseConfig: () => ({
      url: env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
      isConfigured: !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    }),
    getAuthConfig: () => ({
      jwtSecret: env.JWT_SECRET || '',
      validApiKeys: env.VALID_API_KEYS ? env.VALID_API_KEYS.split(',').filter(Boolean).map((key: string) => key.trim()) : [],
      adminApiKey: env.ADMIN_API_KEY || '',
      skipAuth: env.SKIP_API_AUTH === true,
      isConfigured: !!(env.JWT_SECRET && env.VALID_API_KEYS)
    })
  };
}

/**
 * 在应用启动时预初始化环境变量
 * 可以在入口文件中调用，确保环境变量尽早验证
 */
export function preInitializeServerEnv(): void {
  if (typeof window === 'undefined') {
    try {
      initializeServerEnv();
    } catch (error) {
      // 在预初始化阶段，我们只记录错误，不阻止应用启动
      console.warn('[Server] Pre-initialization failed, environment will be validated on first use:', error);
    }
  }
}

// 在模块加载时尝试预初始化（仅在服务端）
if (typeof window === 'undefined') {
  // 使用setTimeout确保在模块完全加载后执行
  setTimeout(() => {
    preInitializeServerEnv();
  }, 0);
}