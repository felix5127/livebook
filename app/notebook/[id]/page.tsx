'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string, timestamp: Date}[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const [chatContainerRef, setChatContainerRef] = useState<HTMLDivElement | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [transcriptData, setTranscriptData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  
  // 替换功能状态
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [replaceFrom, setReplaceFrom] = useState('');
  const [replaceTo, setReplaceTo] = useState('');
  const [replaceCount, setReplaceCount] = useState(0);
  
  // 提示信息状态
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 获取转写数据
  useEffect(() => {
    const fetchTranscriptData = async () => {
      try {
        setLoading(true);
        // 如果notebookId是实际的taskId，直接查询
        const response = await fetch(`/api/tasks/${notebookId}`);
        const data = await response.json();
        
        console.log('获取到的转写数据:', data);
        
        if (data.success && data.data) {
          setTranscriptData(data.data);
          
          // 尝试获取音频URL
          const audioUrl = data.data.result?.file_url || 
                         data.data.file_url || 
                         data.data.transcription?.file_url;
          
          console.log('音频URL:', audioUrl);
          
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

  // 动态设置音频源
  useEffect(() => {
    if (audioRef && transcriptData) {
      const audioUrl = getAudioUrl();
      if (audioUrl && audioRef.src !== audioUrl) {
        console.log('设置音频源:', audioUrl);
        audioRef.src = audioUrl;
        audioRef.load(); // 重新加载音频
      }
    }
  }, [audioRef, transcriptData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateTitleFromContent = () => {
    if (!transcriptData?.result?.segments || transcriptData.result.segments.length === 0) {
      return null;
    }

    // 提取前几句话的文本内容
    const firstSegments = transcriptData.result.segments.slice(0, 3);
    const combinedText = firstSegments.map((s: any) => s.text).join('');
    
    // 移除标点符号和空格
    const cleanText = combinedText.replace(/[，。！？；：""''（）【】]/g, '').trim();
    
    // 根据内容关键词生成标题
    if (cleanText.includes('强化学习') || cleanText.includes('机器学习') || cleanText.includes('深度学习')) {
      return '机器学习技术讨论';
    }
    if (cleanText.includes('清华大学') || cleanText.includes('大学') || cleanText.includes('课程')) {
      return '学术课程讲座';
    }
    if (cleanText.includes('产品') || cleanText.includes('设计') || cleanText.includes('用户')) {
      return '产品设计会议';
    }
    if (cleanText.includes('技术') || cleanText.includes('算法') || cleanText.includes('系统')) {
      return '技术研讨会';
    }
    if (cleanText.includes('会议') || cleanText.includes('讨论') || cleanText.includes('分享')) {
      return '团队讨论会议';
    }
    
    // 如果没有匹配到关键词，截取前15个字符作为标题
    if (cleanText.length > 15) {
      return cleanText.substring(0, 15) + '...';
    }
    
    return cleanText || '音频内容摘要';
  };

  const getDisplayTitle = () => {
    // 优先使用从内容生成的标题
    const generatedTitle = generateTitleFromContent();
    if (generatedTitle) {
      return generatedTitle;
    }
    
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

  // 获取音频文件URL
  const getAudioUrl = () => {
    console.log('调试 - transcriptData:', transcriptData);
    
    // 根据API路由的结构，音频URL应该在transcription对象中
    if (transcriptData?.transcription?.file_url) {
      console.log('找到音频URL (transcription):', transcriptData.transcription.file_url);
      return transcriptData.transcription.file_url;
    }
    
    // 备用：检查result层级的file_url
    if (transcriptData?.result?.file_url) {
      console.log('找到音频URL (result):', transcriptData.result.file_url);
      return transcriptData.result.file_url;
    }
    
    // 备用：检查根级别的file_url
    if (transcriptData?.file_url) {
      console.log('找到音频URL (root):', transcriptData.file_url);
      return transcriptData.file_url;
    }
    
    console.log('未找到音频URL - 可用的keys:', Object.keys(transcriptData || {}));
    return null;
  };

  const handlePlayPause = async () => {
    if (audioRef) {
      try {
        if (isPlaying) {
          audioRef.pause();
          setIsPlaying(false);
        } else {
          console.log('尝试播放音频:', audioRef.src);
          await audioRef.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('音频播放失败:', error);
        setIsPlaying(false);
        // 可以在这里添加用户提示
      }
    } else {
      console.warn('音频元素未初始化，音频URL:', getAudioUrl());
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
      const updateDuration = () => {
        if (audioRef.duration && !isNaN(audioRef.duration)) {
          setDuration(audioRef.duration);
          console.log('音频时长已更新:', audioRef.duration);
        }
      };
      const handleEnd = () => setIsPlaying(false);
      const handlePause = () => setIsPlaying(false);
      const handlePlay = () => setIsPlaying(true);
      const handleError = (e: Event) => {
        console.error('音频加载错误:', e);
        setIsPlaying(false);
        setAudioReady(false);
      };
      const handleLoadStart = () => {
        console.log('开始加载音频');
        setAudioReady(false);
      };
      const handleCanPlay = () => {
        console.log('音频可以播放');
        setAudioReady(true);
      };

      audioRef.addEventListener('timeupdate', updateTime);
      audioRef.addEventListener('loadedmetadata', updateDuration);
      audioRef.addEventListener('ended', handleEnd);
      audioRef.addEventListener('pause', handlePause);
      audioRef.addEventListener('play', handlePlay);
      audioRef.addEventListener('error', handleError);
      audioRef.addEventListener('loadstart', handleLoadStart);
      audioRef.addEventListener('canplay', handleCanPlay);

      return () => {
        audioRef.removeEventListener('timeupdate', updateTime);
        audioRef.removeEventListener('loadedmetadata', updateDuration);
        audioRef.removeEventListener('ended', handleEnd);
        audioRef.removeEventListener('pause', handlePause);
        audioRef.removeEventListener('play', handlePlay);
        audioRef.removeEventListener('error', handleError);
        audioRef.removeEventListener('loadstart', handleLoadStart);
        audioRef.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [audioRef]);

  // 自动滚动到聊天底部
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages, isAiThinking]);

  const handleSendQuestion = async () => {
    if (!question.trim() || isAiThinking) return;
    
    const userMessage = question.trim();
    setQuestion('');
    
    // 添加用户消息到聊天记录
    setChatMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);
    
    setIsAiThinking(true);
    
    try {
      // 准备转写内容作为上下文
      const context = transcriptData?.result?.segments?.map((seg: any) => 
        `[${formatTime(Math.floor(seg.start_time / 1000))}] 说话人${parseInt(seg.speaker_id) + 1}: ${seg.text}`
      ).join('\n') || '';
      
      console.log('[AI助手] 发送请求:', { userMessage, hasContext: !!context });
      
      // 调用AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          context: context
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI助手] API响应错误:', errorText);
        throw new Error(`AI服务暂时不可用: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[AI助手] API响应:', data);
      
      if (data.success && data.data.choices && data.data.choices[0]) {
        const aiResponse = data.data.choices[0].message.content;
        
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        }]);
        
        showToastMessage('AI助手回复成功');
      } else {
        throw new Error('AI响应格式错误');
      }
      
    } catch (error: any) {
      console.error('[AI助手] 请求失败:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，我现在无法回答您的问题，请稍后重试。',
        timestamp: new Date()
      }]);
      showToastMessage(`AI助手暂时不可用: ${error.message}`);
    } finally {
      setIsAiThinking(false);
    }
  };

  // 显示提示信息
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // 替换功能处理
  const handleReplace = () => {
    if (!transcriptData?.result?.segments || !replaceFrom.trim()) {
      return;
    }

    let count = 0;
    const updatedSegments = transcriptData.result.segments.map((segment: any) => {
      if (segment.text.includes(replaceFrom)) {
        count++;
        return {
          ...segment,
          text: segment.text.replace(new RegExp(replaceFrom, 'g'), replaceTo)
        };
      }
      return segment;
    });

    setTranscriptData({
      ...transcriptData,
      result: {
        ...transcriptData.result,
        segments: updatedSegments
      }
    });

    setReplaceCount(count);
    setShowReplaceDialog(false);
    setReplaceFrom('');
    setReplaceTo('');
  };

  // 复制功能
  const handleCopy = async () => {
    if (transcriptData?.result?.segments) {
      try {
        const text = transcriptData.result.segments.map((s: any) => 
          `${formatTime(Math.floor(s.start_time / 1000))} 说话人${parseInt(s.speaker_id) + 1}: ${s.text}`
        ).join('\n');
        await navigator.clipboard.writeText(text);
        showToastMessage('转写文本已复制到剪贴板！');
      } catch (error) {
        console.error('复制失败:', error);
        showToastMessage('复制失败，请重试');
      }
    }
  };

  // 下载功能
  const handleDownload = () => {
    if (transcriptData?.result?.segments) {
      try {
        const text = transcriptData.result.segments.map((s: any) => 
          `${formatTime(Math.floor(s.start_time / 1000))} 说话人${parseInt(s.speaker_id) + 1}: ${s.text}`
        ).join('\n');
        
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${getDisplayTitle()}-转写文本.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToastMessage('转写文本下载成功！');
      } catch (error) {
        console.error('下载失败:', error);
        showToastMessage('下载失败，请重试');
      }
    }
  };

  // 导出总结功能
  const handleExportSummary = () => {
    try {
      const summaryText = `# ${getDisplayTitle()}

## 主要议题
本次讨论主要围绕深度学习和强化学习展开，探讨了机器学习的发展历程和技术细节。

## 关键要点
• 强化学习是机器学习的一个特殊分支
• 与传统机器学习的主要区别在于决策机制
• 强化学习更适合解决复杂的序列决策问题
• 人生本质上就是一个强化学习的过程

## 说话人观点
**说话人1:** 主要介绍了强化学习的基本概念和应用场景
**说话人2:** 提出了关于技术普及和深入浅出解释的观点

## 内容时间线
1:19 - 介绍背景和课程设置
1:50 - 强化学习概念解释
2:02 - 传统机器学习对比

---
生成时间: ${new Date().toLocaleString('zh-CN')}
`;

      const blob = new Blob([summaryText], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${getDisplayTitle()}-笔记总结.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToastMessage('笔记总结导出成功！');
    } catch (error) {
      console.error('导出失败:', error);
      showToastMessage('导出失败，请重试');
    }
  };

  // 分享笔记功能 - 显示分享选项
  const [showShareOptions, setShowShareOptions] = useState(false);
  
  // 字幕分组功能
  const [isGroupedView, setIsGroupedView] = useState(false);
  
  // 说话人颜色配置
  const getSpeakerStyle = (speakerId: string) => {
    const speakerIndex = parseInt(speakerId) || 0;
    const styles = [
      {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        badgeColor: 'bg-blue-600',
        number: '1',
        name: '说话人1'
      },
      {
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
        badgeColor: 'bg-purple-600',
        number: '2',
        name: '说话人2'
      },
      {
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        badgeColor: 'bg-green-600',
        number: '3',
        name: '说话人3'
      },
      {
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200',
        badgeColor: 'bg-orange-600',
        number: '4',
        name: '说话人4'
      }
    ];
    
    return styles[speakerIndex] || styles[speakerIndex % styles.length];
  };

  // 按说话人分组转写内容
  const getGroupedTranscript = () => {
    if (!transcriptData?.result?.segments) return [];
    
    const grouped: { [key: string]: any[] } = {};
    
    transcriptData.result.segments.forEach((segment: any) => {
      const speakerId = segment.speaker_id || 'unknown';
      if (!grouped[speakerId]) {
        grouped[speakerId] = [];
      }
      grouped[speakerId].push(segment);
    });
    
    // 转换为数组格式，按说话人ID排序
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([speakerId, segments]) => ({
        speakerId,
        segments,
        totalDuration: segments.reduce((sum, seg) => sum + (seg.end_time - seg.start_time), 0)
      }));
  };
  
  const handleShareNote = async () => {
    // 优先使用系统分享
    if (navigator.share && /Mobile|Android|iPhone/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: getDisplayTitle(),
          text: '我刚刚用 Livebook 生成了这个音频转写笔记，分享给你看看！',
          url: window.location.href
        });
        showToastMessage('分享成功！');
        return;
      } catch (error: any) {
        if (error.name === 'AbortError') return;
      }
    }
    
    // 显示分享选项弹窗
    setShowShareOptions(true);
  };

  // 社交媒体分享
  const shareToSocialMedia = (platform: string) => {
    const title = encodeURIComponent(getDisplayTitle());
    const description = encodeURIComponent('我刚刚用 Livebook 生成了这个音频转写笔记，分享给你看看！');
    const url = encodeURIComponent(window.location.href);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'wechat':
        // 微信朋友圈分享 - 复制链接并提示用户
        navigator.clipboard.writeText(window.location.href).then(() => {
          showToastMessage('链接已复制，请在微信中粘贴分享！');
        }).catch(() => {
          showToastMessage('请手动复制当前页面链接到微信分享');
        });
        break;
        
      case 'xiaohongshu':
        // 小红书分享
        shareUrl = `https://www.xiaohongshu.com/explore/post?title=${title}&content=${description}&url=${url}`;
        window.open(shareUrl, '_blank');
        showToastMessage('正在打开小红书分享页面...');
        break;
        
      case 'weibo':
        // 微博分享
        shareUrl = `https://service.weibo.com/share/share.php?title=${title} - ${description}&url=${url}`;
        window.open(shareUrl, '_blank');
        showToastMessage('正在打开微博分享页面...');
        break;
        
      case 'copy':
        // 复制链接
        navigator.clipboard.writeText(window.location.href).then(() => {
          showToastMessage('链接已复制到剪贴板！');
        }).catch(() => {
          showToastMessage('复制功能暂时不可用');
        });
        break;
    }
    
    setShowShareOptions(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 grid grid-cols-12 gap-4">
      {/* 音频元素 */}
      <audio
        ref={setAudioRef}
        preload="metadata"
        crossOrigin="anonymous"
        onLoadStart={() => console.log('音频开始加载')}
        onLoadedData={() => console.log('音频数据已加载')}
        onCanPlay={() => console.log('音频可以播放')}
        onError={(e) => {
          console.error('音频错误:', e);
          console.error('音频错误详情:', e.currentTarget.error);
        }}
        style={{ display: 'none' }}
      />
      
      {/* 左侧面板 - 播放器和聊天 */}
      <div className="col-span-4 p-4 flex flex-col h-screen bg-gray-50">
        {/* 头部导航 */}
        <div className="flex items-center space-x-3 mb-4 p-2">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {getDisplayTitle()}
          </h1>
        </div>

        {/* 音频播放器 */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePlayPause}
              disabled={!audioReady}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors ${
                audioReady 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                {!audioReady && <span>加载中...</span>}
              </div>
              <div 
                className="w-full bg-gray-200 rounded-full h-1.5 cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = x / rect.width;
                  const seekTime = percentage * duration;
                  handleSeek(seekTime);
                }}
              >
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 聊天窗口 */}
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-xs font-medium text-gray-600 mb-2 px-2 uppercase tracking-wider">AI 助手</h3>
          
          {/* 消息区域 */}
          <div 
            ref={chatMessagesRef}
            className="flex-1 bg-white rounded-lg border border-gray-200 p-3 mb-3 overflow-y-auto"
          >
            <div className="space-y-4">
              {/* 默认欢迎消息 */}
              {chatMessages.length === 0 && (
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs">🤖</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {transcriptData?.result?.segments?.length 
                        ? "嗨！我已经为您整理好了转写内容，有什么问题可以问我！" 
                        : "嗨！转写完成后您可以向我提问关于音频内容的任何问题。"}
                    </p>
                  </div>
                </div>
              )}
              
              {/* 聊天消息 */}
              {chatMessages.map((message, index) => (
                <div key={index} className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-green-100' 
                      : 'bg-blue-100'
                  }`}>
                    <span className="text-xs">
                      {message.role === 'user' ? '👤' : '🤖'}
                    </span>
                  </div>
                  <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                    <p className={`text-xs leading-relaxed ${
                      message.role === 'user' 
                        ? 'text-gray-800 bg-green-50 rounded-lg p-2 inline-block' 
                        : 'text-gray-600'
                    }`}>
                      {message.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {message.timestamp.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* AI思考中指示器 */}
              {isAiThinking && (
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs animate-pulse">🤖</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <span>AI正在思考</span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 输入区域 */}
          <div className="space-y-2 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="问个问题..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                onKeyPress={(e) => e.key === 'Enter' && handleSendQuestion()}
              />
              <button
                onClick={handleSendQuestion}
                disabled={!question.trim() || isAiThinking}
                className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAiThinking ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 中间面板 - 转写文本/字幕 */}
      <div className="col-span-5 bg-white border-l border-r border-gray-200 flex flex-col h-screen">
        {/* 播放进度 - 柔和设计 */}
        <div className="px-4 py-2 bg-white border-b border-gray-100 group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <div className="flex-1 mx-3">
              <div 
                className="w-full bg-gray-100 hover:bg-gray-200 rounded-full h-0.5 cursor-pointer transition-all duration-200"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = x / rect.width;
                  const seekTime = percentage * duration;
                  handleSeek(seekTime);
                }}
              >
                <div 
                  className="bg-blue-400 h-0.5 rounded-full transition-all duration-300"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {Math.round((currentTime / duration) * 100) || 0}%
            </span>
          </div>
        </div>
        
        {/* 工具栏 */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowReplaceDialog(true)}
                className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
              >
                替换
              </button>
              <button className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
                AI校对
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsGroupedView(!isGroupedView)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  isGroupedView 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isGroupedView ? '按时间' : '分组'}
              </button>
              <button
                onClick={handleCopy}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
                title="复制转写文本"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
                title="下载转写文本"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 转写内容 */}
        <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
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
              {!isGroupedView ? (
                // 按时间序列显示
                transcriptData.result.segments.map((segment: any, index: number) => (
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
                    
                    {/* 说话人标识 */}
                    {(() => {
                      const style = getSpeakerStyle(segment.speaker_id);
                      return (
                        <div className={`flex-shrink-0 w-6 h-6 ${style.badgeColor} rounded-full`}>
                        </div>
                      );
                    })()}
                    
                    {/* 说话人和文本 */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs mb-1 font-medium ${getSpeakerStyle(segment.speaker_id).textColor}`}>
                        {getSpeakerStyle(segment.speaker_id).name}
                      </div>
                      <p className="text-gray-900 leading-relaxed">
                        {segment.text}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                // 按说话人分组显示
                getGroupedTranscript().map((group, groupIndex) => {
                  const style = getSpeakerStyle(group.speakerId);
                  return (
                    <div key={group.speakerId} className={`${style.bgColor} ${style.borderColor} border rounded-lg p-4 mb-4`}>
                      {/* 说话人头部 */}
                      <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-current border-opacity-20">
                        <div className={`w-10 h-10 ${style.badgeColor} rounded-full shadow-sm`}>
                        </div>
                        <div>
                          <h3 className={`font-semibold ${style.textColor}`}>
                            {style.name}
                          </h3>
                          <p className={`text-xs ${style.textColor} opacity-75`}>
                            {group.segments.length}段对话 · {formatTime(Math.floor(group.totalDuration / 1000))}
                          </p>
                        </div>
                      </div>
                    
                    {/* 说话人的所有对话 */}
                    <div className="space-y-3">
                      {group.segments.map((segment: any, index: number) => (
                        <div key={segment.id || index} className="flex items-start space-x-3">
                          <button
                            onClick={() => handleSeek(Math.floor(segment.start_time / 1000))}
                            className="text-xs text-blue-600 hover:text-blue-800 font-mono flex-shrink-0 mt-1"
                          >
                            {formatTime(Math.floor(segment.start_time / 1000))}
                          </button>
                          <p className="text-gray-800 leading-relaxed flex-1">
                            {segment.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <div className="text-gray-500">暂无转写数据</div>
            </div>
          )}
        </div>
      </div>

      {/* 右侧面板 - 笔记总结 */}
      <div className="col-span-3 bg-white p-6 flex flex-col">
        {/* 总结标题 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">笔记总结</h3>
          <button className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200">
            重新生成
          </button>
        </div>

        {/* 内容总结 */}
        <div className="flex-1 overflow-y-auto">
          {transcriptData?.result?.segments ? (
            <div className="space-y-4">
              {/* 主要议题 */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">🎯 主要议题</h4>
                <p className="text-sm text-blue-800">
                  本次讨论主要围绕深度学习和强化学习展开，探讨了机器学习的发展历程和技术细节。
                </p>
              </div>

              {/* 关键要点 */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">💡 关键要点</h4>
                <ul className="text-sm text-green-800 space-y-2">
                  <li>• 强化学习是机器学习的一个特殊分支</li>
                  <li>• 与传统机器学习的主要区别在于决策机制</li>
                  <li>• 强化学习更适合解决复杂的序列决策问题</li>
                  <li>• 人生本质上就是一个强化学习的过程</li>
                </ul>
              </div>

              {/* 说话人观点 */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">👥 说话人观点</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-purple-800">说话人1:</span>
                    <p className="text-purple-700 mt-1">主要介绍了强化学习的基本概念和应用场景</p>
                  </div>
                  <div>
                    <span className="font-medium text-purple-800">说话人2:</span>
                    <p className="text-purple-700 mt-1">提出了关于技术普及和深入浅出解释的观点</p>
                  </div>
                </div>
              </div>

              {/* 时间线 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">⏰ 内容时间线</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>1:19 - 介绍背景和课程设置</span>
                    <span className="text-xs text-gray-500">重要</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1:50 - 强化学习概念解释</span>
                    <span className="text-xs text-gray-500">核心</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2:02 - 传统机器学习对比</span>
                    <span className="text-xs text-gray-500">对比</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <div className="text-center text-gray-500">
                <p>转写完成后将自动生成笔记总结</p>
                <p className="text-sm mt-2">包含关键要点、主要议题和时间线</p>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button 
              onClick={handleExportSummary}
              className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              导出总结
            </button>
            <button 
              onClick={handleShareNote}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              分享笔记
            </button>
          </div>
        </div>
      </div>

      {/* 替换对话框 */}
      {showReplaceDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                替换文本
              </h3>
              <button
                onClick={() => setShowReplaceDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  查找文本
                </label>
                <input
                  type="text"
                  value={replaceFrom}
                  onChange={(e) => setReplaceFrom(e.target.value)}
                  placeholder="输入要替换的文本..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  替换为
                </label>
                <input
                  type="text"
                  value={replaceTo}
                  onChange={(e) => setReplaceTo(e.target.value)}
                  placeholder="输入替换后的文本..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowReplaceDialog(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleReplace}
                disabled={!replaceFrom.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                替换全部
              </button>
            </div>
            
            {replaceCount > 0 && (
              <div className="mt-3 text-sm text-green-600">
                已替换 {replaceCount} 处文本
              </div>
            )}
          </div>
        </div>
      )}

      {/* 分享选项弹窗 */}
      {showShareOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                分享笔记
              </h3>
              <button
                onClick={() => setShowShareOptions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* 微信朋友圈 */}
              <button
                onClick={() => shareToSocialMedia('wechat')}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.5 5c-3.038 0-5.5 2.015-5.5 4.5 0 1.397.707 2.648 1.857 3.496L4 16l2.5-1.5c.548.178 1.139.264 1.75.25 3.036-.089 5.5-2.104 5.5-4.5S11.538 5 8.5 5zm12 8c-2.485 0-4.5 1.567-4.5 3.5 0 1.084.549 2.058 1.442 2.717L16.5 21l1.944-1.167c.426.138.884.211 1.356.194 2.484-.07 4.5-1.635 4.5-3.5S22.985 13 20.5 13z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium">微信朋友圈</span>
              </button>
              
              {/* 小红书 */}
              <button
                onClick={() => shareToSocialMedia('xiaohongshu')}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v-.07zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium">小红书</span>
              </button>
              
              {/* 微博 */}
              <button
                onClick={() => shareToSocialMedia('weibo')}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.35 16.88c-2.67 0-4.84-1.93-4.84-4.31 0-2.38 2.17-4.31 4.84-4.31s4.84 1.93 4.84 4.31c0 2.38-2.17 4.31-4.84 4.31zm-.01-7.12c-1.89 0-3.42 1.34-3.42 2.99s1.53 2.99 3.42 2.99 3.42-1.34 3.42-2.99-1.53-2.99-3.42-2.99zm7.82-4.29c-.34-.13-.57-.46-.57-.82 0-.49.4-.89.89-.89.18 0 .35.05.49.15 1.18.74 1.88 2.04 1.88 3.49 0 1.71-.99 3.19-2.52 3.94-.17.08-.36.13-.55.13-.69 0-1.25-.56-1.25-1.25 0-.5.29-.92.71-1.12.65-.32 1.06-.97 1.06-1.7 0-.73-.35-1.4-.94-1.82z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium">微博</span>
              </button>
              
              {/* 复制链接 */}
              <button
                onClick={() => shareToSocialMedia('copy')}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </div>
                <span className="text-sm font-medium">复制链接</span>
              </button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500 text-center">
              选择分享到你喜欢的社交平台
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-right-1 duration-300">
          {toastMessage}
        </div>
      )}
    </div>
  );
}