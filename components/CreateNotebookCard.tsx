'use client';

import React from 'react';
import { Plus, Sparkles, Upload, Mic } from 'lucide-react';
import { Card } from '@/components/ui';

interface CreateNotebookCardProps {
  onClick: () => void;
}

const CreateNotebookCard: React.FC<CreateNotebookCardProps> = ({ onClick }) => {
  return (
    <Card 
      variant="bordered"
      hover
      className="group cursor-pointer border-2 border-dashed border-brand-300 hover:border-brand-400 hover:bg-brand-50/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-warm"
      onClick={onClick}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-warm opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl" />
      
      {/* 内容居中布局 */}
      <div className="relative flex flex-col items-center justify-center min-h-[240px] text-center">
        
        {/* 图标区域 */}
        <div className="relative mb-6">
          {/* 主图标 */}
          <div className="w-16 h-16 bg-gradient-brand rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-warm">
            <Plus className="w-8 h-8 text-white" />
          </div>
          
          {/* 装饰性小图标 */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-soft flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
            <Sparkles className="w-3 h-3 text-brand-500" />
          </div>
          
          {/* 浮动图标 */}
          <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-brand-100 rounded-full flex items-center justify-center group-hover:bounce transition-all duration-300">
            <Mic className="w-2.5 h-2.5 text-brand-600" />
          </div>
        </div>
        
        {/* 文字内容 */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-neutral-900 group-hover:text-brand-700 transition-colors">
            创建新笔记本
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed max-w-48">
            上传音频文件或链接，让 AI 为您创建智能笔记
          </p>
        </div>
        
        {/* 功能提示 */}
        <div className="mt-6 flex items-center space-x-4 text-xs text-neutral-500">
          <div className="flex items-center space-x-1">
            <Upload className="w-3 h-3" />
            <span>文件上传</span>
          </div>
          <div className="w-1 h-1 bg-neutral-300 rounded-full" />
          <div className="flex items-center space-x-1">
            <Mic className="w-3 h-3" />
            <span>链接转录</span>
          </div>
        </div>
        
        {/* 添加微妙的点击提示 */}
        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="inline-flex items-center space-x-1 px-3 py-1 bg-brand-100 rounded-full text-xs text-brand-700">
            <span>点击开始</span>
            <Sparkles className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CreateNotebookCard;