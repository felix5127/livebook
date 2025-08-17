# Livebook MVP Vercel部署指南

## 概览

本指南详细说明了如何将Livebook MVP项目优化并部署到Vercel生产环境。项目已经过深度优化，支持音频转写、AI总结等功能。

## 🚀 快速部署

### 1. 前置准备

确保你已经有以下账号和服务：
- [Vercel账号](https://vercel.com)
- [Supabase项目](https://supabase.com)
- [阿里云DashScope API密钥](https://dashscope.aliyun.com)

### 2. 环境变量配置

#### 2.1 复制环境变量模板
```bash
cp .env.example .env.local
```

#### 2.2 填写必填环境变量

**DashScope配置（必填）**
```env
DASHSCOPE_API_KEY=sk-xxx  # 阿里云DashScope API密钥
DASHSCOPE_API_URL=https://dashscope.aliyuncs.com/api/v1/services/audio/asr/paraformer
```

**Supabase配置（必填）**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

**安全配置（必填）**
```env
JWT_SECRET=your-super-secure-random-string-here
API_KEY_SECRET=another-secure-random-string-here
```

### 3. 部署到Vercel

#### 方法1: GitHub自动部署（推荐）
1. 将代码推送到GitHub仓库
2. 在Vercel dashboard中导入GitHub仓库
3. 在Vercel中配置环境变量
4. 点击Deploy

#### 方法2: Vercel CLI部署
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 预览部署
npm run deploy:preview

# 生产部署
npm run deploy
```

## 📊 配置详解

### Vercel配置特性

我们的`vercel.json`配置包含以下优化：

#### 1. API超时配置
```json
"functions": {
  "app/api/transcribe/route.ts": { "maxDuration": 300 },  // 5分钟转写
  "app/api/upload/route.ts": { "maxDuration": 60 },       // 1分钟上传
  "app/api/ai/*/route.ts": { "maxDuration": 120 }         // 2分钟AI处理
}
```

#### 2. 安全头配置
- CORS策略
- XSS保护
- Content Type检查
- Frame保护
- 权限策略

#### 3. 缓存策略
```json
"headers": [
  {
    "source": "/_next/static/(.*)",
    "headers": [
      { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
    ]
  }
]
```

#### 4. 地域配置
- 主要地域：香港（hkg1）
- 备用地域：新加坡（sin1）、旧金山（sfo1）

### Next.js配置优化

#### 1. 构建优化
- SWC压缩：更快的构建速度
- 智能代码分割：减少包大小
- Bundle分析：`npm run analyze`

#### 2. 安全配置
- CSP策略：防止XSS攻击
- HSTS：强制HTTPS
- 安全头：多层防护

#### 3. 性能优化
- 图片优化：WebP/AVIF格式
- 代码分割：按需加载
- 缓存策略：减少重复请求

## 🔧 环境变量说明

### 必填变量

| 变量名 | 描述 | 示例 |
|--------|------|------|
| `DASHSCOPE_API_KEY` | 阿里云API密钥 | `sk-xxx` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase项目URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase公开密钥 | `eyJxxx` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase服务密钥 | `eyJxxx` |
| `JWT_SECRET` | JWT签名密钥 | 32字符随机字符串 |
| `API_KEY_SECRET` | API密钥加密密钥 | 32字符随机字符串 |

### 可选变量

| 变量名 | 描述 | 默认值 |
|--------|------|---------|
| `KIMI_API_KEY` | Kimi AI密钥 | - |
| `REDIS_URL` | Redis连接URL | - |
| `MAX_FILE_SIZE` | 最大文件大小(MB) | 50 |
| `RATE_LIMIT_RPM` | 速率限制(请求/分钟) | 10 |

## 🎯 部署检查清单

### 部署前检查
- [ ] 环境变量已配置
- [ ] Supabase数据库已迁移
- [ ] API密钥测试通过
- [ ] 构建测试通过：`npm run build`
- [ ] 类型检查通过：`npm run type-check`
- [ ] 代码质量检查：`npm run lint`

### 部署后验证
- [ ] 首页加载正常
- [ ] 用户认证功能正常
- [ ] 文件上传功能正常
- [ ] 音频转写功能正常
- [ ] AI总结功能正常
- [ ] API响应时间正常

## 🚨 常见问题

### 1. 构建失败
**问题**：构建时TypeScript错误
**解决**：
```bash
npm run type-check
npm run lint:fix
```

### 2. API超时
**问题**：转写API超时
**解决**：检查`vercel.json`中的`maxDuration`配置

### 3. 环境变量问题
**问题**：环境变量未生效
**解决**：
- 确保在Vercel dashboard中配置了环境变量
- 重新部署项目
- 检查变量名是否正确

### 4. 文件上传失败
**问题**：大文件上传失败
**解决**：
- 检查文件大小限制（当前50MB）
- 验证Supabase Storage配置
- 检查网络连接

### 5. 数据库连接问题
**问题**：无法连接Supabase
**解决**：
- 验证Supabase URL和密钥
- 检查数据库是否已暂停
- 确认网络策略设置

## 📈 性能监控

### 1. Vercel Analytics
在Vercel dashboard中启用Analytics来监控：
- 页面加载时间
- API响应时间
- 错误率
- 用户访问量

### 2. 自定义监控
```bash
# 分析Bundle大小
npm run analyze

# 检查构建输出
npm run build -- --debug
```

### 3. 性能优化建议
- 启用Vercel Edge Functions（如需要）
- 配置CDN缓存策略
- 监控API函数执行时间
- 定期清理无用依赖

## 🔄 CI/CD配置

### GitHub Actions示例
创建`.github/workflows/deploy.yml`：
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🔗 相关链接

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Integration](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [DashScope API](https://help.aliyun.com/zh/dashscope/)

## 📞 技术支持

如遇到部署问题，请检查：
1. [Vercel Status](https://vercel-status.com/)
2. [Supabase Status](https://status.supabase.com/)
3. 项目日志：Vercel Dashboard > Functions > Logs

---

**注意**：本配置已针对音频转写应用进行优化，支持大文件上传和长时间API调用。部署前请确保所有环境变量配置正确。