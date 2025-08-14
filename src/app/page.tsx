'use client';

import React, { useState, useEffect } from 'react';
import { Mic, Clock, CheckCircle, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import TaskProgress from '@/components/TaskProgress';
import ThemeToggle from '@/components/ThemeToggle';
import { TranscriptionTask, TaskStatus } from '@/types';
import { generateRandomColor } from '@/lib/utils';

// 模拟数据
const generateMockTask = (id: string, fileName: string, status: TaskStatus): TranscriptionTask => ({
  id,
  fileName,
  fileSize: Math.random() * 20 * 1024 * 1024, // 随机文件大小
  fileType: ['mp3', 'wav', 'm4a', 'mp4', 'mov'][Math.floor(Math.random() * 5)] as any,
  status,
  progress: status === 'completed' ? 100 : Math.random() * 90,
  createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
  completedAt: status === 'completed' ? new Date() : undefined,
  estimatedTime: status === 'processing' ? Math.random() * 300 : undefined,
  errorMessage: status === 'failed' ? '音频格式不支持或文件损坏' : undefined,
  audioUrl: status === 'completed' ? '/mock-audio.mp3' : undefined,
  duration: status === 'completed' ? Math.random() * 3600 : undefined,
});

export default function HomePage() {
  const [tasks, setTasks] = useState<TranscriptionTask[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 初始化模拟数据
  useEffect(() => {
    const mockTasks = [
      generateMockTask('1', '会议录音_2024-01-15.mp3', 'completed'),
      generateMockTask('2', '英语听力练习.wav', 'processing'),
      generateMockTask('3', '产品演示视频.mp4', 'uploading'),
      generateMockTask('4', '客户访谈.m4a', 'failed'),
    ];
    setTasks(mockTasks);
  }, []);

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    const newTask: TranscriptionTask = {
      id: Date.now().toString(),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.name.split('.').pop()?.toLowerCase() as any,
      status: 'uploading',
      progress: 0,
      createdAt: new Date(),
    };

    setTasks(prev => [newTask, ...prev]);

    // 模拟上传和处理过程
    setTimeout(() => {
      setTasks(prev => prev.map(task => 
        task.id === newTask.id 
          ? { ...task, status: 'processing', progress: 10, estimatedTime: 180 }
          : task
      ));
    }, 2000);

    // 模拟完成
    setTimeout(() => {
      setTasks(prev => prev.map(task => 
        task.id === newTask.id 
          ? { 
              ...task, 
              status: 'completed', 
              progress: 100, 
              completedAt: new Date(),
              audioUrl: '/mock-audio.mp3',
              duration: 3600,
              estimatedTime: undefined
            }
          : task
      ));
    }, 8000);
  };

  // 处理URL上传
  const handleUrlUpload = async (url: string) => {
    const fileName = url.includes('youtube') ? 'YouTube视频.mp4' : 'B站视频.mp4';
    const newTask: TranscriptionTask = {
      id: Date.now().toString(),
      fileName,
      fileSize: 50 * 1024 * 1024, // 假设50MB
      fileType: 'mp4',
      status: 'processing',
      progress: 0,
      createdAt: new Date(),
      estimatedTime: 300,
    };

    setTasks(prev => [newTask, ...prev]);

    // 模拟处理过程
    setTimeout(() => {
      setTasks(prev => prev.map(task => 
        task.id === newTask.id 
          ? { 
              ...task, 
              status: 'completed', 
              progress: 100, 
              completedAt: new Date(),
              audioUrl: '/mock-audio.mp3',
              duration: 1800,
              estimatedTime: undefined
            }
          : task
      ));
    }, 10000);
  };

  // 重试任务
  const handleRetry = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: 'processing', progress: 0, estimatedTime: 180, errorMessage: undefined }
        : task
    ));

    // 模拟重试成功
    setTimeout(() => {
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: 'completed', 
              progress: 100, 
              completedAt: new Date(),
              audioUrl: '/mock-audio.mp3',
              duration: 1200,
              estimatedTime: undefined
            }
          : task
      ));
    }, 6000);
  };

  // 删除任务
  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  // 刷新任务列表
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // 模拟API调用
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // 获取任务统计
  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const processing = tasks.filter(t => t.status === 'processing' || t.status === 'uploading').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    
    return { total, completed, processing, failed };
  };

  const stats = getTaskStats();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-600 rounded-lg">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Livebook MVP
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  智能音频转写平台
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="刷新任务列表"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要内容区 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 文件上传区域 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                开始新的转写任务
              </h2>
              <FileUploader
                onFileUpload={handleFileUpload}
                onUrlUpload={handleUrlUpload}
              />
            </div>

            {/* 任务列表 */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  转写任务
                </h2>
                {tasks.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    共 {tasks.length} 个任务
                  </p>
                )}
              </div>

              {tasks.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <Mic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    还没有任务
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    上传音频或视频文件开始转写
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="relative group">
                      <TaskProgress
                        task={task}
                        onRetry={() => handleRetry(task.id)}
                      />
                      
                      {/* 删除按钮 */}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
                        title="删除任务"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 统计信息 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                任务统计
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">总任务</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.total}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">已完成</span>
                  </div>
                  <span className="font-medium text-green-600">{stats.completed}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">处理中</span>
                  </div>
                  <span className="font-medium text-yellow-600">{stats.processing}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">失败</span>
                  </div>
                  <span className="font-medium text-red-600">{stats.failed}</span>
                </div>
              </div>
            </div>

            {/* 使用提示 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">
                使用提示
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <li>• 支持 MP3、WAV、M4A、MP4、MOV 格式</li>
                <li>• 文件大小限制为 30MB</li>
                <li>• 支持 YouTube 和 B站 视频链接</li>
                <li>• 转写完成后可导出多种格式</li>
                <li>• 自动识别和区分不同说话人</li>
              </ul>
            </div>

            {/* 最近完成的任务 */}
            {stats.completed > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  最近完成
                </h3>
                <div className="space-y-3">
                  {tasks
                    .filter(task => task.status === 'completed')
                    .slice(0, 3)
                    .map(task => (
                      <div key={task.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {task.fileName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {task.completedAt?.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => window.open(`/result/${task.id}`, '_blank')}
                          className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          查看
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}