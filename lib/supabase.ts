import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
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
    // 生成唯一文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${file.name.replace(/\.[^/.]+$/, '')}_${timestamp}_${randomString}.${fileExtension}`;
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
        fileSizeLimit: 30 * 1024 * 1024 // 30MB
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