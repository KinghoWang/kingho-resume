# 企微获客链路交互 Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增一个可在 GitHub Pages 直接运行的双手机交互 Demo，让用户亲手对比旧链路长按 / 系统菜单与新链路文案 / 卡片双入口，并从 `cases.html` Case 01 进入。

**Architecture:** `demo-wecom-flow.html` 继续遵循仓库现有单文件 Demo 模式，内含语义 HTML、响应式 CSS 和纯 JavaScript 有限状态机；`tests/wecom-flow.spec.js` 用 Playwright 从用户视角覆盖手动、长按、自动演示、接管、重置与移动端布局。`cases.html` 只做一处入口集成，不改写现有案例事实和 KPI。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、Playwright（使用 Codex bundled Node runtime）、Python `http.server`、GitHub Pages

---

## 文件结构

- Create: `demo-wecom-flow.html` — 完整交互页面、状态机、渲染、长按和自动演示。
- Create: `tests/wecom-flow.spec.js` — Playwright 浏览器回归测试，直接校验公开页面行为。
- Modify: `cases.html:250-256` — 在 Case 01 故事卡之后加入 Demo 入口。
- Modify: `docs/superpowers/specs/2026-08-12-wecom-acquisition-flow-demo-design.md:4` — 将规格状态改为用户已通过。

测试命令统一使用：

```bash
playwright test tests/wecom-flow.spec.js --workers=1
```

本地服务统一使用：

```bash
python3 -m http.server 52784 --bind 127.0.0.1
```

### Task 1: 建立失败的页面骨架与集成测试

**Files:**
- Create: `tests/wecom-flow.spec.js`
- Create: `demo-wecom-flow.html`

- [x] **Step 1: 写页面存在性、双链路起点和隐私边界的失败测试**

在 `tests/wecom-flow.spec.js` 写入测试夹具和首组断言：

```js
const { test, expect } = require('playwright/test');

const BASE = process.env.DEMO_BASE_URL || 'http://127.0.0.1:52784';

test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE}/demo-wecom-flow.html`);
});

test('loads two independent lanes at the shared ad start', async ({ page }) => {
  await expect(page).toHaveTitle('企微获客链路交互模拟');
  await expect(page.getByTestId('privacy-note')).toContainText('无真实素材');
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_AD');
  await expect(page.getByTestId('new-phone')).toHaveAttribute('data-state', 'NEW_AD');
  await expect(page.getByTestId('old-claim')).toBeVisible();
  await expect(page.getByTestId('new-claim')).toBeVisible();
  await expect(page.locator('a[href^="http"]')).toHaveCount(0);
});
```

- [x] **Step 2: 启动本地服务并确认测试以页面缺失失败**

在仓库根目录启动服务，再在另一个终端运行统一测试命令。

Expected: FAIL，原因包含 `404`、标题不匹配或找不到 `old-phone`。

- [x] **Step 3: 写最小语义页面骨架**

创建 `demo-wecom-flow.html`，先提供稳定的测试钩子和无外部依赖声明：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>企微获客链路交互模拟</title>
</head>
<body>
  <header class="demo-header">
    <a href="cases.html#case-lianlu">返回企微获客案例</a>
    <p data-testid="privacy-note">虚构重绘 · 无真实素材 · 无真实链接</p>
  </header>
  <main>
    <section aria-labelledby="old-title">
      <h2 id="old-title">原链路</h2>
      <div data-testid="old-phone" data-state="OLD_AD">
        <button data-testid="old-claim" type="button">立即领取</button>
      </div>
    </section>
    <section aria-labelledby="new-title">
      <h2 id="new-title">新链路</h2>
      <div data-testid="new-phone" data-state="NEW_AD">
        <button data-testid="new-claim" type="button">立即领取</button>
      </div>
    </section>
  </main>
</body>
</html>
```

- [x] **Step 4: 运行测试确认骨架通过**

Run: 统一测试命令。

Expected: `1 passed`。

- [x] **Step 5: 提交页面骨架和首个回归测试**

```bash
git add demo-wecom-flow.html tests/wecom-flow.spec.js
git commit -m "test: scaffold WeCom flow demo"
```

### Task 2: 实现明确状态机和手动成功路径

**Files:**
- Modify: `demo-wecom-flow.html`
- Modify: `tests/wecom-flow.spec.js`

- [x] **Step 1: 写状态机、链路独立性和双入口失败测试**

追加以下核心测试：

```js
test('manual lanes advance independently and both reach added', async ({ page }) => {
  await page.getByTestId('new-claim').click();
  await expect(page.getByTestId('new-phone')).toHaveAttribute('data-state', 'NEW_CHAT');
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_AD');

  await expect(page.getByTestId('acquisition-text')).toBeVisible();
  await expect(page.getByTestId('acquisition-card')).toBeVisible();
  await page.getByTestId('acquisition-text').click();
  await expect(page.getByTestId('new-phone')).toHaveAttribute('data-state', 'NEW_CONTACT');
  await page.getByTestId('new-add-contact').click();
  await expect(page.getByTestId('new-phone')).toHaveAttribute('data-state', 'NEW_ADDED');

  await page.getByTestId('reset-all').click();
  await page.getByTestId('new-claim').click();
  await expect(page.getByTestId('acquisition-card')).toBeVisible();
  await page.getByTestId('acquisition-card').click();
  await expect(page.getByTestId('new-phone')).toHaveAttribute('data-state', 'NEW_CONTACT');
});

test('transition metadata reports standard path counts', async ({ page }) => {
  await expect(page.getByTestId('old-standard-actions')).toHaveText('4');
  await expect(page.getByTestId('old-friction-actions')).toHaveText('2');
  await expect(page.getByTestId('new-standard-actions')).toHaveText('3');
  await expect(page.getByTestId('new-friction-actions')).toHaveText('0');
});
```

- [x] **Step 2: 运行测试确认因状态机未实现而失败**

Run: 统一测试命令。

Expected: FAIL，找不到 `reset-all`、`acquisition-text` 或状态未推进。

- [x] **Step 3: 定义状态、事件和转移元数据**

在页面脚本中定义稳定名称：

```js
const INITIAL = Object.freeze({
  mode: 'manual', countdown: null, oldLane: 'OLD_AD', newLane: 'NEW_AD'
});

const TRANSITIONS = Object.freeze({
  old: {
    OLD_AD: { CLAIM_CLICK: { to: 'OLD_H5', userAction: 1, highFriction: 0 } },
    OLD_H5: { HOLD_START: { to: 'OLD_HOLDING', userAction: 0, highFriction: 0 } },
    OLD_HOLDING: {
      HOLD_COMPLETE: { to: 'OLD_MENU', userAction: 1, highFriction: 1 },
      HOLD_ABORT: { to: 'OLD_H5', userAction: 0, highFriction: 0 }
    },
    OLD_MENU: {
      MENU_OPEN_CONTACT: { to: 'OLD_CONTACT', userAction: 1, highFriction: 1 },
      MENU_CANCEL: { to: 'OLD_H5', userAction: 0, highFriction: 0 },
      MENU_SHARE: { to: 'OLD_MENU', userAction: 0, highFriction: 0 },
      MENU_SAVE: { to: 'OLD_MENU', userAction: 0, highFriction: 0 }
    },
    OLD_CONTACT: { ADD_CONTACT: { to: 'OLD_ADDED', userAction: 1, highFriction: 0 } }
  },
  new: {
    NEW_AD: { CLAIM_CLICK: { to: 'NEW_CHAT', userAction: 1, highFriction: 0 } },
    NEW_CHAT: { SEND_TEXT: { to: 'NEW_TEXT_SENT', userAction: 0, highFriction: 0 } },
    NEW_TEXT_SENT: {
      SEND_CARD: { to: 'NEW_BOTH_SENT', userAction: 0, highFriction: 0 },
      ACQUISITION_CLICK: { to: 'NEW_CONTACT', userAction: 1, highFriction: 0 }
    },
    NEW_BOTH_SENT: {
      ACQUISITION_CLICK: { to: 'NEW_CONTACT', userAction: 1, highFriction: 0 }
    },
    NEW_CONTACT: { ADD_CONTACT: { to: 'NEW_ADDED', userAction: 1, highFriction: 0 } }
  }
});
```

- [x] **Step 4: 实现 `dispatch`、单向渲染和会话消息调度**

实现这些接口，所有事件都经过 `dispatch`：

```js
function dispatch(lane, event) {
  const stateKey = lane === 'old' ? 'oldLane' : 'newLane';
  const transition = TRANSITIONS[lane][state[stateKey]]?.[event];
  if (!transition) return false;
  state[stateKey] = transition.to;
  if (lane === 'new' && event === 'ACQUISITION_CLICK') clearTimers('message');
  render();
  return true;
}

function scheduleLaneMessages() {
  if (state.newLane === 'NEW_CHAT') {
    registerTimer('message', 500, () => dispatch('new', 'SEND_TEXT'));
    registerTimer('message', 1100, () => dispatch('new', 'SEND_CARD'));
  } else if (state.newLane === 'NEW_TEXT_SENT') {
    registerTimer('message', 500, () => dispatch('new', 'SEND_CARD'));
  }
}
```

`renderOldLane()` 和 `renderNewLane()` 必须根据状态生成广告、H5、菜单、会话、文案、卡片、联系人及已添加画面，并在根节点同步 `data-state`。文案控件和卡片控件都使用 `type="button"` 且共同派发 `ACQUISITION_CLICK`。

- [x] **Step 5: 从转移元数据计算标准动作指标**

定义标准事件序列，再复用转移元数据求和：

```js
const STANDARD_PATHS = Object.freeze({
  old: [
    ['OLD_AD', 'CLAIM_CLICK'],
    ['OLD_HOLDING', 'HOLD_COMPLETE'],
    ['OLD_MENU', 'MENU_OPEN_CONTACT'],
    ['OLD_CONTACT', 'ADD_CONTACT']
  ],
  new: [
    ['NEW_AD', 'CLAIM_CLICK'],
    ['NEW_BOTH_SENT', 'ACQUISITION_CLICK'],
    ['NEW_CONTACT', 'ADD_CONTACT']
  ]
});

function sumPath(lane, field) {
  return STANDARD_PATHS[lane].reduce(
    (sum, [from, event]) => sum + TRANSITIONS[lane][from][event][field], 0
  );
}
```

- [x] **Step 6: 运行测试确认新链路和指标通过**

Run: 统一测试命令。

Expected: 所有现有测试 PASS。

- [x] **Step 7: 提交状态机与手动新链路**

```bash
git add demo-wecom-flow.html tests/wecom-flow.spec.js
git commit -m "feat: add WeCom flow state machines"
```

### Task 3: 实现原链路长按、菜单分支和键盘操作

**Files:**
- Modify: `demo-wecom-flow.html`
- Modify: `tests/wecom-flow.spec.js`

- [x] **Step 1: 写短按、真实长按、取消和无效菜单项失败测试**

```js
test('old flow requires an 800ms hold and supports menu branches', async ({ page }) => {
  await page.getByTestId('old-claim').click();
  const qr = page.getByTestId('old-qr');

  await qr.dispatchEvent('pointerdown', { pointerType: 'mouse', button: 0 });
  await page.waitForTimeout(200);
  await qr.dispatchEvent('pointerup', { pointerType: 'mouse', button: 0 });
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_H5');
  await expect(page.getByTestId('feedback')).toContainText('请长按二维码');

  await qr.dispatchEvent('pointerdown', { pointerType: 'mouse', button: 0 });
  await page.waitForTimeout(850);
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_MENU');
  await page.getByTestId('menu-share').click();
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_MENU');
  await page.getByTestId('menu-cancel').click();
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_H5');
});

test('old flow completes with keyboard hold', async ({ page }) => {
  await page.getByTestId('old-claim').click();
  const qr = page.getByTestId('old-qr');
  await qr.focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(850);
  await page.keyboard.up('Space');
  await page.getByTestId('menu-open-contact').click();
  await page.getByTestId('old-add-contact').click();
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_ADDED');
});
```

- [x] **Step 2: 运行测试确认长按行为失败**

Run: 统一测试命令。

Expected: FAIL，状态停在 `OLD_H5` 或缺少菜单控件。

- [x] **Step 3: 实现统一的长按生命周期**

实现 `startHold` / `abortHold` / `completeHold`，鼠标、触屏和空格键复用同一逻辑：

```js
function startHold() {
  if (state.oldLane !== 'OLD_H5' || hold.active) return;
  dispatch('old', 'HOLD_START');
  hold.active = true;
  hold.timer = registerTimer('hold', 800, completeHold);
}

function abortHold() {
  if (!hold.active) return;
  clearTimer(hold.timer);
  hold.active = false;
  dispatch('old', 'HOLD_ABORT');
  showFeedback('请长按二维码');
}

function completeHold() {
  if (!hold.active || state.oldLane !== 'OLD_HOLDING') return;
  hold.active = false;
  dispatch('old', 'HOLD_COMPLETE');
}
```

在伪二维码上绑定 `pointerdown`、`pointerup`、`pointercancel`、`pointerleave`、`keydown` 和 `keyup`。阻止 `contextmenu`，且空格键只在非重复按键时启动。

- [x] **Step 4: 实现菜单与联系人结束页**

菜单按钮明确派发四个事件；联系人页新旧链路复用同一 DOM 结构和 CSS token，只有 `data-testid` 前缀不同。添加完成后按钮替换为不可操作的「已添加」。

- [x] **Step 5: 运行测试确认长按与菜单通过**

Run: 统一测试命令。

Expected: 所有测试 PASS。

- [x] **Step 6: 提交原链路交互**

```bash
git add demo-wecom-flow.html tests/wecom-flow.spec.js
git commit -m "feat: simulate legacy long-press flow"
```

### Task 4: 实现自动演示、用户接管和确定性重置

**Files:**
- Modify: `demo-wecom-flow.html`
- Modify: `tests/wecom-flow.spec.js`

- [x] **Step 1: 写自动完成顺序、接管补消息和重置失败测试**

```js
test('autoplay starts together and the new lane finishes first', async ({ page }) => {
  await page.getByTestId('auto-mode').click();
  await expect(page.getByTestId('countdown')).toHaveText('3');
  await expect(page.getByTestId('new-phone')).toHaveAttribute('data-state', 'NEW_ADDED', { timeout: 8500 });
  await expect(page.getByTestId('old-phone')).not.toHaveAttribute('data-state', 'OLD_ADDED');
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_ADDED', { timeout: 5000 });
});

test('user takeover preserves state and completes pending messages', async ({ page }) => {
  await page.getByTestId('auto-mode').click();
  await expect(page.getByTestId('new-phone')).toHaveAttribute('data-state', 'NEW_CHAT', { timeout: 5000 });
  await page.getByTestId('new-phone').click({ position: { x: 10, y: 10 } });
  await expect(page.getByTestId('mode-status')).toContainText('手动');
  await expect(page.getByTestId('acquisition-text')).toBeVisible();
  await expect(page.getByTestId('acquisition-card')).toBeVisible();
});

test('reset clears timers and returns both lanes to the shared ad', async ({ page }) => {
  await page.getByTestId('auto-mode').click();
  await page.getByTestId('reset-all').click();
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_AD');
  await expect(page.getByTestId('new-phone')).toHaveAttribute('data-state', 'NEW_AD');
  await page.waitForTimeout(4500);
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_AD');
  await expect(page.getByTestId('new-phone')).toHaveAttribute('data-state', 'NEW_AD');
});
```

- [x] **Step 2: 运行测试确认自动演示尚未实现**

Run: 统一测试命令。

Expected: FAIL，缺少 `auto-mode` 或状态未按时间线推进。

- [x] **Step 3: 实现分类计时器注册表**

```js
const timers = new Map();

function registerTimer(kind, delay, callback) {
  const id = window.setTimeout(() => {
    timers.delete(id);
    callback();
  }, delay);
  timers.set(id, kind);
  return id;
}

function clearTimers(kind) {
  for (const [id, timerKind] of timers) {
    if (!kind || timerKind === kind) {
      clearTimeout(id);
      timers.delete(id);
    }
  }
}
```

- [x] **Step 4: 实现倒计时和规格时间线**

`startAutoDemo()` 必须先 `resetAll({ mode: 'auto' })`，再通过 `demo` 计时器展示 3、2、1。倒计时结束后严格调度规格中的事件：

```js
const AUTO_EVENTS = Object.freeze([
  [3000, 'old', 'CLAIM_CLICK'], [3000, 'new', 'CLAIM_CLICK'],
  [3800, 'new', 'SEND_TEXT'], [4400, 'new', 'SEND_CARD'],
  [4400, 'old', 'HOLD_START'], [5200, 'old', 'HOLD_COMPLETE'],
  [6200, 'new', 'ACQUISITION_CLICK'], [7600, 'new', 'ADD_CONTACT'],
  [8000, 'old', 'MENU_OPEN_CONTACT'], [10700, 'old', 'ADD_CONTACT']
]);
```

自动演示中的新链路不得同时注册普通 `message` 消息定时器，否则会重复派发。

- [x] **Step 5: 实现用户接管和后台暂停**

`cancelAutomation()` 清除 `demo` 计时器、切为手动并调用 `scheduleLaneMessages()`；手机容器捕获 `pointerdown` / `keydown` 时先暂停，再让命中的控件继续处理。`visibilitychange` 进入 hidden 时暂停，回到 visible 时只补消息，不恢复自动演示。新链路入口只清理 `message` 计时器，原链路长按只使用 `hold` 计时器，二者不能互相取消。

- [x] **Step 6: 运行测试确认自动演示、接管和重置通过**

Run: 统一测试命令。

Expected: 所有测试 PASS；完整测试时间约 20 秒。

- [x] **Step 7: 提交自动演示**

```bash
git add demo-wecom-flow.html tests/wecom-flow.spec.js
git commit -m "feat: add WeCom flow autoplay"
```

### Task 5: 完成已批准视觉系统与响应式布局

**Files:**
- Modify: `demo-wecom-flow.html`
- Modify: `tests/wecom-flow.spec.js`

- [x] **Step 1: 写响应式、最小触控尺寸和无溢出失败测试**

```js
for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 360, height: 800 }
]) {
  test(`${viewport.name} layout has no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.reload();
    const sizes = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth);
    const box = await page.getByTestId('reset-all').boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
}
```

- [x] **Step 2: 运行测试确认未完成样式时失败**

Run: 统一测试命令。

Expected: 至少一个 viewport 因横向溢出或按钮高度不足 FAIL。

- [x] **Step 3: 落实已批准视觉 token 和稳定几何**

页面根部定义多色但克制的 token，避免单一色系：

```css
:root {
  --page:#eef2f3; --surface:#fff; --surface-soft:#f5f7f8;
  --ink:#20282d; --muted:#68757b; --line:#d9dfe3;
  --old:#b6463c; --old-soft:#fff2ef;
  --new:#267052; --new-soft:#edf7f1;
  --link:#286e9b; --phone:#15191c;
}
```

手机使用固定 `aspect-ratio: 9 / 18.4` 和受控宽度；状态画面放入固定高度内容区；步骤编号、按钮、反馈区和指标行均设置稳定尺寸。使用系统字体，不依赖远程字体或图片。

- [x] **Step 4: 实现桌面、平板和手机断点**

- `>= 980px`：`.stage` 双列，两条链路并排。
- `< 980px`：`.stage` 单列，每条链路手机与步骤并排。
- `< 580px`：手机居中，步骤栏两列或单列；主容器 padding 缩小。
- 所有控件 `min-height:44px`；文字允许换行；`body{overflow-x:hidden}` 只能作为兜底，测试仍要求根元素 `scrollWidth <= clientWidth`。

- [x] **Step 5: 加入焦点、长按进度与 reduced-motion**

为按钮、伪二维码和菜单项提供明显 `:focus-visible`；长按用 CSS 自定义属性绘制进度；在 `prefers-reduced-motion: reduce` 中关闭非必要位移和渐变动画，但保留状态切换。

- [x] **Step 6: 运行全部自动测试**

Run: 统一测试命令。

Expected: 全部 PASS。

- [x] **Step 7: 用浏览器截图检查四个 viewport 和关键状态**

用浏览器或 Playwright 打开本地 Demo，至少检查并保存到临时 QA 目录：

- `1440x900` 初始双手机。
- `1024x768` 自动演示中双入口与旧链路菜单同时可见。
- `390x844` 新链路联系人页。
- `360x800` 原链路 H5 长按状态。

逐张检查：页面非空、手机完整、中文正常、控件无重叠、文字不截断、没有横向滚动。

- [x] **Step 8: 提交视觉和响应式实现**

```bash
git add demo-wecom-flow.html tests/wecom-flow.spec.js
git commit -m "style: polish WeCom flow comparison"
```

### Task 6: 集成 Case 01 并做公开边界回归

**Files:**
- Modify: `cases.html:250-256`
- Modify: `tests/wecom-flow.spec.js`
- Modify: `docs/superpowers/specs/2026-08-12-wecom-acquisition-flow-demo-design.md:4`

- [x] **Step 1: 写案例入口、返回锚点和既有 KPI 保留失败测试**

```js
test('Case 01 links to the demo and preserves the published evidence', async ({ page }) => {
  await page.goto(`${BASE}/cases.html#case-lianlu`);
  const caseOne = page.locator('#case-lianlu');
  await expect(caseOne.getByRole('link', { name: '打开交互 Demo' }))
    .toHaveAttribute('href', 'demo-wecom-flow.html');
  await expect(caseOne).toContainText('曝光-加微率 +50%+');
  await expect(caseOne).toContainText('曝光-地址率 +40%+');
  await expect(caseOne).toContainText('后转无损');

  await page.goto(`${BASE}/demo-wecom-flow.html`);
  await expect(page.getByRole('link', { name: '返回企微获客案例' }))
    .toHaveAttribute('href', 'cases.html#case-lianlu');
});
```

- [x] **Step 2: 运行测试确认入口尚不存在**

Run: 统一测试命令。

Expected: FAIL，找不到「打开交互 Demo」。

- [x] **Step 3: 在 Case 01 故事卡后加入单一入口**

在 `cases.html` 的 `.story` 后、首个 `.panel` 前加入：

```html
<p class="demo-pointer">
  <a href="demo-wecom-flow.html">▶ 打开交互 Demo</a>
  · 从同一广告起点亲手走完原链路与新链路；全部界面虚构重绘，不含真实素材或链接。
</p>
```

复用现有 `.demo-pointer` 样式，不新增无必要 CSS。

- [x] **Step 4: 将规格状态更新纳入提交**

确认规格头部为：

```markdown
- 状态：用户已于 2026-08-12 通过书面规格
```

- [x] **Step 5: 运行全部自动测试与静态检查**

Run: 统一测试命令。

Run:

```bash
git diff --check
```

Run:

```bash
rg -n -i 'localhost|127\.0\.0\.1|file://|/Users/|api[_-]?key|access[_-]?token|keys\.json|ghp_[A-Za-z0-9]+' \
  demo-wecom-flow.html cases.html
```

Expected: Playwright 全部 PASS；`git diff --check` 无输出；敏感扫描无输出。

- [x] **Step 6: 运行全站本地链接扫描**

用 Python `html.parser` 收集仓库根目录 HTML 的 `href` / `src`，忽略 `http(s)`、锚点、`mailto:`、`tel:` 和 `data:`，断言所有相对文件存在。

Expected: `missing=[]`。

- [x] **Step 7: 提交案例集成**

```bash
git add cases.html tests/wecom-flow.spec.js docs/superpowers/specs/2026-08-12-wecom-acquisition-flow-demo-design.md
git commit -m "feat: link WeCom flow demo from case study"
```

### Task 7: 最终验证、同步远端并发布 GitHub Pages

**Files:**
- Verify: `demo-wecom-flow.html`
- Verify: `cases.html`
- Verify: `tests/wecom-flow.spec.js`

- [x] **Step 1: 获取最新远端并确认提交基线**

```bash
git fetch origin main
git rev-parse HEAD origin/main
git log --oneline --decorate -6
```

Expected: 能看到设计提交及实现提交；若 `origin/main` 有新提交，先无破坏地合并 / rebase 并重新跑全部测试，禁止 force push。

- [x] **Step 2: 最终运行完整测试**

Run: 统一测试命令。

Expected: 所有用例 PASS，且无未处理浏览器错误。

- [x] **Step 3: 做最终浏览器人工验收**

在桌面和手机 viewport 逐项操作：

1. 原链路短按失败、`0.8s` 长按、取消、重新长按、打开联系人、添加完成。
2. 新链路文案入口完成一次、重置后卡片入口完成一次。
3. 自动演示新链路先完成，原链路后完成。
4. 在 `NEW_CHAT` 和 `NEW_TEXT_SENT` 分别接管一次，消息均能补齐。
5. 自动中途重置，等待 5 秒后仍保持两边广告起点。

Expected: 每项与设计规格一致，浏览器控制台无 error。

- [x] **Step 4: 确认提交范围**

```bash
git status --short
git diff origin/main...HEAD --name-only
```

Expected: 只包含设计 / 计划文档、`demo-wecom-flow.html`、`cases.html` 和 `tests/wecom-flow.spec.js`；`.superpowers/` 仍未跟踪且未暂存；没有视频或真实素材。

- [ ] **Step 5: 推送 main**

```bash
git push origin main
```

Expected: `main -> main`，无 force push。

- [ ] **Step 6: 等待 Pages 部署成功并线上复验**

检查最新 `pages build and deployment` 对应 HEAD 为 `completed success`，再用缓存破除参数打开：

```text
https://kinghowang.github.io/kingho-resume/cases.html?nc=<short-sha>#case-lianlu
https://kinghowang.github.io/kingho-resume/demo-wecom-flow.html?nc=<short-sha>
```

在线重复：Case 01 入口、两条手动流程、自动演示、用户接管、移动端布局和脱敏扫描。最终截图与本地版本一致后才报告完成。
