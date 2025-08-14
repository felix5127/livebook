# Livebook MVP 开发问题与解决方案

## 问题1: 项目目录名称包含空格导致npm初始化失败

### 问题描述
尝试使用 `npx create-next-app@latest .` 在名为 "newlive book" 的目录中初始化项目时，出现npm命名限制错误。

### 解决方案
手动创建项目配置文件，包括：
- package.json
- tsconfig.json
- next.config.js
- tailwind.config.js
- postcss.config.js

### 经验教训
项目目录名称应避免使用空格，推荐使用连字符或下划线。

---

## 问题2: Next.js 14中experimental.appDir已废弃

### 问题描述
在next.config.js中配置了`experimental: { appDir: true }`，导致启动时出现警告。

### 解决方案
移除experimental.appDir配置，因为App Router在Next.js 14+中已经稳定。

### 经验教训
及时更新配置以适应Next.js新版本的变化。

---

## 问题3: 如何设计良好的组件架构

### 问题描述
需要创建多个功能复杂的组件，如何保证代码的可维护性和复用性？

### 解决方案
采用以下架构设计：
1. **单一职责原则**：每个组件只负责一个功能
2. **Props接口设计**：明确定义组件的输入和输出
3. **类型安全**：使用TypeScript确保类型安全
4. **工具函数分离**：将通用逻辑抽象到utils中
5. **状态管理清晰**：使用React Hooks管理组件状态

### 组件设计模式
```
FileUploader.tsx     # 文件上传 - 处理文件选择和验证
TaskProgress.tsx     # 进度显示 - 展示任务状态
TranscriptViewer.tsx # 结果查看 - 处理转写结果展示
ExportOptions.tsx    # 导出功能 - 处理文件导出
```

---

## 问题4: 深色模式实现方案

### 问题描述
如何实现系统级深色模式支持，包括自动检测和手动切换？

### 解决方案
1. 创建ThemeProvider上下文管理主题状态
2. 监听系统主题变化
3. 在localStorage中持久化用户偏好
4. 使用Tailwind CSS的dark:前缀实现样式切换

### 实现要点
- 使用`suppressHydrationWarning`避免SSR水合问题
- 提供light/dark/system三种模式选择
- 所有组件都支持深色模式样式

---

## 问题5: 模拟数据vs真实API集成

### 问题描述
在没有后端API的情况下，如何设计前端界面？

### 解决方案
1. 先定义完整的TypeScript接口
2. 创建模拟数据生成函数
3. 使用setTimeout模拟异步操作
4. 预留API调用接口，方便后续集成

### 代码示例
```typescript
// 定义接口
interface TranscriptionTask {
  id: string;
  status: TaskStatus;
  // ...
}

// 模拟数据
const generateMockTask = (id: string): TranscriptionTask => {
  // 生成模拟数据
}

// 预留真实API调用位置
const uploadFile = async (file: File) => {
  // TODO: 替换为真实API调用
  return mockApiCall();
}
```

---

## 最佳实践总结

1. **类型先行**：先定义TypeScript接口再实现功能
2. **组件分离**：保持组件的单一职责和高内聚
3. **用户体验**：提供loading状态、错误处理、进度反馈
4. **响应式设计**：确保在各种设备上都有良好体验
5. **可访问性**：添加适当的ARIA标签和键盘支持
6. **性能优化**：合理使用React.memo和useMemo
7. **错误边界**：提供完善的错误处理机制

---

## 技术债务和后续优化

1. **真实API集成**：替换模拟数据为真实API调用
2. **状态管理优化**：考虑使用Zustand或Redux Toolkit
3. **测试覆盖**：添加单元测试和集成测试
4. **性能监控**：集成性能分析工具
5. **SEO优化**：添加元数据和结构化数据
6. **国际化**：支持多语言界面
7. **PWA支持**：添加离线功能和应用安装