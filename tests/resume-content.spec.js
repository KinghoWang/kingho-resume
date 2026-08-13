const { test, expect } = require('playwright/test');

const BASE = process.env.DEMO_BASE_URL || 'http://127.0.0.1:52784';

test('Chinese and English resumes publish the four-product portfolio including Wukong', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  await expect(page.locator('.statwall')).toContainText('4 个');
  await expect(page.locator('.ai-grid > .ai-card')).toHaveCount(4);
  await expect(page.locator('.ai-grid > .ai-card').nth(1).locator('h3')).toContainText('悟空');
  await expect(page.locator('.ai-grid')).toContainText('「悟空」自建 Agent');
  await expect(page.locator('.ai-grid')).toContainText('只有验证脚本输出算数');
  await expect(page.getByRole('link', { name: 'English' })).toHaveAttribute('href', 'en.html');

  await page.goto(`${BASE}/en.html`);
  await expect(page.locator('.statwall')).toContainText('4');
  await expect(page.locator('.ai-grid > .ai-card')).toHaveCount(4);
  await expect(page.locator('.ai-grid > .ai-card').nth(1).locator('h3')).toContainText('Wukong');
  await expect(page.locator('.ai-grid')).toContainText('Wukong');
  await expect(page.locator('.ai-grid')).toContainText('Only verification-script output counts');
  await expect(page.locator('.ai-grid')).not.toContainText('see ③');
  await expect(page.getByRole('link', { name: '中文版简历' })).toHaveAttribute('href', 'index.html');
});

test('both resume languages frame the WeCom work around the older-user long-press barrier', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  const chineseExperience = page.locator('li').filter({ hasText: '链路产品优化' });
  await expect(chineseExperience).toContainText('中老年主力用户不熟悉「长按识别二维码」');
  await expect(chineseExperience).toContainText('可点击的获客文案与卡片');

  await page.goto(`${BASE}/en.html`);
  const englishExperience = page.locator('li').filter({ hasText: 'Funnel product optimization' });
  await expect(englishExperience).toContainText('older users');
  await expect(englishExperience).toContainText('long-press QR recognition');
  await expect(englishExperience).toContainText('clickable acquisition text and card');
  await expect(englishExperience).not.toContainText(/shorter|fewer steps/i);
});

for (const viewport of [
  { name: 'narrow mobile', width: 360, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`${viewport.name} keeps both resume languages within the viewport`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const file of ['index.html', 'en.html']) {
      await page.goto(`${BASE}/${file}`);
      const geometry = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      }));
      expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth);
      await expect(page.locator('.ai-grid > .ai-card')).toHaveCount(4);
      await expect(page.locator('footer')).toBeVisible();
    }
  });
}
