'use client';

import { useState } from 'react';

export default function TestApiPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testUploadApi = async () => {
    setLoading(true);
    try {
      // 创建一个模拟文件进行测试
      const testFile = new File(['test content'], 'test.mp3', { type: 'audio/mpeg' });
      const formData = new FormData();
      formData.append('file', testFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testTranscribeApi = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: 'https://gw.alipayobjects.com/os/bmw-prod/0574ee2e-f494-45a5-820f-63aee583045a.wav',
          fileName: 'test.wav',
          fileSize: 1024000,
          speakerCount: 2,
          languageHints: ['zh', 'en']
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          API 测试页面
        </h1>

        <div className="space-y-6">
          {/* 测试按钮 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              API 测试
            </h2>
            <div className="space-x-4">
              <button
                onClick={testUploadApi}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                测试文件上传 API
              </button>
              <button
                onClick={testTranscribeApi}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                测试转写 API
              </button>
            </div>
            {loading && (
              <div className="mt-4 text-blue-600 dark:text-blue-400">
                请求中...
              </div>
            )}
          </div>

          {/* 结果显示 */}
          {result && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                API 响应结果
              </h2>
              <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {/* 说明 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              测试说明
            </h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-300">
              <p><strong>文件上传 API:</strong> 测试 /api/upload 接口，验证文件验证和处理逻辑</p>
              <p><strong>转写 API:</strong> 测试 /api/transcribe 接口，提交转写任务（需要阿里云 API Key）</p>
              <p className="text-yellow-600 dark:text-yellow-400">
                注意：转写 API 需要配置 DASHSCOPE_API_KEY 环境变量才能正常工作
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}