'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Download, Copy, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Task, Segment } from '@/types'

export default function ResultPage() {
  const params = useParams()
  const taskId = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (taskId) {
      fetchTaskData()
      // 如果任务还在处理中，设置轮询
      const interval = setInterval(() => {
        if (task?.status === 'processing') {
          fetchTaskData()
        }
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [taskId, task?.status])

  const fetchTaskData = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`)
      if (response.ok) {
        const data = await response.json()
        setTask(data.task)
        setSegments(data.segments || [])
      }
    } catch (error) {
      console.error('获取任务数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    const fullText = segments.map(segment => segment.text).join(' ')
    try {
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const downloadTranscript = () => {
    const fullText = segments.map(segment => 
      `[${formatTime(segment.start_time)} - ${formatTime(segment.end_time)}]\n${segment.text}\n`
    ).join('\n')
    
    const blob = new Blob([fullText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript-${taskId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">任务未找到</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">转写结果</h1>
          <p className="text-gray-600">文件: {task.file_name}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                task.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : task.status === 'processing'
                  ? 'bg-yellow-100 text-yellow-800'
                  : task.status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {task.status === 'completed' && '已完成'}
                {task.status === 'processing' && '处理中'}
                {task.status === 'failed' && '失败'}
                {task.status === 'pending' && '等待中'}
              </span>
              {task.status === 'processing' && (
                <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
              )}
            </div>

            {task.status === 'completed' && segments.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      复制文本
                    </>
                  )}
                </button>
                <button
                  onClick={downloadTranscript}
                  className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载转录
                </button>
              </div>
            )}
          </div>

          {task.status === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">正在处理您的音频文件，请稍候...</p>
            </div>
          )}

          {task.status === 'failed' && (
            <div className="text-center py-8">
              <p className="text-red-600">处理失败: {task.error_message}</p>
            </div>
          )}

          {task.status === 'completed' && segments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">转录内容</h3>
              <div className="space-y-3">
                {segments.map((segment) => (
                  <div
                    key={segment.id}
                    className="border-l-4 border-blue-200 pl-4 py-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-500">
                        {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                      </span>
                      {segment.confidence && (
                        <span className="text-sm text-gray-400">
                          置信度: {(segment.confidence * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900">{segment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {task.status === 'completed' && segments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">未检测到音频内容</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}