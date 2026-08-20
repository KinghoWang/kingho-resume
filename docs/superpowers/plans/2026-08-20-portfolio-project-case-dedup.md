# Portfolio Project Case Deduplication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the resume-like summary cards and separate Demo directory in `cases.html` with three independently readable project cases whose five public Demo links appear once, beside the relevant case; keep the competitor-intelligence Demo file only as a non-indexed, non-publicly-linked historical artifact.

**Architecture:** Keep the site as one static page with inline case-page CSS and the existing reveal script. Render three unframed, full-width `<article>` sections in resume order; each article owns its background, judgment, execution logic, result, attribution boundary, and public Demo links. Keep the five public Demo files unchanged. Retain `demo-advideo.html` without changing its functionality, data, or visuals, but remove it from every public discovery surface and add only `noindex,nofollow`; keep `robots.txt` crawlable so search engines can process that directive. Preserve the homepage destination `cases.html#case-lianlu` and its approved labels `查看案例` / `View case`.

**Tech Stack:** Static HTML5, CSS3, vanilla JavaScript, Playwright, Python `http.server`, Git

---

## File Map

- Modify `cases.html`: replace the summary-card and Demo-directory information architecture with the three approved case narratives.
- Modify `tests/portfolio-content.spec.js`: lock the three-case content contract, one-link-per-public-Demo contract, hidden-Demo discovery boundary, removed structures, responsive geometry, touch targets, and console cleanliness.
- Modify `tests/resume-content.spec.js`: keep the cross-page five-public-Demo regression while removing its dependency on the deleted Demo directory.
- Verify/Modify `tests/wecom-flow.spec.js`: synchronize the new case link and evidence copy while retaining the 44px touch-target and bidirectional `cases.html#case-lianlu` anchor checks.
- Modify `README.md`: describe three complete cases with five public Demo links embedded beside the relevant case; retain a five-row direct Demo table with no competitor-intelligence entry.
- Modify `README.en.md`: mirror the same portfolio architecture in English; retain a five-row direct Demo table with no competitor-intelligence entry.
- Modify `index.html` / `en.html`: set the hero count to five public demos. Retain the prerequisite project-entry contract: both files keep `cases.html#case-lianlu` and the labels `查看案例` / `View case`; do not change any other resume copy.
- Modify `sitemap.xml`: list the five public Demo URLs and omit the hidden Demo.
- Modify `robots.txt`: retain `Allow: /` and explain that non-indexed pages declare their own robots meta.
- Modify `demo-advideo.html`: add only `<meta name="robots" content="noindex,nofollow">`; do not delete the file or change its functionality, data, or visuals.
- Do not modify `style.css`, `kingho-resume-ai-pm.pdf`, Word/PDF sources, or any other Demo content.

### Task 1: Lock The Approved Page Contract And Implement The Three Cases

**Files:**
- Modify: `tests/portfolio-content.spec.js:23-223`
- Modify: `tests/resume-content.spec.js:348-365`
- Verify/Modify: `tests/wecom-flow.spec.js:310-341` (the branch diff already synchronizes the approved case-link label and evidence assertions while retaining the 44px and bidirectional-anchor checks)
- Modify: `cases.html:6-243`
- Retain from prerequisite commit `cb48394` as part of the final implementation scope: `index.html:80` and `en.html:79` (one label-only line in each file; both keep `cases.html#case-lianlu`)

- [ ] **Step 1: Replace the old portfolio hierarchy assertions with failing case-page regressions**

Keep the README test at the top of `tests/portfolio-content.spec.js` for Task 2. Replace the remaining tests with the following contract:

```javascript
const PUBLIC_DEMOS = [
  'demo-creative.html',
  'demo-eval.html',
  'demo-shufen.html',
  'demo-wecom-flow.html',
  'demo-wukong.html',
];

test('portfolio renders three complete project cases in résumé order', async ({ page }) => {
  await page.goto(`${BASE}/cases.html`);

  await expect(page.getByRole('heading', { level: 1, name: '作品集 · 项目案例' })).toBeVisible();
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
  await expect(page.locator('.project-demo-note')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /全部在线 Demo/ })).toHaveCount(0);
  await expect(page.locator('.case-index-steps')).toHaveCount(0);
  await expect(page.locator('section.case')).toHaveCount(0);
  await expect(page.locator('#case1, #case2, #case3')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('算法流量存废之争');
  await expect(page.locator('body')).not.toContainText('财务对账数据可信性');
  await expect(page.locator('body')).not.toContainText('策略产品 & 数据分析案例');
  await expect(page.locator('body')).not.toContainText('竞品广告情报');
  await expect(page.locator('body')).not.toContainText('外部素材参考');
  await expect(page.locator('body')).not.toContainText('采集细节');
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
```

Replace the old portfolio Demo-count test in `tests/resume-content.spec.js` with:

```javascript
test('portfolio publishes five unique online demos once inside project cases', async ({ page }) => {
  await page.goto(`${BASE}/cases.html`);
  await expect(page.locator('[data-testid="project-case"]')).toHaveCount(3);
  await expect(page.locator('[data-section="demo-directory"]')).toHaveCount(0);
  const expected = ['demo-creative.html', 'demo-eval.html', 'demo-shufen.html', 'demo-wecom-flow.html', 'demo-wukong.html'];
  const published = await page.locator('a[href^="demo-"][href$=".html"]').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')).sort()
  );
  expect(published).toEqual(expected);
  await expect(page.locator('a[href="demo-advideo.html"]')).toHaveCount(0);
  for (const href of expected) {
    await expect(page.locator(`a[href="${href}"]`)).toHaveCount(1);
  }
});
```

- [ ] **Step 2: Run the new page tests and verify the old layout fails**

Run:

```bash
DEMO_BASE_URL=http://127.0.0.1:52786 playwright test tests/portfolio-content.spec.js tests/resume-content.spec.js --grep "complete project cases|embeds each Demo|evidence and attribution|duplicate cards|project content usable|once inside project cases" --workers=1
```

Expected: FAIL because the current page still has the legacy Demo directory, `.case-index-steps`, repeated Demo URLs, and lacks the five-part case narrative.

- [ ] **Step 3: Replace the case-page metadata and inline CSS**

Set the metadata to:

```html
<title>王钧灏 - 作品集：三个项目案例</title>
<meta name="description" content="王钧灏作品集：企微获客链路、AI 创意生产与投放验证、AI 广告日报与问题排查。每个案例讲清背景、关键判断、执行逻辑、结果验证和归因边界。">
<meta property="og:title" content="王钧灏 · 作品集：三个项目案例">
<meta property="og:description" content="三个完整项目案例，按简历顺序呈现；对应 Demo 就近放在案例末尾。">
```

Replace the case-page `<style>` block with this unframed project layout:

```css
:root{--c-green:#1e8449;--c-amber:#b9770e}
.page-head{max-width:960px;margin:0 auto;padding:56px 48px 8px}
.back-link{display:inline-flex;align-items:center;min-height:44px;font-size:.85rem;color:var(--accent);text-decoration:none;font-weight:600}
.back-link:hover{text-decoration:underline}
.page-head h1{font-family:var(--font-display);font-size:clamp(1.7rem,3.5vw,2.4rem);font-weight:700;margin:12px 0 8px}
.page-head .sub{color:var(--muted);font-size:1rem;max-width:700px}
.disclaimer{max-width:864px;margin:24px auto 10px;padding:13px 0;border-top:1px solid #e6c986;border-bottom:1px solid #e6c986;font-size:.84rem;color:#735f2a;line-height:1.65}
.disclaimer strong{color:#5f4c1d}
.project-list{max-width:864px;margin:18px auto 0;padding:0 0 36px}
.project-case{padding:38px 0 42px;border-top:1px solid var(--border);opacity:1;transform:none;scroll-margin-top:20px}
.project-case.reveal-pending{opacity:0;transform:translateY(24px)}
.project-case.reveal-pending.visible{animation:fadeUp .55s ease forwards}
.project-case:last-child{border-bottom:1px solid var(--border)}
.project-case-head{display:grid;grid-template-columns:58px minmax(0,1fr);gap:18px;align-items:start}
.project-case-no{font-family:var(--font-display);font-size:1.55rem;line-height:1;color:var(--accent);font-weight:700}
.project-case-title h2{font-family:var(--font-display);font-size:1.28rem;line-height:1.35;font-weight:700}
.project-case-role{margin-top:5px;color:#657274;font-size:.76rem}
.project-context{max-width:760px;margin:19px 0 18px 76px;color:#354047;font-size:.9rem;line-height:1.72}
.project-label{display:block;margin-bottom:4px;color:var(--accent);font-size:.72rem;font-weight:700}
.project-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));margin-left:76px;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.project-detail{min-width:0;padding:18px 24px 18px 0}
.project-detail:nth-child(even){border-left:1px solid var(--border);padding-left:24px;padding-right:0}
.project-detail:nth-child(n+3){border-top:1px solid var(--border)}
.project-detail h3{margin-bottom:6px;color:var(--accent);font-size:.76rem;font-weight:700}
.project-detail p{color:#354047;font-size:.85rem;line-height:1.68}
.project-detail.attribution h3{color:var(--c-green)}
.project-demos{display:grid;grid-template-columns:128px minmax(0,1fr);gap:14px;margin:18px 0 0 76px;align-items:start}
.project-demos-title{padding-top:11px;color:#333;font-size:.76rem;font-weight:700}
.project-demo-links{display:flex;flex-wrap:wrap;gap:8px 14px}
.project-demo-link{display:inline-flex;align-items:center;min-height:44px;color:var(--accent);font-size:.8rem;font-weight:700;text-decoration:none;border-bottom:1px solid #dfa39b}
.project-demo-link:hover{text-decoration:underline}
.footer{margin-top:0}
@media(max-width:960px){
  .disclaimer,.project-list{margin-left:48px;margin-right:48px}
}
@media(max-width:640px){
  .page-head{padding:36px 20px 4px}
  .disclaimer,.project-list{margin-left:20px;margin-right:20px}
  .project-case{padding:30px 0 34px}
  .project-case-head{grid-template-columns:42px minmax(0,1fr);gap:10px}
  .project-case-no{font-size:1.25rem}
  .project-context,.project-detail-grid,.project-demos{margin-left:52px}
  .project-detail-grid{grid-template-columns:1fr}
  .project-detail{padding:15px 0}
  .project-detail:nth-child(even){border-left:0;border-top:1px solid var(--border);padding-left:0}
  .project-detail:nth-child(n+3){border-top:1px solid var(--border)}
  .project-demos{grid-template-columns:1fr;gap:2px}
  .project-demos-title{padding-top:0}
  .project-demo-links{display:grid;grid-template-columns:1fr}
  .project-demo-link{width:100%}
}
```

- [ ] **Step 4: Replace the old page body with the approved three-case markup**

Keep the existing footer only. Replace the content from `<header class="page-head"` through the closing tag of the Demo-directory section with:

```html
<header class="page-head" data-reveal>
  <a class="back-link" href="index.html">← 返回简历主页</a>
  <h1>作品集 · 项目案例</h1>
  <p class="sub">三个项目按简历顺序呈现。每个案例独立讲清关键判断、执行逻辑、结果与归因边界，再就近进入对应 Demo。</p>
</header>

<div class="disclaimer" data-reveal>
  <strong>脱敏说明：</strong>本页基于真实工作项目整理；客户 / 代理商名称、绝对数据、内部表名和界面素材均已脱敏或示意化处理。
</div>

<main class="project-list" aria-label="项目案例">
  <article class="project-case" id="case-lianlu" data-testid="project-case" data-reveal>
    <header class="project-case-head">
      <div class="project-case-no" aria-hidden="true">01</div>
      <div class="project-case-title">
        <h2>企微获客链路改造</h2>
        <p class="project-case-role">产品方案设计 · 协同落地 · 数据验证</p>
      </div>
    </header>
    <p class="project-context"><span class="project-label">必要背景</span>原链路要求用户在 H5 长按二维码，再从系统菜单选择识别；中老年主力用户不熟悉这一步，容易在加微前退出。</p>
    <div class="project-detail-grid">
      <section class="project-detail"><h3>关键判断</h3><p>问题不只是链路多一步，而是关键动作不符合目标用户的常用操作习惯。优化目标是移除长按和菜单判断，不是单纯减少页面数量。</p></section>
      <section class="project-detail"><h3>方案逻辑</h3><p>小程序无法直接调起企微获客助手，但可以打开企微客服会话。以客服会话为中转，自动发送文案和卡片，两者都指向同一获客链接，用户点击任一入口即可继续添加微信。</p></section>
      <section class="project-detail"><h3>结果验证</h3><p>曝光-加微率提升 50% 以上，曝光-地址率提升 40% 以上；广告主后续转化未下降。</p></section>
      <section class="project-detail attribution"><h3>归因边界</h3><p>指标为相对原链路的提升，绝对值已脱敏；后续转化未下降作为质量护栏。CPM 同步提升只作为平台效率结果展示，不单独归因为前端链路改造。</p></section>
    </div>
    <nav class="project-demos" aria-label="企微获客链路改造对应 Demo">
      <p class="project-demos-title">对应 Demo</p>
      <div class="project-demo-links"><a class="project-demo-link" href="demo-wecom-flow.html">体验企微链路 Demo ↗</a></div>
    </nav>
  </article>

  <article class="project-case" data-testid="project-case" data-reveal>
    <header class="project-case-head">
      <div class="project-case-no" aria-hidden="true">02</div>
      <div class="project-case-title">
        <h2>AI 创意生产与投放验证</h2>
        <p class="project-case-role">素材洞察 · Agent 生产执行 · 人工抽检</p>
      </div>
    </header>
    <p class="project-context"><span class="project-label">必要背景</span>新 SKU 素材制作需要复用历史有效经验，同时不能让缺少视觉判断能力的 Agent 自行决定创意方向。</p>
    <div class="project-detail-grid">
      <section class="project-detail"><h3>关键判断</h3><p>人工查看广告素材逐秒表现和分段聚合数据，找出可复用与需优化部分并形成新 SKU 制作建议；Agent 只按已确定方向执行剪辑，人工负责最终抽检。</p></section>
      <section class="project-detail"><h3>执行流程</h3><p>素材洞察 → 制作建议 → 悟空任务卡与剪辑脚本执行 → 自动质检与白名单自修 → 人工抽检 → 投放验证。</p></section>
      <section class="project-detail"><h3>结果验证</h3><p>以同期同 SKU 全量素材为基准，新素材的 CPM 与 CTCVR 综合表现处于中上游；减少人工逐条跟进与重复制作投入，但不量化未经确认的节省比例。</p></section>
      <section class="project-detail attribution"><h3>归因边界</h3><p>结果支持这套生产流程能稳定产出可投、表现不差的素材；不包装为头部爆款，也不声称全部投放表现由 AI 单独造成。</p></section>
    </div>
    <nav class="project-demos" aria-label="AI 创意生产与投放验证对应 Demo">
      <p class="project-demos-title">对应 Demo</p>
      <div class="project-demo-links">
        <a class="project-demo-link" href="demo-creative.html">查看创意分析 Demo ↗</a>
        <a class="project-demo-link" href="demo-wukong.html">体验悟空生产流程 ↗</a>
      </div>
    </nav>
  </article>

  <article class="project-case" data-testid="project-case" data-reveal>
    <header class="project-case-head">
      <div class="project-case-no" aria-hidden="true">03</div>
      <div class="project-case-title">
        <h2>AI 广告日报与问题排查</h2>
        <p class="project-case-role">AI 初筛 · 人工核验 · MRD 反馈</p>
      </div>
    </header>
    <p class="project-context"><span class="project-label">必要背景</span>广告日报需要快速发现异常，同时避免运营直接采用模型给出的未经核验结论。</p>
    <div class="project-detail-grid">
      <section class="project-detail"><h3>关键判断</h3><p>AI 只负责按固定指标口径汇总核心表现、异常变化和待排查线索；运营在公司内部大数据看板 Grafana-Lite 下钻，用明细数据核验问题与影响范围，并作最终判断。</p></section>
      <section class="project-detail"><h3>执行流程</h3><p>固定指标口径 → 数分机器人生成日报和线索 → Grafana-Lite 下钻核验 → 将确认的问题、数据依据与影响范围整理成 MRD → 反馈产研。</p></section>
      <section class="project-detail"><h3>结果验证</h3><p>日报整理及数据排查从小时级缩短至分钟级；每周向产研提交 1 至 2 份 MRD。</p></section>
      <section class="project-detail attribution"><h3>归因边界</h3><p>不声明 MRD 的采纳或上线数量，不把最终业务判断或问题解决归给 AI，也不把 Grafana-Lite 的建设归属作为卖点。</p></section>
    </div>
    <nav class="project-demos" aria-label="AI 广告日报与问题排查对应 Demo">
      <p class="project-demos-title">对应 Demo</p>
      <div class="project-demo-links">
        <a class="project-demo-link" href="demo-shufen.html">体验数分机器人 ↗</a>
        <a class="project-demo-link" href="demo-eval.html">查看 Eval 评测 ↗</a>
      </div>
    </nav>
  </article>
</main>
```

Replace the reveal script with this progressive-enhancement implementation. Project cases are visible by default. Add `reveal-pending` only when `IntersectionObserver` exists and its constructor succeeds; after intersection, add `visible` and remove the pending state on `animationend` or after 650ms. If the API is missing or construction/observation throws, the fallback removes `reveal-pending` and adds `visible`:

```html
<script>
document.addEventListener('DOMContentLoaded',()=>{
  const els=document.querySelectorAll('[data-reveal]');
  const projectCases=document.querySelectorAll('.project-case[data-reveal]');
  const showProjectCases=()=>projectCases.forEach(el=>{
    el.classList.remove('reveal-pending');
    el.classList.add('visible');
  });
  if(typeof IntersectionObserver!=='function'){
    showProjectCases();
    return;
  }
  let io;
  try{
    io=new IntersectionObserver((entries)=>{
      entries.forEach(e=>{if(e.isIntersecting){
        e.target.classList.add('visible');
        if(e.target.classList.contains('project-case')){
          const finishReveal=()=>e.target.classList.remove('reveal-pending');
          e.target.addEventListener('animationend',finishReveal,{once:true});
          setTimeout(finishReveal,650);
        }
        io.unobserve(e.target);
      }})
    },{threshold:.08});
    projectCases.forEach(el=>el.classList.add('reveal-pending'));
    els.forEach(el=>io.observe(el));
  }catch(error){
    if(io)io.disconnect();
    showProjectCases();
  }
});

</script>
```

- [ ] **Step 5: Run the focused page regressions and verify they pass**

Run the Step 2 command again.

Expected: all selected tests PASS; five public Demo links appear exactly once, Case 02 contains only the creative and Wukong links, the old directory is absent, all four viewports stay within width, every Demo link is at least 44px high, and browser errors are empty.

- [ ] **Post-review hardening: lock progressive reveal, supporting-text color, and geometry guards**

Add the reviewed regressions to `tests/portfolio-content.spec.js`:

```javascript
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
});
```

Keep the responsive loop's geometry checks null-safe before reading `x`, `width`, or `height`:

```javascript
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
```

Run:

```bash
DEMO_BASE_URL=http://127.0.0.1:52786 playwright test tests/portfolio-content.spec.js --grep "without IntersectionObserver|reveal resolves case opacity|supporting text uses|project content usable" --workers=1
```

Expected: all selected tests PASS; the three fallback states equal `{ opacity: '1', pending: false }`, anchor/scroll reveals settle to the same state, the three role colors compute to `rgb(101, 114, 116)` (`#657274`), and every project/Demo bounding box is non-null before geometry is read. The removed note and competitor copy are covered by the separate structure/discovery contracts, not by this color test.

- [ ] **Step 6: Preserve the published WeCom anchor and backlink contract**

Verify and, where needed, synchronize `tests/wecom-flow.spec.js` with the approved case-link label and new evidence copy. Keep its mobile 44px touch-target assertion and both directions of the `cases.html#case-lianlu` ↔ `demo-wecom-flow.html` navigation contract.

Run:

```bash
DEMO_BASE_URL=http://127.0.0.1:52786 playwright test tests/wecom-flow.spec.js --grep "navigation links meet|Case 01 links" --workers=1
```

Expected: 2 tests PASS; `cases.html#case-lianlu` reveals the case, its link still points to `demo-wecom-flow.html`, and the Demo backlink still points to `cases.html#case-lianlu`.

- [ ] **Step 7: Commit the page and regression changes**

```bash
git add cases.html tests/portfolio-content.spec.js tests/resume-content.spec.js tests/wecom-flow.spec.js
git commit -m "refactor: turn portfolio into three complete project cases"
```

### Task 2: Synchronize The Repository Descriptions Without Recreating A Directory

**Files:**
- Modify: `tests/portfolio-content.spec.js:7-21`
- Modify: `README.md:19-25`
- Modify: `README.en.md:21-29`

- [ ] **Step 1: Change the README contract test first**

Replace the first test in `tests/portfolio-content.spec.js` with:

```javascript
test('README descriptions match the embedded-Demo portfolio structure', () => {
  const chinese = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  const english = fs.readFileSync(path.join(__dirname, '..', 'README.en.md'), 'utf8');

  expect(chinese).toContain('**三个完整项目案例（按简历顺序）**');
  expect(chinese).toContain('5 个 Demo 分别嵌在对应案例末尾');
  expect(chinese).toContain('**在线 Demo 总表（5 个）**');
  expect(english).toContain('**Three complete project cases (in résumé order)**');
  expect(english).toContain('The five demos are embedded once at the end of the relevant case');
  expect(english).toContain('**Live demo index (5 total)**');

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
```

- [ ] **Step 2: Run the README contract and verify it fails on the old wording**

```bash
DEMO_BASE_URL=http://127.0.0.1:52786 playwright test tests/portfolio-content.spec.js --grep "README descriptions" --workers=1
```

Expected: FAIL because both READMEs still use the outdated public count or retain the hidden competitor-intelligence row.

- [ ] **Step 3: Replace the Chinese portfolio introduction**

Keep the direct Demo table. Replace the two numbered paragraphs above it in `README.md` with:

```markdown
**三个完整项目案例（按简历顺序）**：企微获客链路改造、AI 创意生产与投放验证、AI 广告日报与问题排查。每个案例独立讲清必要背景、关键判断、执行流程、结果验证与归因边界。

5 个 Demo 分别嵌在对应案例末尾，面试官可先理解项目，再按兴趣继续体验。下表保留直接入口，便于快速访问。
```

Keep exactly five table rows: `demo-shufen.html`, `demo-wukong.html`, `demo-wecom-flow.html`, `demo-creative.html`, and `demo-eval.html`. Do not include the hidden Demo URL or its Chinese name.

- [ ] **Step 4: Replace the English portfolio introduction**

Keep the direct Demo table. Replace the two numbered paragraphs above it in `README.en.md` with:

```markdown
**Three complete project cases (in résumé order)**: WeCom acquisition-flow redesign, AI creative production and delivery validation, and AI ad reporting and issue investigation. Each case independently explains the necessary context, key judgment, execution flow, result validation, and attribution boundary.

The five demos are embedded once at the end of the relevant case, so readers can understand the project before choosing what to try. The table below remains as a direct-access index.
```

Keep the same five table rows in English and do not include the hidden Demo URL or its English name.

- [ ] **Step 5: Run the README and full portfolio specs**

```bash
DEMO_BASE_URL=http://127.0.0.1:52786 playwright test tests/portfolio-content.spec.js --workers=1
```

Expected: all tests in `tests/portfolio-content.spec.js` PASS.

- [ ] **Step 6: Commit the README synchronization**

```bash
git add README.md README.en.md tests/portfolio-content.spec.js
git commit -m "docs: align portfolio readmes with embedded demos"
```

### Task 3: Apply The Non-Destructive Competitor-Demo Privacy Revision

**Files:**
- Modify: `cases.html` (Case 02 keeps only the creative and Wukong links; no competitor name or explanatory note)
- Modify: `README.md` and `README.en.md` (five-row public tables; no hidden Demo link or name)
- Modify: `index.html` and `en.html` (hero count becomes five; retain `查看案例` / `View case`)
- Modify: `sitemap.xml` (five public Demo URLs only)
- Modify: `robots.txt` (`Allow: /` remains)
- Modify: `demo-advideo.html` (robots meta only; file and direct URL remain)
- Modify: `tests/portfolio-content.spec.js` and `tests/resume-content.spec.js` (static discovery, count, and hero contracts)

This is discovery-surface hiding, not access control. A visitor who knows the direct URL, follows an old link, or has browser history can still open the retained file. Do not describe the result as private, authenticated, or inaccessible.

- [ ] **Step 1: Lock the public-discovery contract first**

Add the static contract to `tests/portfolio-content.spec.js`:

```javascript
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
```

Keep the Case 02 and public-body assertions from Task 1: two links, zero `demo-advideo.html` links, and zero occurrences of `竞品广告情报`, `外部素材参考`, or `采集细节`. Keep the README assertions from Task 2 so both public tables contain exactly the five `PUBLIC_DEMOS` links once and omit both competitor-intelligence names.

In `tests/resume-content.spec.js`, set the hero and portfolio counts to five while preserving the existing case-label arrays:

```javascript
test('resume heroes use the unified five-demo count', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  await expect(page.locator('.hero-links a[href="cases.html"]')).toContainText('5 个在线 Demo');

  await page.goto(`${BASE}/en.html`);
  await expect(page.locator('.hero-links a[href="cases.html"]')).toContainText('5 live demos');
});

// Existing project-entry contracts remain unchanged:
// ['cases.html#case-lianlu', '查看案例']
// ['cases.html#case-lianlu', 'View case']
```

- [ ] **Step 2: Run the privacy contracts and verify the old public entry points fail**

```bash
DEMO_BASE_URL=http://127.0.0.1:52786 playwright test tests/portfolio-content.spec.js tests/resume-content.spec.js --grep "public discovery surfaces|README descriptions|supporting text uses|embeds each Demo|five-demo count|five unique online demos" --workers=1
```

Expected before the privacy implementation: FAIL on the old Case 02 link/note, README rows, hero count, sitemap entry, or missing robots meta.

- [ ] **Step 3: Apply the exact discovery-file changes**

Keep the Case 02 HTML from Task 1 at exactly two links and no `.project-demo-note`; keep the CSS without a `.project-demo-note` rule. Set the two hero links to:

```html
<a class="hero-cta" href="cases.html">作品集：5 个在线 Demo →</a>
<a class="hero-cta" href="cases.html">Portfolio: 5 live demos →</a>
```

Do not disturb these existing project-entry links:

```html
<a class="project-link" href="cases.html#case-lianlu">查看案例</a>
<a class="project-link" href="cases.html#case-lianlu">View case</a>
```

`sitemap.xml` must retain the three public page URLs and exactly these five Demo entries:

```xml
<url><loc>https://kinghowang.github.io/kingho-resume/demo-wecom-flow.html</loc><priority>0.6</priority></url>
<url><loc>https://kinghowang.github.io/kingho-resume/demo-shufen.html</loc><priority>0.6</priority></url>
<url><loc>https://kinghowang.github.io/kingho-resume/demo-eval.html</loc><priority>0.6</priority></url>
<url><loc>https://kinghowang.github.io/kingho-resume/demo-wukong.html</loc><priority>0.6</priority></url>
<url><loc>https://kinghowang.github.io/kingho-resume/demo-creative.html</loc><priority>0.6</priority></url>
```

Set `robots.txt` to the crawlable contract:

```text
# 允许抓取公开页面；不进入搜索索引的页面在各自 HTML 中声明 noindex。
# 已删除页面需要让爬虫重新抓取并看到 404；历史跳转页也需要让爬虫读取 canonical。

User-agent: *
Allow: /

Sitemap: https://kinghowang.github.io/kingho-resume/sitemap.xml
```

In `demo-advideo.html`, add exactly this line after the charset/viewport line and make no other change to that file:

```html
<meta name="robots" content="noindex,nofollow">
```

- [ ] **Step 4: Run the focused contracts and verify they pass**

Run the Step 2 command again.

Expected: selected tests PASS; the five public Demo URLs appear once in their cases and README tables, Case 02 has two links, public discovery files contain no hidden URL, sitemap contains the five public Demo URLs, the retained hidden page declares `noindex,nofollow`, and `robots.txt` still contains `Allow: /`.

- [ ] **Step 5: Commit the privacy revision**

```bash
git add cases.html README.md README.en.md index.html en.html sitemap.xml robots.txt demo-advideo.html tests/portfolio-content.spec.js tests/resume-content.spec.js
git commit -m "fix: hide competitor intelligence demo from public entry points"
```

### Task 4: Perform The Minimal Full Verification And Prepare Local Review

**Files:**
- Verify only; no source changes expected

- [ ] **Step 1: Run the complete automated suite once**

Ensure the static server is available at `http://127.0.0.1:52786`, then run:

```bash
DEMO_BASE_URL=http://127.0.0.1:52786 playwright test tests/*.spec.js --workers=1
python3 tests/check_local_links.py
python3 tests/public-creative-demo.py
git diff --check origin/main...HEAD
```

Expected: all Playwright tests PASS; local links report `missing=[]`; the creative-demo privacy/integrity check reports PASS; `git diff --check` prints no errors.

- [ ] **Step 2: Capture and inspect the four approved viewport sizes**

Open `http://127.0.0.1:52786/cases.html` and capture full-page screenshots at `360×800`, `390×844`, `1024×768`, and `1440×900`. Scroll each case into view before capture so reveal animation has completed.

Expected at every size: all three numbered cases are readable; the four content labels keep their natural order; no text, divider, or Demo link overlaps or truncates; Case 02 shows exactly the creative and Wukong Demo links; no hidden-Demo note or public entry is present; no horizontal scrollbar is present.

- [ ] **Step 3: Review the final diff against the approved scope**

```bash
git status --short
git diff --stat origin/main...HEAD
git diff --name-only origin/main...HEAD
git log --oneline origin/main..HEAD
```

Expected: the implementation changes are limited to `cases.html`, `README.md`, `README.en.md`, `index.html`, `en.html`, `sitemap.xml`, `robots.txt`, `demo-advideo.html`, `tests/portfolio-content.spec.js`, `tests/resume-content.spec.js`, `tests/wecom-flow.spec.js`, plus the approved spec and this plan. `index.html` and `en.html` contain only the approved `查看案例` / `View case` label change (retaining `cases.html#case-lianlu`) and the hero count change to five. `demo-advideo.html` contains only the robots meta addition. No other resume copy, PDF, Word, shared stylesheet, Demo functionality, data, or visuals appear in the diff.

- [ ] **Step 4: Stop at local review**

Leave the branch unpushed. Present the local preview URL and verification result to the user. Push to GitHub only after the user reviews the local page and explicitly approves publication.
