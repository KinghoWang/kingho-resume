const { test, expect } = require('playwright/test');
const fs = require('fs');
const path = require('path');

const BASE = process.env.DEMO_BASE_URL || 'http://127.0.0.1:52784';

test('README descriptions match the embedded-Demo portfolio structure', () => {
  const chinese = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  const english = fs.readFileSync(path.join(__dirname, '..', 'README.en.md'), 'utf8');

  expect(chinese).toContain('**三个完整项目案例（按简历顺序）**');
  expect(chinese).toContain('5 个 Demo 分别嵌在对应案例末尾');
  expect(chinese).not.toContain('**② 6 个在线 Demo**');
  expect(chinese).toContain('**在线 Demo 总表（5 个）**');
  expect(english).toContain('**Three complete project cases (in résumé order)**');
  expect(english).toContain('The five demos are embedded once at the end of the relevant case');
  expect(english).not.toContain('**② Six live demos**');
  expect(english).toContain('**Live demo index (5 total)**');
  expect(english).toContain('**Methodology write-ups**:');
  expect(english).not.toContain('**④ Methodology write-ups**:');

  for (const href of PUBLIC_DEMOS) {
    const markdownLink = `[${href}](https://kinghowang.github.io/kingho-resume/${href})`;
    expect(chinese.split(markdownLink).length - 1).toBe(1);
    expect(english.split(markdownLink).length - 1).toBe(1);
  }
  expect(chinese).not.toContain('demo-advideo.html');
  expect(chinese).not.toContain('竞品广告情报引擎');
  expect(english).not.toContain('demo-advideo.html');
  expect(english).not.toContain('Competitor Ad Intelligence');
});

const PUBLIC_DEMOS = [
  'demo-creative.html',
  'demo-eval.html',
  'demo-shufen.html',
  'demo-wecom-flow.html',
  'demo-wukong.html',
];

test('portfolio renders three complete project cases in résumé order', async ({ page }) => {
  await page.goto(`${BASE}/cases.html`);

  await expect(page).toHaveTitle('王钧灏 - 作品集：三个项目案例');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', '王钧灏作品集：企微获客链路、AI 创意生产与投放验证、AI 广告日报与问题排查。每个案例讲清背景、关键判断、执行逻辑、结果验证和归因边界。');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', '王钧灏 · 作品集：三个项目案例');
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', '三个完整项目案例，按简历顺序呈现；对应 Demo 就近放在案例末尾。');
  await expect(page.getByRole('heading', { level: 1, name: '作品集 · 项目案例' })).toBeVisible();
  await expect(page.locator('.page-head .sub')).toHaveText('三个项目按简历顺序呈现。每个案例独立讲清关键判断、执行逻辑、结果与归因边界，再就近进入对应 Demo。');
  await expect(page.locator('.disclaimer')).toContainText('本页基于真实工作项目整理；客户 / 代理商名称、绝对数据、内部表名和界面素材均已脱敏或示意化处理。');

  const projectCases = page.locator('[data-testid="project-case"]');
  await expect(projectCases).toHaveCount(3);
  await expect(projectCases.nth(0)).toHaveAttribute('id', 'case-lianlu');
  await expect(projectCases.nth(0)).toContainText('企微获客链路改造');
  await expect(projectCases.nth(1)).toContainText('AI 创意生产与投放验证');
  await expect(projectCases.nth(2)).toContainText('AI 广告日报与问题排查');

  for (const projectCase of await projectCases.all()) {
    await expect(projectCase).toContainText('必要背景');
    await expect(projectCase).toContainText('关键判断');
    await expect(projectCase).toContainText(/方案逻辑|执行流程/);
    await expect(projectCase).toContainText('结果验证');
    await expect(projectCase).toContainText('归因边界');
    await expect(projectCase).toContainText('对应 Demo');
  }
});

test('portfolio keeps project cases readable without IntersectionObserver', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto(`${BASE}/cases.html`);

  const states = await page.locator('[data-testid="project-case"]').evaluateAll((projectCases) =>
    projectCases.map((projectCase) => ({
      opacity: getComputedStyle(projectCase).opacity,
      pending: projectCase.classList.contains('reveal-pending'),
    }))
  );
  expect(states).toEqual([
    { opacity: '1', pending: false },
    { opacity: '1', pending: false },
    { opacity: '1', pending: false },
  ]);
});

test('portfolio reveal resolves case opacity after anchor navigation and scrolling', async ({ page }) => {
  await page.goto(`${BASE}/cases.html#case-lianlu`);
  const projectCases = page.locator('[data-testid="project-case"]');
  await expect(projectCases).toHaveCount(3);

  for (let index = 0; index < 3; index += 1) {
    const projectCase = projectCases.nth(index);
    await projectCase.scrollIntoViewIfNeeded();
    await expect.poll(
      () => projectCase.evaluate((element) => ({
        opacity: getComputedStyle(element).opacity,
        pending: element.classList.contains('reveal-pending'),
      })),
      { message: `project case ${index + 1} reveal did not resolve` }
    ).toEqual({ opacity: '1', pending: false });
  }
});

test('portfolio supporting text uses the approved accessible color', async ({ page }) => {
  await page.goto(`${BASE}/cases.html`);

  const roleColors = await page.locator('.project-case-role').evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).color)
  );
  expect(roleColors).toEqual([
    'rgb(101, 114, 116)',
    'rgb(101, 114, 116)',
    'rgb(101, 114, 116)',
  ]);
  await expect(page.locator('.project-demo-note')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('竞品广告情报');
  await expect(page.locator('body')).not.toContainText('外部素材参考');
  await expect(page.locator('body')).not.toContainText('采集细节');
});

test('portfolio embeds each Demo URL exactly once beside its project', async ({ page }) => {
  await page.goto(`${BASE}/cases.html`);
  const projectCases = page.locator('[data-testid="project-case"]');

  await expect(projectCases.nth(0).locator('a[href="demo-wecom-flow.html"]')).toHaveCount(1);
  await expect(projectCases.nth(0).locator('a')).toHaveCount(1);
  await expect(projectCases.nth(1).locator('a[href="demo-creative.html"]')).toHaveCount(1);
  await expect(projectCases.nth(1).locator('a[href="demo-wukong.html"]')).toHaveCount(1);
  await expect(projectCases.nth(1).locator('a[href="demo-advideo.html"]')).toHaveCount(0);
  await expect(projectCases.nth(1).locator('a')).toHaveCount(2);
  await expect(projectCases.nth(2).locator('a[href="demo-shufen.html"]')).toHaveCount(1);
  await expect(projectCases.nth(2).locator('a[href="demo-eval.html"]')).toHaveCount(1);
  await expect(projectCases.nth(2).locator('a')).toHaveCount(2);

  const published = await page.locator('a[href^="demo-"][href$=".html"]').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')).sort()
  );
  expect(published).toEqual(PUBLIC_DEMOS);
  for (const href of PUBLIC_DEMOS) {
    await expect(page.locator(`a[href="${href}"]`)).toHaveCount(1);
  }
});

test('portfolio keeps the approved evidence and attribution boundaries', async ({ page }) => {
  await page.goto(`${BASE}/cases.html#case-lianlu`);
  const projectCases = page.locator('[data-testid="project-case"]');

  await expect(projectCases.nth(0)).toContainText('中老年主力用户不熟悉这一步');
  await expect(projectCases.nth(0)).toContainText('曝光-加微率提升 50% 以上');
  await expect(projectCases.nth(0)).toContainText('曝光-地址率提升 40% 以上');
  await expect(projectCases.nth(0)).toContainText('广告主后续转化未下降');
  await expect(projectCases.nth(0)).toContainText('不单独归因为前端链路改造');

  await expect(projectCases.nth(1)).toContainText('同期同 SKU 全量素材');
  await expect(projectCases.nth(1)).toContainText('CPM 与 CTCVR 综合表现处于中上游');
  await expect(projectCases.nth(1)).toContainText('不包装为头部爆款');

  await expect(projectCases.nth(2)).toContainText('小时级缩短至分钟级');
  await expect(projectCases.nth(2)).toContainText('每周向产研提交 1 至 2 份 MRD');
  await expect(projectCases.nth(2)).toContainText('不声明 MRD 的采纳或上线数量');
  await expect(projectCases.nth(2)).toContainText('不把 Grafana-Lite 的建设归属作为卖点');
});

test('portfolio removes the duplicate cards, Demo directory, and supplemental cases', async ({ page }) => {
  await page.goto(`${BASE}/cases.html`);

  await expect(page.locator('[data-section="demo-directory"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="project-demo"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="extension-demo"]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /全部在线 Demo/ })).toHaveCount(0);
  await expect(page.locator('.case-index-steps')).toHaveCount(0);
  await expect(page.locator('section.case')).toHaveCount(0);
  await expect(page.locator('#case1, #case2, #case3')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('算法流量存废之争');
  await expect(page.locator('body')).not.toContainText('财务对账数据可信性');
  await expect(page.locator('body')).not.toContainText('策略产品 & 数据分析案例');
});

test('public discovery surfaces hide the competitor intelligence Demo', () => {
  for (const file of ['cases.html', 'README.md', 'README.en.md', 'index.html', 'en.html', 'sitemap.xml']) {
    const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    expect(content, file).not.toContain('demo-advideo.html');
  }

  const sitemap = fs.readFileSync(path.join(__dirname, '..', 'sitemap.xml'), 'utf8');
  for (const href of PUBLIC_DEMOS) {
    expect(sitemap).toContain(`https://kinghowang.github.io/kingho-resume/${href}`);
  }

  const hiddenDemo = fs.readFileSync(path.join(__dirname, '..', 'demo-advideo.html'), 'utf8');
  expect(hiddenDemo).toContain('<meta name="robots" content="noindex,nofollow">');

  const robots = fs.readFileSync(path.join(__dirname, '..', 'robots.txt'), 'utf8');
  expect(robots).not.toContain('各 Demo 均为对外展示内容');
  expect(robots).toMatch(/^Allow: \/$/m);
});

for (const viewport of [
  { name: 'narrow mobile', width: 360, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`${viewport.name} keeps all project content usable`, async ({ page }) => {
    const browserErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });
    page.on('pageerror', (error) => browserErrors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto(`${BASE}/cases.html`);

    const projectCases = page.locator('[data-testid="project-case"]');
    await expect(projectCases).toHaveCount(3);
    const projectCaseItems = await projectCases.all();
    for (let index = 0; index < projectCaseItems.length; index += 1) {
      const projectCase = projectCaseItems[index];
      await projectCase.scrollIntoViewIfNeeded();
      await expect(projectCase).toBeVisible();
      const box = await projectCase.boundingBox();
      expect(box, `${viewport.name} project case ${index + 1} has no bounding box`).not.toBeNull();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    }
    const links = page.locator('.project-demo-link');
    await expect(links).toHaveCount(5);
    const demoLinks = await links.all();
    for (let index = 0; index < demoLinks.length; index += 1) {
      const link = demoLinks[index];
      await link.scrollIntoViewIfNeeded();
      const box = await link.boundingBox();
      expect(box, `${viewport.name} Demo link ${index + 1} has no bounding box`).not.toBeNull();
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(viewport.width);
    expect(browserErrors).toEqual([]);
  });
}
