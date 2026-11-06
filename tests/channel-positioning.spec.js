const { test, expect } = require('playwright/test');
const fs = require('fs');
const path = require('path');

const BASE = process.env.DEMO_BASE_URL || 'http://127.0.0.1:52784';

test('channel-first resume uses a public-safe narrative in both languages', async ({ page }) => {
  for (const file of ['index.html', 'en.html']) {
    await page.goto(`${BASE}/${file}`);
    const projects = page.locator('.resume-project-list > .resume-project');
    await expect(projects).toHaveCount(4);
    await expect(projects.locator('.resume-project__rail span')).toHaveText(['CHANNEL', 'ANALYTICS', 'AI CREATIVE', 'PRODUCT']);
    const channel = projects.first();
    await expect(channel.locator('a')).toHaveCount(0);
    await expect(channel.locator('.resume-project__footer')).toHaveCount(0);
    await expect(channel).not.toContainText(/公开版不展示|not disclosed/i);
    await expect(channel.locator('.resume-project__main')).not.toContainText(/[0-9%]/);
    await expect(channel).not.toContainText(/ROI|反作弊|anti.fraud/i);
    await expect(page.locator('.intent')).toContainText(file === 'index.html' ? '渠道运营' : 'Channel Operations');
    await expect(page.locator('.lead')).toContainText(file === 'index.html' ? '主要供内部运营使用' : 'primarily used by internal operations');
    await expect(page.locator('.lead')).toContainText(file === 'index.html' ? '面向外部的应用仍在开发' : 'External-facing applications are still in development');
    await expect(projects.nth(1)).toContainText(file === 'index.html' ? '每周' : 'per week');
    await expect(projects.last().locator('a[href="cases.html#case-lianlu"]')).toHaveCount(1);
  }
});

test('channel achievements are not duplicated in employment bullets', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  const currentJob = page.locator('.tl-card').filter({ hasText: '北京太字流动' });
  await expect(currentJob.locator('li')).toHaveCount(3);
  await expect(currentJob).not.toContainText(/春节|备款锁定|ROI|系数|时段|增量口径/);
});

test('portfolio states the current internal AI usage boundary', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'cases.html'), 'utf8');
  expect(html).toContain('主要供内部运营使用');
  expect(html).toContain('面向外部的应用仍在开发');
});
