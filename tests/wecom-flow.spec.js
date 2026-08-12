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

test('new flow accepts either message entry without advancing the old lane', async ({ page }) => {
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

test('transition metadata reports standard path counts from ad to added', async ({ page }) => {
  await expect(page.getByTestId('old-standard-actions')).toHaveText('4');
  await expect(page.getByTestId('old-friction-actions')).toHaveText('2');
  await expect(page.getByTestId('new-standard-actions')).toHaveText('3');
  await expect(page.getByTestId('new-friction-actions')).toHaveText('0');
});

test('step rails highlight the screen currently shown on each phone', async ({ page }) => {
  await expect(page.getByTestId('old-steps').locator('.step.active b')).toHaveText('广告起点');
  await expect(page.getByTestId('new-steps').locator('.step.active b')).toHaveText('广告起点');

  await page.getByTestId('old-claim').click();
  await expect(page.getByTestId('old-steps').locator('.step.active b')).toHaveText('H5 落地页');

  await page.getByTestId('new-claim').click();
  await expect(page.getByTestId('new-steps').locator('.step.active b')).toHaveText('客服会话');
  await expect(page.getByTestId('acquisition-card')).toBeVisible();
  await expect(page.getByTestId('new-steps').locator('.step.active b')).toHaveText('文案 + 卡片');
});

test('async card delivery preserves focus on the existing text entry', async ({ page }) => {
  await page.getByTestId('new-claim').click();
  const textEntry = page.getByTestId('acquisition-text');
  await textEntry.waitFor({ state: 'visible' });
  await textEntry.focus();
  await expect(textEntry).toBeFocused();
  await page.getByTestId('acquisition-card').waitFor({ state: 'visible' });
  await expect(page.getByTestId('acquisition-text')).toBeFocused();
});

test('old flow rejects a short press and keeps menu side actions non-progressing', async ({ page }) => {
  await page.getByTestId('old-claim').click();
  let qrBox = await page.getByTestId('old-qr').boundingBox();
  let qrCenter = { x: qrBox.x + qrBox.width / 2, y: qrBox.y + qrBox.height / 2 };

  await page.mouse.move(qrCenter.x, qrCenter.y);
  await page.mouse.down();
  await page.waitForTimeout(200);
  await page.mouse.up();
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_H5');
  await expect(page.getByTestId('feedback')).toContainText('请长按二维码');

  qrBox = await page.getByTestId('old-qr').boundingBox();
  qrCenter = { x: qrBox.x + qrBox.width / 2, y: qrBox.y + qrBox.height / 2 };
  await page.mouse.move(qrCenter.x, qrCenter.y);
  await page.mouse.down();
  await page.waitForTimeout(850);
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_MENU');
  await page.mouse.up();
  await page.getByTestId('menu-share').click();
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_MENU');
  await expect(page.getByTestId('feedback')).toContainText('仅作提示');
  await page.getByTestId('menu-save').click();
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_MENU');
  await page.getByTestId('menu-cancel').click();
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_H5');
});

test('old flow completes with an 800ms keyboard hold', async ({ page }) => {
  await page.getByTestId('old-claim').click();
  const qr = page.getByTestId('old-qr');
  await qr.focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(850);
  await page.keyboard.up('Space');
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_MENU');
  await page.getByTestId('menu-open-contact').click();
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_CONTACT');
  await page.getByTestId('old-add-contact').click();
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_ADDED');
});

test('keyboard release before 800ms aborts the hold', async ({ page }) => {
  await page.getByTestId('old-claim').click();
  const qr = page.getByTestId('old-qr');
  await qr.focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(200);
  await page.keyboard.up('Space');
  await page.waitForTimeout(700);
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_H5');
  await expect(page.getByTestId('feedback')).toContainText('请长按二维码');
});

test('a real touch tap remains a short press after the hold view rerenders', async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/demo-wecom-flow.html`);
  await page.getByTestId('old-claim').tap();
  await page.getByTestId('old-qr').tap();
  await page.waitForTimeout(900);
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_H5');
  await expect(page.getByTestId('feedback')).toContainText('请长按二维码');
  await context.close();
});

test('system menu is announced as a dialog and receives focus', async ({ page }) => {
  await page.getByTestId('old-claim').click();
  const qr = page.getByTestId('old-qr');
  await qr.focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(850);
  await page.keyboard.up('Space');
  await expect(page.getByRole('dialog', { name: '模拟系统菜单' })).toBeVisible();
  await expect(page.getByTestId('menu-open-contact')).toBeFocused();
  await page.getByTestId('menu-cancel').click();
  await expect(page.getByTestId('old-qr')).toBeFocused();
});

test('new-flow clicks do not cancel an active old-flow hold', async ({ page }) => {
  await page.getByTestId('old-claim').click();
  await page.getByTestId('new-claim').click();

  await page.getByTestId('old-qr').dispatchEvent('pointerdown', {
    pointerType: 'touch', pointerId: 11, button: 0
  });
  await page.waitForTimeout(300);
  await expect(page.getByTestId('acquisition-text')).toBeVisible();
  await page.getByTestId('acquisition-text').dispatchEvent('click');
  await expect(page.getByTestId('new-phone')).toHaveAttribute('data-state', 'NEW_CONTACT');
  await page.waitForTimeout(550);
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_MENU');
});

test('autoplay counts down, starts together, and finishes the new lane first', async ({ page }) => {
  await page.getByTestId('auto-mode').click();
  await expect(page.getByTestId('countdown')).toHaveText('3');
  await expect(page.getByTestId('new-phone')).toHaveAttribute('data-state', 'NEW_ADDED', { timeout: 8500 });
  await expect(page.getByTestId('old-phone')).not.toHaveAttribute('data-state', 'OLD_ADDED');
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_ADDED', { timeout: 5000 });
});

test('user takeover preserves progress and completes pending chat messages', async ({ page }) => {
  await page.getByTestId('auto-mode').click();
  await expect(page.getByTestId('new-phone')).toHaveAttribute('data-state', 'NEW_CHAT', { timeout: 5000 });
  await page.getByTestId('new-phone').click({ position: { x: 10, y: 10 } });
  await expect(page.getByTestId('mode-status')).toContainText('手动');
  await expect(page.getByTestId('new-phone')).not.toHaveAttribute('data-state', 'NEW_AD');
  await expect(page.getByTestId('acquisition-text')).toBeVisible();
  await expect(page.getByTestId('acquisition-card')).toBeVisible();
});

test('reset clears every pending autoplay event', async ({ page }) => {
  await page.getByTestId('auto-mode').click();
  await expect(page.getByTestId('countdown')).toHaveText('3');
  await page.getByTestId('reset-all').click();
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_AD');
  await expect(page.getByTestId('new-phone')).toHaveAttribute('data-state', 'NEW_AD');
  await page.waitForTimeout(4500);
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_AD');
  await expect(page.getByTestId('new-phone')).toHaveAttribute('data-state', 'NEW_AD');
});

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 360, height: 800 }
]) {
  test(`${viewport.name} layout has no horizontal overflow and keeps controls tappable`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.reload();
    const sizes = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth);

    const resetBox = await page.getByTestId('reset-all').boundingBox();
    expect(resetBox.height).toBeGreaterThanOrEqual(44);

    const oldPhoneBox = await page.getByTestId('old-phone').boundingBox();
    const newPhoneBox = await page.getByTestId('new-phone').boundingBox();
    expect(oldPhoneBox.width).toBeGreaterThan(200);
    expect(newPhoneBox.width).toBeGreaterThan(200);
  });
}

test('navigation links meet the 44px touch target on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const backBox = await page.getByRole('link', { name: '返回企微获客案例' }).boundingBox();
  expect(backBox.height).toBeGreaterThanOrEqual(44);

  await page.goto(`${BASE}/cases.html#case-lianlu`);
  const demoBox = await page.getByRole('link', { name: '打开交互 Demo' }).boundingBox();
  expect(demoBox.height).toBeGreaterThanOrEqual(44);
});

test('reduced motion keeps the hold indicator aligned with the 800ms state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByTestId('old-claim').click();
  const qr = page.getByTestId('old-qr');
  await qr.focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(200);
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_HOLDING');
  const duration = await page.locator('.hold-fill').evaluate(element => getComputedStyle(element).animationDuration);
  expect(duration).toBe('0.8s');
  await page.keyboard.up('Space');
});

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
