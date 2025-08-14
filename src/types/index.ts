// 转写任务状态
export type TaskStatus = 'uploading' | 'processing' | 'completed' | 'failed';

// 文件类型
export type SupportedFileType = 'mp3' | 'wav' | 'm4a' | 'mp4' | 'mov';

// 说话人信息
export interface Speaker {
  id: string;
  name: string;
  color: string;
}

// 转写文本片段
export interface TranscriptSegment {
  id: string;
  startTime: number; // 秒
  endTime: number; // 秒
  text: string;
  speaker: Speaker;
  confidence: number; // 0-1
}

// 转写任务
export interface TranscriptionTask {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: SupportedFileType;
  status: TaskStatus;
  progress: number; // 0-100
  createdAt: Date;
  completedAt?: Date;
  estimatedTime?: number; // 预估剩余时间(秒)
  errorMessage?: string;
  audioUrl?: string;
  duration?: number; // 音频总时长(秒)
}

// 转写结果
export interface TranscriptionResult {
  taskId: string;
  segments: TranscriptSegment[];
  speakers: Speaker[];
  duration: number;
  audioUrl: string;
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 文件上传响应
export interface UploadResponse {
  taskId: string;
  message: string;
}

// 导出格式
export type ExportFormat = 'txt' | 'srt' | 'json';