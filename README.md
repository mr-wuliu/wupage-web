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

展示页面使用 HTML、CSS 和原生 JavaScript；收款 API 运行在 Cloudflare Worker，使用 `@waffo/pancake-ts` SDK。仅预览展示页面可运行：

```sh
python3 -m http.server 8765
```

打开 <http://localhost:8765>。样式位于 `assets/css/style.css`，通用交互位于 `assets/js/main.js`，引导交互位于 `assets/js/guide.js`。

## 发布

现有 GitHub Actions 部署至 Cloudflare Worker 及 Static Assets，配置见 `.github/workflows/deploy.yml` 与 `wrangler.jsonc`。构建仅将 HTML、`assets/` 和 `_headers` 复制至 `dist/public/`，服务端源码、依赖、密钥及开发文件不作为静态资源发布。更新未使用内容哈希的静态资源时，同步更新 HTML 引用的版本参数，避免旧缓存影响展示。

## 法律页面维护

当前运营主体为吴翰琦（个人，以夜猫桌游馆名义运营），统一联系邮箱为 master.wuliu@gmail.com。支持付款为 US$5 / US$15 两档纯打赏，对应自愿支持免费插件，不提供额外服务或权益，按一次性、自愿、无积分余额及无自动续费处理；页面提供两个打赏按钮；未配置生产私钥和两个商品 ID 时，按钮保持禁用并显示收款未就绪。收款配置齐全后才创建 Waffo 会话并跳转，结账说明及退款设置须与服务条款保持一致。

内容参考 Waffo 的[服务条款模板](https://docs.waffo.ai/zh/mor/account-reviews/tos)及[隐私政策模板](https://docs.waffo.ai/zh/mor/account-reviews/privacy-policy)，按扩展主仓库 `PRIVACY.md` 的实际数据流调整。未将尚未确认的固定数据保留年限、支付认证、安全审计或跨境合同写成既有事实。版本历史以页面版本记录及 Git 历史保存；重大更新按页面约定提前通知。

## Waffo 收款配置

按官方 [waffo-pancake Skill](https://docs.waffo.ai/zh/integrate/skill) 接入，SDK 只在服务端执行。商户 ID 和店铺 ID 位于 `src/payments.ts`，生产商品 ID 位于 `wrangler.jsonc` 的 `vars`。金额固定为 USD 5.00 / 15.00，不提供额外服务或积分，不自动续费。

```sh
npm ci
npm run check
npm test
npm run dev
```

本地 Worker 默认端口为 8787，可通过 `npm run dev -- --port 8793` 调整。仅页面预览不包含 `/api/` 接口。打赏提交仅接受正式官网的同源请求；浏览器测试在本地模拟收银台响应，服务端逻辑由测试直接覆盖。

1. 将生产 RSA 私钥放在仓库外。不要提交 `.pem`、`.env` 或 `.dev.vars`，不要粘贴到前端代码。
2. 若已有 Waffo 审核通过的一次性商品，设置 `WAFFO_PRODUCT_5`、`WAFFO_PRODUCT_15`。新建商品时设置与实际商品一致的 `WAFFO_TAX_CATEGORY`。本项目经营者确认商品为 WuPage 浏览器插件，采用 `software`；两档均为自愿支持，不提供额外服务。
3. 运行配置脚本（此命令会创建/发布商品并注册生产 Webhook，已有商品会校验而不改价）：

```sh
WAFFO_PRIVATE_KEY_FILE=/absolute/path/outside/repo/private.pem npm run payments:setup
```

脚本将校验通过的商品 ID 写入 `wrangler.jsonc`，本地进度存于被忽略的 `.payment-setup.json`。如部分发布失败，重新运行可恢复。收款按钮只有两个有效且不同的商品 ID、私钥齐全时才启用；每次创建收银台前还会查询指定店铺的生产一次性商品，并校验 USD 价格与展示一致。

4. 私钥通过 GitHub Actions secret `WAFFO_PRIVATE_KEY` 注入现有 Cloudflare Worker（不会成为普通 `vars`）：

```sh
gh secret set WAFFO_PRIVATE_KEY < /absolute/path/outside/repo/private.pem
```

5. 提交非敏感配置并推送 `main`，Actions 会安装依赖、类型检查、运行测试、上传密钥及部署。Actions 未提供私钥时保留 Worker 已有 secret。

接口：`GET /api/payments/status` 返回配置就绪状态；`POST /api/checkout` 创建短期收银台会话；`POST /api/waffo/webhook` 以原始请求文本验证生产签名、店铺及环境。纯打赏不交付权益，Webhook 只做无状态确认，重复投递不会产生副作用；交易和退款以 Waffo 后台为记录来源。`/thanks` 只表示从收银台返回，不将访问该页视为支付成功。

真实付款测试须由付款人自行在收银台完成；自动测试不会发起真实扣款。退款仍按条款通过联系邮箱申请、在 Waffo 后台办理。
