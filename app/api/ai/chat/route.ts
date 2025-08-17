import { NextRequest, NextResponse } from 'next/server';
import { kimiClient, ChatMessage } from '@/lib/kimi';

export async function POST(request: NextRequest) {
  try {
    // 获取认证信息（由中间件添加）
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const userEmail = request.headers.get('x-user-email') || '';
    const authMethod = request.headers.get('x-auth-method') || 'none';

    console.log(`[AI Chat] 认证信息: 用户ID=${userId}, 邮箱=${userEmail}, 认证方式=${authMethod}`);

    const body = await request.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: '消息格式不正确' },
        { status: 400 }
      );
    }

    console.log('[AI Chat] 收到请求:', { messagesCount: messages.length, hasContext: !!context });

    // 调用Kimi API
    const response = await kimiClient.chat(messages, context);

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error: any) {
    console.error('[AI Chat] 请求失败:', error);

    return NextResponse.json(
      {
        error: 'AI助手暂时无法响应',
        details: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
      },
      { status: 500 }
    );
  }
}

// 分析转写内容的专用接口
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript } = body;

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: '转写内容不能为空' },
        { status: 400 }
      );
    }

    console.log('[AI Analyze] 分析转写内容，长度:', transcript.length);

    const analysis = await kimiClient.analyzeTranscript(transcript);

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[AI Analyze] 分析失败:', error);

    return NextResponse.json(
      {
        error: '内容分析失败',
        details: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
      },
      { status: 500 }
    );
  }
}