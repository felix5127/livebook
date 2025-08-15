# Livebook 部署指南

## Vercel 部署步骤

### 1. 准备工作
确保你的项目已经推送到 GitHub，并且本地构建成功：
```bash
npm run build
```

### 2. 安装 Vercel CLI（如果还没有安装）
```bash
npm install -g vercel
```

### 3. 登录 Vercel
```bash
vercel login
```

### 4. 部署到 Vercel
在项目根目录运行：
```bash
vercel
```

第一次部署时，Vercel 会问你几个问题：
- Set up and deploy? → **Yes**
- Which scope? → 选择你的账户
- Link to existing project? → **No**
- What's your project's name? → **livebook** (或你喜欢的名字)
- In which directory is your code located? → **./**

### 5. 配置环境变量
在 Vercel Dashboard 中配置以下环境变量：

#### 必需的环境变量：
```
DASHSCOPE_API_KEY=sk-474655cacec74d7da53fab2f35f20de4
BAILIAN_API_KEY=sk-474655cacec74d7da53fab2f35f20de4
NEXT_PUBLIC_SUPABASE_URL=https://dexffxmkmvhndsbgfhin.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleGZmeG1rbXZobmRzYmdmaGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5OTc1NzcsImV4cCI6MjA2NjU3MzU3N30.nMBQK_vlVGX1hnPs7o_Jqr3nuz47gfpNLcFSenGaxhA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleGZmeG1rbXZobmRzYmdmaGluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDk5NzU3NywiZXhwIjoyMDY2NTczNTc3fQ.sToNcR-1K531Tw0FbVx8b3n1I5u3XGsO4xyFZW7fwFQ
NODE_ENV=production
```

### 6. 生产环境部署
```bash
vercel --prod
```

## 环境变量配置方式

### 方式1：通过 Vercel Dashboard
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 Settings → Environment Variables
4. 添加上述环境变量

### 方式2：通过命令行
```bash
vercel env add DASHSCOPE_API_KEY production
vercel env add BAILIAN_API_KEY production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NODE_ENV production
```

## 重新部署
每次推送代码到 main 分支时，Vercel 会自动部署。
手动重新部署：
```bash
vercel --prod
```

## 故障排除

### 构建失败
1. 检查 TypeScript 错误：`npm run type-check`
2. 检查构建：`npm run build`
3. 查看 Vercel 构建日志

### API 错误
1. 确认环境变量配置正确
2. 检查 Supabase 连接
3. 验证阿里云 API 密钥

### 域名配置
在 Vercel Dashboard 中可以配置自定义域名。

## 性能优化建议
1. 启用 Vercel Analytics
2. 配置 CDN 缓存策略
3. 监控 API 响应时间