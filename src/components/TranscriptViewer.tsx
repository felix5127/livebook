'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Play, Pause, User, Clock, Edit2, Check, X } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import { TranscriptionResult, TranscriptSegment, Speaker } from '@/types';

interface TranscriptViewerProps {
  result: TranscriptionResult;
  onTimeJump?: (time: number) => void;
  isPlaying?: boolean;
  currentTime?: number;
  className?: string;
}

export default function TranscriptViewer({
  result,
  onTimeJump,
  isPlaying = false,
  currentTime = 0,
  className
}: TranscriptViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('all');
  const [editingSegment, setEditingSegment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [highlightedSegments, setHighlightedSegments] = useState<Set<string>>(new Set());
  
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // 过滤和搜索逻辑
  const filteredSegments = result.segments.filter(segment => {
    const matchesSearch = searchTerm === '' || 
      segment.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpeaker = selectedSpeaker === 'all' || 
      segment.speaker.id === selectedSpeaker;
    return matchesSearch && matchesSpeaker;
  });

  // 高亮搜索结果
  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // 查找当前播放的片段
  const getCurrentSegment = () => {
    return result.segments.find(segment => 
      currentTime >= segment.startTime && currentTime <= segment.endTime
    );
  };

  const currentSegment = getCurrentSegment();

  // 自动滚动到当前播放片段
  useEffect(() => {
    if (currentSegment && activeSegmentRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentSegment?.id]);

  // 开始编辑
  const startEdit = (segment: TranscriptSegment) => {
    setEditingSegment(segment.id);
    setEditText(segment.text);
  };

  // 保存编辑
  const saveEdit = () => {
    if (editingSegment && editText.trim()) {
      // 这里应该调用API更新转写文本
      console.log('保存编辑:', { segmentId: editingSegment, text: editText });
    }
    setEditingSegment(null);
    setEditText('');
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingSegment(null);
    setEditText('');
  };

  // 获取说话人统计信息
  const getSpeakerStats = (speakerId: string) => {
    const segments = result.segments.filter(s => s.speaker.id === speakerId);
    const totalDuration = segments.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
    return {
      segmentCount: segments.length,
      duration: totalDuration
    };
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* 搜索和过滤控件 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索转写内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          {/* 说话人过滤 */}
          <div className="sm:w-48">
            <select
              value={selectedSpeaker}
              onChange={(e) => setSelectedSpeaker(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">所有说话人</option>
              {result.speakers.map((speaker) => {
                const stats = getSpeakerStats(speaker.id);
                return (
                  <option key={speaker.id} value={speaker.id}>
                    {speaker.name} ({stats.segmentCount}段)
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* 搜索结果统计 */}
        {searchTerm && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            找到 {filteredSegments.length} 个相关片段
          </div>
        )}
      </div>

      {/* 说话人图例 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
          <User className="w-4 h-4 mr-2" />
          说话人识别
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {result.speakers.map((speaker) => {
            const stats = getSpeakerStats(speaker.id);
            return (
              <div
                key={speaker.id}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: speaker.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {speaker.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {stats.segmentCount}段 · {formatTime(stats.duration)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 转写内容 */}
      <div className="space-y-2">
        {filteredSegments.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {searchTerm ? '没有找到匹配的内容' : '没有转写内容'}
          </div>
        ) : (
          filteredSegments.map((segment, index) => {
            const isCurrentSegment = currentSegment?.id === segment.id;
            const isEditing = editingSegment === segment.id;
            
            return (
              <div
                key={segment.id}
                ref={isCurrentSegment ? activeSegmentRef : undefined}
                className={cn(
                  'group bg-white dark:bg-gray-800 rounded-lg border p-4 transition-all duration-300',
                  isCurrentSegment
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                {/* 片段头部 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {/* 说话人标识 */}
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: segment.speaker.color }}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {segment.speaker.name}
                      </span>
                    </div>
                    
                    {/* 时间戳 */}
                    <button
                      onClick={() => onTimeJump?.(segment.startTime)}
                      className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                      </span>
                    </button>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => onTimeJump?.(segment.startTime)}
                          className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                          title="跳转到此时间点"
                        >
                          {isCurrentSegment && isPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => startEdit(segment)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="编辑文本"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    
                    {isEditing && (
                      <>
                        <button
                          onClick={saveEdit}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="保存"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="取消"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 转写文本 */}
                <div className="text-gray-900 dark:text-white">
                  {isEditing ? (
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
                      rows={3}
                      autoFocus
                    />
                  ) : (
                    <p className="leading-relaxed">
                      {highlightSearchTerm(segment.text)}
                    </p>
                  )}
                </div>

                {/* 置信度指示器 */}
                {segment.confidence < 0.8 && (
                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    置信度较低 ({Math.round(segment.confidence * 100)}%)
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 页面底部空白，便于滚动 */}
      <div className="h-20" />
    </div>
  );
}