import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    // 获取认证信息（由中间件添加）
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const userEmail = request.headers.get('x-user-email') || '';
    const authMethod = request.headers.get('x-auth-method') || 'none';

    console.log(`[AI Translate] 认证信息: 用户ID=${userId}, 邮箱=${userEmail}, 认证方式=${authMethod}`);

    const { text, targetLanguage = 'en' } = await request.json();

    if (!text) {
      return NextResponse.json(
        { success: false, error: '需要翻译的文本不能为空' },
        { status: 400 }
      );
    }

    // 使用阿里云DashScope API进行翻译
    const apiKey = process.env.DASHSCOPE_API_KEY || process.env.BAILIAN_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: '翻译服务暂时不可用' },
        { status: 500 }
      );
    }

    // 定义语言映射
    const languageMap: Record<string, string> = {
      'en': '英语',
      'ja': '日语',
      'ko': '韩语',
      'fr': '法语',
      'de': '德语',
      'es': '西班牙语',
      'ru': '俄语'
    };

    const targetLangName = languageMap[targetLanguage] || '英语';

    const response = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model: 'qwen-plus',
        input: {
          messages: [
            {
              role: 'system',
              content: `你是一个专业的翻译助手。请将用户提供的中文文本翻译成${targetLangName}。要求：
1. 保持原文的语义和语调
2. 使用自然流畅的表达
3. 保留专业术语的准确性
4. 只返回翻译结果，不要任何解释`
            },
            {
              role: 'user',
              content: text
            }
          ]
        },
        parameters: {
          temperature: 0.3,
          max_tokens: 1000,
          top_p: 0.8
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const result = response.data;
    
    if (!result.output || !result.output.text) {
      throw new Error('翻译服务响应格式错误');
    }

    return NextResponse.json({
      success: true,
      data: {
        originalText: text,
        translatedText: result.output.text.trim(),
        targetLanguage,
        usage: result.usage
      }
    });

  } catch (error: any) {
    console.error('翻译API错误:', error);
    
    let errorMessage = '翻译失败，请稍后重试';
    
    if (error.response) {
      errorMessage = `翻译服务错误: ${error.response.status}`;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = '翻译请求超时';
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}