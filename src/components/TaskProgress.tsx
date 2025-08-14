'use client';

import React from 'react';
import { Clock, CheckCircle, AlertCircle, RotateCcw, Loader2 } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import { TranscriptionTask, TaskStatus } from '@/types';

interface TaskProgressProps {
  task: TranscriptionTask;
  onRetry?: () => void;
  className?: string;
}

const statusConfig: Record<TaskStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  uploading: {
    label: '上传中',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    icon: Loader2,
  },
  processing: {
    label: '转写中',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    icon: Loader2,
  },
  completed: {
    label: '已完成',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    icon: CheckCircle,
  },
  failed: {
    label: '失败',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    icon: AlertCircle,
  },
};

export default function TaskProgress({ task, onRetry, className }: TaskProgressProps) {
  const config = statusConfig[task.status];
  const StatusIcon = config.icon;
  const isLoading = task.status === 'uploading' || task.status === 'processing';

  // 计算预估剩余时间
  const getEstimatedTime = () => {
    if (task.status === 'completed') return null;
    if (task.status === 'failed') return null;
    if (!task.estimatedTime) return null;
    
    return formatTime(task.estimatedTime);
  };

  // 获取进度描述
  const getProgressDescription = () => {
    switch (task.status) {
      case 'uploading':
        return '正在上传文件...';
      case 'processing':
        return '正在分析音频并生成转写文本...';
      case 'completed':
        return `转写完成，处理时长：${task.completedAt ? 
          formatTime((task.completedAt.getTime() - task.createdAt.getTime()) / 1000) : '未知'}`;
      case 'failed':
        return task.errorMessage || '转写失败，请重试';
      default:
        return '';
    }
  };

  return (
    <div className={cn(
      'border rounded-lg p-4 transition-all duration-300',
      config.bgColor,
      className
    )}>
      {/* 任务头部信息 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {task.fileName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            创建时间：{task.createdAt.toLocaleString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <StatusIcon 
            className={cn(
              'w-5 h-5',
              config.color,
              isLoading && 'animate-spin'
            )}
          />
          <span className={cn('text-sm font-medium', config.color)}>
            {config.label}
          </span>
        </div>
      </div>

      {/* 进度条 */}
      {(task.status === 'uploading' || task.status === 'processing') && (
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>{getProgressDescription()}</span>
            <span>{Math.round(task.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                task.status === 'uploading' ? 'bg-blue-500' : 'bg-yellow-500'
              )}
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 状态描述 */}
      <div className="space-y-2">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {getProgressDescription()}
        </p>

        {/* 预估剩余时间 */}
        {getEstimatedTime() && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 mr-1" />
            <span>预估剩余时间：{getEstimatedTime()}</span>
          </div>
        )}

        {/* 文件信息 */}
        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
          <span>类型：{task.fileType.toUpperCase()}</span>
          <span>大小：{(task.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
          {task.duration && (
            <span>时长：{formatTime(task.duration)}</span>
          )}
        </div>
      </div>

      {/* 重试按钮 */}
      {task.status === 'failed' && onRetry && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onRetry}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重试</span>
          </button>
        </div>
      )}

      {/* 完成状态的操作按钮 */}
      {task.status === 'completed' && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex space-x-2">
            <button
              onClick={() => window.open(`/result/${task.id}`, '_blank')}
              className="px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-md transition-colors"
            >
              查看结果
            </button>
            {task.audioUrl && (
              <button
                onClick={() => {
                  const audio = new Audio(task.audioUrl);
                  audio.play().catch(console.error);
                }}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                播放音频
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}