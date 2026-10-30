# WuPage Translator 产品网站

WuPage 的中文产品页与使用引导，介绍网页、图片和 PDF 翻译，帮助用户完成安装、第一次翻译与服务选择。

官网：<https://wupage.mrwuliu.top> · 扩展源码：<https://github.com/mr-wuliu/wupage>

## 页面

- `index.html`：产品介绍、真实阅读截图、安装入口和常见问题。
- `guide.html`：四步使用引导，包含安装、首次翻译、显示模式体验、图片与 PDF 翻译；支持步骤直达与浏览器前进后退。
- `api.html`：翻译服务指南，介绍默认免密钥服务、DeepSeek、GLM 和本地离线翻译等选项。

内容依据扩展主仓库当前使用说明更新。涉及尚未合入的 Issue 或 PR 时，不将提案或性能测量写为已发布承诺。阅读截图来自主仓库 `docs/example/`。

## 本地预览

纯静态 HTML、CSS 和原生 JavaScript，无需安装依赖或构建：

```sh
python3 -m http.server 8765
```

打开 <http://localhost:8765>。样式位于 `assets/css/style.css`，通用交互位于 `assets/js/main.js`，引导交互位于 `assets/js/guide.js`。

## 发布

现有 GitHub Actions 部署至 Cloudflare Workers Static Assets，配置见 `.github/workflows/deploy.yml` 与 `wrangler.jsonc`。更新未使用内容哈希的静态资源时，同步更新 HTML 引用的版本参数，避免旧缓存影响展示。
