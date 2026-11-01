# WuPage Translator 产品网站

WuPage 的中文产品页与使用引导，介绍网页、图片和 PDF 翻译，帮助用户完成安装、第一次翻译与服务选择。

官网：<https://wupage.mrwuliu.top> · 扩展源码：<https://github.com/mr-wuliu/wupage>

## 页面

- `index.html`：产品介绍、真实阅读截图、免费范围与价格说明（`/#pricing`）、安装入口和常见问题。
- `guide.html`：四步使用引导，包含安装、首次翻译、显示模式体验、图片与 PDF 翻译；支持步骤直达与浏览器前进后退。
- `terms.html`：服务条款，说明个人运营主体、一次性自愿支持付款及退款政策。
- `privacy.html`：隐私政策，说明本地数据、第三方服务、支付数据及权利请求渠道。
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

## 法律页面维护

当前运营主体为吴翰琦（个人，以夜猫桌游馆名义运营），统一联系邮箱为 master.wuliu@gmail.com。支持付款为 US$5 / US$15 两档纯打赏，不提供对应商品、服务或权益，按一次性、自愿、无积分余额及无自动续费处理；页面不提供付款入口，也不代表已完成 Waffo 接入。开通付款时，须将结账说明及退款设置与服务条款保持一致。

内容参考 Waffo 的[服务条款模板](https://docs.waffo.ai/zh/mor/account-reviews/tos)及[隐私政策模板](https://docs.waffo.ai/zh/mor/account-reviews/privacy-policy)，按扩展主仓库 `PRIVACY.md` 的实际数据流调整。未将尚未确认的固定数据保留年限、支付认证、安全审计或跨境合同写成既有事实。版本历史以页面版本记录及 Git 历史保存；重大更新按页面约定提前通知。
