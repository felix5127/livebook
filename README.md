# Livebook MVP - AI 音频转写工具

基于阿里云 Paraformer-v2 的智能音频转写工具，支持说话人分离和多语言识别。

## 🎯 功能特性

- **智能转写**: 使用阿里云 Paraformer-v2 模型，支持中英混合识别
- **说话人分离**: 自动识别不同说话人，彩色标记区分
- **实时进度**: 上传和处理进度实时显示
- **多格式支持**: 支持 MP3, WAV, M4A, MP4, MOV 等格式
- **链接导入**: 支持 YouTube 和 B站 视频链接
- **编辑功能**: 支持转写结果的查找替换和手动编辑
- **多格式导出**: 支持 TXT, SRT, JSON 格式导出
- **响应式设计**: 支持桌面端和移动端，深色模式

## 🛠️ 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Supabase PostgreSQL
- **存储**: Supabase Storage
- **AI API**: 阿里云 DashScope Paraformer-v2
- **部署**: Vercel

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <项目地址>
cd livebook-mvp
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制环境变量模板：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入以下配置：

```env
# 阿里云 DashScope API Key (必需)
DASHSCOPE_API_KEY=your-dashscope-api-key

# Supabase 配置 (必需)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 4. 配置 Supabase

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 运行数据库迁移：

```bash
npx supabase db push
```

3. 配置存储桶（用于音频文件存储）

### 5. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📋 API 密钥获取

### 阿里云 DashScope API Key

1. 访问 [阿里云百炼控制台](https://dashscope.console.aliyun.com/)
2. 登录并开通服务
3. 创建 API Key（选择北京区域）
4. 确保账户有足够余额或免费额度

### Supabase 配置

1. 在 [Supabase Dashboard](https://app.supabase.com) 创建项目
2. 从项目设置中获取：
   - Project URL
   - Anon Key  
   - Service Role Key

## 🏗️ 项目结构

```
livebook-mvp/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── upload/        # 文件上传接口
│   │   ├── transcribe/    # 转写任务提交
│   │   └── tasks/[id]/    # 任务状态查询
│   ├── result/[id]/       # 结果展示页面
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── FileUploader.tsx   # 文件上传组件
│   ├── TranscriptViewer.tsx # 转写结果查看
│   └── TaskProgress.tsx   # 进度显示
├── lib/                   # 工具库
│   ├── dashscope.ts      # 阿里云 API 封装
│   ├── supabase.ts       # Supabase 客户端
│   └── utils.ts          # 通用工具函数
├── types/                 # TypeScript 类型定义
└── supabase/             # Supabase 配置
    ├── migrations/       # 数据库迁移
    └── functions/        # Edge Functions
```

## 💡 使用说明

### 1. 上传音频文件

- 支持拖拽上传或点击选择
- 文件大小限制：30MB
- 支持格式：MP3, WAV, M4A, MP4, MOV

### 2. 链接导入

- 粘贴 YouTube 或 B站 视频链接
- 系统自动提取音频进行转写

### 3. 查看结果

- 自动说话人分离和颜色标记
- 支持按时间戳跳转播放
- 可搜索和过滤转写内容

### 4. 编辑和导出

- 支持文本查找替换
- 可手动编辑转写内容
- 导出为 TXT/SRT/JSON 格式

## 🔧 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 类型检查
npm run type-check

# 数据库操作
npm run db:push      # 推送数据库变更
npm run db:reset     # 重置数据库
```

## 📝 API 文档

### POST /api/upload

上传音频文件到存储桶

**请求体**:
```json
{
  "file": "File对象"
}
```

**响应**:
```json
{
  "success": true,
  "fileUrl": "https://...",
  "fileName": "audio.mp3"
}
```

### POST /api/transcribe

提交转写任务

**请求体**:
```json
{
  "fileUrl": "https://...",
  "fileName": "audio.mp3",
  "speakerCount": 2,
  "languageHints": ["zh", "en"]
}
```

**响应**:
```json
{
  "success": true,
  "taskId": "task_123",
  "noteId": "note_456"
}
```

### GET /api/tasks/[id]

查询任务状态

**响应**:
```json
{
  "success": true,
  "task": {
    "id": "task_123",
    "status": "completed",
    "progress": 100,
    "result": { ... }
  }
}
```

## 🚀 部署

### Vercel 部署（推荐）

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 部署

### 手动部署

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

## ⚠️ 注意事项

1. **API Key 安全**: 请勿在客户端代码中暴露 API Key
2. **文件大小**: 建议音频文件不超过 30MB
3. **地域限制**: DashScope API 需要使用北京区域的 Key
4. **网络要求**: 确保服务器可以访问阿里云和 Supabase

## 🐛 常见问题

### 1. API 调用失败

- 检查 API Key 是否正确
- 确认 API Key 对应的区域是北京
- 检查账户余额是否充足

### 2. 文件上传失败

- 检查文件格式是否支持
- 确认文件大小不超过限制
- 检查 Supabase 存储配置

### 3. 转写结果为空

- 确认音频文件包含清晰的语音内容
- 检查文件是否损坏
- 尝试重新提交任务

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题，请联系：[your-email@example.com]