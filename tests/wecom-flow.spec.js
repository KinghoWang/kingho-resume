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
