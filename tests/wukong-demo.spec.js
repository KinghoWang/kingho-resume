const { test, expect } = require('playwright/test');

const BASE = process.env.DEMO_BASE_URL || 'http://127.0.0.1:52784';
const PAGE_URL = `${BASE}/demo-wukong.html`;
const STORAGE_KEY = 'wukong-demo-state';

async function openDemo(page) {
  const response = await page.goto(PAGE_URL);
  expect(response, 'demo-wukong.html should return a document response').not.toBeNull();
  expect(response.status(), 'demo-wukong.html should exist before behavior assertions run').toBe(200);
}

async function createTask(page) {
  await page.getByTestId('generate-task').click();
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'RUNNING');
}

async function reachGateFailure(page) {
  await createTask(page);
  await page.getByTestId('run-to-gate').click();
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'GATE_FAILED');
}

async function recoverGate(page) {
  await reachGateFailure(page);
  await page.getByTestId('repair-clear-cache').check();
  await page.getByTestId('apply-repair').click();
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'GATE_RECOVERED');
}

async function reachReview(page) {
  await recoverGate(page);
  await page.getByTestId('continue-review').click();
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'REVIEW');
}

async function submitSingleRework(page) {
  await reachReview(page);
  const rows = page.getByTestId('review-item');
  await rows.nth(0).getByRole('button', { name: '通过' }).click();
  await rows.nth(1).getByRole('button', { name: '重做' }).click();
  await rows.nth(2).getByRole('button', { name: '通过' }).click();
  await page.getByTestId('review-submit').click();
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'REWORK');
}

async function reachComments(page) {
  await submitSingleRework(page);
  await page.getByTestId('run-rework').click();
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'COMMENTS');
}

test('starts as a sanitized, offline-only static demonstration', async ({ page }) => {
  const secondaryRequests = [];
  const sockets = [];
  page.on('request', request => {
    if (request.url() !== PAGE_URL) secondaryRequests.push(request.url());
  });
  page.on('websocket', socket => sockets.push(socket.url()));

  await openDemo(page);
  await page.waitForTimeout(100);

  await expect(page).toHaveTitle(/悟空.*生产管线.*Demo/);
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'SETUP');
  await expect(page.getByTestId('privacy-note')).toContainText('静态脱敏演示');
  await expect(page.getByTestId('privacy-note')).toContainText('不连接生产环境');
  await expect(page.getByTestId('privacy-note')).toContainText('不含真实素材');
  await expect(page.getByTestId('privacy-note')).toContainText('不调用真实模型');

  await expect(page.locator('img, video, audio, iframe')).toHaveCount(0);
  await expect(page.locator('script[src], link[rel="stylesheet"], a[href^="http"]')).toHaveCount(0);
  expect(secondaryRequests).toEqual([]);
  expect(sockets).toEqual([]);

  const source = await page.content();
  expect(source).not.toMatch(/https?:\/\//i);
  expect(source).not.toMatch(/\/Users\/|[A-Z]:\\|\bsk-[A-Za-z0-9]|api[_-]?key/i);
  expect(await page.evaluate(key => sessionStorage.getItem(key), STORAGE_KEY)).toBeNull();
});

test('validates the synthetic setup and generates three segments with 25 task cards', async ({ page }) => {
  await openDemo(page);

  await expect(page.getByTestId('source-a')).toHaveValue('课程素材 A');
  await expect(page.getByTestId('reference-b')).toHaveValue('参考节奏 B');
  await expect(page.getByTestId('sku')).toHaveValue('兴趣课程体验包');
  await expect(page.getByTestId('brand')).toHaveValue('示例品牌');
  await expect(page.getByTestId('job')).toHaveValue('course_demo_01');

  await page.getByTestId('source-a').fill('');
  await page.getByTestId('generate-task').click();
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'SETUP');
  await expect(page.getByTestId('status-live')).toContainText('五个字段均为必填');

  await page.getByTestId('source-a').fill('课程素材 A');
  await createTask(page);
  await expect(page.getByTestId('segment')).toHaveCount(3);
  await expect(page.getByTestId('segment').nth(0)).toContainText('解构填表');
  await expect(page.getByTestId('segment').nth(1)).toContainText('渲染过门');
  await expect(page.getByTestId('segment').nth(2)).toContainText('耳审交付');
  await expect(page.getByTestId('task-card')).toHaveCount(25);
  await expect(page.getByTestId('progress-summary')).toContainText(/0\s*\/\s*25/);
  await expect(page.getByTestId('existing-job-note')).toContainText('同名任务不会覆盖既有卡');
});

test('ignores an Agent completion claim and parks on failed verification evidence', async ({ page }) => {
  await openDemo(page);
  await reachGateFailure(page);

  await expect(page.getByTestId('progress-summary')).toContainText(/11\s*\/\s*25/);
  await expect(page.getByTestId('agent-claim')).toContainText('已完成');
  await expect(page.getByTestId('agent-claim')).toContainText('自述无效');
  await expect(page.getByTestId('gate-evidence')).toContainText('音频缓存门');
  await expect(page.getByTestId('gate-evidence')).toContainText('FAIL');
  await expect(page.getByTestId('status-live')).toContainText('流程已停车');
  await expect(page.getByTestId('continue-review')).toBeDisabled();
  await expect(page.getByTestId('demo-root')).not.toHaveAttribute('data-state', 'REVIEW');
});

test('allows only whitelisted repair actions before the failed card can recover', async ({ page }) => {
  await openDemo(page);
  await reachGateFailure(page);

  await expect(page.getByTestId('repair-rerun')).toBeEnabled();
  await expect(page.getByTestId('repair-clear-cache')).toBeEnabled();
  await expect(page.getByTestId('repair-geometry')).toBeEnabled();
  await expect(page.getByTestId('repair-modify-gate')).toBeDisabled();
  await expect(page.getByTestId('repair-modify-gate-note')).toContainText('不可由执行 Agent 改写');

  await page.getByTestId('repair-clear-cache').check();
  await page.getByTestId('apply-repair').click();
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'GATE_RECOVERED');
  await expect(page.getByTestId('gate-history')).toContainText('FAIL');
  await expect(page.getByTestId('gate-history')).toContainText('PASS');
  await expect(page.getByTestId('gate-history').locator('[data-mark="fail"]')).toHaveCount(1);
  await expect(page.getByTestId('gate-history').locator('[data-mark="pass"]')).toHaveCount(1);
  await expect(page.getByTestId('continue-review')).toBeEnabled();
});

test('keeps the gate failed when an allowed repair does not address the current evidence', async ({ page }) => {
  await openDemo(page);
  await reachGateFailure(page);

  await page.getByTestId('repair-rerun').check();
  await page.getByTestId('apply-repair').click();
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'GATE_FAILED');
  await expect(page.getByTestId('status-live')).toContainText('重跑脚本');
  await expect(page.getByTestId('status-live')).toContainText('缓存指纹仍不一致');

  await page.getByTestId('repair-geometry').check();
  await page.getByTestId('apply-repair').click();
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'GATE_FAILED');
  await expect(page.getByTestId('status-live')).toContainText('几何数值');
  await expect(page.getByTestId('status-live')).toContainText('不适用于音频缓存门');
});

test('blocks incomplete ear review and invalidates only the sentence marked for rework', async ({ page }) => {
  await openDemo(page);
  await reachReview(page);

  const rows = page.getByTestId('review-item');
  await expect(rows).toHaveCount(3);
  await expect(page.getByTestId('review-progress')).toContainText(/0\s*\/\s*3/);
  await expect(page.getByTestId('review-submit')).toBeDisabled();

  await rows.nth(0).getByRole('button', { name: '通过' }).click();
  await rows.nth(1).getByRole('button', { name: '重做' }).click();
  await expect(page.getByTestId('review-progress')).toContainText(/2\s*\/\s*3/);
  await expect(page.getByTestId('review-submit')).toBeDisabled();

  await rows.nth(2).getByRole('button', { name: '通过' }).click();
  await expect(page.getByTestId('review-submit')).toBeEnabled();
  await page.getByTestId('review-submit').click();
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'REWORK');
  await expect(page.getByTestId('rework-summary')).toContainText('仅第 2 条缓存失效');
  await expect(page.getByTestId('frozen-review-item')).toHaveCount(2);
  await expect(page.getByTestId('invalidated-review-item')).toHaveCount(1);
  await expect(page.getByTestId('invalidated-review-item')).toHaveAttribute('data-review-index', '2');
});

test('keeps keyboard focus on the review choice after updating its pressed state', async ({ page }) => {
  await openDemo(page);
  await reachReview(page);

  const choice = page.getByTestId('review-item').nth(0).getByRole('button', { name: '通过' });
  await choice.focus();
  await page.keyboard.press('Enter');

  const restoredChoice = page.getByTestId('review-item').nth(0).getByRole('button', { name: '通过' });
  await expect(restoredChoice).toHaveAttribute('aria-pressed', 'true');
  await expect(restoredChoice).toBeFocused();
});

test('renders every selected rework item and freezes only passed items', async ({ page }) => {
  await openDemo(page);
  await reachReview(page);

  const rows = page.getByTestId('review-item');
  await rows.nth(0).getByRole('button', { name: '重做' }).click();
  await rows.nth(1).getByRole('button', { name: '通过' }).click();
  await rows.nth(2).getByRole('button', { name: '重做' }).click();
  await page.getByTestId('review-submit').click();

  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'REWORK');
  await expect(page.getByTestId('rework-summary')).toContainText('第 1、3 条缓存失效');
  await expect(page.getByTestId('invalidated-review-item')).toHaveCount(2);
  await expect(page.getByTestId('invalidated-review-item').nth(0)).toHaveAttribute('data-review-index', '1');
  await expect(page.getByTestId('invalidated-review-item').nth(1)).toHaveAttribute('data-review-index', '3');
  await expect(page.getByTestId('frozen-review-item')).toHaveCount(1);
});

test('skips rework when every review item passes', async ({ page }) => {
  await openDemo(page);
  await reachReview(page);

  const rows = page.getByTestId('review-item');
  for (let index = 0; index < 3; index += 1) {
    await rows.nth(index).getByRole('button', { name: '通过' }).click();
  }
  await page.getByTestId('review-submit').click();

  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'COMMENTS');
  await expect(page.getByTestId('status-live')).toContainText('全部通过');
  await expect(page.getByTestId('run-rework')).toHaveCount(0);
});

test('routes timestamped free text to audit before applying a deterministic action', async ({ page }) => {
  await openDemo(page);
  await reachComments(page);

  await expect(page.getByTestId('synthetic-timeline')).toBeVisible();
  await expect(page.locator('video, audio')).toHaveCount(0);
  await expect(page.getByTestId('comment-time')).toHaveValue('18.4s');
  await expect(page.getByTestId('comment-text')).toHaveValue('这一句口播偏快，停顿再留半拍');
  await page.getByTestId('add-comment').click();
  await expect(page.getByTestId('comment-draft')).toContainText('18.4s');
  await expect(page.getByTestId('comment-draft')).toContainText('音频');
  await page.getByTestId('submit-comments').click();

  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'AUDIT_PENDING');
  await expect(page.getByTestId('audit-status')).toContainText('等待审计');
  await expect(page.getByTestId('audit-status')).toContainText('不会直接发给执行 Agent');
  await expect(page.getByTestId('audit-resolution')).toBeEmpty();
  await expect(page.getByTestId('progress-summary')).not.toContainText(/25\s*\/\s*25/);

  await page.getByTestId('audit-backfill').click();
  await expect(page.getByTestId('audit-resolution')).toContainText('拉长该句 0.4 秒并重跑音频门');
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'COMPLETE');
  await expect(page.getByTestId('progress-summary')).toContainText(/25\s*\/\s*25/);
});

test('treats a custom audit comment as text and preserves it through submission', async ({ page }) => {
  await openDemo(page);
  await reachComments(page);

  const payload = '<img data-testid="injected-node" src=x onerror="window.__commentInjected=true">自定义留言';
  await page.getByTestId('comment-text').fill(payload);
  await page.getByTestId('add-comment').click();

  await expect(page.getByTestId('comment-draft')).toContainText(payload);
  await expect(page.getByTestId('injected-node')).toHaveCount(0);
  expect(await page.evaluate(() => window.__commentInjected)).toBeUndefined();

  await page.getByTestId('submit-comments').click();
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'AUDIT_PENDING');
  await expect(page.getByTestId('submitted-comment')).toContainText(payload);
  await expect(page.getByTestId('injected-node')).toHaveCount(0);
  expect(await page.evaluate(() => window.__commentInjected)).toBeUndefined();
});

test('restores the failed gate from sessionStorage after refresh without storing free text', async ({ page }) => {
  await openDemo(page);
  await reachGateFailure(page);

  const stored = await page.evaluate(key => sessionStorage.getItem(key), STORAGE_KEY);
  expect(stored).not.toBeNull();
  expect(JSON.parse(stored).state).toBe('GATE_FAILED');
  expect(stored).not.toMatch(/\/Users\/|https?:\/\/|sk-[A-Za-z0-9]/i);

  await page.reload();
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'GATE_FAILED');
  await expect(page.getByTestId('progress-summary')).toContainText(/11\s*\/\s*25/);
  await expect(page.getByTestId('gate-evidence')).toContainText('FAIL');
});

test('reset clears persisted state and every pending automatic transition', async ({ page }) => {
  await openDemo(page);
  await reachGateFailure(page);
  await page.getByTestId('reset-demo').click();

  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'SETUP');
  await expect(page.getByTestId('progress-summary')).toContainText(/0\s*\/\s*25/);
  expect(await page.evaluate(key => sessionStorage.getItem(key), STORAGE_KEY)).toBeNull();
  await page.waitForTimeout(1200);
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', 'SETUP');
});

test('a real user action takes over an automatic demonstration without losing progress', async ({ page }) => {
  await openDemo(page);
  await page.getByTestId('auto-demo').click();
  await expect(page.getByTestId('mode-status')).toContainText('自动演示');
  await expect(page.getByTestId('demo-root')).not.toHaveAttribute('data-state', 'SETUP', { timeout: 3000 });

  const stateAtTakeover = await page.getByTestId('demo-root').getAttribute('data-state');
  const progressAtTakeover = await page.getByTestId('progress-summary').textContent();
  await page.getByTestId('evidence-panel').click({ position: { x: 12, y: 12 } });
  await expect(page.getByTestId('mode-status')).toContainText('手动接管');
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', stateAtTakeover);
  await expect(page.getByTestId('progress-summary')).toHaveText(progressAtTakeover.trim());

  await page.waitForTimeout(1200);
  await expect(page.getByTestId('demo-root')).toHaveAttribute('data-state', stateAtTakeover);
  await expect(page.getByTestId('progress-summary')).toHaveText(progressAtTakeover.trim());
});

for (const viewport of [
  { name: 'narrow mobile', width: 360, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`${viewport.name} has no horizontal overflow and keeps every visible button at least 44px tall`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openDemo(page);
    await reachGateFailure(page);

    const geometry = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);

    const undersized = await page.locator('button:visible').evaluateAll(buttons => buttons
      .map(button => ({ label: button.textContent.trim(), height: button.getBoundingClientRect().height }))
      .filter(button => button.height < 44));
    expect(undersized, `buttons shorter than 44px at ${viewport.width}px`).toEqual([]);

    const rootBox = await page.getByTestId('demo-root').boundingBox();
    expect(rootBox.x).toBeGreaterThanOrEqual(0);
    expect(rootBox.x + rootBox.width).toBeLessThanOrEqual(viewport.width + 1);
  });
}
