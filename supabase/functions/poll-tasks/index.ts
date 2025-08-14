import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 类型定义 (复制自主项目)
interface TaskStatus {
  output: {
    task_id: string;
    task_status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
    submit_time: string;
    scheduled_time?: string;
    end_time?: string;
    task_metrics?: {
      TOTAL: number;
      SUCCESS: number;
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

interface TranscriptionResult {
  file_url: string;
  transcripts: Transcript[];
}

interface Transcript {
  channel_id: number;
  text: string;
  sentences: Sentence[];
}

interface Sentence {
  begin_time: number;
  end_time: number;
  text: string;
  speaker_id?: string;
  emotion_value?: number;
  words: Word[];
}

interface Word {
  begin_time: number;
  end_time: number;
  text: string;
  confidence: number;
}

// DashScope 客户端类 (简化版)
class DashScopeClient {
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, apiUrl: string) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async checkTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await fetch(`${this.apiUrl}/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`DashScope API 错误: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  parseTranscriptionResult(taskStatus: TaskStatus): any {
    if (!taskStatus.output.results || taskStatus.output.results.length === 0) {
      throw new Error('无转写结果可解析');
    }

    const result = taskStatus.output.results[0];
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
    const segments = transcript.sentences.map((sentence, index) => ({
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
      duration,
      speaker_count: speakers.size,
      segments
    };
  }
}

serve(async (req) => {
  // CORS 处理
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // 获取环境变量
    const dashScopeApiKey = Deno.env.get('DASHSCOPE_API_KEY');
    const dashScopeApiUrl = Deno.env.get('DASHSCOPE_API_URL') || 'https://dashscope.aliyuncs.com/api/v1/services/audio/asr';
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!dashScopeApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('缺少必需的环境变量');
    }

    // 初始化客户端
    const dashScope = new DashScopeClient(dashScopeApiKey, dashScopeApiUrl);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[PollTasks] 开始轮询任务...');

    // 查询待处理的任务 (状态为 pending 或 processing)
    const { data: pendingTasks, error: queryError } = await supabase
      .from('transcription_tasks')
      .select('*')
      .in('status', ['pending', 'processing'])
      .not('dashscope_task_id', 'is', null);

    if (queryError) {
      throw new Error(`查询待处理任务失败: ${queryError.message}`);
    }

    console.log(`[PollTasks] 找到 ${pendingTasks?.length || 0} 个待处理任务`);

    const results = [];

    for (const task of pendingTasks || []) {
      try {
        console.log(`[PollTasks] 检查任务: ${task.id} (${task.dashscope_task_id})`);

        // 查询 DashScope 任务状态
        const taskStatus = await dashScope.checkTaskStatus(task.dashscope_task_id);
        
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        switch (taskStatus.output.task_status) {
          case 'PENDING':
          case 'RUNNING':
            // 任务仍在处理中，只更新时间戳
            updateData.status = taskStatus.output.task_status === 'PENDING' ? 'pending' : 'processing';
            break;

          case 'SUCCESS':
            // 任务完成，解析结果
            try {
              const transcriptionResult = dashScope.parseTranscriptionResult(taskStatus);
              
              updateData.status = 'completed';
              updateData.completed_at = taskStatus.output.end_time || new Date().toISOString();
              updateData.result = transcriptionResult;
              updateData.segments_count = transcriptionResult.segments?.length || 0;
              updateData.duration = transcriptionResult.duration;
              updateData.speaker_count = transcriptionResult.speaker_count;

              console.log(`[PollTasks] 任务完成: ${task.id}, 片段数: ${transcriptionResult.segments?.length}`);
            } catch (parseError) {
              console.error(`[PollTasks] 解析结果失败 (${task.id}):`, parseError);
              updateData.status = 'failed';
              updateData.error = `解析结果失败: ${parseError.message}`;
            }
            break;

          case 'FAILED':
            // 任务失败
            updateData.status = 'failed';
            updateData.error = '转写任务失败';
            updateData.completed_at = taskStatus.output.end_time || new Date().toISOString();
            
            console.log(`[PollTasks] 任务失败: ${task.id}`);
            break;
        }

        // 更新数据库中的任务状态
        const { error: updateError } = await supabase
          .from('transcription_tasks')
          .update(updateData)
          .eq('id', task.id);

        if (updateError) {
          console.error(`[PollTasks] 更新任务状态失败 (${task.id}):`, updateError);
          results.push({
            taskId: task.id,
            success: false,
            error: updateError.message
          });
        } else {
          results.push({
            taskId: task.id,
            success: true,
            status: updateData.status,
            dashScopeStatus: taskStatus.output.task_status
          });
        }

      } catch (taskError) {
        console.error(`[PollTasks] 处理任务失败 (${task.id}):`, taskError);
        
        // 标记任务为失败
        await supabase
          .from('transcription_tasks')
          .update({
            status: 'failed',
            error: `轮询失败: ${taskError.message}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id);

        results.push({
          taskId: task.id,
          success: false,
          error: taskError.message
        });
      }
    }

    console.log(`[PollTasks] 轮询完成，处理了 ${results.length} 个任务`);

    return new Response(
      JSON.stringify({
        success: true,
        message: '任务轮询完成',
        processed: results.length,
        results
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('[PollTasks] 轮询任务失败:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: '任务轮询失败',
        details: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});