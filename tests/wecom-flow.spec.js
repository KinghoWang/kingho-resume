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
