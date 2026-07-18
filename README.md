# WuPage Translator

> 一键翻译整个网页，双语对照阅读。Manifest V3 浏览器扩展，支持 Chrome / Edge。

官网：<https://wupage.mrwuliu.top> ｜ 插件源码：<https://github.com/mr-wuliu/wupage>

## 这是什么

WuPage Translator 是一款浏览器翻译扩展：点一下工具栏图标，整页内容立即翻译为目标语言，并以**双语对照**方式呈现 —— 原文保留，译文行内插入，便于对照阅读。

所有翻译请求**由扩展直接发送到翻译服务商**，不经过任何中转代理。你填入的 API Key 只在本机使用，不会上传到 WuPage 的服务器（也没有这个服务器）。

## 核心特性

- **一键整页翻译** —— 工具栏弹出按钮，一次点击完成翻译
- **双语对照渲染** —— 原文与译文相邻展示，对照学习更高效
- **段落模式 / 悬浮球** —— 按需切换翻译呈现方式
- **本地缓存** —— 按 provider + 目标语言 + 原文缓存，重复内容秒回
- **无托管代理** —— 请求直达服务商，Key 不离开本机
- **多 provider 支持** —— 5 种翻译服务自由启停，无需改代码
- **全局并发与分块** —— 统一管理默认值，单个 provider 可独立覆盖（始终不超过全局上限）

## 支持的翻译服务

| Provider | 需要 Key | 备注 |
|---|---|---|
| **Google Web Translate** | 否 | 调用公开 web 端点，无官方授权。⚠️ 可能被限流、屏蔽或下线，不建议用于生产 |
| **Microsoft Translator (Azure)** | 是 | Azure Translator 资源 key + 区域（如 `eastasia`） |
| **Google Cloud Translation Basic** | 是 | GCP API key |
| **OpenAI 兼容 LLM** | 是 | 可配 `baseURL` / `key` / `model` / `prompt`；支持 OpenAI Chat Completions 与 Anthropic Messages 两种格式，兼容 OpenAI / DeepSeek 等 OpenAI 兼容网关 |
| **HTTP 模板** | 视情况 | 自定义 URL + 请求模板，占位符 `{{targetLang}}` `{{sourceLang}}` `{{texts}}` `{{json texts}}`；响应需解析为与输入顺序一致的字符串数组 |

**具体端点：**

- Google Web：`https://translate.googleapis.com/translate_a/single`
- Azure：`POST https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to={targetLang}`
- GCP：`POST https://translation.googleapis.com/language/translate/v2?key={apiKey}`

## 安装扩展

当前版本需手动加载未打包扩展：

```bash
git clone https://github.com/mr-wuliu/wupage.git
cd wupage
npm install
npm run build
```

然后在浏览器：

1. 打开 `chrome://extensions`（Edge 为 `edge://extensions`）
2. 右上角开启**开发者模式**
3. 点击**加载已解压的扩展程序**，选中 `wupage/dist/` 目录

加载成功后工具栏会出现 WuPage Translator 图标，点击即可使用。

## 使用

- **弹窗（popup）**：选择目标语言与翻译服务，开关段落模式 / 悬浮球，点「翻译全文」开始；含 Debug 与清除缓存按钮
- **选项页（options）**：通用设置（源语言、分块大小、并发数、缓存开关、悬浮球显示）＋ 翻译服务管理（增删改、测试连通性、恢复默认）

## 隐私

- 翻译请求**直接**从扩展发往你配置的翻译服务商
- 没有任何 WuPage 自有的中转服务器
- 你的 API Key 只存在浏览器本地，不会上传
- 翻译缓存只在你本地

## 相关链接

- **官网（在线体验、图文介绍、API 获取流程）**：<https://wupage.mrwuliu.top>
- **插件源码仓库**：<https://github.com/mr-wuliu/wupage>
- **问题反馈**：<https://github.com/mr-wuliu/wupage/issues>

---

## 关于本仓库

> 如果你是来**使用** WuPage Translator 的，不需要继续往下读 —— 直接去[官网](https://wupage.mrwuliu.top)或[插件仓库](https://github.com/mr-wuliu/wupage)即可。

本仓库（`wupage-web`）是上述官网的源代码。纯静态 HTML / CSS / 原生 JS，零构建步骤，零运行时依赖。出于学习参考目的可查看：

- `index.html` —— 单页站点入口，所有章节内容
- `assets/css/style.css` —— 设计系统、组件样式、深色模式
- `assets/js/main.js` —— 导航、平滑滚动、标签切换、滚动渐显

部署通过 GitHub Actions 自动推送到 Cloudflare Workers Static Assets，配置见 `.github/workflows/deploy.yml` 与 `wrangler.jsonc`。

© 2026 WuPage Translator. 开源项目。
