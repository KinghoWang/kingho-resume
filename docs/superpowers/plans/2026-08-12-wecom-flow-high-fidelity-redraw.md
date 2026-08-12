# 企微获客链路高保真重绘实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不公开真实业务素材的前提下，把企微获客链路 Demo 的手机内部界面升级为与两段参考视频逐状态一致的净室高保真重绘。

**Architecture:** 保留 `demo-wecom-flow.html` 的纯 HTML/CSS/JavaScript 和既有有限状态机；只扩充渲染层、增加 `NEW_LINK_LOADING` 状态与独立 `navigation` 计时器。浏览器回归测试继续从可见 DOM 和用户操作验证，视频关键帧仅用于本地人工截图对照，不进入仓库。

**Tech Stack:** 静态 HTML、CSS、原生 JavaScript、Playwright、Python `http.server`、FFmpeg（仅本地提取参考帧）

---

## 文件职责

- `demo-wecom-flow.html`：页面外层、两台手机的净室高保真界面、有限状态机和交互。
- `tests/wecom-flow.spec.js`：状态机、视觉结构、脱敏边界、响应式和无障碍回归。
- `docs/superpowers/specs/2026-08-12-wecom-acquisition-flow-demo-design.md`：用户已确认的高保真设计规格。
- `docs/superpowers/plans/2026-08-12-wecom-flow-high-fidelity-redraw.md`：本轮执行清单。

### Task 1: 锁定视觉结构与脱敏回归

**Files:**
- Modify: `tests/wecom-flow.spec.js`
- Verify: `demo-wecom-flow.html`

- [x] **Step 1: 为手机内部关键状态写失败测试**

新增测试，要求：

```js
test('video-faithful redraw exposes the required visual layers', async ({ page }) => {
  await expect(page.getByTestId('old-phone').locator('.short-video-ad')).toBeVisible();
  await page.getByTestId('old-claim').click();
  await expect(page.getByTestId('old-phone').locator('.h5-scroll')).toBeVisible();
  await expect(page.getByTestId('old-phone').locator('.claim-list')).toBeVisible();
  await expect(page.getByTestId('old-phone').locator('.sticky-claim-bar')).toBeVisible();

  await page.getByTestId('new-claim').click();
  await expect(page.getByTestId('new-phone').locator('.chat-screen.dark')).toBeVisible();
  await expect(page.getByTestId('chat-composer')).toBeVisible();
  await expect(page.getByTestId('acquisition-card')).toBeVisible();
});
```

再新增脱敏断言：手机内无 `work.example/link`、无真实可点击外链、无红色调试描边；展示的企微路径必须是掩码。

- [x] **Step 2: 运行新增测试并确认因缺少高保真结构而失败**

Run:

```bash
DEMO_BASE_URL=http://127.0.0.1:52784 playwright-test tests/wecom-flow.spec.js --workers=1 --grep "video-faithful|sanitized"
```

Expected: FAIL，失败点为 `.short-video-ad`、`.h5-scroll`、`.chat-screen.dark` 或掩码入口尚不存在，不得是测试环境报错。

- [x] **Step 3: 提交测试红灯证据前检查工作树**

Run:

```bash
git diff --check
git status --short
```

Expected: 只出现规格、计划和测试文件改动；无视频、关键帧或真实素材。

### Task 2: 重绘广告、原链路 H5 与系统菜单

**Files:**
- Modify: `demo-wecom-flow.html`
- Test: `tests/wecom-flow.spec.js`

- [x] **Step 1: 用 CSS/HTML 重绘共用短视频广告**

`adView(lane)` 必须输出 `.short-video-ad`，包含：状态栏/灵动岛、圆形返回键、右上胶囊、绿色播放按钮、大字标题、竖版虚构素材、关闭圆钮和白色 CTA 条。两条链路使用同一结构，不嵌入图片或外部资源。

- [x] **Step 2: 用可滚动白色长页替换原简化 H5**

`h5View()` 必须输出 `.h5-scroll`、`.health-book-cover`、`.claim-panel`、`.claim-list`、主伪二维码、头像列和 `.sticky-claim-bar`。只有主伪二维码保留 `data-hold-target`，滚动页面不触发长按。

- [x] **Step 3: 重绘 iOS 风格 action sheet**

保留现有 `role="dialog"`、焦点接管和四个测试 ID；将菜单改为视频中的白色底部操作表样式，背景变暗，项目顺序为转发、收藏、保存图片、联系人入口、取消。

- [x] **Step 4: 运行原链路和长按测试**

Run:

```bash
DEMO_BASE_URL=http://127.0.0.1:52784 playwright-test tests/wecom-flow.spec.js --workers=1 --grep "old flow|keyboard|touch|system menu|video-faithful"
```

Expected: 原链路视觉结构断言通过；短按、800ms 长按、键盘、触屏和菜单焦点测试全部 PASS。

### Task 3: 重绘深色客服会话、加载页与联系人页

**Files:**
- Modify: `demo-wecom-flow.html`
- Test: `tests/wecom-flow.spec.js`

- [x] **Step 1: 先写加载状态失败测试**

```js
test('either acquisition entry shows the local loading screen before contact', async ({ page }) => {
  await page.getByTestId('new-claim').click();
  await page.getByTestId('acquisition-card').click();
  await expect(page.getByTestId('new-phone')).toHaveAttribute('data-state', 'NEW_LINK_LOADING');
  await expect(page.getByTestId('link-loading')).toBeVisible();
  await expect(page.getByTestId('new-phone')).toHaveAttribute('data-state', 'NEW_CONTACT', { timeout: 1500 });
});
```

Run the single test and expect FAIL because `NEW_LINK_LOADING` does not yet exist.

- [x] **Step 2: 扩展状态机和计时器**

将两处 `ACQUISITION_CLICK` 的目标改为 `NEW_LINK_LOADING`，增加 `LINK_RESOLVE -> NEW_CONTACT`。实现 `scheduleLinkResolution()`，使用独立 `navigation` 计时器；手动点击入口时自动注册，重置时清空，自动演示与用户接管时不与 `message`、`hold` 互相误杀。

- [x] **Step 3: 重绘深色会话和输入栏**

`chatView()` 输出 `.chat-screen.dark`、深灰左侧气泡、绿色右侧气泡、脱敏历史内容、富文本文案、获客卡片、掩码 `work.weixin.qq.com/ca/••••••••` 和固定 `.chat-composer`。文案与卡片整块继续派发同一事件。

- [x] **Step 4: 增加链接加载页**

`linkLoadingView()` 输出深色浏览器栏、关闭图标、显示域名、绿色进度线、白色内容区和 `data-testid="link-loading"` 的居中深灰加载浮层；不得产生 fetch、iframe 或外部导航。

- [x] **Step 5: 分别重绘浅色和深色联系人页**

`contactView(lane, added)` 按 `lane` 选择主题，保留相同资料字段和测试 ID，但原链路为浅色、新链路为深色；头像、姓名、企业和缩略图全部 CSS 虚构。

- [x] **Step 6: 运行新链路、计时器与自动演示测试**

Run:

```bash
DEMO_BASE_URL=http://127.0.0.1:52784 playwright-test tests/wecom-flow.spec.js --workers=1 --grep "new flow|loading screen|autoplay|takeover|reset|timer"
```

Expected: 双入口都经历加载状态再到联系人页；自动演示新链路仍先完成；重置和接管无残留计时器。

### Task 4: 全量验收、同步权威源与发布

**Files:**
- Modify: 权威源目录中的 `网站源码/demo-wecom-flow.html`（目录位置不写入公开仓库）
- Verify: `demo-wecom-flow.html`
- Verify: `cases.html`

- [x] **Step 1: 运行全量浏览器测试和本地链接扫描**

Run:

```bash
DEMO_BASE_URL=http://127.0.0.1:52784 playwright-test tests/wecom-flow.spec.js --workers=1
python3 tests/check_local_links.py
```

Expected: 全部测试 PASS；本地引用 `missing=[]`。

- [x] **Step 2: 逐状态视觉验收**

在 `1440x900`、`1024x768`、`390x844`、`360x800` 检查无横向溢出和重叠；保存八个关键状态截图，仅在临时目录与视频关键帧并排核对。重点检查短视频广告、H5 长页、菜单、深色会话、加载页和两种联系人主题。

- [x] **Step 3: 执行公开边界扫描**

Run:

```bash
rg -n "work\.example|https?://|/Users/|\.mp4|真实客户名|真实联系人名" demo-wecom-flow.html tests/wecom-flow.spec.js docs/superpowers
git status --short
```

Expected: HTML 中无外链、绝对路径、视频引用和真实识别信息；规格中对禁止项的文字命中需人工确认，不能形成运行时资源；Git 状态无视频和关键帧。

- [x] **Step 4: 同步权威源并校验哈希**

将审核通过的 `demo-wecom-flow.html` 同步到权威目录，随后比较 SHA-256，两个文件必须一致。`cases.html` 本轮不修改。

- [ ] **Step 5: 提交并推送**

Run:

```bash
git add demo-wecom-flow.html tests/wecom-flow.spec.js docs/superpowers/specs/2026-08-12-wecom-acquisition-flow-demo-design.md docs/superpowers/plans/2026-08-12-wecom-flow-high-fidelity-redraw.md
git commit -m "feat: redraw WeCom flow demo from video references"
git push origin main
```

Expected: `main` 推送成功；提交不含本地视频、关键帧或真实素材。

- [ ] **Step 6: 验收 GitHub Pages**

等待 Pages 对新提交显示 `completed success`；使用 `?nc=<commit>` 下载线上 HTML，比对 SHA-256，并在线走通手动双入口、自动演示与 390px 手机布局。
