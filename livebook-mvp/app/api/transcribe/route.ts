import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/audio/asr'

export async function POST(request: NextRequest) {
  try {
    const { taskId } = await request.json()

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: '缺少任务ID' },
        { status: 400 }
      )
    }

    if (!DASHSCOPE_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'DashScope API密钥未配置' },
        { status: 500 }
      )
    }

    // 获取任务信息
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      )
    }

    // 更新任务状态为处理中
    await supabase
      .from('tasks')
      .update({ status: 'processing' })
      .eq('id', taskId)

    try {
      // 模拟转写过程（实际实现需要调用DashScope API）
      // 这里使用模拟数据，实际项目中需要替换为真实的API调用
      
      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 3000))

      // 模拟转写结果
      const mockSegments = [
        {
          task_id: taskId,
          text: '欢迎使用Livebook音频转写平台，这是一个基于人工智能的语音识别服务。',
          start_time: 0.0,
          end_time: 3.5,
          confidence: 0.95,
          segment_index: 0
        },
        {
          task_id: taskId,
          text: '我们提供高精度的语音转文字功能，支持多种音频格式。',
          start_time: 3.5,
          end_time: 7.0,
          confidence: 0.92,
          segment_index: 1
        },
        {
          task_id: taskId,
          text: '请上传您的音频文件，我们将为您提供准确的转写结果。',
          start_time: 7.0,
          end_time: 10.5,
          confidence: 0.97,
          segment_index: 2
        }
      ]

      // 保存转写结果
      const { error: segmentsError } = await supabase
        .from('segments')
        .insert(mockSegments)

      if (segmentsError) {
        throw new Error('保存转写结果失败')
      }

      // 更新任务状态为完成
      await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          duration: 10.5,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)

      return NextResponse.json({
        success: true,
        message: '转写完成'
      })

    } catch (transcriptionError) {
      console.error('转写失败:', transcriptionError)
      
      // 更新任务状态为失败
      await supabase
        .from('tasks')
        .update({ 
          status: 'failed',
          error_message: transcriptionError instanceof Error ? transcriptionError.message : '转写过程中发生错误'
        })
        .eq('id', taskId)

      return NextResponse.json(
        { success: false, error: '转写失败' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('转写请求处理失败:', error)
    return NextResponse.json(
      { success: false, error: '请求处理失败' },
      { status: 500 }
    )
  }
}

// 实际的DashScope API调用示例（未启用）
async function callDashScopeAPI(filePath: string) {
  // 注意：这是一个示例实现，实际使用时需要根据DashScope的具体API文档进行调整
  
  const formData = new FormData()
  // formData.append('model', 'paraformer-realtime-v1')
  // formData.append('file', fs.createReadStream(filePath))
  // formData.append('parameters', JSON.stringify({
  //   format: 'pcm',
  //   sample_rate: 16000,
  //   enable_words: true
  // }))

  const response = await fetch(DASHSCOPE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
    },
    body: formData
  })

  if (!response.ok) {
    throw new Error(`DashScope API调用失败: ${response.statusText}`)
  }

  return await response.json()
}