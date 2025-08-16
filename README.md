# 🎙️ Livebook MVP

基于AI的音频转写和笔记应用，类似于NotebookLM的现代化界面和功能。

![Livebook MVP](https://img.shields.io/badge/Status-MVP-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan)

## ✨ 功能特性

- 🎵 **智能音频上传** - 支持MP3、WAV、M4A、MP4、MOV等多种格式
- 🤖 **高质量AI转写** - 集成阿里云百炼Paraformer-v2模型，支持中英文
- 👥 **说话人分离** - 自动识别并区分不同说话人
- 📝 **实时进度追踪** - 转写进度实时显示，无需页面跳转
- 🎨 **NotebookLM风格界面** - 现代化卡片设计，直观易用
- 💾 **数据持久化** - 本地存储，刷新不丢失
- 🎵 **智能音频播放器** - 支持时间戳跳转和播放控制
- 📤 **多格式导出** - 支持文本、字幕等多种导出格式

## 🛠️ 技术栈

- **前端框架**: Next.js 14 with App Router
- **开发语言**: TypeScript
- **UI样式**: Tailwind CSS + Lucide Icons
- **数据存储**: Supabase (PostgreSQL + Storage)
- **AI服务**: 阿里云百炼 DashScope API
- **部署平台**: Vercel

## 📋 环境要求

- Node.js 18.17+ 
- 阿里云百炼API账户
- Supabase项目

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/livebook-mvp.git
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

编辑 `.env.local` 文件：

```env
# 阿里云百炼 API 配置
DASHSCOPE_API_KEY=sk-your-dashscope-api-key

# Supabase 配置  
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# 项目配置
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用！

## 📖 使用指南

### 上传音频文件

1. 点击"新建笔记本"卡片
2. 选择"文件上传"或"链接导入"
3. 拖拽文件或点击选择音频文件
4. 等待上传和转写完成

### 查看转写结果

1. 转写完成后，主页会显示新的笔记卡片
2. 点击笔记卡片进入详情页面
3. 左侧是音频播放器和AI聊天功能
4. 右侧显示完整的转写文本和时间戳

### 音频播放和导航

- 点击时间戳可以跳转到对应音频位置
- 使用播放器控制音频播放暂停
- 支持进度条拖拽快速定位

## 🚢 部署到Vercel

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/livebook-mvp)

### 手动部署

1. Fork 项目到你的GitHub
2. 登录 [Vercel](https://vercel.com)
3. 点击"Import Project"导入你的仓库
4. 配置环境变量（与本地相同）
5. 点击Deploy开始部署

### 环境变量配置

在Vercel项目设置中添加以下环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DASHSCOPE_API_KEY` | 阿里云百炼API密钥 | `sk-xxx...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase项目URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名密钥 | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase服务密钥 | `eyJhbG...` |

## 📁 项目结构

```
livebook-mvp/
├── app/                    # Next.js App Router页面
│   ├── api/               # API路由
│   ├── notebook/          # 笔记详情页
│   └── page.tsx          # 主页
├── components/            # React组件
├── lib/                   # 工具库
├── types/                # TypeScript类型定义
└── public/               # 静态资源
```

## 🎯 支持的文件格式

### 音频格式
- MP3, WAV, M4A, AAC, FLAC, OGG

### 视频格式  
- MP4, MOV, AVI, MKV

### 文件限制
- 最大文件大小：50MB
- 最大时长：建议30分钟内

## 🔧 API文档

### 上传文件
```
POST /api/upload
Content-Type: multipart/form-data
```

### 提交转写任务
```
POST /api/transcribe
Content-Type: application/json
```

### 查询任务状态
```
GET /api/tasks/[taskId]
```

## 🐛 故障排除

### 常见问题

**Q: 转写失败怎么办？**
A: 检查API密钥是否正确，文件格式是否支持，网络是否正常。

**Q: 音频播放不了？**
A: 确认浏览器支持音频格式，检查文件URL是否可访问。

**Q: 部署到Vercel失败？**
A: 检查环境变量是否完整配置，构建日志查看具体错误。

更多问题请查看 [Issues](https://github.com/your-username/livebook-mvp/issues)

## 🤝 贡献指南

1. Fork 项目
2. 创建feature分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📜 更新日志

### v1.0.0 (2025-01-15)
- ✨ 初始版本发布
- 🎵 支持音频文件上传和转写
- 🎨 NotebookLM风格界面
- 💾 本地数据持久化
- 🎵 音频播放器功能

## 📄 许可证

MIT License - 详情请查看 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [阿里云百炼](https://bailian.console.aliyun.com/) - 提供AI转写服务
- [Supabase](https://supabase.com/) - 数据库和存储服务
- [Vercel](https://vercel.com/) - 部署平台
- [Lucide](https://lucide.dev/) - 图标库

---

**由 [Claude Code](https://claude.ai/code) 协助开发** 🤖

如果这个项目对你有帮助，请给个 ⭐️ Star！