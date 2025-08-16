'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  // 开发用：清理所有数据
  const clearAllData = () => {
    if (confirm('确定要清除所有数据吗？这将删除所有任务和笔记本。')) {
      localStorage.removeItem('processingTasks');
      localStorage.removeItem('notebooks');
      // 刷新页面以重新加载
      window.location.reload();
    }
  };

  return (
    <ProtectedRoute requireAuth={true} redirectTo="/">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 顶部导航栏 */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* 左侧品牌标识 */}
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Livebook
                  </h1>
                </div>
                <div className="hidden md:block ml-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    AI 智能笔记本平台
                  </span>
                </div>
              </div>

              {/* 右侧用户信息和操作 */}
              <div className="flex items-center space-x-4">
                {user && (
                  <>
                    {/* 用户信息 */}
                    <div className="hidden sm:flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                            {user.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.user_metadata?.full_name || '用户'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 移动端用户图标 */}
                    <div className="sm:hidden">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                          {user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* 设置按钮 */}
                    <button 
                      onClick={clearAllData}
                      className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
                      title="清除所有数据"
                    >
                      <Settings className="w-5 h-5" />
                    </button>

                    {/* 退出登录按钮 */}
                    <button
                      onClick={handleSignOut}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span className="hidden sm:inline">退出</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* 主要内容区域 */}
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="min-h-[calc(100vh-8rem)]">
            {children}
          </div>
        </main>

        {/* 页脚 */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                © 2024 Livebook. 专业的AI驱动笔记本平台
              </p>
              <div className="flex items-center space-x-4">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  版本 1.0.0
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}