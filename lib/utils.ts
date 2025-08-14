import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS 类名合并工具
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化时间戳为可读格式
 * @param timestamp 时间戳 (毫秒)
 * @returns 格式化的时间字符串 (HH:MM:SS)
 */
export function formatTimestamp(timestamp: number): string {
  const totalSeconds = Math.floor(timestamp / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 格式化时长
 * @param duration 时长 (毫秒)
 * @returns 格式化的时长字符串
 */
export function formatDuration(duration: number): string {
  const totalSeconds = Math.floor(duration / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}小时${minutes}分钟${seconds}秒`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds}秒`;
  }
  
  return `${seconds}秒`;
}

/**
 * 转换说话人 ID 为友好显示名称
 * @param speakerId 原始说话人 ID
 * @param speakerMap 说话人映射表 (可选)
 * @returns 友好的说话人名称
 */
export function formatSpeakerId(
  speakerId: string, 
  speakerMap?: Record<string, string>
): string {
  if (speakerMap && speakerMap[speakerId]) {
    return speakerMap[speakerId];
  }

  // 如果是数字 ID，转换为 "说话人 X"
  if (/^\d+$/.test(speakerId)) {
    const speakerNum = parseInt(speakerId, 10) + 1;
    return `说话人 ${speakerNum}`;
  }

  // 如果是 spk_0, spk_1 格式
  if (speakerId.startsWith('spk_')) {
    const speakerNum = parseInt(speakerId.replace('spk_', ''), 10) + 1;
    return `说话人 ${speakerNum}`;
  }

  // 如果是 unknown 或其他
  if (speakerId === 'unknown') {
    return '未知说话人';
  }

  return speakerId;
}

/**
 * 生成唯一的任务 ID
 * @param prefix 前缀
 * @returns 唯一 ID
 */
export function generateTaskId(prefix: string = 'task'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * 生成文件上传的唯一文件名
 * @param originalName 原始文件名
 * @param userId 用户 ID (可选)
 * @returns 唯一文件名
 */
export function generateUniqueFileName(originalName: string, userId?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const userPrefix = userId ? `${userId}_` : '';
  
  return `${userPrefix}${baseName}_${timestamp}_${random}.${extension}`;
}

/**
 * 验证音频文件格式
 * @param fileName 文件名
 * @returns 是否为支持的音频格式
 */
export function isValidAudioFile(fileName: string): boolean {
  const supportedFormats = [
    'mp3', 'wav', 'm4a', 'mp4', 'mov', 'avi', 'mkv', 'flac', 'aac', 'ogg'
  ];
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  return supportedFormats.includes(extension || '');
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(2);
  
  return `${size} ${sizes[i]}`;
}

/**
 * 验证文件大小是否在限制内
 * @param fileSize 文件大小 (字节)
 * @param maxSizeMB 最大大小 (MB)
 * @returns 是否在限制内
 */
export function isFileSizeValid(fileSize: number, maxSizeMB: number = 500): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
}

/**
 * 计算转写任务的预估完成时间
 * @param fileSizeMB 文件大小 (MB)
 * @param durationMinutes 音频时长 (分钟)
 * @returns 预估时间 (分钟)
 */
export function estimateTranscriptionTime(
  fileSizeMB: number, 
  durationMinutes: number
): number {
  // 基于经验的预估公式：通常转写时间是音频时长的 10-30%
  const baseTime = Math.max(durationMinutes * 0.1, 1); // 至少1分钟
  const sizeMultiplier = Math.max(fileSizeMB / 50, 1); // 大文件增加时间
  
  return Math.ceil(baseTime * sizeMultiplier);
}

/**
 * 解析转写置信度等级
 * @param confidence 置信度 (0-1)
 * @returns 等级描述
 */
export function getConfidenceLevel(confidence: number): {
  level: 'high' | 'medium' | 'low';
  label: string;
  color: string;
} {
  if (confidence >= 0.8) {
    return { level: 'high', label: '高', color: 'text-green-600' };
  } else if (confidence >= 0.6) {
    return { level: 'medium', label: '中', color: 'text-yellow-600' };
  } else {
    return { level: 'low', label: '低', color: 'text-red-600' };
  }
}

/**
 * 导出转写结果为 SRT 字幕格式
 * @param segments 转写片段
 * @returns SRT 格式字符串
 */
export function exportToSRT(segments: Array<{
  start_time: number;
  end_time: number;
  text: string;
}>): string {
  return segments.map((segment, index) => {
    const startTime = formatSRTTimestamp(segment.start_time);
    const endTime = formatSRTTimestamp(segment.end_time);
    
    return [
      index + 1,
      `${startTime} --> ${endTime}`,
      segment.text,
      ''
    ].join('\n');
  }).join('\n');
}

/**
 * 导出转写结果为 TXT 格式
 * @param segments 转写片段
 * @param includeTimestamps 是否包含时间戳
 * @param includeSpeakers 是否包含说话人信息
 * @returns TXT 格式字符串
 */
export function exportToTXT(
  segments: Array<{
    start_time: number;
    end_time: number;
    text: string;
    speaker_id?: string;
  }>,
  includeTimestamps: boolean = false,
  includeSpeakers: boolean = false
): string {
  return segments.map(segment => {
    let line = segment.text;
    
    if (includeTimestamps) {
      const timestamp = formatTimestamp(segment.start_time);
      line = `[${timestamp}] ${line}`;
    }
    
    if (includeSpeakers && segment.speaker_id) {
      const speaker = formatSpeakerId(segment.speaker_id);
      line = `${speaker}: ${line}`;
    }
    
    return line;
  }).join('\n');
}

/**
 * 格式化 SRT 时间戳
 * @param timestamp 时间戳 (毫秒)
 * @returns SRT 格式时间戳 (HH:MM:SS,mmm)
 */
function formatSRTTimestamp(timestamp: number): string {
  const totalMs = Math.floor(timestamp);
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = totalMs % 1000;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间 (毫秒)
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param limit 时间限制 (毫秒)
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 新增的缺失函数

/**
 * 验证文件类型
 * @param file 文件对象
 * @returns 是否为支持的文件类型
 */
export function validateFileType(file: File): boolean {
  return isValidAudioFile(file.name);
}

/**
 * 验证文件大小
 * @param file 文件对象
 * @param maxSizeMB 最大大小 (MB，默认30MB)
 * @returns 是否在大小限制内
 */
export function validateFileSize(file: File, maxSizeMB: number = 30): boolean {
  return isFileSizeValid(file.size, maxSizeMB);
}

/**
 * 验证音频文件（综合验证）
 * @param file 文件对象
 * @returns 验证结果对象
 */
export function validateAudioFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  if (!validateFileType(file)) {
    return {
      isValid: false,
      error: '不支持的文件格式。支持的格式：MP3, WAV, M4A, MP4, MOV'
    };
  }

  if (!validateFileSize(file)) {
    return {
      isValid: false,
      error: '文件大小超过限制（最大30MB）'
    };
  }

  return { isValid: true };
}

/**
 * 检查是否为 YouTube URL
 * @param url URL 字符串
 * @returns 是否为 YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/
  ];
  
  return patterns.some(pattern => pattern.test(url));
}

/**
 * 检查是否为 B站 URL
 * @param url URL 字符串
 * @returns 是否为 B站 URL
 */
export function isBilibiliUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?bilibili\.com\/video\/[a-zA-Z0-9]+/,
    /^https?:\/\/b23\.tv\/[a-zA-Z0-9]+/
  ];
  
  return patterns.some(pattern => pattern.test(url));
}

/**
 * 格式化时间显示
 * @param seconds 秒数
 * @returns 格式化的时间字符串
 */
export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 获取任务状态对应的颜色
 * @param status 任务状态
 * @returns CSS 颜色类名
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'text-green-600';
    case 'processing':
      return 'text-blue-600';
    case 'failed':
      return 'text-red-600';
    case 'pending':
    default:
      return 'text-gray-600';
  }
}

/**
 * 获取任务状态对应的文本
 * @param status 任务状态
 * @returns 状态文本
 */
export function getStatusText(status: string): string {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'processing':
      return '处理中';
    case 'failed':
      return '失败';
    case 'pending':
      return '等待中';
    default:
      return '未知状态';
  }
}