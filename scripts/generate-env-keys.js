#!/usr/bin/env node

/**
 * 生成环境变量所需的密钥
 * 使用方法：node scripts/generate-env-keys.js
 */

const crypto = require('crypto');

console.log('🔐 生成环境变量密钥\n');
console.log('=' .repeat(60));

// 生成JWT密钥
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('\n# JWT密钥（用于签名令牌）');
console.log(`JWT_SECRET=${jwtSecret}`);

// 生成API密钥
const apiKey1 = `lbk_${crypto.randomBytes(16).toString('hex')}`;
const apiKey2 = `lbk_${crypto.randomBytes(16).toString('hex')}`;
console.log('\n# API访问密钥（可以生成多个）');
console.log(`VALID_API_KEYS=${apiKey1},${apiKey2}`);

// 生成管理员密钥
const adminKey = `admin_${crypto.randomBytes(16).toString('hex')}`;
console.log('\n# 管理员密钥');
console.log(`ADMIN_API_KEY=${adminKey}`);

console.log('\n' + '=' .repeat(60));
console.log('\n📋 使用说明：');
console.log('1. 将上面生成的密钥复制到 .env.local 文件');
console.log('2. 从阿里云获取 DASHSCOPE_API_KEY');
console.log('3. 从Supabase获取数据库相关密钥');
console.log('4. 设置 NEXT_PUBLIC_APP_URL 为你的域名');

console.log('\n⚠️  安全提醒：');
console.log('- 不要将这些密钥提交到Git仓库');
console.log('- 在Vercel中使用环境变量功能配置生产密钥');
console.log('- 定期轮换密钥以保证安全');

console.log('\n✅ 密钥生成完成！');