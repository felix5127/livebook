'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Copy, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface TranscriptionResult {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  dashScopeStatus: string;
  submitTime: string;
  endTime?: string;
  result?: {
    duration: number;
    speaker_count: number;
    segments: Array<{
      id: string;
      start_time: number;
      end_time: number;
      text: string;
      speaker_id: string;
      confidence: number;
      words: Array<{
        text: string;
        start_time: number;
        end_time: number;
        confidence: number;
      }>;
    }>;
  };
  transcription?: any;
  parseError?: string;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;
  
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const fetchResult = async () => {
    try {
      setPolling(true);
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
        setError(null);
        
        // 如果任务还在进行中，继续轮询
        if (data.data.status === 'pending' || data.data.status === 'processing') {
          setTimeout(fetchResult, 3000); // 3秒后再次查询
        }
      } else {
        setError(data.error || '获取结果失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误');
    } finally {
      setLoading(false);
      setPolling(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchResult();
    }
  }, [taskId]);

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportSubtitles = (format: 'srt' | 'txt') => {
    if (!result?.result?.segments) return;

    let content = '';
    
    if (format === 'srt') {
      result.result.segments.forEach((segment, index) => {
        const startTime = formatTime(segment.start_time);
        const endTime = formatTime(segment.end_time);
        content += `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n\n`;
      });
    } else {
      content = result.result.segments.map(s => s.text).join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">加载转写结果中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            获取结果失败
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 头部 */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                转写结果
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {result?.status === 'completed' && (
                <>
                  <button
                    onClick={() => exportSubtitles('txt')}
                    className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    导出文本
                  </button>
                  <button
                    onClick={() => exportSubtitles('srt')}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    导出字幕
                  </button>
                </>
              )}
              
              {(result?.status === 'pending' || result?.status === 'processing') && (
                <button
                  onClick={fetchResult}
                  disabled={polling}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 inline mr-1 ${polling ? 'animate-spin' : ''}`} />
                  刷新
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 状态信息 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              任务状态
            </h2>
            <div className="flex items-center space-x-2">
              {result?.status === 'completed' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {result?.status === 'failed' && (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              {(result?.status === 'pending' || result?.status === 'processing') && (
                <Clock className="w-5 h-5 text-yellow-500" />
              )}
              
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                result?.status === 'completed' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : result?.status === 'failed'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {result?.status === 'completed' ? '转写完成' 
                 : result?.status === 'failed' ? '转写失败'
                 : result?.status === 'processing' ? '转写中'
                 : '等待中'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">任务ID:</span>
              <p className="font-mono text-xs">{result?.taskId}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">提交时间:</span>
              <p>{result?.submitTime}</p>
            </div>
            {result?.endTime && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">完成时间:</span>
                <p>{result.endTime}</p>
              </div>
            )}
          </div>
          
          {result?.result && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <span className="text-gray-500 dark:text-gray-400">音频时长:</span>
                <p>{result.result.duration} 秒</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">说话人数:</span>
                <p>{result.result.speaker_count} 人</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">段落数量:</span>
                <p>{result.result.segments?.length || 0} 段</p>
              </div>
            </div>
          )}
        </div>

        {/* 转写结果 */}
        {result?.status === 'completed' && result?.result?.segments && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                转写文本
              </h2>
              <button
                onClick={() => copyToClipboard(result.result!.segments.map(s => s.text).join('\n'))}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <Copy className="w-4 h-4" />
                <span>复制全部</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {result.result.segments.map((segment, index) => (
                <div 
                  key={segment.id}
                  className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 w-20">
                    {formatTime(segment.start_time)}
                  </div>
                  <div className="flex-shrink-0 w-8 h-6 bg-blue-100 dark:bg-blue-900 rounded text-xs text-blue-800 dark:text-blue-200 flex items-center justify-center">
                    {segment.speaker_id}
                  </div>
                  <div className="flex-1 text-gray-900 dark:text-white">
                    {segment.text}
                  </div>
                  <button
                    onClick={() => copyToClipboard(segment.text)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {result?.parseError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-6">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                解析错误
              </h3>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {result.parseError}
            </p>
          </div>
        )}

        {/* 处理中状态 */}
        {(result?.status === 'pending' || result?.status === 'processing') && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
              正在转写中...
            </h3>
            <p className="text-blue-700 dark:text-blue-300">
              这可能需要几分钟时间，页面会自动刷新显示最新状态
            </p>
          </div>
        )}

        {/* 失败状态 */}
        {result?.status === 'failed' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
              转写失败
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">
              文件处理失败，可能是文件格式不支持或音频质量问题
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              重新上传
            </button>
          </div>
        )}
      </main>
    </div>
  );
}