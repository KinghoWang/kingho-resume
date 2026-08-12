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

test('old flow rejects a short press and keeps menu side actions non-progressing', async ({ page }) => {
  await page.getByTestId('old-claim').click();
  const qr = page.getByTestId('old-qr');

  await qr.dispatchEvent('pointerdown', { pointerType: 'mouse', pointerId: 1, button: 0 });
  await page.waitForTimeout(200);
  await qr.dispatchEvent('pointerup', { pointerType: 'mouse', pointerId: 1, button: 0 });
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_H5');
  await expect(page.getByTestId('feedback')).toContainText('请长按二维码');

  await qr.dispatchEvent('pointerdown', { pointerType: 'mouse', pointerId: 2, button: 0 });
  await page.waitForTimeout(850);
  await expect(page.getByTestId('old-phone')).toHaveAttribute('data-state', 'OLD_MENU');
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
