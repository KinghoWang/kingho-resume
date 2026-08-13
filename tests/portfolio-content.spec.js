const { test, expect } = require('playwright/test');
const fs = require('fs');
const path = require('path');

const BASE = process.env.DEMO_BASE_URL || 'http://127.0.0.1:52784';

test('README hierarchy matches the portfolio section counts', () => {
  const chinese = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  const english = fs.readFileSync(path.join(__dirname, '..', 'README.en.md'), 'utf8');

  expect(chinese).toContain('**② 3 个策略产品 & 数据分析案例**');
  expect(chinese).toContain('**③ 2 个扩展在线 Demo**');
  expect(chinese).toContain('核心与扩展区合计 **5 个 AI / 数据产品在线 Demo**');
  expect(chinese).toContain('**在线 Demo 总表（5 个）**');
  expect(english).toContain('**② Three strategy-product and data-analysis cases**');
  expect(english).toContain('**③ Two extension live demos**');
  expect(english).toContain('The core and extension sections contain **five AI / data product demos** in total');
  expect(english).toContain('**Live demo index (5 total)**');
});

test('portfolio separates two core projects from two extension demos', async ({ page }) => {
  await page.goto(`${BASE}/cases.html`);

  await expect(page.getByRole('heading', { name: /2 组核心项目/ })).toBeVisible();
  await expect(page.locator('[data-testid="core-project"]')).toHaveCount(2);

  const core = page.locator('[data-testid="core-project"]');
  await expect(core.nth(0)).toContainText('数分机器人 × Eval');
  await expect(core.nth(0).locator('a[href="demo-shufen.html"]')).toHaveCount(1);
  await expect(core.nth(0).locator('a[href="demo-eval.html"]')).toHaveCount(1);

  await expect(core.nth(1)).toContainText('悟空');
  await expect(core.nth(1).locator('a[href="demo-wukong.html"]')).toHaveCount(1);

  await expect(page.getByRole('heading', { name: /扩展在线 Demo/ })).toBeVisible();
  const extensions = page.locator('[data-testid="extension-demo"]');
  await expect(extensions).toHaveCount(2);
  await expect(extensions.nth(0)).toContainText('竞品广告情报引擎');
  await expect(extensions.nth(0).locator('a[href="demo-advideo.html"]')).toHaveCount(1);
  await expect(extensions.nth(1)).toContainText('创意分段诊断 Demo');
  await expect(extensions.nth(1).locator('a[href="demo-creative.html"]')).toHaveCount(1);

  await expect(page.locator('body')).toContainText('5 个 AI / 数据在线 Demo');
  await expect(page.locator('.demo-lead')).toContainText('核心与扩展区共 5 个 AI / 数据在线 Demo');
  await expect(page.locator('.demo-lead')).toContainText('企微交互演示另见 ② 案例 01');
  await expect(page.locator('.demo-lead')).toContainText('取数与财务对账见 ② 案例 03');
  const reconciliationCase = page.locator('#case2');
  await expect(reconciliationCase).toContainText('财务对账数据可信性 · 自建工具与三条业务铁律');
  await expect(page.locator('[data-testid="core-project"]').filter({ hasText: 'adquery-lite' })).toHaveCount(0);
});

test('portfolio places extension demos after the strategy and analysis cases', async ({ page }) => {
  await page.goto(`${BASE}/cases.html`);

  await expect(page.locator('.page-head .sub')).toContainText('② 策略产品与数据分析案例');
  await expect(page.locator('.page-head .sub')).toContainText('③ 扩展在线 Demo');

  const order = await page.locator('.section-divider h2').evaluateAll(headings =>
    headings.map(heading => heading.textContent.trim())
  );
  expect(order).toEqual([
    expect.stringMatching(/^① .*2 组核心项目/),
    expect.stringMatching(/^② 策略产品 & 数据分析案例/),
    expect.stringMatching(/^③ 扩展在线 Demo/),
  ]);

  const footerFollowsExtensions = await page.evaluate(() => {
    const extension = document.querySelector('[data-section="extension-demos"]');
    const footer = document.querySelector('footer');
    return Boolean(extension && footer && (extension.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING));
  });
  expect(footerFollowsExtensions).toBe(true);
});

test('portfolio focuses the strategy section on three outcome-led cases', async ({ page }) => {
  await page.goto(`${BASE}/cases.html`);

  const cases = page.locator('section.case');
  await expect(cases).toHaveCount(3);
  await expect(cases.locator('.case-no')).toHaveText(['01', '02', '03']);
  await expect(page.locator('#case3')).toHaveCount(0);

  const decisionCase = page.locator('#case1');
  await expect(decisionCase.locator('h2').first()).toHaveText('算法流量存废之争 · 一次决策反转');
  await expect(decisionCase.locator('.story-card.res')).toContainText('1.67% vs 保量 1.62%');
  await expect(decisionCase.locator('.story-card.res')).toContainText('不能仅凭到客率一刀切砍量');
  await expect(decisionCase.locator('.demo-pointer')).toContainText('本案例讲业务决策');
  await expect(decisionCase).not.toContainText('大盘核心指标（含 7 日基线对比）');
  await expect(decisionCase).not.toContainText('混淆变量实例');

  const reconciliationCase = page.locator('#case2');
  await expect(reconciliationCase.locator('h2').first()).toHaveText('财务对账数据可信性 · 自建工具与三条业务铁律');
  await expect(reconciliationCase.locator('.story-card.res')).toContainText('25×');
  await expect(reconciliationCase.locator('.story-card.res')).toContainText('审批通过');
  await expect(reconciliationCase.locator('.feat-grid')).not.toContainText('键盘流取数');
  await expect(reconciliationCase).not.toContainText('查询历史/收藏');
  await expect(page.locator('body')).not.toContainText('跨行业流量质量归因 · 分析方法论');
});

test('customer monitor remains filterable and sortable after the case merge', async ({ page }) => {
  await page.goto(`${BASE}/cases.html`);

  await page.locator('#indFilters .chip', { hasText: '知识付费' }).click();
  await expect(page.locator('#custBody tr')).toHaveCount(4);
  await expect(page.locator('#custBody tr td:nth-child(2)')).toHaveText([
    '知识付费', '知识付费', '知识付费', '知识付费',
  ]);

  await page.locator('#custTable th[data-key="ctcvr"]').click();
  await expect(page.locator('#custBody tr').first().locator('td').nth(4)).toHaveText('1.75%');
  await page.locator('#custTable th[data-key="ctcvr"]').click();
  await expect(page.locator('#custBody tr').first().locator('td').nth(4)).toHaveText('1.40%');
});

for (const viewport of [
  { name: 'narrow mobile', width: 360, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`${viewport.name} keeps the portfolio project hierarchy within the viewport`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`${BASE}/cases.html`);
    const geometry = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth);
    await expect(page.locator('[data-testid="core-project"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="extension-demo"]')).toHaveCount(2);
  });
}

test('mobile wide data tables remain horizontally reachable inside their panels', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(`${BASE}/cases.html`);

  for (const title of ['头部客户异常监控', '同客户内 · 算法流量 vs 保量流量 到客率对照']) {
    const body = page.locator('.panel').filter({ hasText: title }).locator('.panel-body');
    const geometry = await body.evaluate(element => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      overflowX: getComputedStyle(element).overflowX,
    }));

    expect(geometry.scrollWidth).toBeGreaterThan(geometry.clientWidth);
    expect(geometry.overflowX).toBe('auto');
    await body.evaluate(element => { element.scrollLeft = element.scrollWidth; });
    expect(await body.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  }
});
