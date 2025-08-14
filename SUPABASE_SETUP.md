# Supabase 配置指南

## 1. 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 注册/登录账户
3. 点击 "New project"
4. 选择组织和输入项目信息：
   - Project name: `livebook-mvp`
   - Database password: 创建一个强密码
   - Region: 选择最近的区域
5. 点击 "Create new project"

## 2. 获取项目配置信息

项目创建完成后，在项目仪表板中：

1. 点击左侧菜单 "Settings" → "API"
2. 复制以下信息：
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon (public) key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service role (secret) key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 3. 更新环境变量

编辑 `.env.local` 文件，替换以下配置：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 4. 设置存储策略 (Storage Policies)

在 Supabase 仪表板中：

1. 点击左侧菜单 "Storage"
2. 系统会自动创建 `audio-files` 存储桶
3. 点击存储桶名称进入设置
4. 在 "Policies" 标签页中，添加以下策略：

### 上传策略 (Insert Policy)
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'audio-files');
```

### 读取策略 (Select Policy)
```sql
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'audio-files');
```

### 删除策略 (Delete Policy)
```sql
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'audio-files');
```

## 5. 验证配置

配置完成后，重启开发服务器：

```bash
npm run dev
```

上传文件时，检查控制台日志：
- 成功：`文件上传成功到Supabase: {...}`
- 失败回退：`回退到测试音频: {...}`

## 6. 故障排除

### 权限错误
- 检查 Service Role Key 是否正确
- 确认存储策略已正确设置

### 存储桶不存在
- 代码会自动创建 `audio-files` 存储桶
- 如果失败，手动在仪表板中创建

### CORS 错误
- 在 Authentication → Settings → Site URL 中添加 `http://localhost:3000`

## 7. 生产环境配置

部署到 Vercel 时，需要在项目设置中添加环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- `SUPABASE_SERVICE_ROLE_KEY`