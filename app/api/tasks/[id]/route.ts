import { NextRequest, NextResponse } from 'next/server';
import { dashScopeClient } from '@/lib/dashscope';
import { ProcessedTranscription } from '@/types/transcription';

interface RouteParams {
  params: {
    id: string;
  };
}

// 查询任务状态
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // 获取认证信息（由中间件添加）
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const userEmail = request.headers.get('x-user-email') || '';
    const authMethod = request.headers.get('x-auth-method') || 'none';

    console.log(`[API Tasks] 认证信息: 用户ID=${userId}, 邮箱=${userEmail}, 认证方式=${authMethod}`);

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: '任务 ID 不能为空' },
        { status: 400 }
      );
    }

    console.log(`[API] 查询任务状态: ${id}`);

    // 这里需要根据内部任务 ID 查询对应的 DashScope 任务 ID
    // 目前直接使用传入的 ID 作为 DashScope 任务 ID (需要改进)
    let dashScopeTaskId = id;
    
    // 如果是内部任务 ID，需要从数据库查询对应的 DashScope 任务 ID
    if (id.startsWith('transcribe_')) {
      // TODO: 从数据库查询 DashScope 任务 ID
      // const task = await getTaskFromDatabase(id);
      // dashScopeTaskId = task.dashScopeTaskId;
      
      // 暂时返回错误，提示需要数据库集成
      return NextResponse.json(
        { 
          error: '任务查询功能需要数据库集成',
          details: '请使用 DashScope 任务 ID 直接查询，或集成数据库存储'
        },
        { status: 501 }
      );
    }

    // 查询 DashScope 任务状态
    const taskStatus = await dashScopeClient.checkTaskStatus(dashScopeTaskId);
    
    console.log(`[API] 任务状态: ${taskStatus.output.task_status}`);

    // 构造返回数据
    const response: any = {
      success: true,
      data: {
        taskId: id,
        dashScopeTaskId: dashScopeTaskId,
        status: mapDashScopeStatus(taskStatus.output.task_status),
        dashScopeStatus: taskStatus.output.task_status,
        submitTime: taskStatus.output.submit_time,
        scheduledTime: taskStatus.output.scheduled_time,
        endTime: taskStatus.output.end_time,
        metrics: taskStatus.output.task_metrics
      }
    };

    // 如果任务完成，解析转写结果
    if (taskStatus.output.task_status === 'SUCCESS' || taskStatus.output.task_status === 'SUCCEEDED') {
      try {
        console.log('[API] 完整任务响应:', JSON.stringify(taskStatus, null, 2));
        const transcription = await dashScopeClient.parseTranscriptionResult(taskStatus);
        response.data.result = transcription.result;
        response.data.transcription = transcription;
        
        console.log(`[API] 转写完成，共 ${transcription.result?.segments?.length || 0} 个片段`);
      } catch (parseError) {
        console.error('[API] 解析转写结果失败:', parseError);
        console.error('[API] 任务状态结构:', JSON.stringify(taskStatus.output, null, 2));
        response.data.parseError = '转写结果解析失败';
      }
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error(`[API] 查询任务状态失败 (${params.id}):`, error);

    // 处理不同类型的错误
    if (error.code) {
      // DashScope API 错误
      return NextResponse.json(
        { 
          error: '查询任务状态失败',
          details: error.message,
          code: error.code,
          requestId: error.request_id
        },
        { status: 500 }
      );
    }

    // 任务不存在
    if (error.message?.includes('not found') || error.message?.includes('404')) {
      return NextResponse.json(
        { 
          error: '任务不存在',
          details: `找不到 ID 为 ${params.id} 的任务`
        },
        { status: 404 }
      );
    }

    // 其他错误
    return NextResponse.json(
      { 
        error: '查询任务状态失败',
        details: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
      },
      { status: 500 }
    );
  }
}

// 更新任务状态 (用于手动刷新)
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action } = body;

    if (!id) {
      return NextResponse.json(
        { error: '任务 ID 不能为空' },
        { status: 400 }
      );
    }

    console.log(`[API] 更新任务: ${id}, 操作: ${action}`);

    switch (action) {
      case 'refresh':
        // 强制刷新任务状态
        return await GET(request, { params });
      
      case 'retry':
        // 重试失败的任务
        return NextResponse.json(
          { 
            error: '重试功能暂未实现',
            details: '请重新提交转写任务'
          },
          { status: 501 }
        );
      
      default:
        return NextResponse.json(
          { error: `不支持的操作: ${action}` },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error(`[API] 更新任务失败 (${params.id}):`, error);

    return NextResponse.json(
      { 
        error: '更新任务失败',
        details: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
      },
      { status: 500 }
    );
  }
}

// 删除任务
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: '任务 ID 不能为空' },
        { status: 400 }
      );
    }

    console.log(`[API] 删除任务: ${id}`);

    // TODO: 从数据库删除任务记录
    // await deleteTaskFromDatabase(id);

    return NextResponse.json({
      success: true,
      message: '任务已删除',
      data: { taskId: id }
    });

  } catch (error: any) {
    console.error(`[API] 删除任务失败 (${params.id}):`, error);

    return NextResponse.json(
      { 
        error: '删除任务失败',
        details: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
      },
      { status: 500 }
    );
  }
}

/**
 * 映射 DashScope 状态到应用内部状态
 */
function mapDashScopeStatus(
  dashScopeStatus: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'SUCCEEDED' | 'FAILED'
): 'pending' | 'processing' | 'completed' | 'failed' {
  switch (dashScopeStatus) {
    case 'PENDING':
      return 'pending';
    case 'RUNNING':
      return 'processing';
    case 'SUCCESS':
    case 'SUCCEEDED':
      return 'completed';
    case 'FAILED':
      return 'failed';
    default:
      return 'pending';
  }
}