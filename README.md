# 智能冰箱食谱推荐 (Smart Recipe Recommendation)

这是一个基于 Next.js 和 OpenAI Vision API 的智能食谱推荐应用。用户可以通过拍摄冰箱食材照片，获取AI生成的健康食谱推荐。

## 功能特点

- **拍照识别**: 支持调用摄像头拍摄冰箱食材。
- **图片上传**: 支持上传本地食材图片。
- **智能分析**: 使用 OpenAI GPT-4o (Vision) 识别食材。
- **菜谱推荐**: 根据现有食材生成详细的菜谱，包含步骤、烹饪时间和营养估算。

## 快速开始

1. **安装依赖**

   ```bash
   npm install
   ```

2. **配置环境变量** (可选)

   如果需要使用真实的 AI 功能，请配置 OpenAI API Key。如果未配置，将使用演示模式（返回模拟数据）。

   复制 `.env.example` 为 `.env.local` 并填入您的 API Key：

   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 填入 OPENAI_API_KEY=sk-... 和 DEEPSEEK_API_KEY=sk-...
   ```

3. **运行开发服务器**

   ```bash
   npm run dev
   ```

   打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **AI**: OpenAI API (GPT-4o)

## 注意事项

- 相机功能需要 HTTPS 环境或 `localhost` 才能正常工作。
- 演示模式下会返回固定的“西红柿炒鸡蛋”和“青菜豆腐汤”菜谱。
