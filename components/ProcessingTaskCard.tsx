'use client';

import React from 'react';
import { FileAudio, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, Badge, LoadingDots } from '@/components/ui';

interface ProcessingTask {
  id: string;
  taskId: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime: string;
}

interface ProcessingTaskCardProps {
  task: ProcessingTask;
}

const ProcessingTaskCard: React.FC<ProcessingTaskCardProps> = ({ task }) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'processing': return 'warning';
      case 'pending': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing': return '处理中';
      case 'pending': return '等待处理';
      case 'completed': return '已完成';
      case 'failed': return '处理失败';
      default: return '未知状态';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': 
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'pending': 
        return <Clock className="w-4 h-4" />;
      case 'completed': 
        return <CheckCircle className="w-4 h-4" />;
      case 'failed': 
        return <AlertCircle className="w-4 h-4" />;
      default: 
        return <Clock className="w-4 h-4" />;
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'pending': return 10;
      case 'processing': return 60;
      case 'completed': return 100;
      case 'failed': return 0;
      default: return 0;
    }
  };

  const generateSmartTitle = (fileName: string) => {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    if (nameWithoutExt.includes('强化学习') || nameWithoutExt.includes('机器学习') || nameWithoutExt.includes('深度学习')) {
      return '机器学习技术讨论';
    }
    if (nameWithoutExt.includes('清华大学') || nameWithoutExt.includes('大学') || nameWithoutExt.includes('课程')) {
      return '学术课程讲座';
    }
    if (nameWithoutExt.includes('产品') || nameWithoutExt.includes('设计') || nameWithoutExt.includes('用户')) {
      return '产品设计会议';
    }
    if (nameWithoutExt.includes('技术') || nameWithoutExt.includes('开发') || nameWithoutExt.includes('编程')) {
      return '技术开发讨论';
    }
    if (nameWithoutExt.includes('会议') || nameWithoutExt.includes('讨论') || nameWithoutExt.includes('交流')) {
      return '工作会议记录';
    }
    
    if (nameWithoutExt.length > 15) {
      return nameWithoutExt.substring(0, 15) + '...';
    }
    
    return nameWithoutExt || '音频内容摘要';
  };

  const getCardVariant = (status: string) => {
    switch (status) {
      case 'failed': return 'bordered';
      default: return 'warm';
    }
  };

  return (
    <Card 
      variant={getCardVariant(task.status)}
      className={`relative overflow-hidden ${
        task.status === 'processing' ? 'animate-pulse-slow' : ''
      }`}
    >
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-brand opacity-10 rounded-full -translate-y-8 translate-x-8" />
      
      {/* 卡片头部 */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          task.status === 'failed' 
            ? 'bg-error-100' 
            : task.status === 'completed'
            ? 'bg-success-100'
            : 'bg-warning-100'
        }`}>
          <FileAudio className={`w-6 h-6 ${
            task.status === 'failed'
              ? 'text-error-600'
              : task.status === 'completed'
              ? 'text-success-600'
              : 'text-warning-600'
          }`} />
        </div>
        
        <Badge 
          variant={getStatusVariant(task.status)} 
          size="sm"
        >
          <span className="flex items-center space-x-1">
            {getStatusIcon(task.status)}
            <span>{getStatusText(task.status)}</span>
          </span>
        </Badge>
      </div>

      {/* 任务信息 */}
      <div className="flex-1 mb-4">
        <h3 className="text-lg font-bold text-neutral-900 mb-2">
          {task.status === 'processing' || task.status === 'pending' 
            ? '正在创建笔记...' 
            : generateSmartTitle(task.fileName)}
        </h3>
        <p className="text-sm text-neutral-600">
          {task.status === 'processing' && '正在使用 AI 技术处理您的音频文件'}
          {task.status === 'pending' && '已加入处理队列，请稍候'}
          {task.status === 'completed' && '处理完成，即将跳转到详情页面'}
          {task.status === 'failed' && '处理过程中遇到问题，请重试或联系支持'}
        </p>
      </div>

      {/* 进度和时间 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>开始时间: {new Date(task.startTime).toLocaleTimeString('zh-CN')}</span>
          <span>{getProgressPercentage(task.status)}%</span>
        </div>
        
        {/* 进度条 */}
        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ease-out ${
              task.status === 'failed'
                ? 'bg-error-500'
                : task.status === 'completed'
                ? 'bg-success-500'
                : 'bg-gradient-brand'
            } ${
              task.status === 'processing' ? 'animate-pulse' : ''
            }`}
            style={{ width: `${getProgressPercentage(task.status)}%` }}
          />
        </div>
        
        {/* 加载动画（仅在处理中显示） */}
        {task.status === 'processing' && (
          <div className="flex justify-center pt-2">
            <LoadingDots variant="brand" size="sm" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProcessingTaskCard;