const { test, expect } = require('playwright/test');

const BASE = process.env.DEMO_BASE_URL || 'http://127.0.0.1:52784';

test('resume contact details use real email and phone links', async ({ page }) => {
  for (const file of ['index.html', 'en.html']) {
    await page.goto(`${BASE}/${file}`);
    const contacts = page.locator('.contact-row');
    await expect(contacts.locator('a[href="mailto:kinghowang@foxmail.com"]')).toHaveCount(1);
    await expect(contacts.locator('a[href="tel:+8617512006748"]')).toHaveCount(1);
    await expect(contacts.locator('a[href^="mailto:"]')).toHaveCount(1);
    await expect(contacts.locator('a[href^="tel:"]')).toHaveCount(1);

    const trigger = page.locator('[data-testid="wechat-trigger"]');
    const dialog = page.locator('[data-testid="wechat-dialog"]');
    const qr = dialog.locator('img[src="wechat-qr.png"]');
    await expect(trigger).toBeVisible();
    await expect(dialog).not.toBeVisible();
    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/微信扫码添加|Scan to connect/);
    await expect(dialog.locator('.wechat-id')).toHaveText('WJH748247724');
    await expect(page.getByText('WJH748247724', { exact: true })).toHaveCount(1);
    await expect(qr).toBeVisible();
    const qrGeometry = await qr.evaluate((image) => ({
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      width: image.getBoundingClientRect().width,
      height: image.getBoundingClientRect().height,
    }));
    expect(qrGeometry.naturalWidth).toBe(720);
    expect(qrGeometry.naturalHeight).toBe(720);
    expect(qrGeometry.width).toBeGreaterThanOrEqual(180);
    expect(qrGeometry.height).toBeGreaterThanOrEqual(180);
    await dialog.locator('#wechatClose').click();
    await expect(dialog).not.toBeVisible();
    await trigger.click();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  }
});

test('mobile WeChat dialog is centered and contained within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(`${BASE}/index.html`);
  await page.locator('[data-testid="wechat-trigger"]').click();
  const geometry = await page.locator('[data-testid="wechat-dialog"]').evaluate((dialog) => {
    const box = dialog.getBoundingClientRect();
    return {
      horizontalOffset: Math.abs((box.left + box.right) / 2 - innerWidth / 2),
      verticalOffset: Math.abs((box.top + box.bottom) / 2 - innerHeight / 2),
      inside: box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight,
      documentWidth: document.documentElement.scrollWidth,
    };
  });
  expect(geometry.horizontalOffset).toBeLessThanOrEqual(1);
  expect(geometry.verticalOffset).toBeLessThanOrEqual(1);
  expect(geometry.inside).toBe(true);
  expect(geometry.documentWidth).toBeLessThanOrEqual(360);
});

test('WeChat dialog copies the ID and reports clipboard failures honestly', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  await page.goto(`${BASE}/index.html`);
  await page.locator('[data-testid="wechat-trigger"]').click();
  const copy = page.locator('#wechatCopy');
  await copy.click();
  await expect(copy).toHaveText('已复制');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('WJH748247724');

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('blocked')) },
    });
    document.execCommand = () => false;
  });
  await page.goto(`${BASE}/en.html`);
  await page.locator('[data-testid="wechat-trigger"]').click();
  await page.locator('#wechatCopy').click();
  await expect(page.locator('#wechatCopy')).toHaveText('Copy manually');
});

test('Chinese resume presents four product, AI and data projects with WeCom first', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  const cards = page.locator('.ai-grid > .ai-card');

  await expect(cards).toHaveCount(4);

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
  await expect(wukong).toContainText('4 个 job 产出可播放主成片');
  await expect(wukong).not.toContainText('端到端交付');
  await expect(wukong).toContainText('只有验证脚本输出算数');
  await expect(wukong.locator('a[href="demo-wukong.html"]')).toHaveCount(1);

  const reconciliation = cards.nth(3);
  await expect(reconciliation.locator('h3')).toContainText('广告财务对账系统');
  await expect(reconciliation).toContainText('与财务对齐对账规则');
  await expect(reconciliation).toContainText('固化到固定查询与月度核对流程');
  await expect(reconciliation).not.toContainText('推动上线');

  await expect(cards.locator('h3').filter({ hasText: 'adquery-lite' })).toHaveCount(0);
  await expect(cards.locator('h3').filter({ hasText: /^广告归因质量 Eval 评测体系$/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'English' })).toHaveAttribute('href', 'en.html');
});

test('English resume presents four product, AI and data projects with WeCom first', async ({ page }) => {
  await page.goto(`${BASE}/en.html`);
  const cards = page.locator('.ai-grid > .ai-card');

  await expect(cards).toHaveCount(4);

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
  await expect(wukong).toContainText('4 jobs produced playable master videos');
  await expect(wukong).not.toContainText('end-to-end delivery');
  await expect(wukong).toContainText('Only verification-script output counts');
  await expect(wukong.locator('a[href="demo-wukong.html"]')).toHaveCount(1);

  const reconciliation = cards.nth(3);
  await expect(reconciliation.locator('h3')).toContainText('Ad Finance Reconciliation System');
  await expect(reconciliation).toContainText('aligned reconciliation rules with finance');
  await expect(reconciliation).toContainText('monthly reconciliation workflow');
  await expect(reconciliation).not.toContainText('drove it to launch');

  await expect(cards.locator('h3').filter({ hasText: 'adquery-lite' })).toHaveCount(0);
  await expect(cards.locator('h3').filter({ hasText: /^Attribution Quality Eval Harness$/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: '中文版简历' })).toHaveAttribute('href', 'index.html');
});

test('resume heroes use the unified six-demo count', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  await expect(page.locator('.hero-links a[href="cases.html"]')).toContainText('6 个在线 Demo');

  await page.goto(`${BASE}/en.html`);
  await expect(page.locator('.hero-links a[href="cases.html"]')).toContainText('6 live demos');
});

test('portfolio publishes six unique online demos', async ({ page }) => {
  await page.goto(`${BASE}/cases.html`);
  await expect(page.locator('.section-divider').first()).toContainText('自建 AI 产品');
  await expect(page.locator('.demo-lead')).toContainText('6 个在线 Demo');
  await expect(page.locator('[data-testid="core-project"]')).toHaveCount(2);
  await expect(page.locator('[data-testid="extension-demo"]')).toHaveCount(2);
  await expect(page.locator('.demo-gallery a[href="demo-wukong.html"]')).toHaveCount(1);
  const expected = ['demo-advideo.html', 'demo-creative.html', 'demo-eval.html', 'demo-shufen.html', 'demo-wecom-flow.html', 'demo-wukong.html'];
  const published = await page.locator('a[href^="demo-"][href$=".html"]').evaluateAll((links) =>
    [...new Set(links.map((link) => link.getAttribute('href')))].sort()
  );
  expect(published).toEqual(expected);
  for (const href of expected) {
    await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
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

test('resume keeps contribution claims tied to their verified evidence', async ({ page }) => {
  for (const file of ['index.html', 'en.html']) {
    await page.goto(`${BASE}/${file}`);
    await expect(page.locator('.stat')).toHaveCount(0);
    await expect(page.locator('.statwall')).toHaveCount(0);
    await expect(page.locator('.ai-grid > .ai-card')).toHaveCount(4);
    await expect(page.locator('body')).toContainText(/5%\s*(?:→|to)\s*90%\+/);
    await expect(page.locator('body')).toContainText(/低于大盘.*14%|14%\s*below.*benchmark/i);
    await expect(page.locator('body')).not.toContainText(/20%\s*(?:→|to)\s*60%/i);
    await expect(page.locator('body')).not.toContainText('+287%');
    await expect(page.locator('body')).not.toContainText('opening a new closed-loop');
  }
});

test('Baidu keeps the evidenced model and rollout without an unsupported rate claim', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  const zhBaidu = page.locator('.tl-card').filter({ hasText: '百度(中国)' });
  await expect(zhBaidu).toContainText('直播 + 低价体验 + 附赠图书');
  await expect(zhBaidu).toContainText('5 家客户');
  await expect(zhBaidu).toContainText('最佳新人奖');
  await expect(zhBaidu).not.toContainText(/20%\s*→\s*60%/);

  await page.goto(`${BASE}/en.html`);
  const enBaidu = page.locator('.tl-card').filter({ hasText: 'Baidu (China)' });
  await expect(enBaidu).toContainText('livestream + low-cost trial + bundled books');
  await expect(enBaidu).toContainText('five clients');
  await expect(enBaidu).toContainText('Best Newcomer');
  await expect(enBaidu).not.toContainText(/20%\s*(?:to|→)\s*60%/i);
});

test('Chinese primary resume no longer routes readers to the stale ad-operations page', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  await expect(page.locator('a[href="resume-adops.html"]')).toHaveCount(0);
  const heroLinks = page.locator('.hero-links > a');
  await expect(heroLinks).toHaveCount(3);
  await expect(heroLinks.nth(0)).toHaveAttribute('href', 'cases.html');
  await expect(heroLinks.nth(1)).toHaveAttribute('href', 'kingho-resume-ai-pm.pdf');
  await expect(heroLinks.nth(2)).toHaveAttribute('href', 'en.html');
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
      await expect(page.locator('.ai-grid > .ai-card')).toHaveCount(4);
      await expect(page.locator('footer')).toBeVisible();
    }
  });
}
