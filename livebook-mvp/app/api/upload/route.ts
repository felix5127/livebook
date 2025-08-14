import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '104857600') // 100MB
const ALLOWED_TYPES = (process.env.ALLOWED_FILE_TYPES || 'audio/mp3,audio/wav,audio/m4a,audio/mpeg,audio/mp4').split(',')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: '没有上传文件' },
        { status: 400 }
      )
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: '文件大小超过限制 (100MB)' },
        { status: 400 }
      )
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '不支持的文件类型' },
        { status: 400 }
      )
    }

    // 创建上传目录
    const uploadDir = join(process.cwd(), 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const filePath = join(uploadDir, fileName)

    // 保存文件
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 创建任务记录
    const { data: task, error } = await supabase
      .from('tasks')
      .insert([
        {
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_path: filePath,
          status: 'pending'
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('创建任务失败:', error)
      return NextResponse.json(
        { success: false, error: '创建任务失败' },
        { status: 500 }
      )
    }

    // 触发转写任务（异步）
    fetch(`${request.nextUrl.origin}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: task.id })
    }).catch(error => {
      console.error('启动转写任务失败:', error)
    })

    return NextResponse.json({
      success: true,
      taskId: task.id,
      message: '文件上传成功，开始转写'
    })

  } catch (error) {
    console.error('上传失败:', error)
    return NextResponse.json(
      { success: false, error: '上传失败，请重试' },
      { status: 500 }
    )
  }
}