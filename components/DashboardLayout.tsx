'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileAudio, Settings, User, LogOut, Plus, Search, Bell, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Badge } from '@/components/ui';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const getUserName = () => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return '用户';
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* 顶部导航栏 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-brand-200/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 左侧品牌区域 */}
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
                <FileAudio className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-neutral-900">Livebook</h1>
                <p className="text-xs text-neutral-600">智能音频助手</p>
              </div>
            </div>

            {/* 中间搜索区域 */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="搜索你的音频笔记..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* 右侧用户区域 */}
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" icon={<Bell />} />
              <Button variant="ghost" size="sm" icon={<Calendar />} />
              
              {/* 用户菜单 */}
              <div className="flex items-center space-x-3 pl-3 border-l border-neutral-200">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-neutral-900">
                    {getGreeting()}，{getUserName()}
                  </p>
                  <p className="text-xs text-neutral-600">{user?.email}</p>
                </div>
                
                <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center text-white font-semibold">
                  {getUserName().charAt(0).toUpperCase()}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  icon={<LogOut />}
                  className="text-neutral-500 hover:text-neutral-700"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900">
                {getGreeting()}，{getUserName()}！
              </h2>
              <p className="text-lg text-neutral-600 mt-1">
                准备处理一些音频内容吗？
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="warm" dot>
                {new Date().toLocaleDateString('zh-CN', { 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'short'
                })}
              </Badge>
            </div>
          </div>
        </div>

        {/* 子组件内容 */}
        {children}
      </main>

      {/* 页脚 */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-brand-200/30 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-neutral-600">
              Livebook - 让音频内容更有价值 · 由 AI 驱动
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}