#!/usr/bin/env node

/**
 * 环境变量验证测试脚本
 * 测试不同环境下的验证逻辑
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 环境变量验证测试\n');

// 保存原始环境文件
const envLocalPath = path.join(__dirname, '../.env.local');
const envBackupPath = path.join(__dirname, '../.env.local.backup');

let originalEnvExists = false;
if (fs.existsSync(envLocalPath)) {
  originalEnvExists = true;
  fs.copyFileSync(envLocalPath, envBackupPath);
  console.log('📁 已备份原始 .env.local 文件');
}

// 测试场景
const testScenarios = [
  {
    name: '开发环境 - 最小配置',
    env: {
      NODE_ENV: 'development',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
    },
    expectSuccess: true
  },
  {
    name: '开发环境 - 完整配置',
    env: {
      NODE_ENV: 'development',
      DASHSCOPE_API_KEY: 'test-key',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      JWT_SECRET: 'test-jwt-secret-32-characters-minimum',
      VALID_API_KEYS: 'lbk_test123',
      ADMIN_API_KEY: 'admin_test123',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      SKIP_API_AUTH: 'false'
    },
    expectSuccess: true
  },
  {
    name: '生产环境 - 缺少必需配置',
    env: {
      NODE_ENV: 'production',
      DASHSCOPE_API_KEY: 'test-key',
      NEXT_PUBLIC_APP_URL: 'https://example.com'
    },
    expectSuccess: false
  },
  {
    name: '生产环境 - 完整配置',
    env: {
      NODE_ENV: 'production',
      DASHSCOPE_API_KEY: 'test-key',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      JWT_SECRET: 'test-jwt-secret-32-characters-minimum',
      VALID_API_KEYS: 'lbk_test123',
      ADMIN_API_KEY: 'admin_test123',
      NEXT_PUBLIC_APP_URL: 'https://example.com'
    },
    expectSuccess: true
  },
  {
    name: '测试环境 - 默认配置',
    env: {
      NODE_ENV: 'test'
    },
    expectSuccess: true
  }
];

function createEnvFile(envVars) {
  const content = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(envLocalPath, content);
}

function runTest(scenario) {
  console.log(`\n🔍 测试: ${scenario.name}`);
  
  try {
    // 创建测试环境文件
    createEnvFile(scenario.env);
    
    // 运行验证测试（创建临时测试文件）
    const testScriptPath = path.join(__dirname, 'temp-test.js');
    const testScript = `
      const { validateEnv } = require('../lib/env-validation');
      try {
        const env = validateEnv();
        console.log('VALIDATION_SUCCESS');
      } catch (error) {
        console.log('VALIDATION_FAILED');
        console.error(error.message);
      }
    `;
    
    fs.writeFileSync(testScriptPath, testScript);
    
    const result = execSync(`node ${testScriptPath}`, { 
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // 清理临时文件
    fs.unlinkSync(testScriptPath);
    
    const success = result.includes('VALIDATION_SUCCESS');
    
    if (success === scenario.expectSuccess) {
      console.log(`✅ 测试通过 - ${success ? '验证成功' : '验证失败（符合预期）'}`);
      return true;
    } else {
      console.log(`❌ 测试失败 - 期望${scenario.expectSuccess ? '成功' : '失败'}，实际${success ? '成功' : '失败'}`);
      if (!success) {
        console.log(`   错误信息: ${result.replace('VALIDATION_FAILED', '').trim()}`);
      }
      return false;
    }
    
  } catch (error) {
    const failed = !scenario.expectSuccess;
    if (failed) {
      console.log(`✅ 测试通过 - 验证失败（符合预期）`);
      console.log(`   错误信息: ${error.message.split('\n')[0]}`);
      return true;
    } else {
      console.log(`❌ 测试失败 - 期望成功，但验证失败`);
      console.log(`   错误信息: ${error.message.split('\n')[0]}`);
      return false;
    }
  }
}

// 运行所有测试
let passedTests = 0;
let totalTests = testScenarios.length;

for (const scenario of testScenarios) {
  if (runTest(scenario)) {
    passedTests++;
  }
}

// 恢复原始环境文件
if (originalEnvExists) {
  fs.copyFileSync(envBackupPath, envLocalPath);
  fs.unlinkSync(envBackupPath);
  console.log('\n📁 已恢复原始 .env.local 文件');
} else {
  if (fs.existsSync(envLocalPath)) {
    fs.unlinkSync(envLocalPath);
  }
  console.log('\n📁 已清理测试环境文件');
}

// 输出测试结果
console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`);

if (passedTests === totalTests) {
  console.log('🎉 所有测试通过！环境变量验证系统工作正常');
  process.exit(0);
} else {
  console.log('❌ 部分测试失败，请检查环境变量验证逻辑');
  process.exit(1);
}