'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Settings } from 'lucide-react';
import TranscriptViewer from '@/components/TranscriptViewer';
import ExportOptions from '@/components/ExportOptions';
import { TranscriptionResult, TranscriptSegment, Speaker } from '@/types';
import { formatTime, generateRandomColor } from '@/lib/utils';

// 生成模拟数据
const generateMockResult = (taskId: string): TranscriptionResult => {
  const speakers: Speaker[] = [
    { id: 'speaker-1', name: '主持人', color: '#3b82f6' },
    { id: 'speaker-2', name: '嘉宾A', color: '#ef4444' },
    { id: 'speaker-3', name: '嘉宾B', color: '#10b981' },
  ];

  const segments: TranscriptSegment[] = [
    {
      id: '1',
      startTime: 0,
      endTime: 5.2,
      text: '欢迎收听本期节目，我是主持人张三。今天我们邀请到了两位专家来讨论人工智能的发展趋势。',
      speaker: speakers[0],
      confidence: 0.95
    },
    {
      id: '2',
      startTime: 5.5,
      endTime: 12.8,
      text: '大家好，我是李四，很高兴能参加这次讨论。我认为人工智能在未来几年会有突破性发展。',
      speaker: speakers[1],
      confidence: 0.92
    },
    {
      id: '3',
      startTime: 13.1,
      endTime: 18.9,
      text: '我是王五，我同意李四的观点。特别是在自然语言处理和计算机视觉领域。',
      speaker: speakers[2],
      confidence: 0.88
    },
    {
      id: '4',
      startTime: 19.2,
      endTime: 26.5,
      text: '那么两位专家认为，人工智能对传统行业的影响会是怎样的呢？',
      speaker: speakers[0],
      confidence: 0.96
    },
    {
      id: '5',
      startTime: 27.0,
      endTime: 35.8,
      text: '我觉得影响是深远的。比如在制造业，AI可以提高生产效率，降低成本。在医疗行业，AI辅助诊断已经开始普及。',
      speaker: speakers[1],
      confidence: 0.91
    },
    // 可以添加更多片段...
  ];

  return {
    taskId,
    segments,
    speakers,
    duration: 3600, // 1小时
    audioUrl: '/mock-audio.mp3'
  };
};

export default function ResultPage() {
  const params = useParams();
  const taskId = params.id as string;
  
  const [result] = useState<TranscriptionResult>(() => generateMockResult(taskId));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // 音频控制函数
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleTimeJump = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(result.duration, audioRef.current.currentTime + 10);
    }
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying]);

  const progressPercentage = (currentTime / result.duration) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 隐藏的音频元素 */}
      <audio
        ref={audioRef}
        src={result.audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            audioRef.current.volume = volume;
          }
        }}
      />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  转写结果
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  任务ID: {taskId}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                导出结果
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* 主要内容区 */}
          <div className="xl:col-span-3">
            {/* 音频播放器 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={togglePlayPause}
                  className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </button>

                <button
                  onClick={skipBackward}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="后退10秒 (←)"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={skipForward}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="前进10秒 (→)"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(result.duration)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 cursor-pointer">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-150"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* 音量控制 */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* 播放速度 */}
                <select
                  value={playbackRate}
                  onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                  className="text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>

              {/* 快捷键提示 */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                快捷键：空格键播放/暂停，左右方向键快进/快退10秒
              </div>
            </div>

            {/* 转写内容 */}
            <TranscriptViewer
              result={result}
              onTimeJump={handleTimeJump}
              isPlaying={isPlaying}
              currentTime={currentTime}
            />
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 音频信息 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                音频信息
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">总时长</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatTime(result.duration)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">转写片段</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {result.segments.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">说话人数</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {result.speakers.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">平均置信度</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Math.round(result.segments.reduce((sum, s) => sum + s.confidence, 0) / result.segments.length * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 导出选项 */}
            {showExportOptions && (
              <ExportOptions result={result} />
            )}

            {/* 操作提示 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                使用提示
              </h3>
              <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-300">
                <li>• 点击时间戳可跳转到对应位置</li>
                <li>• 支持搜索和按说话人筛选</li>
                <li>• 可以直接编辑转写文本</li>
                <li>• 支持导出多种格式</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}