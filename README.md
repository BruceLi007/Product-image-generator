# 电商商品主图 & 文案自动生成工具

基于 React + Vite + Tailwind CSS 的电商运营辅助工具，自动生成商品主图和营销文案。

## 功能

- **主图生成** — 上传商品图片、填写商品信息，AI 自动生成主图 + 3 套营销文案
- **图片生成** — 输入提示词，AI 生成商品场景图
- **图片描述** — 上传商品图，AI 分析并输出描述、卖点、关键词
- **模板库** — 收藏和管理满意的生成结果
- **对话历史** — 每次任务自动记录，支持查看和导出 JSON
- **多模型支持** — 可配置文字/图片/识图三类 AI 模型

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

启动后浏览器打开 `http://localhost:5173/`。

## 技术栈

- [React 18](https://react.dev/)
- [Vite 6](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/)（图标）

## 配置 AI 模型

在「AI 配置」页面填写 API 地址、密钥和模型名，支持：
- **文字模型** — 用于生成营销文案
- **图片模型** — 用于生成商品图片
- **识图模型** — 用于分析商品图片

未配置时自动使用本地模板降级生成。
