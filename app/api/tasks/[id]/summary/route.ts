import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface SummaryData {
  mainTopics: string;
  keyPoints: string[];
  speakers: { speaker: string; viewpoint: string }[];
  timeline: { time: string; content: string; importance: string }[];
}

// 获取AI总结
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;

    if (!taskId) {
      return NextResponse.json(
        { error: '缺少任务ID' },
        { status: 400 }
      );
    }

    console.log('[Summary API] 获取总结:', taskId);

    // 从数据库获取任务和AI总结
    const { data: task, error } = await supabaseAdmin
      .from('transcription_tasks')
      .select('ai_summary, ai_summary_generated_at')
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('[Summary API] 数据库查询错误:', error);
      return NextResponse.json(
        { error: '获取总结失败' },
        { status: 500 }
      );
    }

    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    // 返回总结数据
    return NextResponse.json({
      success: true,
      data: {
        summary: task.ai_summary,
        generatedAt: task.ai_summary_generated_at,
        hasSummary: !!task.ai_summary
      }
    });

  } catch (error: any) {
    console.error('[Summary API] 获取总结错误:', error);
    return NextResponse.json(
      { error: error.message || '获取总结失败' },
      { status: 500 }
    );
  }
}

// 保存AI总结
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const body = await request.json();
    const { summary }: { summary: SummaryData } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: '缺少任务ID' },
        { status: 400 }
      );
    }

    if (!summary) {
      return NextResponse.json(
        { error: '缺少总结数据' },
        { status: 400 }
      );
    }

    console.log('[Summary API] 保存总结:', taskId);

    // 保存总结到数据库
    const { data, error } = await supabaseAdmin
      .from('transcription_tasks')
      .update({
        ai_summary: summary,
        ai_summary_generated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select('ai_summary, ai_summary_generated_at')
      .single();

    if (error) {
      console.error('[Summary API] 保存错误:', error);
      return NextResponse.json(
        { error: '保存总结失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: data.ai_summary,
        generatedAt: data.ai_summary_generated_at
      }
    });

  } catch (error: any) {
    console.error('[Summary API] 保存总结错误:', error);
    return NextResponse.json(
      { error: error.message || '保存总结失败' },
      { status: 500 }
    );
  }
}