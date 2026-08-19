const { test, expect } = require('playwright/test');
const fs = require('fs');
const path = require('path');

const BASE = process.env.DEMO_BASE_URL || 'http://127.0.0.1:52784';

test('README hierarchy matches the portfolio section counts', () => {
  const chinese = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  const english = fs.readFileSync(path.join(__dirname, '..', 'README.en.md'), 'utf8');

  expect(chinese).toContain('**① 3 个项目案例（按简历顺序）**');
  expect(chinese).toContain('**② 3 个完整策略产品 & 数据分析案例**');
  expect(chinese).toContain('**③ 6 个在线 Demo**');
  expect(chinese).toContain('**③ 6 个在线 Demo**');
  expect(chinese).toContain('**在线 Demo 总表（6 个）**');
  expect(chinese).toContain('demo-wecom-flow.html');
  expect(english).toContain('**① Three project cases (in the same order as the résumé)**');
  expect(english).toContain('**② Three complete strategy-product and data-analysis cases**');
  expect(english).toContain('**③ Six live demos**');
  expect(english).toContain('**Live demo index (6 total)**');
  expect(english).toContain('demo-wecom-flow.html');
});

test('portfolio project entry points follow the résumé order and link demos', async ({ page }) => {
  await page.goto(`${BASE}/cases.html`);

  await expect(page.getByRole('heading', { name: /项目案例 · 按简历顺序阅读/ })).toBeVisible();
  const projectCases = page.locator('[data-testid="project-case"]');
  await expect(projectCases).toHaveCount(3);
  await expect(projectCases.nth(0)).toContainText('企微获客链路改造：把长按识别改成点击');
  await expect(projectCases.nth(0).locator('a[href="demo-wecom-flow.html"]')).toHaveCount(1);
  await expect(projectCases.nth(0).locator('a[href="cases.html#case-lianlu"]')).toHaveCount(1);
  await expect(projectCases.nth(1)).toContainText('用广告数据指导 AI 生产新素材，再用投放结果验证');
  await expect(projectCases.nth(1).locator('a[href="demo-creative.html"]')).toHaveCount(1);
  await expect(projectCases.nth(1).locator('a[href="demo-wukong.html"]')).toHaveCount(1);
  await expect(projectCases.nth(2)).toContainText('AI 广告日报与问题排查');
  await expect(projectCases.nth(2).locator('a[href="demo-shufen.html"]')).toHaveCount(1);
  await expect(projectCases.nth(2).locator('a[href="demo-eval.html"]')).toHaveCount(1);

  await expect(page.getByRole('heading', { name: /全部在线 Demo/ })).toBeVisible();
  const projectDemos = page.locator('[data-testid="project-demo"]');
  await expect(projectDemos).toHaveCount(5);
  const extensions = page.locator('[data-testid="extension-demo"]');
  await expect(extensions).toHaveCount(1);
  await expect(extensions.nth(0)).toContainText('竞品广告情报引擎');
  await expect(extensions.nth(0).locator('a[href="demo-advideo.html"]')).toHaveCount(1);

  await expect(page.locator('body')).toContainText('6 个在线 Demo');
  await expect(page.locator('.demo-lead').first()).toContainText('全站共 6 个在线 Demo');
  const reconciliationCase = page.locator('#case2');
  await expect(reconciliationCase).toContainText('财务对账数据可信性 · 自建工具与三条业务铁律');
  await expect(page.locator('[data-testid="project-demo"]').filter({ hasText: 'adquery-lite' })).toHaveCount(0);
});

test('portfolio places complete cases before the grouped demo directory', async ({ page }) => {
  await page.goto(`${BASE}/cases.html`);

  await expect(page.locator('.page-head .sub')).toContainText('按简历顺序先看 3 个项目闭环');
  await expect(page.locator('.page-head .sub')).toContainText('全部 Demo 目录');

  const order = await page.locator('.section-divider h2').evaluateAll(headings =>
    headings.map(heading => heading.textContent.trim())
  );
  expect(order).toEqual([
    expect.stringMatching(/^① 项目案例 · 按简历顺序阅读/),
    expect.stringMatching(/^② 策略产品 & 数据分析案例/),
    expect.stringMatching(/^③ 全部在线 Demo/),
  ]);

  const footerFollowsDemos = await page.evaluate(() => {
    const demos = document.querySelector('[data-section="demo-directory"]');
    const footer = document.querySelector('footer');
    return Boolean(demos && footer && (demos.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING));
  });
  expect(footerFollowsDemos).toBe(true);
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
    await expect(page.locator('[data-testid="project-case"]')).toHaveCount(3);
    await expect(page.locator('[data-testid="project-demo"]')).toHaveCount(5);
    await expect(page.locator('[data-testid="extension-demo"]')).toHaveCount(1);
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
