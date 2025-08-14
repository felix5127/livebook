'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Play, Pause, Volume2, Download, Copy, MessageSquare, Send } from 'lucide-react';

export default function NotebookPage() {
  const params = useParams();
  const router = useRouter();
  const notebookId = params.id as string;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [question, setQuestion] = useState('');
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [transcriptData, setTranscriptData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取转写数据
  useEffect(() => {
    const fetchTranscriptData = async () => {
      try {
        setLoading(true);
        // 如果notebookId是实际的taskId，直接查询
        const response = await fetch(`/api/tasks/${notebookId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setTranscriptData(data.data);
          // 设置音频时长
          if (data.data.result?.duration) {
            setDuration(data.data.result.duration);
          } else if (data.data.result?.segments?.length) {
            // 如果没有总时长，从最后一个片段计算
            const lastSegment = data.data.result.segments[data.data.result.segments.length - 1];
            if (lastSegment.end_time) {
              setDuration(Math.ceil(lastSegment.end_time / 1000));
            }
          }
        } else {
          console.warn('API 响应格式不正确:', data);
          setError(data.error || '获取转写数据失败');
        }
      } catch (err: any) {
        console.error('获取转写数据失败:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (notebookId) {
      fetchTranscriptData();
    }
  }, [notebookId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDisplayTitle = () => {
    if (transcriptData?.transcription?.file_name) {
      return transcriptData.transcription.file_name;
    }
    
    if (transcriptData?.result?.file_url) {
      // 从文件URL提取文件名
      const url = transcriptData.result.file_url;
      const filename = url.split('/').pop()?.split('?')[0];
      if (filename && filename !== 'undefined') {
        // 移除生成的前缀，显示更友好的名称
        return filename.replace(/^A-generated-\d+-\w+_\d+_\w+\./, '音频文件.');
      }
    }
    
    return "音频转写笔记";
  };

  const handlePlayPause = () => {
    if (audioRef) {
      if (isPlaying) {
        audioRef.pause();
      } else {
        audioRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef) {
      audioRef.currentTime = time;
      setCurrentTime(time);
    }
  };

  // 音频事件处理
  useEffect(() => {
    if (audioRef) {
      const updateTime = () => setCurrentTime(audioRef.currentTime);
      const updateDuration = () => setDuration(audioRef.duration || 0);
      const handleEnd = () => setIsPlaying(false);
      const handlePause = () => setIsPlaying(false);
      const handlePlay = () => setIsPlaying(true);

      audioRef.addEventListener('timeupdate', updateTime);
      audioRef.addEventListener('loadedmetadata', updateDuration);
      audioRef.addEventListener('ended', handleEnd);
      audioRef.addEventListener('pause', handlePause);
      audioRef.addEventListener('play', handlePlay);

      return () => {
        audioRef.removeEventListener('timeupdate', updateTime);
        audioRef.removeEventListener('loadedmetadata', updateDuration);
        audioRef.removeEventListener('ended', handleEnd);
        audioRef.removeEventListener('pause', handlePause);
        audioRef.removeEventListener('play', handlePlay);
      };
    }
  }, [audioRef]);

  const handleSendQuestion = () => {
    if (question.trim()) {
      // 这里可以发送问题到AI服务
      console.log('发送问题:', question);
      setQuestion('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 隐藏的音频元素 */}
      {transcriptData?.result?.file_url && (
        <audio
          ref={setAudioRef}
          src={transcriptData.result.file_url}
          preload="metadata"
        />
      )}
      
      {/* 左侧面板 */}
      <div className="w-1/2 p-6 flex flex-col">
        {/* 头部导航 */}
        <div className="flex items-center space-x-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            {getDisplayTitle()}
          </h1>
        </div>

        {/* 音频播放器卡片 */}
        <div className="bg-red-500 rounded-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">音频转写笔记</h2>
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm opacity-90 mb-6">
            {transcriptData?.file_name && transcriptData?.result?.segments?.length 
              ? `已完成转写，共包含 ${transcriptData.result.segments.length} 个片段`
              : loading 
                ? "正在加载转写结果..."
                : "音频转写笔记"}
          </p>
          
          {/* 播放控制 */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
            <div className="flex-1">
              <div className="flex items-center space-x-2 text-sm text-white opacity-90 mb-2">
                <span>{formatTime(currentTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div 
                className="w-full bg-white bg-opacity-20 rounded-full h-2 cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = x / rect.width;
                  const seekTime = percentage * duration;
                  handleSeek(seekTime);
                }}
              >
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 聊天窗口 */}
        <div className="flex-1 flex flex-col">
          <h3 className="text-sm font-medium text-gray-900 mb-3">聊天窗口</h3>
          
          {/* 消息区域 */}
          <div className="flex-1 bg-white rounded-lg border p-4 mb-4 overflow-y-auto">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                <span className="text-pink-600 text-sm">🤖</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  {transcriptData?.result?.segments?.length 
                    ? "嗨！我已经为您整理好了转写内容，有什么问题可以问我！" 
                    : "嗨！转写完成后您可以向我提问关于音频内容的任何问题。"}
                </p>
              </div>
            </div>
          </div>
          
          {/* 输入区域 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="请输入您的问题..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSendQuestion()}
              />
              <button
                onClick={handleSendQuestion}
                disabled={!question.trim()}
                className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="followVideo"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="followVideo" className="ml-2 text-sm text-gray-600">
                跟音频内容相关
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧面板 - 转写文本 */}
      <div className="w-1/2 bg-white border-l border-gray-200 flex flex-col">
        {/* 工具栏 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
                替换
              </button>
              <button className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
                AI校对
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                分组
              </button>
              <button
                onClick={() => {
                  if (transcriptData?.result?.segments) {
                    const text = transcriptData.result.segments.map((s: any) => 
                      `${formatTime(Math.floor(s.start_time / 1000))} 说话人${parseInt(s.speaker_id) + 1}: ${s.text}`
                    ).join('\n');
                    navigator.clipboard.writeText(text);
                  }
                }}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 转写内容 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-gray-500">加载转写数据中...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-red-500">加载失败: {error}</div>
            </div>
          ) : transcriptData?.result?.segments ? (
            <div className="space-y-6">
              {transcriptData.result.segments.map((segment: any, index: number) => (
                <div key={segment.id || index} className="flex items-start space-x-4">
                  {/* 时间戳 */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleSeek(Math.floor(segment.start_time / 1000))}
                      className="text-sm text-blue-600 hover:text-blue-800 font-mono"
                    >
                      {formatTime(Math.floor(segment.start_time / 1000))}
                    </button>
                  </div>
                  
                  {/* 说话人图标 */}
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs text-gray-600">👤</span>
                  </div>
                  
                  {/* 说话人和文本 */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-1">
                      说话人{parseInt(segment.speaker_id) + 1}
                    </div>
                    <p className="text-gray-900 leading-relaxed">
                      {segment.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <div className="text-gray-500">暂无转写数据</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}