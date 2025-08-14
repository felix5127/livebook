'use client';

import React, { useState } from 'react';
import { Download, Copy, FileText, Video, Code, Check, AlertCircle } from 'lucide-react';
import { cn, convertToSRT } from '@/lib/utils';
import { TranscriptionResult, ExportFormat } from '@/types';

interface ExportOptionsProps {
  result: TranscriptionResult;
  className?: string;
}

interface ExportOption {
  id: ExportFormat;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  extension: string;
}

const exportOptions: ExportOption[] = [
  {
    id: 'txt',
    name: '纯文本',
    description: '导出纯文本格式，适合阅读和编辑',
    icon: FileText,
    extension: 'txt',
  },
  {
    id: 'srt',
    name: '字幕文件',
    description: '导出SRT字幕格式，适合视频制作',
    icon: Video,
    extension: 'srt',
  },
  {
    id: 'json',
    name: 'JSON数据',
    description: '导出结构化JSON数据，适合开发使用',
    icon: Code,
    extension: 'json',
  },
];

export default function ExportOptions({ result, className }: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<ExportFormat | null>(null);

  // 生成不同格式的内容
  const generateContent = (format: ExportFormat): string => {
    switch (format) {
      case 'txt':
        return result.segments
          .map(segment => {
            const timeStamp = `[${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}]`;
            return `${segment.speaker.name}: ${segment.text}\n${timeStamp}\n`;
          })
          .join('\n');

      case 'srt':
        return convertToSRT(result.segments);

      case 'json':
        return JSON.stringify({
          taskId: result.taskId,
          duration: result.duration,
          speakers: result.speakers,
          segments: result.segments.map(segment => ({
            id: segment.id,
            startTime: segment.startTime,
            endTime: segment.endTime,
            text: segment.text,
            speaker: segment.speaker,
            confidence: segment.confidence,
          })),
          exportTime: new Date().toISOString(),
        }, null, 2);

      default:
        return '';
    }
  };

  // 格式化时间（用于TXT格式）
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 下载文件
  const downloadFile = async (format: ExportFormat) => {
    setIsExporting(format);
    
    try {
      const content = generateContent(format);
      const option = exportOptions.find(opt => opt.id === format)!;
      
      const blob = new Blob([content], { 
        type: format === 'json' ? 'application/json' : 'text/plain' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript_${result.taskId}.${option.extension}`;
      document.body.appendChild(a);
      a.click();
      
      // 清理
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportSuccess(format);
      setTimeout(() => setExportSuccess(null), 2000);
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setIsExporting(null);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = async (format: ExportFormat) => {
    try {
      const content = generateContent(format);
      await navigator.clipboard.writeText(content);
      setCopiedText(format);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 获取文件大小估计
  const getEstimatedSize = (format: ExportFormat): string => {
    const content = generateContent(format);
    const bytes = new Blob([content]).size;
    
    if (bytes < 1024) {
      return `${bytes}B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)}KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Download className="w-5 h-5 mr-2" />
          导出转写结果
        </h2>
        
        {/* 统计信息 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {result.segments.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">片段总数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {result.speakers.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">说话人数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {formatTime(result.duration)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">总时长</div>
          </div>
        </div>

        {/* 导出选项 */}
        <div className="space-y-4">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            const isCurrentlyExporting = isExporting === option.id;
            const wasCopied = copiedText === option.id;
            const wasExported = exportSuccess === option.id;
            const estimatedSize = getEstimatedSize(option.id);

            return (
              <div
                key={option.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {option.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {option.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        预计大小：{estimatedSize}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {/* 复制按钮 */}
                    <button
                      onClick={() => copyToClipboard(option.id)}
                      disabled={isCurrentlyExporting}
                      className={cn(
                        'p-2 rounded-md transition-colors',
                        wasCopied
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-400',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                      title="复制到剪贴板"
                    >
                      {wasCopied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {/* 下载按钮 */}
                    <button
                      onClick={() => downloadFile(option.id)}
                      disabled={isCurrentlyExporting}
                      className={cn(
                        'px-4 py-2 rounded-md font-medium transition-colors',
                        wasExported
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-600 dark:hover:bg-primary-700',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      {isCurrentlyExporting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>导出中...</span>
                        </div>
                      ) : wasExported ? (
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4" />
                          <span>已导出</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Download className="w-4 h-4" />
                          <span>下载</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 使用说明 */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">导出格式说明：</p>
              <ul className="space-y-1 text-xs">
                <li><strong>纯文本：</strong>包含说话人信息和时间戳，适合阅读和编辑</li>
                <li><strong>字幕文件：</strong>标准SRT格式，可直接用于视频编辑软件</li>
                <li><strong>JSON数据：</strong>完整的结构化数据，包含所有元信息，适合程序处理</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}