# Livebook MVP API 认证指南

## 概述

Livebook MVP 项目实现了完整的API认证保护机制，支持JWT Token和API Key两种认证方式，为敏感API接口提供安全保障。

## 受保护的API端点

以下API端点需要认证才能访问：

- `/api/transcribe` - 音频转写接口
- `/api/ai/*` - 所有AI相关接口
  - `/api/ai/chat` - AI对话
  - `/api/ai/summary` - AI总结
  - `/api/ai/translate` - AI翻译
- `/api/tasks/*` - 任务查询接口

## 认证方式

### 1. API Key 认证

使用预设的API密钥进行认证，适合服务端到服务端的调用。

**请求头格式:**
```http
X-API-Key: lbk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**示例:**
```bash
curl -X POST "http://localhost:3000/api/transcribe" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: lbk_e45748916eeca0804cf0bff25f8fcbc7" \
  -d '{"fileUrl": "audio.mp3", "fileName": "audio.mp3"}'
```

### 2. JWT Token 认证

使用JWT Token进行认证，适合用户会话管理。

**请求头格式:**
```http
Authorization: Bearer <jwt_token>
```

**示例:**
```bash
curl -X GET "http://localhost:3000/api/ai/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'
```

## 获取认证凭据

### 生成API密钥

1. 运行密钥生成脚本：
```bash
node scripts/generate-keys.js
```

2. 将生成的密钥添加到 `.env.local` 文件：
```env
VALID_API_KEYS=lbk_key1,lbk_key2,lbk_key3
```

### 获取JWT Token

#### 方式1: 使用管理员API密钥
```bash
curl -X POST "http://localhost:3000/api/auth/token" \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "admin_your_admin_key"}'
```

#### 方式2: 使用用户名密码（开发模式）
```bash
curl -X POST "http://localhost:3000/api/auth/token" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "admin123"}'
```

## 环境变量配置

### 必需配置

```env
# JWT密钥（生产环境必须设置强密钥）
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# API密钥列表（逗号分隔）
VALID_API_KEYS=lbk_key1,lbk_key2,lbk_key3

# 管理员API密钥
ADMIN_API_KEY=admin_your-admin-key-here
```

### 可选配置

```env
# 开发环境跳过认证（仅限开发调试）
SKIP_API_AUTH=false
```

## API响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    // 实际数据
  },
  "timestamp": "2025-08-16T14:36:00.000Z"
}
```

### 认证失败响应
```json
{
  "success": false,
  "error": "认证失败",
  "message": "缺少认证信息。请提供Bearer Token或API Key",
  "code": "AUTH_ERROR",
  "timestamp": "2025-08-16T14:36:00.000Z"
}
```

## 错误代码参考

| 错误代码 | 说明 |
|---------|------|
| `MISSING_TOKEN` | 缺少JWT Token |
| `INVALID_TOKEN` | JWT Token无效 |
| `EXPIRED_TOKEN` | JWT Token已过期 |
| `MISSING_API_KEY` | 缺少API密钥 |
| `INVALID_API_KEY` | API密钥无效 |
| `AUTH_SERVICE_ERROR` | 认证服务异常 |

## 开发环境设置

### 生成开发密钥
```bash
# 运行密钥生成脚本
node scripts/generate-keys.js

# 复制输出的环境变量到 .env.local
```

### 测试认证功能
```bash
# 测试无认证访问（应该被拦截）
curl http://localhost:3000/api/test-auth

# 测试API Key认证
curl -H "X-API-Key: your_api_key" http://localhost:3000/api/test-auth

# 测试JWT Token认证
curl -H "Authorization: Bearer your_jwt_token" http://localhost:3000/api/test-auth
```

### 跳过认证（仅开发调试）
如果需要在开发环境临时跳过认证，可以设置：
```env
SKIP_API_AUTH=true
```

## 生产环境部署

### 安全配置清单

1. **生成强密钥**
   - JWT_SECRET: 至少32位随机字符串
   - ADMIN_API_KEY: 高熵值管理员密钥
   - VALID_API_KEYS: 定期轮换的API密钥

2. **环境变量保护**
   - 使用环境变量管理密钥，不要硬编码
   - 不要将密钥提交到代码仓库
   - 使用安全的密钥管理服务

3. **网络安全**
   - 启用HTTPS
   - 配置CORS策略
   - 限制API访问频率

4. **监控和日志**
   - 记录认证失败尝试
   - 监控异常API调用
   - 设置告警机制

## 管理工具

### API密钥管理
```bash
# 验证API密钥
curl -X GET "http://localhost:3000/api/auth/apikey" \
  -H "X-API-Key: your_api_key"

# 生成新API密钥（需要管理员权限）
curl -X POST "http://localhost:3000/api/auth/apikey" \
  -H "Content-Type: application/json" \
  -d '{"adminKey": "admin_key", "description": "新的API密钥"}'
```

### JWT Token管理
```bash
# 验证Token
curl -X GET "http://localhost:3000/api/auth/token" \
  -H "Authorization: Bearer your_jwt_token"

# 刷新Token
curl -X PUT "http://localhost:3000/api/auth/token" \
  -H "Authorization: Bearer your_jwt_token"
```

## 故障排除

### 常见问题

1. **"缺少认证信息"错误**
   - 检查请求头是否正确设置
   - 确认API Key或Token格式正确

2. **"Token无效"错误**
   - 检查JWT_SECRET环境变量是否正确
   - 确认Token没有过期

3. **"API Key无效"错误**
   - 检查VALID_API_KEYS环境变量配置
   - 确认API Key格式符合规范

4. **中间件不工作**
   - 检查middleware.ts文件是否存在
   - 确认路径匹配规则正确

### 调试技巧

1. **启用详细日志**
   ```env
   NODE_ENV=development
   ```

2. **临时跳过认证**
   ```env
   SKIP_API_AUTH=true
   ```

3. **检查环境变量**
   ```bash
   # 在API路由中添加调试代码
   console.log('JWT_SECRET:', process.env.JWT_SECRET);
   console.log('VALID_API_KEYS:', process.env.VALID_API_KEYS);
   ```

## 最佳实践

1. **密钥管理**
   - 定期轮换API密钥
   - 使用不同密钥用于不同环境
   - 监控密钥使用情况

2. **Token管理**
   - 设置合适的过期时间
   - 实现Token刷新机制
   - 支持Token撤销

3. **错误处理**
   - 提供清晰的错误信息
   - 记录安全相关事件
   - 实现优雅降级

4. **性能优化**
   - 缓存验证结果
   - 避免不必要的中间件执行
   - 使用高效的验证算法