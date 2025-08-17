import { NextRequest, NextResponse } from 'next/server';
import { dashScopeClient } from '@/lib/dashscope';
import { 
  generateTaskId, 
  isValidAudioFile, 
  isFileSizeValid,
  formatFileSize 
} from '@/lib/utils';
import { ProcessedTranscription } from '@/types/transcription';

// 支持的请求方法
export async function POST(request: NextRequest) {
  try {
    // 获取认证信息（由中间件添加）
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const userEmail = request.headers.get('x-user-email') || '';
    const authMethod = request.headers.get('x-auth-method') || 'none';

    console.log(`[API] 转写请求认证信息: 用户ID=${userId}, 邮箱=${userEmail}, 认证方式=${authMethod}`);

    // 解析请求体
    const body = await request.json();
    const { fileUrl, fileName, fileSize, speakerCount, languageHints } = body;

    // 验证必需参数
    if (!fileUrl) {
      return NextResponse.json(
        { error: '文件 URL 不能为空' },
        { status: 400 }
      );
    }

    if (!fileName) {
      return NextResponse.json(
        { error: '文件名不能为空' },
        { status: 400 }
      );
    }

    // 验证文件格式
    if (!isValidAudioFile(fileName)) {
      return NextResponse.json(
        { 
          error: '不支持的文件格式',
          details: '支持的格式：mp3, wav, m4a, mp4, mov, avi, mkv, flac, aac, ogg'
        },
        { status: 400 }
      );
    }

    // 验证文件大小 (如果提供)
    if (fileSize && !isFileSizeValid(fileSize, 500)) {
      return NextResponse.json(
        { 
          error: '文件大小超出限制',
          details: `文件大小 ${formatFileSize(fileSize)}，最大支持 500MB`
        },
        { status: 400 }
      );
    }

    // 验证说话人数量
    if (speakerCount && (speakerCount < 1 || speakerCount > 10)) {
      return NextResponse.json(
        { error: '说话人数量必须在 1-10 之间' },
        { status: 400 }
      );
    }

    console.log(`[API] 开始处理转写请求: ${fileName}`);
    console.log(`[API] 文件 URL: ${fileUrl}`);
    console.log(`[API] 说话人数量: ${speakerCount || 'auto'}`);

    // 提交转写任务
    const response = await dashScopeClient.submitWithRetry(fileUrl, {
      speakerCount,
      languageHints: languageHints || ['zh', 'en']
    });

    // 生成内部任务 ID
    const internalTaskId = generateTaskId('transcribe');

    // 构造返回数据
    const transcription: Partial<ProcessedTranscription> = {
      id: internalTaskId,
      status: 'pending',
      file_name: fileName,
      file_url: fileUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      task_id: response.output.task_id
    };

    console.log(`[API] 任务提交成功: ${response.output.task_id}`);

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: {
        taskId: internalTaskId,
        dashScopeTaskId: response.output.task_id,
        status: 'pending',
        message: '转写任务已提交，正在处理中...',
        transcription
      }
    });

  } catch (error: any) {
    console.error('[API] 转写任务提交失败:', error);

    // 处理不同类型的错误
    if (error.code) {
      // DashScope API 错误
      return NextResponse.json(
        { 
          error: '转写服务错误',
          details: error.message,
          code: error.code,
          requestId: error.request_id
        },
        { status: 500 }
      );
    }

    // 网络或其他错误
    return NextResponse.json(
      { 
        error: '服务暂时不可用',
        details: '请稍后重试或联系技术支持',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// 获取转写任务列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 这里应该从数据库查询任务列表
    // 目前返回示例数据
    const tasks: ProcessedTranscription[] = [];

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        total: tasks.length,
        limit,
        offset
      }
    });

  } catch (error: any) {
    console.error('[API] 获取任务列表失败:', error);

    return NextResponse.json(
      { 
        error: '获取任务列表失败',
        details: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
      },
      { status: 500 }
    );
  }
}