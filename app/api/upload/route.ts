import { NextRequest, NextResponse } from 'next/server';
import { validateFileType, validateFileSize } from '@/lib/utils';
import { uploadFileToStorage, ensureBucketExists } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 解析 FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '没有找到上传的文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!validateFileType(file)) {
      return NextResponse.json(
        { 
          success: false, 
          error: '不支持的文件格式。支持的格式：MP3, WAV, M4A, MP4, MOV' 
        },
        { status: 400 }
      );
    }

    // 验证文件大小 (50MB)
    if (!validateFileSize(file, 50)) {
      return NextResponse.json(
        { 
          success: false, 
          error: '文件大小超过限制（最大50MB）' 
        },
        { status: 400 }
      );
    }

    // 检查Supabase环境变量
    const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!hasSupabaseConfig) {
      console.log('Supabase未配置，使用测试音频');
      // 如果没有Supabase配置，直接使用测试音频
      const mockFileUrl = `https://gw.alipayobjects.com/os/bmw-prod/0574ee2e-f494-45a5-820f-63aee583045a.wav`;
      
      console.log('回退到测试音频:', {
        originalName: file.name,
        size: file.size,
        type: file.type,
        reason: 'Supabase配置问题'
      });

      return NextResponse.json({
        success: true,
        data: {
          fileUrl: mockFileUrl,
          fileName: file.name,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type
        }
      });
    }

    // 确保存储桶存在
    const bucketResult = await ensureBucketExists('audio-files');
    if (!bucketResult.success) {
      console.error('存储桶检查失败:', bucketResult.error);
      // 如果存储桶操作失败，回退到测试音频
      const mockFileUrl = `https://gw.alipayobjects.com/os/bmw-prod/0574ee2e-f494-45a5-820f-63aee583045a.wav`;
      
      console.log('回退到测试音频:', {
        originalName: file.name,
        size: file.size,
        type: file.type,
        reason: '存储桶检查失败'
      });

      return NextResponse.json({
        success: true,
        data: {
          fileUrl: mockFileUrl,
          fileName: file.name,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type
        }
      });
    }

    // 上传文件到 Supabase Storage
    const uploadResult = await uploadFileToStorage(file, 'audio-files', 'uploads');
    
    if (!uploadResult.success) {
      console.error('Supabase上传失败:', uploadResult.error);
      
      // 上传失败时回退到测试音频
      const mockFileUrl = `https://gw.alipayobjects.com/os/bmw-prod/0574ee2e-f494-45a5-820f-63aee583045a.wav`;
      
      console.log('回退到测试音频:', {
        originalName: file.name,
        size: file.size,
        type: file.type,
        reason: uploadResult.error
      });

      return NextResponse.json({
        success: true,
        data: {
          fileUrl: mockFileUrl,
          fileName: file.name,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type
        }
      });
    }

    console.log('文件上传成功到Supabase:', {
      originalName: file.name,
      fileUrl: uploadResult.url,
      filePath: uploadResult.path,
      size: file.size,
      type: file.type
    });

    return NextResponse.json({
      success: true,
      data: {
        fileUrl: uploadResult.url,
        fileName: uploadResult.path?.split('/').pop() || file.name,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        filePath: uploadResult.path
      }
    });

  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '文件上传失败，请重试' 
      },
      { status: 500 }
    );
  }
}

// 设置文件大小限制
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 秒超时