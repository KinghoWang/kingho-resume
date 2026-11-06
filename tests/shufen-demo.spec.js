const { test, expect } = require('playwright/test');

const BASE = process.env.DEMO_BASE_URL || 'http://127.0.0.1:52784';

test('report generation and both clipboard exports keep the synthetic analysis intact', async ({ page }) => {
  await page.addInitScript(() => {
    window.copied = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async value => window.copied.push(value) },
    });
  });
  await page.goto(`${BASE}/demo-shufen.html`);
  await expect(page.locator('#status')).toHaveText('已生成合成日报');
  await expect(page.locator('#report table')).toHaveCount(3);
  await expect(page.locator('#report table').nth(0).locator('tbody tr')).toHaveCount(8);
  await expect(page.locator('#report table').nth(0).locator('tbody tr').last()).toHaveText('D0101,0004,750,00021.260.056%38.11');
  const initialReport = await page.locator('#report').innerText();
  await page.locator('#run').click();
  expect(await page.locator('#report').innerText()).toBe(initialReport);
  await page.locator('#copy-ai').click();
  await expect(page.locator('#status')).toHaveText('已复制分析摘要');
  const payload = JSON.parse(await page.evaluate(() => window.copied[0]));
  expect(payload.notice).toContain('公开合成数据');
  expect(payload.report.demoRules).toEqual({ overallChangePct: 18, segmentChangePct: 22, accountChangePct: 35 });
  expect(payload.report.current).toMatchObject({ spend: 101000, impressions: 4750000, conversions: 2650, cpm: 21.26, cpa: 38.11 });
  expect(payload.report.summaries).toHaveLength(3);
  await page.locator('#copy-text').click();
  await expect(page.locator('#status')).toHaveText('已复制日报文本');
  const text = await page.evaluate(() => window.copied[1]);
  expect(text).toContain('人工判断边界');
  expect(text).toContain('101,000');
  expect(text).toContain('不对应任何真实公司');
  expect(text).not.toContain('<table');
});

test('clipboard refusal is reported without clearing the report', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async () => { throw new Error('Permission denied'); } },
  }));
  await page.goto(`${BASE}/demo-shufen.html`);
  for (const id of ['copy-ai', 'copy-text']) {
    await page.locator(`#${id}`).click();
    await expect(page.locator('#status')).toHaveText('浏览器未允许复制，请手动选择页面内容。');
    await expect(page.locator('#report table')).toHaveCount(3);
  }
});

for (const width of [375, 1440]) {
  test(`analytics visual system and independent table scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${BASE}/demo-shufen.html?from=resume`);
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(250, 249, 247)');
    await expect(page.locator('#run')).toHaveCSS('background-color', 'rgb(192, 57, 43)');
    expect(await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Source Sans 3');
    await expect(page.locator('#report .table-scroll')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    for (const table of await page.locator('#report .table-scroll').all()) {
      await expect(table).toHaveAttribute('tabindex', '0');
      await expect(table).toHaveAttribute('aria-label', /大盘趋势|行业下钻|客户复核清单/);
    }
    for (const button of await page.locator('.bar button').all()) {
      expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
    }
    if (width < 640) {
      const scroller = page.locator('.table-scroll').first();
      await scroller.focus();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => scroller.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
      expect(await page.evaluate(() => window.scrollX)).toBe(0);
    }
  });
}
