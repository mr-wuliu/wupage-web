# WuPage Translator 官网

[WuPage Translator](https://github.com/mr-wuliu/wupage) 浏览器翻译扩展的官方网站。
纯静态站点（HTML + CSS + 原生 JS），**零构建步骤**，部署到 [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)（推送 main 分支即由 GitHub Actions 自动部署）。

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

## 部署到 Cloudflare Workers Static Assets

本项目使用 **[Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)**（Cloudflare 当前推荐方案；Pages 已进入维护模式，不再有新功能）。

配置位于根目录的 [`wrangler.jsonc`](./wrangler.jsonc)，`assets.directory` 指向仓库根目录，无需 Worker 脚本。`_headers` 文件由 Workers Static Assets 原生解析，与 Pages 格式完全兼容。

### 方式一：GitHub Actions（推荐，已内置）

推送到 `main` 分支会自动触发 [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) 进行部署。**首次使用前需要配置两个 GitHub Secrets**：

1. **创建 Cloudflare API Token**
   - 打开 <https://dash.cloudflare.com/profile/api-tokens>
   - 选择 **Create Token** → 使用 **Edit Cloudflare Workers** 官方模板
   - Account Resources 选你的账户，Zone Resources 留空即可
   - 复制生成的 Token（仅显示一次）

2. **找到 Cloudflare Account ID**
   - 在 [Cloudflare Dashboard](https://dash.cloudflare.com) 首页或任意 Worker 概览页右侧栏可见
   - 形如 `abcd1234abcd1234abcd1234abcd1234`

3. **在 GitHub 仓库添加 Secrets**
   - 进入仓库 **Settings → Secrets and variables → Actions → New repository secret**
   - 添加两个：
     - `CLOUDFLARE_API_TOKEN` → 第 1 步生成的 Token
     - `CLOUDFLARE_ACCOUNT_ID` → 第 2 步的 Account ID

4. **触发部署**
   - 推送一次代码到 `main`（或任意已推送的 commit 上手动触发：Actions 页 → Deploy to Cloudflare Workers → Run workflow）
   - 部署完成后会输出形如 `https://wupage-web.<你的 workers.dev 子域>.workers.dev` 的访问地址
   - 如需自定义域名：在 Cloudflare Dashboard → Workers & Pages → 选中 `wupage-web` Worker → Settings → Domains & Routes 添加

### 方式二：Wrangler CLI（本地手动部署）

```bash
# 安装 wrangler v4（任选其一）
npm install -g wrangler
# 或直接用 npx

# 登录（首次需要浏览器授权）
wrangler login

# 在项目根目录执行部署
wrangler deploy
```

> 注意：是 `wrangler deploy`（不是 `wrangler pages deploy`）。配置已由 `wrangler.jsonc` 接管。

## 目录结构

```
wupage_web/
├── index.html            # 单页站点入口（包含全部 7 个章节）
├── _headers              # 缓存 / 安全 / MIME 头（Workers Static Assets 原生解析）
├── wrangler.jsonc        # Cloudflare Workers Static Assets 部署配置
├── .github/workflows/
│   └── deploy.yml        # GitHub Actions：push main 自动部署到 Workers
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
- Workers Static Assets 文档：<https://developers.cloudflare.com/workers/static-assets/>
- Wrangler 配置参考：<https://developers.cloudflare.com/workers/wrangler/configuration/>
- Pages → Workers 迁移指南：<https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/>

© 2026 WuPage Translator. 开源项目。
