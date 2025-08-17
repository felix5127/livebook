#!/usr/bin/env node

const crypto = require('crypto');

/**
 * 生成安全密钥的工具脚本
 * 使用方法: node scripts/generate-keys.js
 */

console.log('🔐 Livebook MVP - 认证密钥生成工具');
console.log('================================\n');

// 生成JWT密钥
function generateJWTSecret() {
  return crypto.randomBytes(32).toString('hex');
}

// 生成API密钥
function generateAPIKey(prefix = 'lbk') {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(timestamp + random).digest('hex');
  return `${prefix}_${hash.substring(0, 32)}`;
}

// 生成管理员密钥
function generateAdminKey() {
  const random = crypto.randomBytes(24).toString('hex');
  return `admin_${random}`;
}

// 生成所有密钥
const jwtSecret = generateJWTSecret();
const apiKey1 = generateAPIKey('lbk');
const apiKey2 = generateAPIKey('lbk');
const adminKey = generateAdminKey();

console.log('📝 生成的密钥如下（请复制到.env.local文件）:');
console.log('-------------------------------------------\n');

console.log('# JWT密钥（用于Token签名和验证）');
console.log(`JWT_SECRET=${jwtSecret}\n`);

console.log('# API密钥（用于API访问认证，可配置多个）');
console.log(`VALID_API_KEYS=${apiKey1},${apiKey2}\n`);

console.log('# 管理员密钥（用于生成Token和管理API密钥）');
console.log(`ADMIN_API_KEY=${adminKey}\n`);

console.log('# 开发环境设置（可选）');
console.log('SKIP_API_AUTH=false\n');

console.log('⚠️  安全提醒:');
console.log('- 请将这些密钥保存到.env.local文件中');
console.log('- 生产环境必须使用强密钥');
console.log('- 不要将密钥提交到代码仓库');
console.log('- 定期轮换API密钥');
console.log('- 管理员密钥具有最高权限，请妥善保管\n');

// 生成示例认证请求
console.log('📋 认证使用示例:');
console.log('-------------------------------------------');
console.log('1. 使用API密钥认证:');
console.log(`   curl -H "X-API-Key: ${apiKey1}" \\`);
console.log('        http://localhost:3000/api/transcribe\n');

console.log('2. 生成JWT Token:');
console.log(`   curl -X POST http://localhost:3000/api/auth/token \\`);
console.log(`        -H "Content-Type: application/json" \\`);
console.log(`        -d '{"apiKey": "${adminKey}"}'\n`);

console.log('3. 使用JWT Token认证:');
console.log('   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \\');
console.log('        http://localhost:3000/api/ai/chat\n');

console.log('✅ 密钥生成完成！');