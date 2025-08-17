import { createClient } from '@supabase/supabase-js';
import { sanitizeFileName } from './utils';

// 直接从环境变量获取配置（客户端安全）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// 服务端环境变量（仅在服务端可用）
let supabaseServiceRoleKey: string = '';
let validateServiceConfigFn: ((service: string) => boolean) | null = null;

if (typeof window === 'undefined') {
  // 只在服务端导入复杂的环境验证
  try {
    const { getEnv, validateServiceConfig } = require('./env-init');
    const env = getEnv();
    supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || '';
    // 缓存函数引用
    validateServiceConfigFn = validateServiceConfig;
    // 导出validateServiceConfig供其他模块使用
    (global as any).validateServiceConfig = validateServiceConfig;
  } catch (error) {
    console.warn('Server environment validation failed');
    supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    // 提供简单的fallback
    validateServiceConfigFn = () => true;
    (global as any).validateServiceConfig = () => true;
  }
} else {
  // 客户端不应该有服务端密钥
  supabaseServiceRoleKey = '';
}

// 客户端 Supabase 实例 (用于前端)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 服务端 Supabase 实例 (用于后端，具有更高权限)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey);

// 文件上传到 Supabase Storage
export async function uploadFileToStorage(
  file: File,
  bucket: string = 'audio-files',
  folder: string = 'uploads'
): Promise<{ success: boolean; url?: string; error?: string; path?: string }> {
  try {
    // 检查Supabase服务配置
    const validateFn = validateServiceConfigFn || (global as any).validateServiceConfig;
    if (!validateFn || !validateFn('supabase')) {
      console.log('Supabase未配置，跳过文件上传');
      return { success: false, error: 'Supabase未配置' };
    }
    // 生成唯一安全文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const safeFileName = sanitizeFileName(file.name);
    const fileExtension = safeFileName.split('.').pop();
    const baseName = safeFileName.replace(/\.[^/.]+$/, '');
    
    const fileName = `${baseName}_${timestamp}_${randomString}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    // 上传文件到 Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error('Supabase 上传错误:', error);
      return { success: false, error: error.message };
    }

    // 获取公开访问 URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return { success: false, error: '无法获取文件公开URL' };
    }

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath
    };

  } catch (error: any) {
    console.error('文件上传失败:', error);
    return { success: false, error: error.message || '文件上传失败' };
  }
}

// 删除文件
export async function deleteFileFromStorage(
  filePath: string,
  bucket: string = 'audio-files'
): Promise<{ success: boolean; error?: string }> {
  try {
    // 检查Supabase服务配置
    const validateFn = validateServiceConfigFn || (global as any).validateServiceConfig;
    if (!validateFn || !validateFn('supabase')) {
      console.log('Supabase未配置，跳过文件删除');
      return { success: false, error: 'Supabase未配置' };
    }
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('文件删除错误:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('文件删除失败:', error);
    return { success: false, error: error.message || '文件删除失败' };
  }
}

// 检查存储桶是否存在，如果不存在则创建
export async function ensureBucketExists(bucketName: string = 'audio-files') {
  try {
    // 检查Supabase服务配置
    const validateFn = validateServiceConfigFn || (global as any).validateServiceConfig;
    if (!validateFn || !validateFn('supabase')) {
      console.log('Supabase未配置，跳过存储桶操作');
      return { success: false, error: 'Supabase未配置' };
    }
    
    // 尝试获取存储桶信息
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('获取存储桶列表失败:', listError);
      return { success: false, error: listError.message };
    }

    // 检查存储桶是否存在
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      // 创建存储桶
      const { data, error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: [
          'audio/mpeg',
          'audio/wav', 
          'audio/mp4',
          'audio/x-m4a',
          'video/mp4',
          'video/quicktime'
        ],
        fileSizeLimit: 50 * 1024 * 1024 // 50MB
      });

      if (createError) {
        console.error('创建存储桶失败:', createError);
        return { success: false, error: createError.message };
      }

      console.log('存储桶创建成功:', bucketName);
    }

    return { success: true };
  } catch (error: any) {
    console.error('检查/创建存储桶失败:', error);
    return { success: false, error: error.message || '存储桶操作失败' };
  }
}