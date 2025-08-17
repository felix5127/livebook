'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FileAudio, Clock, User, Play, Trash2, Calendar, MoreHorizontal, Headphones } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Notebook {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  duration?: number;
  speakerCount?: number;
  status: 'completed' | 'processing' | 'failed';
}

interface NotebookCardProps {
  notebook: Notebook;
  onDelete: (e: React.MouseEvent, notebookId: string) => void;
  onUpdateTitle?: (notebookId: string) => void;
}

const NotebookCard: React.FC<NotebookCardProps> = ({ 
  notebook, 
  onDelete,
  onUpdateTitle
}) => {
  const router = useRouter();

  const handleCardClick = () => {
    if (onUpdateTitle) {
      onUpdateTitle(notebook.id);
    }
    router.push(`/notebook/${notebook.id}`);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'processing': return '处理中';
      case 'failed': return '失败';
      default: return '未知';
    }
  };

  return (
    <Card 
      variant="elevated" 
      hover 
      className="group cursor-pointer transition-all duration-300 hover:shadow-warm hover:-translate-y-1"
      onClick={handleCardClick}
    >
      {/* 卡片头部 */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <FileAudio className="w-6 h-6 text-white" />
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            icon={<Play />}
            className="text-neutral-500 hover:text-brand-600"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 />}
            className="text-neutral-500 hover:text-error-600"
            onClick={(e) => onDelete(e, notebook.id)}
          />
        </div>
      </div>

      {/* 笔记本信息 */}
      <div className="flex-1 mb-4">
        <h3 className="text-lg font-bold text-neutral-900 mb-2 line-clamp-2 group-hover:text-brand-700 transition-colors">
          {notebook.title}
        </h3>
        <p className="text-sm text-neutral-600 line-clamp-3 leading-relaxed">
          {notebook.description}
        </p>
      </div>

      {/* 状态和元数据 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant={getStatusVariant(notebook.status)} size="sm">
            {getStatusText(notebook.status)}
          </Badge>
          
          <div className="flex items-center space-x-1 text-xs text-neutral-500">
            <Calendar className="w-3 h-3" />
            <span>{notebook.createdAt}</span>
          </div>
        </div>
        
        {/* 音频元数据 */}
        {(notebook.duration || notebook.speakerCount) && (
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            {notebook.duration && (
              <div className="flex items-center space-x-1 text-xs text-neutral-500">
                <Headphones className="w-3 h-3" />
                <span>{formatDuration(notebook.duration)}</span>
              </div>
            )}
            
            {notebook.speakerCount && (
              <div className="flex items-center space-x-1 text-xs text-neutral-500">
                <User className="w-3 h-3" />
                <span>{notebook.speakerCount}人</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 进度指示器（如果需要的话） */}
      {notebook.status === 'processing' && (
        <div className="mt-3">
          <div className="w-full bg-neutral-200 rounded-full h-1.5">
            <div className="bg-gradient-brand h-1.5 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}
    </Card>
  );
};

export default NotebookCard;