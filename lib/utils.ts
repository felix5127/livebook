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
 * 文件魔数签名定义
 */
const FILE_SIGNATURES = {
  // 音频格式
  mp3: {
    signatures: [
      [0xFF, 0xFB], // MP3 frame header
      [0xFF, 0xF3], // MP3 frame header
      [0xFF, 0xF2], // MP3 frame header
      [0x49, 0x44, 0x33] // ID3v2 header "ID3"
    ],
    mimeTypes: ['audio/mpeg', 'audio/mp3']
  },
  wav: {
    signatures: [
      [0x52, 0x49, 0x46, 0x46] // "RIFF"
    ],
    mimeTypes: ['audio/wav', 'audio/wave']
  },
  m4a: {
    signatures: [
      [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], // ftyp box
      [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70] // ftyp box
    ],
    mimeTypes: ['audio/mp4', 'audio/m4a']
  },
  mp4: {
    signatures: [
      [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ftyp box
      [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70] // ftyp box
    ],
    mimeTypes: ['video/mp4']
  },
  mov: {
    signatures: [
      [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70] // ftyp box
    ],
    mimeTypes: ['video/quicktime']
  },
  aac: {
    signatures: [
      [0xFF, 0xF1], // ADTS header
      [0xFF, 0xF9]  // ADTS header
    ],
    mimeTypes: ['audio/aac']
  },
  flac: {
    signatures: [
      [0x66, 0x4C, 0x61, 0x43] // "fLaC"
    ],
    mimeTypes: ['audio/flac']
  },
  ogg: {
    signatures: [
      [0x4F, 0x67, 0x67, 0x53] // "OggS"
    ],
    mimeTypes: ['audio/ogg']
  }
};

/**
 * 读取文件的前几个字节
 * @param file 文件对象
 * @param bytesToRead 要读取的字节数
 * @returns Promise<Uint8Array>
 */
async function readFileHeader(file: File, bytesToRead: number = 16): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const slice = file.slice(0, bytesToRead);
    
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      resolve(new Uint8Array(arrayBuffer));
    };
    
    reader.onerror = () => {
      reject(new Error('无法读取文件头'));
    };
    
    reader.readAsArrayBuffer(slice);
  });
}

/**
 * 检查字节数组是否匹配签名
 * @param header 文件头字节
 * @param signature 签名字节数组
 * @returns 是否匹配
 */
function matchesSignature(header: Uint8Array, signature: number[]): boolean {
  if (header.length < signature.length) return false;
  
  return signature.every((byte, index) => header[index] === byte);
}

/**
 * 验证文件魔数和MIME类型
 * @param file 文件对象
 * @returns Promise<验证结果>
 */
export async function validateFileSignature(file: File): Promise<{
  isValid: boolean;
  detectedType?: string;
  error?: string;
}> {
  try {
    const header = await readFileHeader(file, 32);
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    // 检查文件是否为空
    if (file.size === 0) {
      return {
        isValid: false,
        error: '文件为空'
      };
    }
    
    // 检查扩展名是否支持
    if (!extension || !FILE_SIGNATURES[extension as keyof typeof FILE_SIGNATURES]) {
      return {
        isValid: false,
        error: `不支持的文件扩展名: ${extension}`
      };
    }
    
    const expectedFormat = FILE_SIGNATURES[extension as keyof typeof FILE_SIGNATURES];
    let signatureMatched = false;
    
    // 检查魔数是否匹配
    for (const signature of expectedFormat.signatures) {
      if (matchesSignature(header, signature)) {
        signatureMatched = true;
        break;
      }
    }
    
    if (!signatureMatched) {
      return {
        isValid: false,
        error: `文件内容与扩展名不匹配。文件可能被重命名或损坏`
      };
    }
    
    // 检查MIME类型
    if (!expectedFormat.mimeTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `MIME类型不匹配。期望: ${expectedFormat.mimeTypes.join(', ')}, 实际: ${file.type}`
      };
    }
    
    return {
      isValid: true,
      detectedType: extension
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: `文件验证失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

/**
 * 检查文件名是否包含可疑内容
 * @param fileName 文件名
 * @returns 验证结果
 */
export function validateFileName(fileName: string): {
  isValid: boolean;
  error?: string;
} {
  // 检查文件名长度
  if (fileName.length > 255) {
    return {
      isValid: false,
      error: '文件名过长（最大255字符）'
    };
  }
  
  // 检查危险字符
  const dangerousPatterns = [
    /\.\./,           // 路径遍历
    /[<>:"|?*]/,      // Windows保留字符
    /[\x00-\x1f]/,    // 控制字符
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows保留名
    /\.(exe|bat|cmd|scr|pif|com|vbs|js|jar|app|dmg)$/i // 可执行文件
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(fileName)) {
      return {
        isValid: false,
        error: '文件名包含不安全字符或为系统保留名'
      };
    }
  }
  
  return { isValid: true };
}

/**
 * 检查文件内容是否包含可疑的恶意模式
 * @param file 文件对象
 * @returns Promise<检查结果>
 */
export async function scanFileContent(file: File): Promise<{
  isSafe: boolean;
  threats?: string[];
}> {
  try {
    // 读取文件的前1KB进行基础恶意内容检测
    const header = await readFileHeader(file, 1024);
    const threats: string[] = [];
    
    // 检查是否包含可执行文件头
    const executableSignatures = [
      [0x4D, 0x5A],                 // PE/EXE header "MZ"
      [0x7F, 0x45, 0x4C, 0x46],     // ELF header
      [0xCA, 0xFE, 0xBA, 0xBE],     // Mach-O header
      [0x50, 0x4B, 0x03, 0x04],     // ZIP header (可能包含恶意软件)
    ];
    
    for (const signature of executableSignatures) {
      if (matchesSignature(header, signature)) {
        threats.push('检测到可执行文件特征');
        break;
      }
    }
    
    // 转换为字符串检查脚本内容
    const textContent = new TextDecoder('utf-8', { fatal: false }).decode(header.slice(0, 512));
    const maliciousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\.write/i,
      /iframe/i,
      /base64/i
    ];
    
    for (const pattern of maliciousPatterns) {
      if (pattern.test(textContent)) {
        threats.push('检测到可疑脚本内容');
        break;
      }
    }
    
    return {
      isSafe: threats.length === 0,
      threats: threats.length > 0 ? threats : undefined
    };
    
  } catch (error) {
    // 如果无法扫描，保守起见认为不安全
    return {
      isSafe: false,
      threats: ['无法扫描文件内容']
    };
  }
}

/**
 * 验证文件类型（旧版本兼容）
 * @param file 文件对象
 * @returns 是否为支持的文件类型
 */
export function validateFileType(file: File): boolean {
  return isValidAudioFile(file.name);
}

/**
 * 验证文件大小
 * @param file 文件对象
 * @param maxSizeMB 最大大小 (MB，默认50MB)
 * @returns 是否在大小限制内
 */
export function validateFileSize(file: File, maxSizeMB: number = 50): boolean {
  return isFileSizeValid(file.size, maxSizeMB);
}

/**
 * 清理文件名中的特殊字符
 * @param fileName 原始文件名
 * @returns 清理后的文件名
 */
export function sanitizeFileName(fileName: string): string {
  // 移除扩展名
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  const extension = fileName.split('.').pop();
  
  // 清理文件名：只保留字母、数字、中文、连字符和下划线
  const cleanName = nameWithoutExt
    .replace(/[^\w\u4e00-\u9fa5\-]/g, '_') // 替换特殊字符为下划线
    .replace(/_+/g, '_') // 合并多个连续下划线
    .replace(/^_|_$/g, '') // 移除开头和结尾的下划线
    .substring(0, 100); // 限制长度
  
  return extension ? `${cleanName}.${extension}` : cleanName;
}

/**
 * 综合文件安全验证（新增强版本）
 * @param file 文件对象
 * @param maxSizeMB 最大文件大小（MB）
 * @returns Promise<验证结果>
 */
export async function validateFileSecurity(file: File, maxSizeMB: number = 50): Promise<{
  isValid: boolean;
  error?: string;
  warnings?: string[];
  detectedType?: string;
}> {
  const warnings: string[] = [];
  
  // 1. 基础验证
  if (!file) {
    return { isValid: false, error: '未提供文件' };
  }
  
  if (file.size === 0) {
    return { isValid: false, error: '文件为空' };
  }
  
  // 2. 文件名安全检查
  const fileNameValidation = validateFileName(file.name);
  if (!fileNameValidation.isValid) {
    return { isValid: false, error: fileNameValidation.error };
  }
  
  // 3. 文件大小检查
  if (!validateFileSize(file, maxSizeMB)) {
    return { 
      isValid: false, 
      error: `文件大小超过限制（最大${maxSizeMB}MB）` 
    };
  }
  
  // 4. 魔数和MIME类型验证
  const signatureValidation = await validateFileSignature(file);
  if (!signatureValidation.isValid) {
    return { 
      isValid: false, 
      error: signatureValidation.error 
    };
  }
  
  // 5. 恶意内容扫描
  const contentScan = await scanFileContent(file);
  if (!contentScan.isSafe) {
    return { 
      isValid: false, 
      error: `安全威胁检测: ${contentScan.threats?.join(', ')}` 
    };
  }
  
  // 6. 文件大小合理性检查
  if (file.size > 200 * 1024 * 1024) { // 200MB
    warnings.push('文件较大，上传和处理时间可能较长');
  }
  
  // 7. MIME类型一致性检查
  const extension = file.name.split('.').pop()?.toLowerCase();
  const expectedMimeTypes = FILE_SIGNATURES[extension as keyof typeof FILE_SIGNATURES]?.mimeTypes || [];
  if (!expectedMimeTypes.includes(file.type)) {
    warnings.push(`MIME类型可能不准确: ${file.type}`);
  }
  
  return {
    isValid: true,
    detectedType: signatureValidation.detectedType,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * 验证音频文件（综合验证）- 保持向后兼容
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
      error: '文件大小超过限制（最大50MB）'
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