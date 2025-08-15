import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  TranscriptionRequest,
  TranscriptionTaskResponse,
  TaskStatus,
  ProcessedTranscription,
  TranscriptionSegment,
  DashScopeError,
  DashScopeConfig
} from '@/types/transcription';

/**
 * 阿里云 DashScope Paraformer API 封装类
 */
export class DashScopeClient {
  private client: AxiosInstance;
  private config: DashScopeConfig;

  constructor(config?: Partial<DashScopeConfig>) {
    this.config = {
      apiKey: process.env.DASHSCOPE_API_KEY || '',
      apiUrl: process.env.DASHSCOPE_API_URL || 'https://dashscope.aliyuncs.com/api/v1/services/audio/asr',
      model: 'paraformer-v2',
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };

    // 只在运行时检查，不在构建时检查
    if (!this.config.apiKey && typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn('DashScope API Key 未配置');
    }

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable'
      },
      timeout: 30000
    });

    // 添加请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[DashScope] 发送请求: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[DashScope] 请求错误:', error);
        return Promise.reject(error);
      }
    );

    // 添加响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[DashScope] 响应成功: ${response.status}`);
        return response;
      },
      (error) => {
        console.error('[DashScope] 响应错误:', error.response?.data || error.message);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * 提交转写任务
   * @param fileUrl 音频文件 URL
   * @param options 转写选项
   * @returns 任务响应
   */
  async submitTranscription(
    fileUrl: string,
    options: {
      speakerCount?: number;
      languageHints?: string[];
    } = {}
  ): Promise<TranscriptionTaskResponse> {
    // 运行时检查API密钥
    if (!this.config.apiKey) {
      throw new Error('DashScope API Key 未配置');
    }
    const request: TranscriptionRequest = {
      model: this.config.model,
      input: {
        file_urls: [fileUrl]
      },
      parameters: {
        task: 'transcription',
        source_language: 'auto',
        diarization_enabled: true,
        language_hints: options.languageHints || ['zh', 'en'],
        timestamp_alignment_enabled: true,
        speaker_count: options.speakerCount
      }
    };

    try {
      const response: AxiosResponse<TranscriptionTaskResponse> = await this.client.post('/transcription', request);
      console.log(`[DashScope] 任务提交成功, Task ID: ${response.data.output.task_id}`);
      return response.data;
    } catch (error) {
      console.error('[DashScope] 任务提交失败:', error);
      throw error;
    }
  }

  /**
   * 查询任务状态
   * @param taskId 任务 ID
   * @returns 任务状态
   */
  async checkTaskStatus(taskId: string): Promise<TaskStatus> {
    try {
      // 使用正确的任务查询端点
      const taskClient = axios.create({
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      const response: AxiosResponse<TaskStatus> = await taskClient.get(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`);
      console.log(`[DashScope] 任务状态: ${response.data.output.task_status}`);
      return response.data;
    } catch (error) {
      console.error(`[DashScope] 查询任务状态失败 (${taskId}):`, error);
      throw error;
    }
  }

  /**
   * 获取转写结果
   * @param taskId 任务 ID
   * @returns 转写结果
   */
  async fetchTranscriptionResult(taskId: string): Promise<TaskStatus> {
    const status = await this.checkTaskStatus(taskId);
    
    if (status.output.task_status !== 'SUCCESS') {
      throw new Error(`任务未完成，当前状态: ${status.output.task_status}`);
    }

    if (!status.output.results || status.output.results.length === 0) {
      throw new Error('转写结果为空');
    }

    return status;
  }

  /**
   * 解析转写结果为结构化数据
   * @param taskStatus 任务状态响应
   * @returns 处理后的转写数据
   */
  async parseTranscriptionResult(taskStatus: TaskStatus): Promise<ProcessedTranscription> {
    if (!taskStatus.output.results || taskStatus.output.results.length === 0) {
      throw new Error('无转写结果可解析');
    }

    const result = taskStatus.output.results[0];
    
    // 新的API格式返回transcription_url，需要额外请求获取转写结果
    if ('transcription_url' in result && typeof result.transcription_url === 'string') {
      console.log(`[DashScope] 下载转写结果: ${result.transcription_url}`);
      
      try {
        const transcriptionResponse = await axios.get(result.transcription_url as string);
        const transcriptionData = transcriptionResponse.data;
        
        console.log(`[DashScope] 转写结果数据:`, JSON.stringify(transcriptionData, null, 2));
        
        // 解析下载的转写结果
        if (!transcriptionData.transcripts || transcriptionData.transcripts.length === 0) {
          throw new Error('转写结果为空');
        }

        const transcript = transcriptionData.transcripts[0];
        
        // 计算总时长（从音频属性获取）
        const duration = transcriptionData.properties?.original_duration_in_milliseconds || 
                        transcript.content_duration_in_milliseconds || 0;

        // 获取说话人数量
        const speakers = new Set(
          transcript.sentences
            .filter((s: any) => s.speaker_id !== undefined)
            .map((s: any) => s.speaker_id.toString())
        );

        // 转换为应用内部格式
        const segments: TranscriptionSegment[] = transcript.sentences.map((sentence: any, index: number) => ({
          id: `segment_${index}`,
          start_time: sentence.begin_time,
          end_time: sentence.end_time,
          text: sentence.text,
          speaker_id: sentence.speaker_id?.toString() || 'unknown',
          confidence: sentence.words.length > 0 
            ? sentence.words.reduce((sum: number, word: any) => sum + (word.confidence || 1), 0) / sentence.words.length 
            : 1, // 新API格式可能没有confidence字段
          words: sentence.words.map((word: any) => ({
            text: word.text,
            start_time: word.begin_time,
            end_time: word.end_time,
            confidence: word.confidence || 1 // 新API格式可能没有confidence字段
          }))
        }));
        
        return {
          id: taskStatus.output.task_id,
          status: 'completed',
          file_name: this.extractFileNameFromUrl(result.file_url),
          file_url: result.file_url,
          created_at: taskStatus.output.submit_time,
          updated_at: taskStatus.output.end_time || new Date().toISOString(),
          task_id: taskStatus.output.task_id,
          result: {
            duration: Math.round(duration / 1000), // 转换为秒
            speaker_count: speakers.size,
            segments
          }
        };
      } catch (error) {
        console.error('[DashScope] 下载转写结果失败:', error);
        throw new Error(`下载转写结果失败: ${error}`);
      }
    }
    
    // 兼容旧格式（如果需要）
    if ('transcripts' in result) {
      const transcript = result.transcripts[0];
      
      if (!transcript) {
        throw new Error('转写结果格式错误');
      }

      // 计算总时长
      const duration = Math.max(
        ...transcript.sentences.map(s => s.end_time)
      );

      // 获取说话人数量
      const speakers = new Set(
        transcript.sentences
          .filter(s => s.speaker_id)
          .map(s => s.speaker_id!)
      );

      // 转换为应用内部格式
      const segments: TranscriptionSegment[] = transcript.sentences.map((sentence, index) => ({
        id: `segment_${index}`,
        start_time: sentence.begin_time,
        end_time: sentence.end_time,
        text: sentence.text,
        speaker_id: sentence.speaker_id || 'unknown',
        confidence: sentence.words.length > 0 
          ? sentence.words.reduce((sum, word) => sum + word.confidence, 0) / sentence.words.length 
          : 0,
        words: sentence.words.map(word => ({
          text: word.text,
          start_time: word.begin_time,
          end_time: word.end_time,
          confidence: word.confidence
        }))
      }));

      return {
        id: taskStatus.output.task_id,
        status: 'completed',
        file_name: this.extractFileNameFromUrl(result.file_url),
        file_url: result.file_url,
        created_at: taskStatus.output.submit_time,
        updated_at: taskStatus.output.end_time || new Date().toISOString(),
        task_id: taskStatus.output.task_id,
        result: {
          duration,
          speaker_count: speakers.size,
          segments
        }
      };
    }
    
    throw new Error('不支持的转写结果格式');
  }

  /**
   * 带重试的任务提交
   * @param fileUrl 文件 URL
   * @param options 选项
   * @returns 任务响应
   */
  async submitWithRetry(
    fileUrl: string,
    options: { speakerCount?: number; languageHints?: string[] } = {}
  ): Promise<TranscriptionTaskResponse> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await this.submitTranscription(fileUrl, options);
      } catch (error) {
        lastError = error as Error;
        console.warn(`[DashScope] 提交任务失败 (尝试 ${attempt}/${this.config.maxRetries}):`, error);
        
        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          console.log(`[DashScope] 等待 ${delay}ms 后重试...`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`任务提交失败，已重试 ${this.config.maxRetries} 次: ${lastError?.message || '未知错误'}`);
  }

  /**
   * 轮询任务状态直到完成
   * @param taskId 任务 ID
   * @param pollInterval 轮询间隔 (毫秒)
   * @param maxAttempts 最大尝试次数
   * @returns 最终任务状态
   */
  async pollTaskUntilComplete(
    taskId: string,
    pollInterval: number = 5000,
    maxAttempts: number = 60
  ): Promise<TaskStatus> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const status = await this.checkTaskStatus(taskId);
        
        switch (status.output.task_status) {
          case 'SUCCESS':
            console.log(`[DashScope] 任务完成: ${taskId}`);
            return status;
          
          case 'FAILED':
            throw new Error(`任务失败: ${taskId}`);
          
          case 'PENDING':
          case 'RUNNING':
            console.log(`[DashScope] 任务进行中 (${status.output.task_status}): ${taskId}`);
            break;
        }

        await this.sleep(pollInterval);
        attempts++;
      } catch (error) {
        console.error(`[DashScope] 轮询任务状态出错: ${error}`);
        attempts++;
        await this.sleep(pollInterval);
      }
    }

    throw new Error(`任务轮询超时: ${taskId}, 超过最大尝试次数 ${maxAttempts}`);
  }

  /**
   * 处理 API 错误
   * @param error Axios 错误
   * @returns 格式化错误
   */
  private handleError(error: any): DashScopeError {
    if (error.response?.data) {
      return {
        code: error.response.data.code || 'UNKNOWN_ERROR',
        message: error.response.data.message || '未知错误',
        request_id: error.response.data.request_id
      };
    }

    return {
      code: 'NETWORK_ERROR',
      message: error.message || '网络错误'
    };
  }

  /**
   * 从 URL 中提取文件名
   * @param url 文件 URL
   * @returns 文件名
   */
  private extractFileNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').pop() || 'unknown.audio';
    } catch {
      return 'unknown.audio';
    }
  }

  /**
   * 等待指定时间
   * @param ms 毫秒
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出默认实例
export const dashScopeClient = new DashScopeClient();