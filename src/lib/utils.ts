import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化时间 (秒 -> HH:MM:SS)
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 验证文件类型
export function validateFileType(file: File): boolean {
  const supportedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'video/mp4', 'video/quicktime'];
  return supportedTypes.includes(file.type);
}

// 验证文件大小 (30MB)
export function validateFileSize(file: File): boolean {
  const maxSize = 30 * 1024 * 1024; // 30MB in bytes
  return file.size <= maxSize;
}

// 获取文件扩展名
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

// 验证 YouTube URL
export function isYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)/i;
  return youtubeRegex.test(url);
}

// 验证 B站 URL
export function isBilibiliUrl(url: string): boolean {
  const bilibiliRegex = /^(https?:\/\/)?(www\.)?bilibili\.com\/video\/[A-Za-z0-9]+/i;
  return bilibiliRegex.test(url);
}

// 生成随机颜色 (用于说话人标识)
export function generateRandomColor(): string {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
    '#6366f1', '#14b8a6', '#eab308', '#ec4899'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// 转换为 SRT 格式
export function convertToSRT(segments: any[]): string {
  return segments.map((segment, index) => {
    const startTime = formatSRTTime(segment.startTime);
    const endTime = formatSRTTime(segment.endTime);
    return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
  }).join('\n');
}

// 格式化 SRT 时间格式
function formatSRTTime(seconds: number): string {
  const date = new Date(seconds * 1000);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const secs = date.getUTCSeconds().toString().padStart(2, '0');
  const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${secs},${ms}`;
}