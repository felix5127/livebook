# Livebook MVP

一个基于 Next.js 的音频转写平台，使用 Supabase 作为数据库，集成阿里云 DashScope 进行语音转文字。

## 功能特性

- 📁 音频文件上传（支持 MP3, WAV, M4A 格式）
- 🎯 智能语音转文字
- 📊 实时转写进度跟踪
- 📋 转录结果展示与下载
- 💾 转录历史记录

## 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **语音识别**: 阿里云 DashScope API
- **部署**: Vercel (推荐)

## 快速开始

### 环境准备

1. 克隆项目
```bash
git clone <repository-url>
cd livebook-mvp
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
复制 `.env.example` 到 `.env.local` 并填入相应的值：
```bash
cp .env.example .env.local
```

### 环境变量配置

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# DashScope API Configuration
DASHSCOPE_API_KEY=your-dashscope-api-key
```

### 数据库设置

1. 在 Supabase 中创建新项目
2. 运行数据库迁移：
```bash
npm run db:push
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
livebook-mvp/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── upload/        # 文件上传
│   │   ├── transcribe/    # 转写处理
│   │   └── tasks/[id]/    # 任务管理
│   ├── result/[id]/       # 结果页面
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   └── globals.css        # 全局样式
├── components/            # 可重用组件
├── lib/                   # 工具库
├── types/                 # TypeScript 类型定义
├── supabase/             # 数据库相关
│   └── migrations/       # 数据库迁移
└── uploads/              # 上传文件存储（本地开发）
```

## API 接口

### POST /api/upload
上传音频文件并创建转写任务

### POST /api/transcribe
开始转写处理

### GET /api/tasks/[id]
获取任务状态和结果

### PUT /api/tasks/[id]
更新任务状态

### DELETE /api/tasks/[id]
删除任务

## 部署

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 自动部署

```bash
npm run deploy
```

### 环境变量设置

在 Vercel 后台设置以下环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DASHSCOPE_API_KEY`

## 开发指南

### 添加新的转写服务

1. 在 `lib/` 目录下创建新的服务模块
2. 实现 `TranscriptionService` 接口
3. 在 `/api/transcribe` 中集成新服务

### 数据库变更

1. 创建新的迁移文件：`supabase/migrations/002_xxx.sql`
2. 运行迁移：`npm run db:push`
3. 更新类型定义：`npm run db:generate`

## 注意事项

- 确保上传目录有写权限
- 音频文件大小限制为 100MB
- 支持的音频格式：MP3, WAV, M4A
- DashScope API 需要实名认证

## 许可证

MIT License