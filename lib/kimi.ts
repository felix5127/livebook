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
    
    // 只在运行时检查，不在构建时检查
    if (!this.apiKey && typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn('BAILIAN_API_KEY environment variable is not set');
    }
  }

  /**
   * 发送聊天消息到Kimi K2
   */
  async chat(messages: ChatMessage[], context?: string): Promise<ChatResponse> {
    // 运行时检查API密钥
    if (!this.apiKey) {
      throw new Error('BAILIAN_API_KEY environment variable is required');
    }

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

  /**
   * 生成结构化的笔记总结
   */
  async generateNoteSummary(transcript: string): Promise<{
    mainTopics: string;
    keyPoints: string[];
    speakers: { speaker: string; viewpoint: string }[];
    timeline: { time: string; content: string; importance: string }[];
  }> {
    const messages: ChatMessage[] = [{
      role: 'user',
      content: `快速分析以下音频转写内容，生成简洁的结构化总结。

转写内容：
${transcript}

请直接返回JSON格式的总结，格式如下：
{
  "mainTopics": "一句话总结主要讨论的话题",
  "keyPoints": ["关键点1", "关键点2", "关键点3"],
  "speakers": [{"speaker": "说话人1", "viewpoint": "主要观点"}],
  "timeline": [{"time": "时间点", "content": "该时间段讨论的内容", "importance": "重要"}]
}

要求：
1. 直接返回JSON，不要任何额外文字
2. mainTopics要简洁精准
3. keyPoints提取3-5个最重要的点
4. speakers根据实际说话人数量确定
5. timeline选择3-5个重要时间点`
    }];

    const response = await this.chat(messages, transcript);
    try {
      let content = response.choices[0].message.content;
      
      // 清理markdown格式的JSON
      content = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      
      return JSON.parse(content);
    } catch (error) {
      // 如果JSON解析失败，返回默认结构
      console.error('Failed to parse AI summary JSON:', error);
      console.error('Raw content:', response.choices[0].message.content);
      return {
        mainTopics: "AI正在分析音频内容，请稍后重试",
        keyPoints: ["内容分析中..."],
        speakers: [{ speaker: "系统", viewpoint: "正在处理音频内容" }],
        timeline: [{ time: "0:00", content: "分析进行中", importance: "系统" }]
      };
    }
  }
}

// 导出默认实例
export const kimiClient = new KimiClient();