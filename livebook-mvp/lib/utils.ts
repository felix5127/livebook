import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}秒`
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const remainingSecs = Math.round(seconds % 60)
    return remainingSecs > 0 ? `${mins}分${remainingSecs}秒` : `${mins}分钟`
  } else {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  }
}

export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '104857600') // 100MB
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'audio/mp3,audio/wav,audio/m4a,audio/mpeg,audio/mp4').split(',')

  if (file.size > maxSize) {
    return { valid: false, error: '文件大小超过100MB限制' }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '不支持的文件格式，请上传MP3、WAV或M4A文件' }
  }

  return { valid: true }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'processing':
      return 'bg-yellow-100 text-yellow-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    case 'pending':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'processing':
      return '处理中'
    case 'failed':
      return '失败'
    case 'pending':
      return '等待中'
    default:
      return '未知'
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('复制失败:', error)
    return false
  }
}

export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}