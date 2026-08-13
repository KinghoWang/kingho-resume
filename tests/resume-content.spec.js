const { test, expect } = require('playwright/test');

const BASE = process.env.DEMO_BASE_URL || 'http://127.0.0.1:52784';

test('Chinese resume presents three product and AI projects with WeCom first', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  const cards = page.locator('.ai-grid > .ai-card');

  await expect(cards).toHaveCount(3);

  const wecom = cards.nth(0);
  await expect(wecom.locator('h3')).toContainText('企微获客链路改造');
  await expect(wecom).toContainText('中老年主力用户不熟悉');
  await expect(wecom).toContainText('曝光-加微率');
  await expect(wecom.locator('a[href="demo-wecom-flow.html"]')).toHaveCount(1);

  const analytics = cards.nth(1);
  await expect(analytics.locator('h3')).toContainText('数分机器人');
  await expect(analytics).toContainText('Eval');
  await expect(analytics.locator('a[href="demo-shufen.html"]')).toHaveCount(1);
  await expect(analytics.locator('a[href="demo-eval.html"]')).toHaveCount(1);

  const wukong = cards.nth(2);
  await expect(wukong.locator('h3')).toContainText('悟空');
  await expect(wukong).toContainText('只有验证脚本输出算数');
  await expect(wukong.locator('a[href="demo-wukong.html"]')).toHaveCount(1);

  await expect(cards.locator('h3').filter({ hasText: 'adquery-lite' })).toHaveCount(0);
  await expect(cards.locator('h3').filter({ hasText: /^广告归因质量 Eval 评测体系$/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'English' })).toHaveAttribute('href', 'en.html');
});

test('English resume presents three product and AI projects with WeCom first', async ({ page }) => {
  await page.goto(`${BASE}/en.html`);
  const cards = page.locator('.ai-grid > .ai-card');

  await expect(cards).toHaveCount(3);

  const wecom = cards.nth(0);
  await expect(wecom.locator('h3')).toContainText('WeCom Acquisition Flow');
  await expect(wecom).toContainText('older users');
  await expect(wecom).toContainText(/impression-to-WeCom-contact/i);
  await expect(wecom.locator('a[href="demo-wecom-flow.html"]')).toHaveCount(1);

  const analytics = cards.nth(1);
  await expect(analytics.locator('h3')).toContainText('Analytics Agent');
  await expect(analytics).toContainText('Eval');
  await expect(analytics.locator('a[href="demo-shufen.html"]')).toHaveCount(1);
  await expect(analytics.locator('a[href="demo-eval.html"]')).toHaveCount(1);

  const wukong = cards.nth(2);
  await expect(wukong.locator('h3')).toContainText('Wukong');
  await expect(wukong).toContainText('Only verification-script output counts');
  await expect(wukong.locator('a[href="demo-wukong.html"]')).toHaveCount(1);

  await expect(cards.locator('h3').filter({ hasText: 'adquery-lite' })).toHaveCount(0);
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
  await expect(page.locator('.section-divider').first()).toContainText('自建 AI 产品');
  await expect(page.locator('.demo-lead')).toContainText('5 个 AI / 数据在线 Demo');
  await expect(page.locator('[data-testid="core-project"]')).toHaveCount(2);
  await expect(page.locator('[data-testid="extension-demo"]')).toHaveCount(2);
  await expect(page.locator('.demo-gallery a[href="demo-wukong.html"]')).toHaveCount(1);
  for (const href of ['demo-shufen.html', 'demo-eval.html', 'demo-wukong.html', 'demo-advideo.html', 'demo-creative.html']) {
    await expect(page.locator(`.demo-gallery a[href="${href}"]`)).toHaveCount(1);
  }
});

test('both resume languages promote WeCom out of work bullets without duplicating it', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  await expect(page.locator('li').filter({ hasText: '链路产品优化' })).toHaveCount(0);
  await expect(page.locator('.ai-card').first()).toContainText('长按识别二维码');

  await page.goto(`${BASE}/en.html`);
  await expect(page.locator('li').filter({ hasText: 'Funnel product optimization' })).toHaveCount(0);
  await expect(page.locator('.ai-card').first()).toContainText('long-press QR recognition');
});

test('resume highlights contributions and removes weak attribution claims', async ({ page }) => {
  for (const file of ['index.html', 'en.html']) {
    await page.goto(`${BASE}/${file}`);
    const stats = page.locator('.stat');
    await expect(stats).toHaveCount(6);
    await expect(stats.first()).toContainText(/\+50%/);
    await expect(stats.nth(2)).toContainText('+47%');
    await expect(stats.nth(3)).toContainText('+27%');
    await expect(stats.nth(4)).toContainText('-13%');
    await expect(stats.nth(5)).toContainText('20%→60%');
    await expect(page.locator('body')).not.toContainText('+287%');
    await expect(page.locator('body')).not.toContainText('opening a new closed-loop');
  }
});

test('Baidu result remains a concurrent fact instead of a claimed direct causal effect', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  const zhBaidu = page.locator('.tl-card').filter({ hasText: '百度(中国)' });
  await expect(zhBaidu).toContainText('同期');
  await expect(zhBaidu).not.toContainText(/组合替代.*20%\s*→\s*60%/);

  await page.goto(`${BASE}/en.html`);
  const enBaidu = page.locator('.tl-card').filter({ hasText: 'Baidu (China)' });
  await expect(enBaidu).toContainText('in parallel');
  await expect(enBaidu).not.toContainText(/model.*(?:improved|lifted).*20%\s*(?:to|→)\s*60%/i);
});

test('Chinese primary resume no longer routes readers to the stale ad-operations page', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  await expect(page.locator('a[href="resume-adops.html"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '策略产品案例' })).toHaveAttribute('href', 'cases.html#case-lianlu');
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
        statsInsideCards: [...document.querySelectorAll('.stat')].every((card) => {
          const cardBox = card.getBoundingClientRect();
          return [...card.querySelectorAll('.s-num, .s-lab')].every((content) => {
            const box = content.getBoundingClientRect();
            return box.left >= cardBox.left - 0.5 && box.right <= cardBox.right + 0.5;
          });
        }),
      }));
      expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth);
      expect(geometry.statsInsideCards).toBe(true);
      await expect(page.locator('.ai-grid > .ai-card')).toHaveCount(3);
      await expect(page.locator('footer')).toBeVisible();
    }
  });
}
