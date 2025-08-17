'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, File, Link, AlertCircle, Shield, CheckCircle } from 'lucide-react';
import { cn, formatFileSize, validateFileType, validateFileSize, validateFileSecurity, isYouTubeUrl, isBilibiliUrl } from '@/lib/utils';

interface FileUploaderProps {
  onFileUpload: (file: File, taskId?: string) => void;
  onUrlUpload: (url: string, taskId?: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function FileUploader({ 
  onFileUpload, 
  onUrlUpload, 
  disabled = false, 
  className 
}: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(async (file: File): Promise<{
    isValid: boolean;
    error?: string;
    warnings?: string[];
  }> => {
    try {
      setIsValidating(true);
      const result = await validateFileSecurity(file, 50);
      return {
        isValid: result.isValid,
        error: result.error,
        warnings: result.warnings
      };
    } catch (error) {
      return {
        isValid: false,
        error: '文件验证失败，请重试'
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateUrl = useCallback((url: string): string | null => {
    if (!url.trim()) {
      return '请输入有效的URL';
    }
    
    // 检查是否为有效的 URL 格式
    try {
      new URL(url);
    } catch {
      return '请输入有效的URL格式';
    }
    
    // 检查是否为支持的类型
    const isVideoUrl = isYouTubeUrl(url) || isBilibiliUrl(url);
    const isDirectAudioUrl = /\.(mp3|wav|m4a|aac|flac|ogg)(\?.*)?$/i.test(url);
    const isCloudStorageUrl = /\.(com|cn)\/(.*\/)*(.*\.)(mp3|wav|m4a|aac|flac|ogg)(\?.*)?/i.test(url);
    
    if (!isVideoUrl && !isDirectAudioUrl && !isCloudStorageUrl) {
      return '支持 YouTube/B站视频链接或直接音频文件链接（mp3, wav, m4a等）';
    }
    
    return null;
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      setError(null);
      setWarnings([]);
      
      const validation = await validateFile(file);
      if (!validation.isValid) {
        setError(validation.error || '文件验证失败');
        return;
      }
      
      setSelectedFile(file);
      if (validation.warnings) {
        setWarnings(validation.warnings);
      }
    }
  }, [disabled, validateFile]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setError(null);
      setWarnings([]);
      
      const validation = await validateFile(file);
      if (!validation.isValid) {
        setError(validation.error || '文件验证失败');
        return;
      }
      
      setSelectedFile(file);
      if (validation.warnings) {
        setWarnings(validation.warnings);
      }
    }
  }, [validateFile]);

  const handleUrlSubmit = useCallback(async () => {
    const validationError = validateUrl(urlInput);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      // 直接提交转写任务（URL 链接）
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: urlInput,
          fileName: urlInput.split('/').pop() || 'audio-file',
          speakerCount: 2,
          languageHints: ['zh', 'en']
        }),
      });
      
      const transcribeResult = await transcribeResponse.json();
      
      if (!transcribeResult.success) {
        throw new Error(transcribeResult.error || '转写任务提交失败');
      }
      
      console.log('URL转写任务提交成功:', transcribeResult.data);
      
      // 传递taskId给回调函数
      const taskId = transcribeResult.data.dashScopeTaskId;
      await onUrlUpload(urlInput, taskId);
      setUrlInput('');
    } catch (error: any) {
      console.error('URL处理失败:', error);
      setError(error.message || 'URL处理失败，请检查链接是否有效');
    } finally {
      setIsUploading(false);
    }
  }, [urlInput, validateUrl, onUrlUpload]);

  const handleFileSubmit = useCallback(async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      // 1. 上传文件到服务器
      setUploadProgress(10);
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const uploadResult = await uploadResponse.json();
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || '文件上传失败');
      }
      
      setUploadProgress(50);
      
      // 2. 提交转写任务
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: uploadResult.data.fileUrl,
          fileName: uploadResult.data.fileName,
          fileSize: uploadResult.data.fileSize,
          speakerCount: 2, // 默认2个说话人
          languageHints: ['zh', 'en']
        }),
      });
      
      const transcribeResult = await transcribeResponse.json();
      
      if (!transcribeResult.success) {
        throw new Error(transcribeResult.error || '转写任务提交失败');
      }
      
      setUploadProgress(100);
      
      console.log('转写任务提交成功:', transcribeResult.data);
      
      // 传递taskId给回调函数
      const taskId = transcribeResult.data.dashScopeTaskId;
      await onFileUpload(selectedFile, taskId);
      
      // 重置状态
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('文件处理失败:', error);
      setError(error.message || '文件处理失败，请重试');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFile, onFileUpload]);

  const clearSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setWarnings([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* 上传模式切换 */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setUploadMode('file')}
          className={cn(
            'flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors',
            uploadMode === 'file'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
          disabled={disabled}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          文件上传
        </button>
        <button
          onClick={() => setUploadMode('url')}
          className={cn(
            'flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors',
            uploadMode === 'url'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
          disabled={disabled}
        >
          <Link className="w-4 h-4 inline mr-2" />
          链接导入
        </button>
      </div>

      {/* 文件上传模式 */}
      {uploadMode === 'file' && (
        <div className="space-y-4">
          {!selectedFile && (
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                isDragOver
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !disabled && fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                拖拽文件到此处或点击上传
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                支持 MP3, WAV, M4A, MP4, MOV 格式，最大50MB
              </p>
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                <Shield className="w-4 h-4" />
                <span>文件安全验证已启用</span>
              </div>
            </div>
          )}
          
          {selectedFile && (
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <File className="w-8 h-8 text-primary-500" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedFile.name}
                      </p>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(selectedFile.size)} • 安全验证通过
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearSelectedFile}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={isUploading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* 警告信息 */}
              {warnings.length > 0 && (
                <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">注意事项：</p>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                        {warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 验证状态 */}
              {isValidating && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-blue-600 animate-pulse" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">正在进行安全验证...</p>
                  </div>
                </div>
              )}
              
              {isUploading && (
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>上传中...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              
              <button
                onClick={handleFileSubmit}
                disabled={isUploading}
                className={cn(
                  'w-full py-2 px-4 rounded-md font-medium transition-colors',
                  'bg-primary-500 hover:bg-primary-600 text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isUploading ? '上传中...' : '生成笔记'}
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.m4a,.mp4,.mov,audio/mpeg,audio/wav,audio/mp4,video/mp4,video/quicktime"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
        </div>
      )}

      {/* URL导入模式 */}
      {uploadMode === 'url' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              视频链接
            </label>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="粘贴 YouTube/B站 视频链接或直接音频文件链接"
              className={cn(
                'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              disabled={disabled || isUploading}
            />
          </div>
          
          <button
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim() || isUploading}
            className={cn(
              'w-full py-2 px-4 rounded-md font-medium transition-colors',
              'bg-primary-500 hover:bg-primary-600 text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isUploading ? '处理中...' : '生成笔记'}
          </button>
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            支持 YouTube/B站视频链接或直接音频文件链接（如阿里云OSS、AWS S3等）
          </p>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}