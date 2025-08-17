/**
 * 环境变量初始化和检查模块
 * 用于在应用启动时验证和初始化环境变量
 */

import { validateEnv, getEnvConfigStatus, type ValidatedEnv } from './env-validation';

// 重新导出环境配置状态函数和类型
export { getEnvConfigStatus, type ValidatedEnv } from './env-validation';

// 全局环境变量缓存
let cachedEnv: ValidatedEnv | null = null;
let initializationError: Error | null = null;

/**
 * 初始化环境变量验证
 * 在应用启动时调用，验证所有环境变量
 */
export function initializeEnv(): ValidatedEnv {
  // 如果已经初始化过且成功，直接返回缓存
  if (cachedEnv) {
    return cachedEnv;
  }
  
  // 如果之前初始化失败，重新抛出错误
  if (initializationError) {
    throw initializationError;
  }
  
  try {
    console.log('🔧 Initializing environment variables...');
    
    // 验证环境变量
    const validatedEnv = validateEnv();
    
    // 缓存验证结果
    cachedEnv = validatedEnv;
    
    // 输出配置状态（开发环境）
    if (validatedEnv.NODE_ENV === 'development') {
      printEnvStatus();
    }
    
    console.log('✅ Environment initialization completed successfully');
    return validatedEnv;
    
  } catch (error) {
    initializationError = error as Error;
    
    // 输出详细错误信息
    console.error('❌ Environment initialization failed:');
    console.error(error);
    
    // 输出配置指导
    printConfigurationGuide();
    
    throw error;
  }
}

/**
 * 获取已验证的环境变量
 * 如果尚未初始化，则先进行初始化
 */
export function getEnv(): ValidatedEnv {
  if (!cachedEnv) {
    return initializeEnv();
  }
  return cachedEnv;
}

/**
 * 重置环境变量缓存
 * 用于测试或重新加载配置
 */
export function resetEnvCache(): void {
  cachedEnv = null;
  initializationError = null;
}

/**
 * 检查环境变量是否已正确初始化
 */
export function isEnvInitialized(): boolean {
  return cachedEnv !== null && initializationError === null;
}

/**
 * 打印环境变量配置状态
 */
function printEnvStatus(): void {
  const status = getEnvConfigStatus();
  
  console.log('\n📊 Environment Configuration Status:');
  console.log(`   Environment: ${status.environment}`);
  console.log(`   Total variables: ${status.summary.total}`);
  console.log(`   Configured: ${status.summary.configured}/${status.summary.total}`);
  console.log(`   Required: ${status.summary.required}`);
  
  if (status.summary.missingRequired.length > 0) {
    console.log(`   ⚠️  Missing required: ${status.summary.missingRequired.join(', ')}`);
  }
  
  // 详细配置状态
  console.log('\n📋 Detailed Configuration:');
  Object.entries(status.configStatus).forEach(([name, config]) => {
    const icon = config.configured ? '✅' : (config.required ? '❌' : '⚪');
    const status = config.configured ? 'SET' : 'NOT SET';
    const required = config.required ? '(required)' : '(optional)';
    
    console.log(`   ${icon} ${name}: ${status} ${required}`);
  });
  
  console.log('');
}

/**
 * 打印配置指导信息
 */
function printConfigurationGuide(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  console.log('\n📝 Configuration Guide:');
  console.log('');
  console.log('1. 📄 Check your environment file:');
  console.log('   - Ensure .env.local exists in your project root');
  console.log('   - Compare with .env.example for required variables');
  console.log('');
  console.log('2. 🔑 Required variables for', nodeEnv, 'environment:');
  
  switch (nodeEnv) {
    case 'production':
      console.log('   ✓ NEXT_PUBLIC_SUPABASE_URL');
      console.log('   ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY');
      console.log('   ✓ SUPABASE_SERVICE_ROLE_KEY');
      console.log('   ✓ JWT_SECRET (min 32 characters)');
      console.log('   ✓ VALID_API_KEYS');
      console.log('   ✓ ADMIN_API_KEY');
      console.log('   ✓ DASHSCOPE_API_KEY or BAILIAN_API_KEY');
      console.log('   ✓ NEXT_PUBLIC_APP_URL');
      break;
      
    case 'development':
      console.log('   ✓ NEXT_PUBLIC_SUPABASE_URL (optional but recommended)');
      console.log('   ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY (optional but recommended)');
      console.log('   ✓ JWT_SECRET (optional, min 32 chars if provided)');
      console.log('   ✓ DASHSCOPE_API_KEY or BAILIAN_API_KEY (optional for testing)');
      break;
      
    case 'test':
      console.log('   ✓ Most variables are optional in test environment');
      console.log('   ✓ Default test values will be used if not provided');
      break;
  }
  
  console.log('');
  console.log('3. 🛠️  Quick setup commands:');
  console.log('   cp .env.example .env.local');
  console.log('   # Edit .env.local with your actual values');
  console.log('');
  console.log('4. 📚 Documentation:');
  console.log('   - Check API_AUTH_GUIDE.md for authentication setup');
  console.log('   - Check SUPABASE_SETUP.md for database configuration');
  console.log('   - Check DEPLOYMENT.md for production deployment');
  console.log('');
}

/**
 * 验证特定服务的配置
 */
export function validateServiceConfig(service: 'supabase' | 'dashscope' | 'auth'): boolean {
  try {
    const env = getEnv();
    
    switch (service) {
      case 'supabase':
        return !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        
      case 'dashscope':
        return !!(env.DASHSCOPE_API_KEY || env.BAILIAN_API_KEY);
        
      case 'auth':
        return !!(env.JWT_SECRET && env.VALID_API_KEYS);
        
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * 获取服务配置状态
 */
export function getServiceStatus() {
  return {
    supabase: validateServiceConfig('supabase'),
    dashscope: validateServiceConfig('dashscope'),
    auth: validateServiceConfig('auth'),
    initialized: isEnvInitialized()
  };
}

/**
 * 环境变量健康检查
 * 返回系统健康状态
 */
export function healthCheck() {
  try {
    const env = getEnv();
    const serviceStatus = getServiceStatus();
    
    return {
      status: 'healthy',
      environment: env.NODE_ENV,
      services: serviceStatus,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}