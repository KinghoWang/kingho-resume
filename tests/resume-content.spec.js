const { test, expect } = require('playwright/test');

const BASE = process.env.DEMO_BASE_URL || 'http://127.0.0.1:52784';

test('Chinese resume presents three core projects with Eval embedded in the analytics agent', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  const productStat = page.locator('.stat').filter({ hasText: '自建 AI / 数据' });
  const cards = page.locator('.ai-grid > .ai-card');

  await expect(productStat.locator('.s-num')).toHaveText('3 个');
  await expect(cards).toHaveCount(3);

  const analytics = cards.nth(0);
  await expect(analytics.locator('h3')).toContainText('数分机器人');
  await expect(analytics).toContainText('Eval');
  await expect(analytics.locator('a[href="demo-shufen.html"]')).toHaveCount(1);
  await expect(analytics.locator('a[href="demo-eval.html"]')).toHaveCount(1);

  const wukong = cards.nth(1);
  await expect(wukong.locator('h3')).toContainText('悟空');
  await expect(wukong).toContainText('只有验证脚本输出算数');
  await expect(wukong.locator('a[href="demo-wukong.html"]')).toHaveCount(1);

  await expect(cards.nth(2).locator('h3')).toContainText('adquery-lite');
  await expect(cards.locator('h3').filter({ hasText: /^广告归因质量 Eval 评测体系$/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'English' })).toHaveAttribute('href', 'en.html');
});

test('English resume presents three core projects with Eval embedded in the analytics agent', async ({ page }) => {
  await page.goto(`${BASE}/en.html`);
  const productStat = page.locator('.stat').filter({ hasText: 'Self-built AI / data' });
  const cards = page.locator('.ai-grid > .ai-card');

  await expect(productStat.locator('.s-num')).toHaveText('3');
  await expect(cards).toHaveCount(3);

  const analytics = cards.nth(0);
  await expect(analytics.locator('h3')).toContainText('Analytics Agent');
  await expect(analytics).toContainText('Eval');
  await expect(analytics.locator('a[href="demo-shufen.html"]')).toHaveCount(1);
  await expect(analytics.locator('a[href="demo-eval.html"]')).toHaveCount(1);

  const wukong = cards.nth(1);
  await expect(wukong.locator('h3')).toContainText('Wukong');
  await expect(wukong).toContainText('Only verification-script output counts');
  await expect(wukong.locator('a[href="demo-wukong.html"]')).toHaveCount(1);

  await expect(cards.nth(2).locator('h3')).toContainText('adquery-lite');
  await expect(cards.locator('h3').filter({ hasText: /^Attribution Quality Eval Harness$/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: '中文版简历' })).toHaveAttribute('href', 'index.html');
});

test('resume heroes advertise five live AI and data demos', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  await expect(page.locator('.hero-links a[href="cases.html"]')).toContainText('作品集：5 个在线 Demo');

  await page.goto(`${BASE}/en.html`);
  await expect(page.locator('.hero-links a[href="cases.html"]')).toContainText('Portfolio: 5 live demos');
});

test('portfolio publishes five live AI and data demo cards', async ({ page }) => {
  await page.goto(`${BASE}/cases.html`);
  await expect(page.locator('.section-divider').first()).toContainText('自建 AI / 数据产品');
  await expect(page.locator('.demo-lead')).toContainText('以下五个');
  await expect(page.locator('.demo-gallery > .demo-card')).toHaveCount(5);
  await expect(page.locator('.demo-gallery a[href="demo-wukong.html"]')).toHaveCount(1);
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
      await expect(page.locator('.ai-grid > .ai-card')).toHaveCount(3);
      await expect(page.locator('footer')).toBeVisible();
    }
  });
}
