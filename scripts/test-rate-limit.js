#!/usr/bin/env node

/**
 * 速率限制测试脚本
 * 用于测试API速率限制功能
 */

const API_BASE_URL = 'http://localhost:3000';

// 测试用的API密钥（需要在环境变量中配置）
const TEST_API_KEY = 'test-api-key-12345';

/**
 * 发送HTTP请求
 */
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': TEST_API_KEY,
      ...options.headers
    },
    ...options
  });

  const data = await response.json();
  
  return {
    status: response.status,
    headers: {
      'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
      'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
      'x-ratelimit-reset': response.headers.get('x-ratelimit-reset'),
      'retry-after': response.headers.get('retry-after')
    },
    data
  };
}

/**
 * 测试速率限制
 */
async function testRateLimit(endpoint, maxRequests = 10) {
  console.log(`\n🧪 测试端点: ${endpoint}`);
  console.log(`📊 发送 ${maxRequests} 个请求...`);

  const results = [];
  
  for (let i = 1; i <= maxRequests; i++) {
    try {
      const result = await makeRequest(endpoint);
      
      console.log(
        `请求 ${i.toString().padStart(2)}: ` +
        `状态=${result.status} ` +
        `剩余=${result.headers['x-ratelimit-remaining'] || 'N/A'} ` +
        `限制=${result.headers['x-ratelimit-limit'] || 'N/A'}`
      );

      results.push({
        request: i,
        status: result.status,
        success: result.status < 400,
        remaining: parseInt(result.headers['x-ratelimit-remaining']) || 0,
        retryAfter: result.headers['retry-after']
      });

      // 如果被限制，停止测试
      if (result.status === 429) {
        console.log(`⚠️  在第 ${i} 个请求时触发速率限制`);
        console.log(`⏰ 重试等待时间: ${result.headers['retry-after']} 秒`);
        break;
      }

    } catch (error) {
      console.error(`❌ 请求 ${i} 失败:`, error.message);
      break;
    }

    // 短暂延迟避免网络拥塞
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🚀 开始速率限制测试\n');

  try {
    // 测试1: 速率限制测试API（应该有默认限制）
    await testRateLimit('/api/rate-limit-test', 15);

    // 等待一段时间再测试
    console.log('\n⏳ 等待 3 秒后继续...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 测试2: 转写API（严格限制）
    await testRateLimit('/api/transcribe', 8);

    // 测试3: AI API（中等限制）
    await testRateLimit('/api/ai/chat', 12);

    console.log('\n✅ 速率限制测试完成');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testRateLimit, makeRequest };