// Database types
export interface Task {
  id: string
  file_name: string
  file_size: number
  file_type: string
  file_path?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  duration?: number
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface Segment {
  id: string
  task_id: string
  text: string
  start_time: number
  end_time: number
  confidence?: number
  speaker?: string
  segment_index: number
  created_at: string
}

// API types
export interface TranscriptionResult {
  task_id: string
  segments: Segment[]
  duration: number
  status: 'completed' | 'failed'
  error_message?: string
}

export interface UploadResponse {
  success: boolean
  taskId: string
  message?: string
  error?: string
}

export interface TaskResponse {
  success: boolean
  task: Task
  segments?: Segment[]
  error?: string
}

// DashScope API types
export interface DashScopeTranscriptionRequest {
  model: string
  input: {
    file_urls: string[]
  }
  parameters?: {
    format?: string
    sample_rate?: number
    enable_words?: boolean
  }
}

export interface DashScopeTranscriptionResponse {
  output?: {
    task_id: string
    task_status: string
    results?: Array<{
      transcription_url: string
      subtask_status: string
    }>
  }
  usage?: {
    duration: number
  }
  request_id: string
}

export interface DashScopeWord {
  text: string
  start_time: number
  end_time: number
  confidence: number
}

export interface DashScopeSentence {
  text: string
  start_time: number
  end_time: number
  confidence: number
  words?: DashScopeWord[]
}

export interface DashScopeTranscription {
  file_url: string
  properties: {
    audio_format: string
    original_duration: number
    original_sampling_rate: number
  }
  transcripts: Array<{
    sentences: DashScopeSentence[]
  }>
}

// Utility types
export interface FileUploadConfig {
  maxSize: number
  allowedTypes: string[]
}

export interface ErrorResponse {
  success: false
  error: string
  code?: string
}

export interface SuccessResponse<T = any> {
  success: true
  data: T
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse

// Component props types
export interface FileUploadProps {
  onFileSelect: (file: File) => void
  onUpload: () => void
  file: File | null
  isUploading: boolean
}

export interface TranscriptionDisplayProps {
  task: Task
  segments: Segment[]
  onCopy: () => void
  onDownload: () => void
}

export interface ProgressIndicatorProps {
  status: Task['status']
  message?: string
}