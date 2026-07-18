# WuPage Translator 官网

[WuPage Translator](https://github.com/mr-wuliu/wupage) 浏览器翻译扩展的官方网站。
纯静态站点（HTML + CSS + 原生 JS），**零构建步骤**，可直接部署到 Cloudflare Pages。

## 项目简介

本仓库是 WuPage Translator 的产品落地页，包含：

- **Hero**：标题、副标题、CTA 按钮
- **功能特色**：6 张特性卡片
- **功能指导**：7 步上手指南
- **效果展示**：基于真实插件 UI 的高保复 HTML/CSS 还原（弹窗、选项页、双语对照）
- **API 获取流程**：5 种翻译服务的接入步骤（Google Web / 微软 / Google Cloud / OpenAI 兼容 / HTTP 模板）
- **下载安装**：手动加载扩展的完整步骤
- **页脚**：相关链接与版权信息

特性：

- 中文（zh-CN）单页站点
- 移动优先的响应式设计
- 通过 `prefers-color-scheme` 自动适配深色模式
- 吸顶毛玻璃导航 + 平滑滚动
- `IntersectionObserver` 滚动渐显动画（尊重 `prefers-reduced-motion`）
- 不依赖任何框架、构建工具或第三方 JS 库

## 本地预览

任意静态文件服务器即可，例如：

```bash
# 使用 npx serve（无需全局安装）
npx serve .

# 或使用 Python 内置服务器
python3 -m http.server 8080
```

然后在浏览器打开 `http://localhost:8080`（或终端提示的端口）即可。

## 部署到 Cloudflare Pages

### 方式一：Git 连接（推荐）

1. 将本仓库推送到 GitHub / GitLab。
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)，进入 **Workers & Pages → Create → Pages → Connect to Git**。
3. 选择本仓库，构建配置填写：
   - **Framework preset**：`None`
   - **Build command**：留空
   - **Build output directory**：`/`（根目录）
4. 点击 **Save and Deploy**，Cloudflare 会自动读取根目录的 `_headers` 应用缓存与安全头。

### 方式二：Wrangler CLI

确保已安装 [`wrangler`](https://developers.cloudflare.com/workers/wrangler/)：

```bash
# 安装（任选其一）
npm install -g wrangler
# 或使用 npx

# 登录（首次需要）
wrangler login

# 在项目根目录执行部署
wrangler pages deploy .
```

命令执行后会输出形如 `https://<project>.pages.dev` 的访问地址。

## 目录结构

```
wupage_web/
├── index.html            # 单页站点入口（包含全部 7 个章节）
├── _headers              # Cloudflare Pages 缓存 / 安全 / MIME 头
├── README.md             # 本文档
└── assets/
    ├── css/
    │   └── style.css     # 设计系统 + 全部组件样式（含深色模式）
    └── js/
        └── main.js       # 导航 / 平滑滚动 / 标签切换 / 滚动渐显
```

## 自定义

- **主题色**：修改 `assets/css/style.css` 顶部 `:root` 中的 `--brand-1` / `--brand-2` / `--accent-1`。
- **深色模式**：通过 `@media (prefers-color-scheme: dark)` 块覆盖令牌，无需手动开关。
- **文案**：所有中文文案直接写在 `index.html` 内对应章节中。

## 相关链接

- 插件仓库：<https://github.com/mr-wuliu/wupage>
- Cloudflare Pages 文档：<https://developers.cloudflare.com/pages/>
- Wrangler 文档：<https://developers.cloudflare.com/workers/wrangler/>

© 2026 WuPage Translator. 开源项目。
