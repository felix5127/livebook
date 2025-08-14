// 统一导出所有类型定义

// 从转写相关类型中导出
export * from './transcription';

// 基础应用类型
export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  file_name: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
  duration?: number;
  error?: string;
}

export interface Segment {
  id: string;
  task_id: string;
  start_time: number;
  end_time: number;
  text: string;
  speaker_id?: string;
  confidence: number;
}

export interface Speaker {
  id: string;
  name: string;
  color: string;
}

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker: Speaker;
  confidence: number;
}

export interface TranscriptionResult {
  id: string;
  title: string;
  duration: number;
  speakerCount: number;
  speakers: Speaker[];
  segments: TranscriptSegment[];
  createdAt: string;
  updatedAt: string;
}

// API 相关类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadResponse {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

export interface TranscribeRequest {
  fileUrl: string;
  fileName: string;
  speakerCount?: number;
  languageHints?: string[];
}

export interface TranscribeResponse {
  taskId: string;
  noteId: string;
}