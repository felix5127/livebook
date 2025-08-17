import { NextRequest, NextResponse } from 'next/server';
import { kimiClient } from '@/lib/kimi';

export async function POST(request: NextRequest) {
  try {
    // 获取认证信息（由中间件添加）
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const userEmail = request.headers.get('x-user-email') || '';
    const authMethod = request.headers.get('x-auth-method') || 'none';

    console.log(`[AI Summary] 认证信息: 用户ID=${userId}, 邮箱=${userEmail}, 认证方式=${authMethod}`);

    const body = await request.json();
    const { transcript } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: '缺少转写内容' },
        { status: 400 }
      );
    }

    console.log('[AI总结API] 收到请求:', { transcriptLength: transcript.length });

    // 调用Kimi API生成结构化总结
    const summary = await kimiClient.generateNoteSummary(transcript);

    console.log('[AI总结API] 生成成功:', summary);

    return NextResponse.json(summary);

  } catch (error: any) {
    console.error('[AI总结API] 错误:', error);
    
    return NextResponse.json(
      { error: error.message || '生成总结失败' },
      { status: 500 }
    );
  }
}