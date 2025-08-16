'use client';

import { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            登录到 Livebook
          </h2>
          <p className="text-sm text-gray-600">
            登录后可以跨设备同步您的笔记本
          </p>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8',
                },
              },
            },
            className: {
              container: 'auth-container',
              button: 'auth-button',
              input: 'auth-input',
            },
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: '邮箱地址',
                password_label: '密码',
                email_input_placeholder: '输入您的邮箱',
                password_input_placeholder: '输入您的密码',
                button_label: '登录',
                loading_button_label: '登录中...',
                social_provider_text: '使用 {{provider}} 登录',
                link_text: '已有账号？点击登录',
              },
              sign_up: {
                email_label: '邮箱地址',
                password_label: '密码',
                email_input_placeholder: '输入您的邮箱',
                password_input_placeholder: '创建密码',
                button_label: '注册',
                loading_button_label: '注册中...',
                social_provider_text: '使用 {{provider}} 注册',
                link_text: '没有账号？点击注册',
                confirmation_text: '请检查您的邮箱以确认账号',
              },
              forgotten_password: {
                email_label: '邮箱地址',
                password_label: '密码',
                email_input_placeholder: '输入您的邮箱',
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
    </div>
  );
}