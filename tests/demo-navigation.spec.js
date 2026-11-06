const { test, expect } = require('playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const BASE = process.env.DEMO_BASE_URL || 'http://127.0.0.1:52784';
const demos = [
  { file: 'demo-shufen.html', project: 'analytics', caseId: 'case-analytics' },
  { file: 'demo-eval.html', project: 'analytics', caseId: 'case-analytics' },
  { file: 'demo-creative.html', project: 'creative', caseId: 'case-creative' },
  { file: 'demo-wukong.html', project: 'creative', caseId: 'case-creative' },
  { file: 'demo-wecom-flow.html', project: 'wecom', caseId: 'case-lianlu' },
];
const origins = [
  { file: 'index.html', source: 'resume', label: '返回简历项目' },
  { file: 'en.html', source: 'en', label: 'Back to resume project' },
  { file: 'cases.html', source: 'cases', label: '返回作品集案例' },
];

test('return restores the exact source URL and reading position after a refresh', async ({ page }) => {
  const source = `${BASE}/cases.html?view=interview&query=AI%20PM&tag=one%2ftwo#case-analytics`;
  await page.goto(source);
  const entry = page.locator('#case-analytics a[href^="demo-shufen.html"]');
  await entry.scrollIntoViewIfNeeded();
  const sourceY = await page.evaluate(() => window.scrollY);
  await entry.click();
  await page.reload();
  await page.locator('[data-demo-back]').click();
  await expect(page).toHaveURL(source);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(sourceY, -1);
});

test('English resume, portfolio, and Demo return one level at a time', async ({ page }) => {
  const resume = `${BASE}/en.html?view=interview`;
  await page.goto(resume);
  await page.locator('.hero-cta[href="cases.html"]').click();
  const portfolio = page.url();
  await page.locator('#case-creative a[href^="demo-wukong.html"]').click();
  await page.locator('[data-demo-back]').click();
  await expect(page).toHaveURL(portfolio);
  await page.locator('.page-head .back-link').click();
  await expect(page).toHaveURL(resume);
});

test('a new-tab Demo returns to the actual source rather than a guessed project anchor', async ({ page }) => {
  const source = `${BASE}/en.html?view=interview#project-analytics`;
  await page.goto(source);
  const entry = page.locator('#project-analytics a[href^="demo-shufen.html"]');
  await entry.evaluate(link => { link.target = '_blank'; });
  const popupPromise = page.waitForEvent('popup');
  await entry.click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  await popup.locator('[data-demo-back]').click();
  await expect(popup).toHaveURL(source);
  await expect(page).toHaveURL(source);
  await popup.close();
});

test('visiting the portfolio from a Demo returns to that Demo', async ({ page }) => {
  const source = `${BASE}/demo-creative.html?from=en`;
  await page.goto(source);
  await page.locator('[data-demo-cases]').click();
  await page.locator('.page-head .back-link').click();
  await expect(page).toHaveURL(source);
});

for (const blockedStorage of [false, true]) {
  test(`a new-tab return preserves the portfolio origin (storage blocked: ${blockedStorage})`, async ({ page }) => {
    if (blockedStorage) {
      await page.addInitScript(() => {
        Storage.prototype.setItem = () => { throw new Error('Storage blocked'); };
        Storage.prototype.getItem = () => { throw new Error('Storage blocked'); };
      });
    }
    const resume = `${BASE}/en.html?view=interview`;
    await page.goto(resume);
    await page.locator('.hero-cta[href="cases.html"]').click();
    await expect(page).toHaveURL(`${BASE}/cases.html`);
    const portfolio = page.url();
    const entry = page.locator('#case-analytics a[href^="demo-shufen.html"]');
    await entry.evaluate(link => { link.target = '_blank'; link.rel = 'noopener'; });
    const popupPromise = page.waitForEvent('popup');
    await entry.click();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    await popup.locator('[data-demo-back]').click();
    await expect(popup).toHaveURL(portfolio);
    await popup.locator('[data-page-back]').click();
    await expect(popup).toHaveURL(resume);
    await popup.close();
  });
}

test('exact return and scroll restoration work when browser storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new Error('Storage blocked'); };
    Storage.prototype.getItem = () => { throw new Error('Storage blocked'); };
  });
  const source = `${BASE}/cases.html?view=interview#case-analytics`;
  await page.goto(source);
  const entry = page.locator('#case-analytics a[href^="demo-shufen.html"]');
  await entry.scrollIntoViewIfNeeded();
  const sourceY = await page.evaluate(() => window.scrollY);
  await entry.click();
  await page.reload();
  await page.locator('[data-demo-back]').click();
  await expect(page).toHaveURL(source);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(sourceY, -1);
});

test('an explicit resume exit becomes the next Demo source, without stale portfolio state', async ({ page }) => {
  await page.goto(`${BASE}/cases.html`);
  await page.locator('#case-analytics a[href^="demo-shufen.html"]').click();
  await page.locator('[data-demo-home]').click();
  const resume = page.url();
  await page.locator('#project-analytics a[href^="demo-shufen.html"]').click();
  await page.locator('[data-demo-back]').click();
  await expect(page).toHaveURL(resume);
});

test('mobile returns to the exact English source and reading position', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const source = `${BASE}/en.html?view=mobile`;
  await page.goto(source);
  const entry = page.locator('#project-analytics a[href^="demo-shufen.html"]');
  await entry.scrollIntoViewIfNeeded();
  const sourceY = await page.evaluate(() => window.scrollY);
  await entry.click();
  await page.locator('[data-demo-back]').click();
  await expect(page).toHaveURL(source);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(sourceY, -1);
});

test('local-file entries return to the exact original file URL', async ({ page }) => {
  const base = pathToFileURL(path.resolve(__dirname, '..')).href;
  const source = `${base}/en.html?view=local#project-analytics`;
  await page.goto(source);
  await page.locator('#project-analytics a[href^="demo-shufen.html"]').click();
  await page.reload();
  await page.locator('[data-demo-back]').click();
  await expect(page).toHaveURL(source);
});

for (const origin of origins) {
  for (const demo of demos) {
    test(`${origin.file} -> ${demo.file} returns to the actual source and position`, async ({ page }) => {
      await page.goto(`${BASE}/${origin.file}`);
      const id = origin.source === 'cases' ? demo.caseId : `project-${demo.project}`;
      const entry = page.locator(`#${id} a[href="${demo.file}?from=${origin.source}"]`);
      await expect(entry).toHaveCount(1);
      await entry.scrollIntoViewIfNeeded();
      const sourceY = await page.evaluate(() => window.scrollY);
      await entry.click();
      await expect(page).toHaveURL(`${BASE}/${demo.file}?from=${origin.source}`);

      const nav = page.locator('[data-demo-nav]');
      await expect(nav).toHaveCount(1);
      await expect(nav.locator('[data-demo-back]')).toHaveText(origin.label);
      await expect(nav.locator('[data-demo-back]')).toHaveAttribute('href', origin.file);
      await expect(nav.locator('[data-demo-home]')).toHaveAttribute('href', origin.source === 'en' ? 'en.html' : 'index.html');
      await expect(nav.locator('[data-demo-cases]')).toHaveAttribute('href', 'cases.html');
      await page.reload();
      await nav.locator('[data-demo-back]').click();
      await expect(page).toHaveURL(`${BASE}/${origin.file}`);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(sourceY, -1);
      await expect(page.locator(`#${id}`)).toBeInViewport();
    });
  }
}

test('direct and invalid origins fall back to the resume, never to an external URL', async ({ page }) => {
  for (const demo of demos) {
    for (const query of ['', '?from=https%3A%2F%2Fexample.com', '?from=__proto__']) {
      await page.goto(`${BASE}/${demo.file}${query}`);
      await expect(page.locator('[data-demo-back]')).toHaveAttribute('href', 'index.html');
      await expect(page.locator('[data-demo-back]')).toHaveText('返回简历');
    }
  }
});

test('return destinations cannot escape the public pages in this site directory', async ({ page }) => {
  for (const destination of [
    'https://example.com', '//example.com/index.html', 'javascript:alert(1)',
    '../index.html', 'demo-advideo.html', 'file:///private/tmp/index.html',
    'https://name:password@example.com/index.html',
  ]) {
    await page.goto(`${BASE}/demo-shufen.html?returnTo=${encodeURIComponent(destination)}`);
    await expect(page.locator('[data-demo-back]')).toHaveAttribute('href', 'index.html');
    await page.locator('[data-demo-back]').click();
    await expect(page).toHaveURL(`${BASE}/index.html`);
  }
});

test('navigation works in a new tab without a referrer and from local files', async ({ context }) => {
  const page = await context.newPage();
  for (const base of [BASE, pathToFileURL(path.resolve(__dirname, '..')).href]) {
    await page.goto(`${base}/demo-shufen.html?from=en`);
    expect(await page.evaluate(() => document.referrer)).toBe('');
    await expect(page.locator('[data-demo-back]')).toHaveAttribute('href', 'en.html#project-analytics');
    await page.locator('[data-demo-back]').click();
    await expect(page.locator('#project-analytics')).toBeInViewport();
  }
});

test('static navigation remains usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const demo of demos) {
    await page.goto(`${BASE}/${demo.file}`);
    await expect(page.locator('[data-demo-back]')).toHaveAttribute('href', 'index.html');
    await expect(page.locator('[data-demo-home]')).toBeVisible();
    await expect(page.locator('[data-demo-cases]')).toBeVisible();
  }
  await context.close();
});

test('mobile navigation has readable, non-overlapping 44px targets', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const demo of demos) {
    for (const source of ['resume', 'en', 'cases']) {
      await page.goto(`${BASE}/${demo.file}?from=${source}`);
      const boxes = await page.locator('[data-demo-nav] a').evaluateAll(links => links.map(link => {
        const box = link.getBoundingClientRect();
        return { x: box.x, y: box.y, right: box.right, bottom: box.bottom, height: box.height };
      }));
      expect(boxes).toHaveLength(3);
      for (const box of boxes) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(376);
      }
      for (let i = 0; i < boxes.length; i += 1) {
        for (let j = i + 1; j < boxes.length; j += 1) {
          const a = boxes[i], b = boxes[j];
          expect(a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y).toBeTruthy();
        }
      }
    }
  }
});
