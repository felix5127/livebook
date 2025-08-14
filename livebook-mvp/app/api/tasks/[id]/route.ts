import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: '缺少任务ID' },
        { status: 400 }
      )
    }

    // 获取任务信息
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError) {
      console.error('获取任务失败:', taskError)
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      )
    }

    // 获取转写结果
    const { data: segments, error: segmentsError } = await supabase
      .from('segments')
      .select('*')
      .eq('task_id', taskId)
      .order('segment_index')

    if (segmentsError) {
      console.error('获取转写结果失败:', segmentsError)
      return NextResponse.json(
        { success: false, error: '获取转写结果失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      task,
      segments: segments || []
    })

  } catch (error) {
    console.error('获取任务数据失败:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id
    const { status, error_message, duration } = await request.json()

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: '缺少任务ID' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
    if (status) updateData.status = status
    if (error_message) updateData.error_message = error_message
    if (duration) updateData.duration = duration
    if (status === 'completed') updateData.completed_at = new Date().toISOString()

    // 更新任务状态
    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single()

    if (error) {
      console.error('更新任务失败:', error)
      return NextResponse.json(
        { success: false, error: '更新任务失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      task
    })

  } catch (error) {
    console.error('更新任务失败:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: '缺少任务ID' },
        { status: 400 }
      )
    }

    // 删除任务（segments会通过外键约束自动删除）
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      console.error('删除任务失败:', error)
      return NextResponse.json(
        { success: false, error: '删除任务失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '任务删除成功'
    })

  } catch (error) {
    console.error('删除任务失败:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}