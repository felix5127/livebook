import { z } from 'zod';

/**
 * 环境变量验证Schema
 * 定义了应用运行所需的所有环境变量及其验证规则
 */

// 通用验证函数
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// 开发环境下的宽松验证schema
const developmentEnvSchema = z.object({
  // Node.js环境配置
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // 阿里云DashScope API配置
  DASHSCOPE_API_KEY: z.string().optional(),
  DASHSCOPE_API_URL: z.string().url().optional(),
  BAILIAN_API_KEY: z.string().optional(),
  
  // Supabase配置
  NEXT_PUBLIC_SUPABASE_URL: z.string().refine(isValidUrl, {
    message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL'
  }).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required').optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // 应用配置
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  
  // 认证配置
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long').optional(),
  VALID_API_KEYS: z.string().optional(),
  ADMIN_API_KEY: z.string().optional(),
  
  // 开发环境特殊配置
  SKIP_API_AUTH: z.string().optional().transform(val => val === 'true'),
});

// 生产环境的严格验证schema
const productionEnvSchema = z.object({
  // Node.js环境配置
  NODE_ENV: z.literal('production'),
  
  // 阿里云DashScope API配置 - 生产环境必须有至少一个API密钥
  DASHSCOPE_API_KEY: z.string().min(1).optional(),
  DASHSCOPE_API_URL: z.string().url().default('https://dashscope.aliyuncs.com/api/v1/services/audio/asr'),
  BAILIAN_API_KEY: z.string().min(1).optional(),
  
  // Supabase配置 - 生产环境必填
  NEXT_PUBLIC_SUPABASE_URL: z.string().refine(isValidUrl, {
    message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL'
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required for production'),
  
  // 应用配置
  NEXT_PUBLIC_APP_URL: z.string().url(),
  
  // 认证配置 - 生产环境必填
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  VALID_API_KEYS: z.string().min(1, 'VALID_API_KEYS is required for production'),
  ADMIN_API_KEY: z.string().min(1, 'ADMIN_API_KEY is required for production'),
  
  // 生产环境允许跳过认证（用于初始部署测试）
  SKIP_API_AUTH: z.string().optional().transform(val => val === 'true'),
}).refine(
  (data) => data.DASHSCOPE_API_KEY || data.BAILIAN_API_KEY,
  {
    message: 'Either DASHSCOPE_API_KEY or BAILIAN_API_KEY must be provided',
    path: ['DASHSCOPE_API_KEY']
  }
);

// 测试环境schema
const testEnvSchema = z.object({
  NODE_ENV: z.literal('test'),
  
  // 测试环境下大部分配置都是可选的
  DASHSCOPE_API_KEY: z.string().optional(),
  DASHSCOPE_API_URL: z.string().url().optional(),
  BAILIAN_API_KEY: z.string().optional(),
  
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  
  JWT_SECRET: z.string().min(32).default('test-jwt-secret-32-characters-minimum'),
  VALID_API_KEYS: z.string().default('test_key_123'),
  ADMIN_API_KEY: z.string().default('admin_test_key'),
  
  SKIP_API_AUTH: z.string().optional().transform(val => val === 'true'),
});

/**
 * 根据环境选择对应的验证schema
 */
function getEnvSchema() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  switch (nodeEnv) {
    case 'production':
      return productionEnvSchema;
    case 'test':
      return testEnvSchema;
    case 'development':
    default:
      return developmentEnvSchema;
  }
}

/**
 * 验证环境变量
 * @returns 验证后的环境变量对象
 * @throws 如果验证失败，抛出详细的错误信息
 */
export function validateEnv() {
  const schema = getEnvSchema();
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  try {
    const validatedEnv = schema.parse(process.env);
    
    // 输出验证成功信息（仅在开发环境）
    if (nodeEnv === 'development') {
      console.log('✅ Environment variables validated successfully');
    }
    
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: any) => {
        const path = err.path.join('.');
        return `  ❌ ${path}: ${err.message}`;
      });
      
      const errorMessage = [
        `\n🚨 Environment variable validation failed in ${nodeEnv} mode:`,
        ...errorMessages,
        '',
        '💡 Please check your environment configuration:',
        '   - Review your .env.local file',
        '   - Compare with .env.example',
        '   - Ensure all required variables are set for your environment',
        ''
      ].join('\n');
      
      throw new Error(errorMessage);
    }
    
    throw error;
  }
}

/**
 * 获取验证后的环境变量（类型安全）
 */
export function getValidatedEnv() {
  return validateEnv();
}

/**
 * 检查特定环境变量是否已配置
 */
export function checkEnvVariable(name: keyof ReturnType<typeof validateEnv>): boolean {
  try {
    const env = validateEnv();
    return !!env[name];
  } catch {
    return false;
  }
}

/**
 * 获取环境变量配置状态报告
 */
export function getEnvConfigStatus() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const schema = getEnvSchema();
  
  // 获取schema中定义的所有字段
  const requiredFields = Object.keys(schema.shape);
  const configStatus: Record<string, { configured: boolean; required: boolean; value?: string }> = {};
  
  requiredFields.forEach(field => {
    const envValue = process.env[field];
    const isConfigured = !!envValue;
    const fieldSchema = schema.shape[field as keyof typeof schema.shape];
    
    // 检查字段是否为必需的（没有optional()或default()）
    const isRequired = !fieldSchema.isOptional() && !(fieldSchema._def as any).defaultValue;
    
    configStatus[field] = {
      configured: isConfigured,
      required: isRequired,
      value: isConfigured ? (field.includes('SECRET') || field.includes('KEY') ? '***' : envValue) : undefined
    };
  });
  
  return {
    environment: nodeEnv,
    configStatus,
    summary: {
      total: requiredFields.length,
      configured: Object.values(configStatus).filter(s => s.configured).length,
      required: Object.values(configStatus).filter(s => s.required).length,
      missingRequired: Object.entries(configStatus)
        .filter(([_, status]) => status.required && !status.configured)
        .map(([name]) => name)
    }
  };
}

// 导出类型
export type ValidatedEnv = ReturnType<typeof validateEnv>;
export type EnvConfigStatus = ReturnType<typeof getEnvConfigStatus>;