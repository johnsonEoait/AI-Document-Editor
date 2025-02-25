# AI 文档编辑器

<p align="center">
  <strong>一个现代化的、AI驱动的富文本编辑器，专为文档创作和协作设计</strong>
</p>

<p align="center">
  <strong>由 <a href="https://www.starera.cn" target="_blank">广东星时代网络技术有限公司</a> 开发</strong>
</p>

<p align="center">
  <a href="#特性">特性</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#使用指南">使用指南</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#贡献指南">贡献指南</a> •
  <a href="#许可证">许可证</a>
</p>

## 特性

🚀 **现代化编辑体验**
- 基于 TipTap 和 ProseMirror 的强大富文本编辑功能
- 支持 Markdown 语法和快捷键
- 丝滑的编辑体验和动画效果

🤖 **AI 辅助功能**
- 内置 AI 助手，帮助改进文本
- 智能内容生成和补全
- 炫酷的 AI 内容插入动画效果

📝 **全面的文档功能**
- 支持标题、列表、表格、代码块等丰富元素
- 自动生成目录
- 文本高亮、颜色和字体大小调整

💾 **多种导出格式**
- 导出为 Word 文档 (.docx)
- 自动保存功能
- 文档标题管理

🎨 **美观的用户界面**
- 基于 Tailwind CSS 的现代设计
- 响应式布局，适配各种设备
- 自定义主题支持

## 快速开始

### 前提条件

- Node.js 18.0.0 或更高版本
- pnpm 8.0.0 或更高版本

### 安装

1. 克隆仓库
```bash
git clone https://github.com/starera/ai-doc-editor.git
cd ai-doc-editor
```

2. 安装依赖
```bash
pnpm install
```

3. 配置环境变量
```bash
cp .env.example .env
```
编辑 `.env` 文件，添加必要的 API 密钥（如 OpenAI API 密钥）。

4. 启动开发服务器
```bash
pnpm dev
```

5. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)

## 使用指南

### 基本编辑

- 使用工具栏格式化文本
- 支持快捷键（Ctrl+B 加粗，Ctrl+I 斜体等）
- 输入 `/` 触发命令菜单

### AI 功能

- 选中文本后按 `Alt + /` 触发 AI 助手
- AI 可以帮助改写、扩展、总结或翻译选中的文本
- 生成的内容会以平滑的动画效果插入

### 导出文档

- 点击工具栏中的导出按钮
- 选择是否包含文档标题
- 文档将以 .docx 格式下载

## 技术栈

- **前端框架**: [Next.js](https://nextjs.org/) 15.x
- **UI 库**: [React](https://reactjs.org/) 19.x
- **编辑器核心**: [TipTap](https://tiptap.dev/) 2.x
- **样式**: [Tailwind CSS](https://tailwindcss.com/) 3.x
- **动画**: [Framer Motion](https://www.framer.com/motion/)
- **文档处理**: [docx](https://docx.js.org/)
- **AI 集成**: [OpenAI API](https://openai.com/api/)

## 贡献指南

我们欢迎所有形式的贡献，无论是新功能、bug 修复还是文档改进。

1. Fork 这个仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

请确保你的代码遵循项目的代码风格和最佳实践。

## 许可证

本项目采用修改版 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。该许可证在标准MIT许可证的基础上增加了以下限制：

- 修改必须明确标注
- 必须保留原始归属和版权声明
- 特定商业用途需获得书面许可
- 专利使用需获取必要许可

版权所有 © 2023-2024 <a href="https://www.starera.cn" target="_blank">广东星时代网络技术有限公司</a>

## 致谢

- 感谢 [TipTap](https://tiptap.dev/) 团队提供的出色编辑器框架
- 感谢所有为这个项目做出贡献的开发者
- 特别感谢我们的用户社区提供的宝贵反馈

---

<p align="center">
  <strong><a href="https://www.starera.cn" target="_blank">广东星时代网络技术有限公司</a></strong> 出品
</p>
<p align="center">
  用 ❤️ 制作
</p>
