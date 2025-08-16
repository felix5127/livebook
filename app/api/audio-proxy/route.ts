import { NextRequest, NextResponse } from 'next/server';

// 音频代理接口，用于解决CORS问题
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const audioUrl = searchParams.get('url');

  if (!audioUrl) {
    return NextResponse.json(
      { error: '缺少音频URL参数' },
      { status: 400 }
    );
  }

  try {
    console.log('[音频代理] 请求音频:', audioUrl);

    // 获取音频文件
    const response = await fetch(audioUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Livebook/1.0)',
        'Accept': 'audio/*,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error('[音频代理] 获取音频失败:', response.status, response.statusText);
      return NextResponse.json(
        { error: `获取音频失败: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // 获取音频数据
    const audioBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const contentLength = response.headers.get('content-length');

    console.log('[音频代理] 音频获取成功:', {
      contentType,
      contentLength,
      size: audioBuffer.byteLength
    });

    // 返回音频数据，设置适当的CORS头
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': audioBuffer.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600', // 缓存1小时
        'Accept-Ranges': 'bytes', // 支持范围请求，用于音频跳转
      },
    });

  } catch (error: any) {
    console.error('[音频代理] 代理失败:', error);
    return NextResponse.json(
      { 
        error: '音频代理失败',
        details: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
      },
      { status: 500 }
    );
  }
}

// 处理OPTIONS请求 (CORS预检)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}