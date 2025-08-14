// 阿里云 DashScope API 相关类型定义

export interface TranscriptionRequest {
  model: string;
  input: {
    file_urls: string[];
  };
  parameters: {
    task: string;
    source_language: string;
    diarization_enabled: boolean;
    language_hints: string[];
    timestamp_alignment_enabled: boolean;
    speaker_count?: number;
  };
}

export interface TranscriptionTaskResponse {
  output: {
    task_id: string;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  request_id: string;
}

export interface TaskStatus {
  output: {
    task_id: string;
    task_status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'SUCCEEDED' | 'FAILED';
    submit_time: string;
    scheduled_time?: string;
    end_time?: string;
    task_metrics?: {
      TOTAL: number;
      SUCCESS?: number;
      SUCCEEDED?: number;
      FAILED: number;
    };
    results?: TranscriptionResult[];
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  request_id: string;
}

export interface TranscriptionResult {
  file_url: string;
  transcripts: Transcript[];
}

export interface Transcript {
  channel_id: number;
  text: string;
  sentences: Sentence[];
}

export interface Sentence {
  begin_time: number;
  end_time: number;
  text: string;
  speaker_id?: string;
  emotion_value?: number;
  words: Word[];
}

export interface Word {
  begin_time: number;
  end_time: number;
  text: string;
  confidence: number;
}

// 应用内部使用的类型
export interface ProcessedTranscription {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_name: string;
  file_url: string;
  created_at: string;
  updated_at: string;
  task_id?: string;
  result?: {
    duration: number;
    speaker_count: number;
    segments: TranscriptionSegment[];
  };
  error?: string;
}

export interface TranscriptionSegment {
  id: string;
  start_time: number;
  end_time: number;
  text: string;
  speaker_id: string;
  confidence: number;
  words: WordSegment[];
}

export interface WordSegment {
  text: string;
  start_time: number;
  end_time: number;
  confidence: number;
}

// API 错误类型
export interface DashScopeError {
  code: string;
  message: string;
  request_id?: string;
}

// 配置类型
export interface DashScopeConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
  maxRetries: number;
  retryDelay: number;
}