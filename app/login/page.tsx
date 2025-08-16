'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { FileAudio, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 根据URL参数设置初始视图
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'sign_up') {
      setView('sign_up');
    }
  }, [searchParams]);

  // 如果已经登录，重定向到仪表板
  useEffect(() => {
    if (!loading && user) {
      console.log('[登录页] 检测到已登录用户，重定向到仪表板');
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // 监听认证状态变化
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[登录页] 认证状态变化:', event, session);
        
        if (event === 'SIGNED_UP') {
          // 注册成功，显示验证弹窗
          console.log('[登录页] 注册成功，显示验证弹窗');
          setShowSuccessModal(true);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [router]);

  // 监听页面上的确认消息
  useEffect(() => {
    const checkForConfirmationMessage = () => {
      // 查找页面上是否出现了确认消息
      const messageElement = document.querySelector('[data-supabase-auth-ui-message]') || 
                           document.querySelector('.auth-message') ||
                           document.querySelector('[role="status"]');
      
      if (messageElement && messageElement.textContent) {
        const text = messageElement.textContent.toLowerCase();
        if ((text.includes('check') && text.includes('email')) || 
            text.includes('confirm') || 
            text.includes('verification') ||
            (text.includes('检查') && text.includes('邮箱'))) {
          console.log('[登录页] 检测到邮箱确认消息，显示弹窗');
          setShowSuccessModal(true);
        }
      }
    };

    // 设置观察器监听DOM变化
    const observer = new MutationObserver(checkForConfirmationMessage);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    // 定期检查
    const interval = setInterval(checkForConfirmationMessage, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 头部 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <FileAudio className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Livebook
              </h1>
            </div>
            
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回主页</span>
            </button>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          {/* 欢迎文字 */}
          <div className="text-center mb-8">
            <FileAudio className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {view === 'sign_in' ? '欢迎回来' : '欢迎使用 Livebook'}
            </h2>
            <p className="text-gray-600">
              {view === 'sign_in' 
                ? '登录您的账号，继续使用音频笔记本' 
                : '注册后可以跨设备同步您的音频笔记本，享受更安全便捷的体验'
              }
            </p>
          </div>

          {/* 登录/注册切换标签 */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('sign_in')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                view === 'sign_in'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setView('sign_up')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                view === 'sign_up'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              注册
            </button>
          </div>

          {/* 登录表单 */}
          <div>
            <Auth
              supabaseClient={supabase}
              view={view}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#2563eb',
                      brandAccent: '#1d4ed8',
                    },
                    space: {
                      spaceSmall: '4px',
                      spaceMedium: '8px',
                      spaceLarge: '16px',
                      labelBottomMargin: '8px',
                      anchorBottomMargin: '4px',
                      emailInputSpacing: '4px',
                      socialAuthSpacing: '4px',
                      buttonPadding: '10px 15px',
                      inputPadding: '10px 15px',
                    },
                    fontSizes: {
                      baseBodySize: '13px',
                      baseInputSize: '14px',
                      baseLabelSize: '14px',
                      baseButtonSize: '14px',
                    },
                    borderWidths: {
                      buttonBorderWidth: '1px',
                      inputBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: '6px',
                      buttonBorderRadius: '6px',
                      inputBorderRadius: '6px',
                    },
                  },
                },
                className: {
                  container: 'auth-container',
                  button: 'auth-button w-full',
                  input: 'auth-input w-full',
                  label: 'auth-label',
                  anchor: 'auth-anchor',
                  divider: 'auth-divider',
                  message: 'auth-message',
                },
              }}
              localization={{
                variables: {
                  sign_in: {
                    email_label: '邮箱地址',
                    password_label: '密码',
                    email_input_placeholder: '输入您的邮箱地址',
                    password_input_placeholder: '输入您的密码',
                    button_label: '登录',
                    loading_button_label: '登录中...',
                    social_provider_text: '使用 {{provider}} 登录',
                    link_text: '已有账号？点击登录',
                  },
                  sign_up: {
                    email_label: '邮箱地址',
                    password_label: '密码',
                    email_input_placeholder: '输入您的邮箱地址',
                    password_input_placeholder: '创建密码（至少6位）',
                    button_label: '注册',
                    loading_button_label: '注册中...',
                    social_provider_text: '使用 {{provider}} 注册',
                    link_text: '没有账号？点击注册',
                    confirmation_text: '请检查您的邮箱以确认账号',
                  },
                  forgotten_password: {
                    email_label: '邮箱地址',
                    password_label: '密码',
                    email_input_placeholder: '输入您的邮箱地址',
                    button_label: '发送重置链接',
                    loading_button_label: '发送中...',
                    link_text: '忘记密码？',
                    confirmation_text: '请检查您的邮箱以重置密码',
                  },
                },
              }}
              providers={[]}
              redirectTo={typeof window !== 'undefined' ? window.location.origin : ''}
              onlyThirdPartyProviders={false}
              magicLink={false}
            />
          </div>

          {/* 邮箱验证说明 - 只在注册时显示 */}
          {view === 'sign_up' && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm">
                  <p className="text-amber-800">
                    <strong>注册说明：</strong>注册后请检查邮箱（包括垃圾邮件文件夹）点击验证链接完成账号激活。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 免登录体验 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/')}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              暂不登录，继续浏览
            </button>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>Livebook - 让音频内容更有价值</p>
          </div>
        </div>
      </footer>

      {/* 注册成功弹窗 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            {/* 成功图标 */}
            <div className="text-center mb-4">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                注册成功！
              </h3>
              <p className="text-gray-600 mb-4">
                您的账号已成功创建，为了保护您的账号安全，我们已向您的邮箱发送了一封验证邮件。
              </p>
            </div>

            {/* 详细说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm">
                  <p className="text-blue-800 font-medium mb-2">请完成以下步骤激活账号：</p>
                  <ol className="text-blue-700 space-y-1 list-decimal list-inside">
                    <li>打开您的邮箱应用或网页版邮箱</li>
                    <li>查找来自 Livebook 的验证邮件</li>
                    <li>如果没有收到，请检查垃圾邮件文件夹</li>
                    <li>点击邮件中的"确认邮箱"按钮</li>
                    <li>激活成功后返回此页面登录</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setView('sign_in');
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                我已验证，返回登录
              </button>
              
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                稍后验证
              </button>
            </div>

            {/* 帮助文字 */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                邮件可能需要1-2分钟才能送达，请耐心等待
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}