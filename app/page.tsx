'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Settings, FileAudio, Clock, User, PlayCircle, Trash2 } from 'lucide-react';
import FileUploader from '@/components/FileUploader';

interface Notebook {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  duration?: number;
  speakerCount?: number;
  status: 'completed' | 'processing' | 'failed';
}

interface ProcessingTask {
  id: string;
  taskId: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime: string;
}

export default function HomePage() {
  const router = useRouter();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [processingTasks, setProcessingTasks] = useState<ProcessingTask[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 从localStorage加载数据
  useEffect(() => {
    const loadSavedData = () => {
      try {
        // 加载处理中的任务
        const savedTasks = localStorage.getItem('processingTasks');
        if (savedTasks) {
          const tasks: ProcessingTask[] = JSON.parse(savedTasks);
          setProcessingTasks(tasks);
          
          // 恢复轮询正在处理的任务 - 延迟执行避免闭包问题
          setTimeout(() => {
            tasks.forEach(task => {
              if (task.status === 'processing' || task.status === 'pending') {
                pollTaskStatus(task.taskId, task.id);
              }
            });
          }, 100);
        }
        
        // 加载完成的笔记本
        const savedNotebooks = localStorage.getItem('notebooks');
        if (savedNotebooks) {
          const notebooks: Notebook[] = JSON.parse(savedNotebooks);
          setNotebooks(notebooks);
        } else {
          // 如果没有保存的数据，设置初始示例数据
          const mockNotebooks: Notebook[] = [
            {
              id: '1',
              title: 'AI Agent 技术讲座',
              description: '关于大语言模型和Agent应用的深度讨论...',
              createdAt: '2025年8月14日',
              duration: 3600,
              speakerCount: 3,
              status: 'completed'
            },
            {
              id: '2', 
              title: '强化学习研讨会',
              description: '深度强化学习在游戏和机器人中的应用...',
              createdAt: '2025年8月12日',
              duration: 2400,
              speakerCount: 2,
              status: 'completed'
            },
            {
              id: '3',
              title: '产品设计会议',
              description: 'UI/UX设计原则和用户体验优化策略...',
              createdAt: '2025年8月10日',
              duration: 1800,
              speakerCount: 4,
              status: 'completed'
            }
          ];
          setNotebooks(mockNotebooks);
          localStorage.setItem('notebooks', JSON.stringify(mockNotebooks));
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('加载本地数据失败:', error);
        setIsLoaded(true);
      }
    };
    
    loadSavedData();
  }, []);

  // 保存处理中的任务到localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('processingTasks', JSON.stringify(processingTasks));
    }
  }, [processingTasks, isLoaded]);

  // 保存笔记本到localStorage  
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('notebooks', JSON.stringify(notebooks));
    }
  }, [notebooks, isLoaded]);

  const handleFileUpload = async (file: File, taskId?: string) => {
    console.log('文件上传完成:', file.name, 'TaskId:', taskId);
    
    if (taskId) {
      // 添加处理中的任务
      const newTask: ProcessingTask = {
        id: Date.now().toString(),
        taskId: taskId,
        fileName: file.name.replace(/\.[^/.]+$/, ''),
        status: 'processing',
        startTime: new Date().toISOString()
      };
      setProcessingTasks(prev => [newTask, ...prev]);
      
      // 开始轮询任务状态
      pollTaskStatus(taskId, newTask.id);
    }
    
    setShowUploader(false);
  };

  const handleUrlUpload = async (url: string, taskId?: string) => {
    console.log('URL处理完成:', url, 'TaskId:', taskId);
    
    if (taskId) {
      // 添加处理中的任务
      const fileName = url.split('/').pop() || '音频链接';
      const newTask: ProcessingTask = {
        id: Date.now().toString(),
        taskId: taskId,
        fileName: fileName.split('?')[0], // 移除URL参数
        status: 'processing',
        startTime: new Date().toISOString()
      };
      setProcessingTasks(prev => [newTask, ...prev]);
      
      // 开始轮询任务状态
      pollTaskStatus(taskId, newTask.id);
    }
    
    setShowUploader(false);
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string, localTaskId: string) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`);
        const data = await response.json();
        
        if (data.success) {
          const status = data.data.status;
          
          // 更新任务状态
          setProcessingTasks(prev => 
            prev.map(task => 
              task.id === localTaskId 
                ? { ...task, status: status }
                : task
            )
          );
          
          // 如果完成，移至notebooks列表并停止轮询
          if (status === 'completed') {
            setProcessingTasks(prev => {
              const task = prev.find(t => t.id === localTaskId);
              if (task) {
                const newNotebook: Notebook = {
                  id: taskId,
                  title: task.fileName,
                  description: '转写已完成，点击查看详情',
                  createdAt: new Date().toLocaleDateString('zh-CN'),
                  status: 'completed'
                };
                setNotebooks(notebooks => [newNotebook, ...notebooks]);
                return prev.filter(t => t.id !== localTaskId);
              }
              return prev;
            });
            return; // 停止轮询
          }
          
          // 如果失败，更新状态并停止轮询
          if (status === 'failed') {
            return;
          }
          
          // 继续轮询
          setTimeout(checkStatus, 3000);
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error);
        setTimeout(checkStatus, 5000); // 错误时延长间隔
      }
    };
    
    checkStatus();
  };

  const handleDeleteNotebook = (e: React.MouseEvent, notebookId: string) => {
    e.stopPropagation(); // 防止触发卡片点击事件
    if (confirm('确定要删除这个笔记本吗？')) {
      setNotebooks(prev => prev.filter(notebook => notebook.id !== notebookId));
    }
  };

  // 开发用：清理所有数据
  const clearAllData = () => {
    if (confirm('确定要清除所有数据吗？这将删除所有任务和笔记本。')) {
      localStorage.removeItem('processingTasks');
      localStorage.removeItem('notebooks');
      setProcessingTasks([]);
      setNotebooks([]);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'processing': return '转写中';
      case 'failed': return '失败';
      default: return '未知';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 头部导航 */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <FileAudio className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Livebook
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={clearAllData}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
                title="清除所有数据"
              >
                <Settings className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-500">设置</span>
              <div className="flex items-center space-x-2 bg-black text-white px-3 py-1 rounded-full text-sm">
                <span>PRO</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            最近打开过的笔记本
          </h2>
          
          {/* 笔记本网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 新建笔记本卡片 */}
            <div 
              onClick={() => setShowUploader(true)}
              className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 hover:bg-gray-100 cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[200px]"
            >
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center">
                新建笔记本
              </h3>
            </div>

            {/* 处理中的任务卡片 */}
            {processingTasks.map((task) => (
              <div
                key={task.id}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 min-h-[200px] flex flex-col relative"
              >
                {/* 图标和状态 */}
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <FileAudio className="w-6 h-6 text-yellow-600 animate-pulse" />
                </div>
                
                {/* 标题和描述 */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {task.fileName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {task.status === 'processing' ? '正在转写中...' : 
                     task.status === 'pending' ? '等待处理...' : 
                     task.status === 'failed' ? '转写失败' : '处理中'}
                  </p>
                </div>
                
                {/* 底部信息 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(task.startTime).toLocaleString('zh-CN')}</span>
                    <span className={`px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-1000 animate-pulse" 
                      style={{ width: task.status === 'processing' ? '60%' : '20%' }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* 现有笔记本卡片 */}
            {notebooks.map((notebook) => (
              <div
                key={notebook.id}
                onClick={() => router.push(`/notebook/${notebook.id}`)}
                className="bg-gray-100 rounded-lg p-6 hover:bg-gray-200 cursor-pointer transition-colors min-h-[200px] flex flex-col relative group"
              >
                {/* 删除按钮 */}
                <button
                  onClick={(e) => handleDeleteNotebook(e, notebook.id)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:shadow-lg z-10"
                  title="删除笔记本"
                >
                  <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
                </button>

                {/* 图标 */}
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <FileAudio className="w-6 h-6 text-blue-600" />
                </div>
                
                {/* 标题和描述 */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 pr-8">
                    {notebook.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {notebook.description}
                  </p>
                </div>
                
                {/* 底部信息 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{notebook.createdAt}</span>
                    <span className={`px-2 py-1 rounded-full ${getStatusColor(notebook.status)}`}>
                      {getStatusText(notebook.status)}
                    </span>
                  </div>
                  
                  {notebook.duration && notebook.speakerCount && (
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(notebook.duration)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{notebook.speakerCount}人</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 上传弹窗 */}
      {showUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  创建新的音频笔记本
                </h3>
                <button
                  onClick={() => setShowUploader(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <FileUploader
                onFileUpload={handleFileUpload}
                onUrlUpload={handleUrlUpload}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}