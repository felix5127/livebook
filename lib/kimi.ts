import axios from 'axios';

/**
 * Kimi K2 AI助手API客户端
 * 使用阿里云百炼平台
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class KimiClient {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.BAILIAN_API_KEY || '';
    this.baseURL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
    
    if (!this.apiKey) {
      throw new Error('BAILIAN_API_KEY environment variable is required');
    }
  }

  /**
   * 发送聊天消息到Kimi K2
   */
  async chat(messages: ChatMessage[], context?: string): Promise<ChatResponse> {
    try {
      // 构建系统提示
      let systemPrompt = `你是一个专业的AI助手，专门帮助用户分析和理解音频转写内容。你的任务是：

1. 根据提供的音频转写内容回答用户问题
2. 提供深入的内容分析和见解
3. 帮助用户理解对话中的关键信息
4. 提供建设性的总结和建议

请保持回答简洁、准确、有帮助。`;

      if (context) {
        systemPrompt += `\n\n当前音频转写内容：\n${context}`;
      }

      const requestMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
      ];

      const response = await axios.post(
        this.baseURL,
        {
          model: 'qwen-plus', // 使用通义千问Plus作为替代，因为它在百炼平台上更稳定
          input: {
            messages: requestMessages
          },
          parameters: {
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 0.9
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      // 转换为OpenAI格式的响应
      const bailianResponse = response.data;
      
      if (!bailianResponse.output || !bailianResponse.output.text) {
        throw new Error('Invalid response from Bailian API');
      }

      return {
        id: bailianResponse.request_id || 'unknown',
        model: 'qwen-plus',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: bailianResponse.output.text
          },
          finish_reason: bailianResponse.output.finish_reason || 'stop'
        }],
        usage: bailianResponse.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };

    } catch (error: any) {
      console.error('Kimi API Error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get AI response');
    }
  }

  /**
   * 分析音频转写内容
   */
  async analyzeTranscript(transcript: string): Promise<string> {
    const messages: ChatMessage[] = [{
      role: 'user',
      content: `请分析这段音频转写内容，提供以下信息：
1. 主要话题和关键观点
2. 参与者的核心论点
3. 重要的结论或决定
4. 值得关注的细节

请用简洁的中文回答。`
    }];

    const response = await this.chat(messages, transcript);
    return response.choices[0].message.content;
  }

  /**
   * 回答基于转写内容的问题
   */
  async answerQuestion(question: string, transcript: string): Promise<string> {
    const messages: ChatMessage[] = [{
      role: 'user',
      content: question
    }];

    const response = await this.chat(messages, transcript);
    return response.choices[0].message.content;
  }
}

// 导出默认实例
export const kimiClient = new KimiClient();