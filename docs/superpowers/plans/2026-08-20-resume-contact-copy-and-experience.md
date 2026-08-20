# Resume Contact Copy And Experience Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make email and phone copyable with honest localized feedback, make the existing WeChat dialog discoverable, describe the portfolio as three project cases, and replace inflated positioning and two weak current-employer bullets with the approved execution-level copy.

**Architecture:** Keep the site static and bilingual. Use semantic contact buttons plus one shared clipboard helper and one non-layout-shifting live-status element in each page; retain the existing WeChat dialog and reuse the same clipboard fallback for its ID button. Keep all content edits local to the two landing pages, with shared interaction styling in `style.css` and behavior locked by Playwright.

**Tech Stack:** Static HTML5, CSS3, vanilla JavaScript, Playwright, Python `http.server`, Git

---

## File Map

- Modify `tests/resume-content.spec.js`: replace the `mailto:` / `tel:` contract, test localized clipboard success and failure, lock the WeChat affordance, three-case homepage label, execution-level positioning, two approved Taizi bullets, and responsive contact geometry.
- Modify `index.html`: semantic copy controls, Chinese live-status element, three-case CTA, Chinese metadata and positioning, approved Taizi bullets, shared clipboard behavior.
- Modify `en.html`: English equivalents with identical data and responsibility boundaries.
- Modify `style.css`: contact button normalization, CSS copy glyph, WeChat chevron, fixed status toast, 44px mobile targets, reduced-motion handling.
- Do not modify `cases.html`, READMEs, PDFs, Word files, generation scripts, project cards, or Demo files.

### Task 1: Lock And Implement Contact Copy Behavior

**Files:**
- Modify: `tests/resume-content.spec.js:230-306`
- Modify: `index.html:35-55,170-211`
- Modify: `en.html:35-55,169-210`
- Modify: `style.css:58-90,244-252`

- [ ] **Step 1: Replace the old link test with failing semantic-copy regressions**

Replace `resume contact details use real email and phone links` with these contracts and tests:

```javascript
const contactContracts = {
  'index.html': {
    emailDone: '邮箱已复制',
    phoneDone: '电话已复制',
    failure: '复制失败，请手动复制',
    wechat: '微信 / 二维码',
  },
  'en.html': {
    emailDone: 'Email copied',
    phoneDone: 'Phone copied',
    failure: 'Copy failed. Please copy manually.',
    wechat: 'WeChat / QR code',
  },
};

test('resume contact controls copy email and phone with localized feedback', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  for (const [file, contract] of Object.entries(contactContracts)) {
    await gotoWithFonts(page, file);
    const contacts = page.locator('.contact-row');
    const email = contacts.locator('[data-testid="contact-email"]');
    const phone = contacts.locator('[data-testid="contact-phone"]');
    const status = page.locator('[data-testid="contact-copy-status"]');
    const trigger = contacts.locator('[data-testid="wechat-trigger"]');

    await expect(contacts.locator('a[href^="mailto:"], a[href^="tel:"]')).toHaveCount(0);
    await expect(email).toHaveAttribute('data-copy-value', 'kinghowang@foxmail.com');
    await expect(phone).toHaveAttribute('data-copy-value', '17512006748');
    await expect(email).toHaveAttribute('aria-label', /复制邮箱|Copy email/);
    await expect(phone).toHaveAttribute('aria-label', /复制电话|Copy phone/);
    await expect(status).toHaveAttribute('role', 'status');
    await expect(status).toHaveAttribute('aria-live', 'polite');

    await email.click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('kinghowang@foxmail.com');
    await expect(status).toHaveText(contract.emailDone);
    await expect(status).toBeVisible();

    await phone.click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('17512006748');
    await expect(status).toHaveText(contract.phoneDone);
    await expect(trigger).toHaveText(contract.wechat);
    await expect(trigger).toHaveAttribute('aria-controls', 'wechatDialog');
    await expect(status).toBeHidden({ timeout: 2500 });
  }
});

test('resume contact controls report clipboard failure honestly', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('blocked')) },
    });
    document.execCommand = () => false;
  });
  for (const [file, contract] of Object.entries(contactContracts)) {
    await page.goto(`${BASE}/${file}`);
    await page.locator('[data-testid="contact-email"]').click();
    const status = page.locator('[data-testid="contact-copy-status"]');
    await expect(status).toHaveText(contract.failure);
    await expect(status).toHaveClass(/is-error/);
  }
});

test('resume keeps the existing WeChat dialog behavior behind the clearer trigger', async ({ page }) => {
  for (const [file, contract] of Object.entries(contactContracts)) {
    await gotoWithFonts(page, file);
    const trigger = page.locator('[data-testid="wechat-trigger"]');
    const dialog = page.locator('[data-testid="wechat-dialog"]');
    const qr = dialog.locator('img[src="wechat-qr.png"]');
    await expect(trigger).toHaveText(contract.wechat);
    await expect(dialog).not.toBeVisible();
    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/微信扫码添加|Scan to connect/);
    await expect(dialog.locator('.wechat-id')).toHaveText('WJH748247724');
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
```

- [ ] **Step 2: Run the contact tests and verify they fail for the old links**

Run:

```bash
NODE_PATH=/Users/a123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules DEMO_BASE_URL=http://127.0.0.1:52786 /Users/a123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /Users/a123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/cli.js test tests/resume-content.spec.js --grep "contact controls copy|contact controls report|WeChat dialog" --workers=1
```

Expected: FAIL because email and phone are still anchors, the live-status element does not exist, and the WeChat trigger still reads only `微信` / `WeChat`.

- [ ] **Step 3: Replace the Chinese contact markup**

Use this markup inside the Chinese hero, immediately followed by the shared status element:

```html
<div class="contact-row">
  <button type="button" class="contact-copy" data-testid="contact-email" data-copy-value="kinghowang@foxmail.com" data-copy-done="邮箱已复制" data-copy-fail="复制失败，请手动复制" aria-label="复制邮箱 kinghowang@foxmail.com"><span>kinghowang@foxmail.com</span><span class="copy-icon" aria-hidden="true"></span></button>
  <button type="button" class="contact-copy" data-testid="contact-phone" data-copy-value="17512006748" data-copy-done="电话已复制" data-copy-fail="复制失败，请手动复制" aria-label="复制电话 17512006748"><span>17512006748</span><span class="copy-icon" aria-hidden="true"></span></button>
  <button type="button" class="wechat-trigger" data-testid="wechat-trigger" aria-haspopup="dialog" aria-controls="wechatDialog"><span>微信 / 二维码</span><span class="wechat-chevron" aria-hidden="true"></span></button>
  <span>29岁 · 男 · 工科学士</span>
</div>
<div class="contact-copy-status" data-testid="contact-copy-status" role="status" aria-live="polite" aria-atomic="true" hidden></div>
```

- [ ] **Step 4: Mirror the semantic markup in English**

Use the same structure with these localized attributes and visible values:

```html
<div class="contact-row">
  <button type="button" class="contact-copy" data-testid="contact-email" data-copy-value="kinghowang@foxmail.com" data-copy-done="Email copied" data-copy-fail="Copy failed. Please copy manually." aria-label="Copy email kinghowang@foxmail.com"><span>kinghowang@foxmail.com</span><span class="copy-icon" aria-hidden="true"></span></button>
  <button type="button" class="contact-copy" data-testid="contact-phone" data-copy-value="17512006748" data-copy-done="Phone copied" data-copy-fail="Copy failed. Please copy manually." aria-label="Copy phone +86 17512006748"><span>+86 17512006748</span><span class="copy-icon" aria-hidden="true"></span></button>
  <button type="button" class="wechat-trigger" data-testid="wechat-trigger" aria-haspopup="dialog" aria-controls="wechatDialog"><span>WeChat / QR code</span><span class="wechat-chevron" aria-hidden="true"></span></button>
  <span>B.Eng. · Beijing</span>
</div>
<div class="contact-copy-status" data-testid="contact-copy-status" role="status" aria-live="polite" aria-atomic="true" hidden></div>
```

The English phone remains visually formatted with `+86`, while `data-copy-value` remains the approved plain local number.

- [ ] **Step 5: Add shared interaction styles**

Replace the contact anchor rules and extend the WeChat rules with:

```css
.contact-copy,.wechat-trigger{display:inline-flex;align-items:center;gap:6px;font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;appearance:none;
  text-decoration:underline;text-decoration-color:rgba(192,57,43,.45);text-underline-offset:3px}
.contact-copy:hover,.wechat-trigger:hover{color:var(--accent);text-decoration-color:var(--accent)}
.contact-copy:focus-visible,.wechat-trigger:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.copy-icon{position:relative;width:13px;height:13px;flex:none;opacity:.66}
.copy-icon::before,.copy-icon::after{content:'';position:absolute;width:7px;height:8px;border:1.4px solid currentColor;border-radius:1px;background:var(--paper)}
.copy-icon::before{left:1px;top:3px}
.copy-icon::after{left:4px;top:0}
.wechat-chevron{width:7px;height:7px;flex:none;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:translateY(-2px) rotate(45deg)}
.contact-copy-status{position:fixed;left:50%;bottom:max(24px,env(safe-area-inset-bottom));z-index:1100;transform:translate(-50%,8px);opacity:0;
  padding:8px 12px;border:1px solid #bed8ce;border-radius:5px;background:#f3faf7;color:#196c5b;box-shadow:0 8px 24px rgba(25,34,46,.14);
  font-size:.8rem;font-weight:650;line-height:1.4;white-space:nowrap;pointer-events:none;transition:opacity .16s ease,transform .16s ease}
.contact-copy-status::before{content:'\2713';margin-right:6px;font-weight:800}
.contact-copy-status.is-visible{opacity:1;transform:translate(-50%,0)}
.contact-copy-status.is-error{border-color:#efc4be;background:#fff4f2;color:var(--accent)}
.contact-copy-status.is-error::before{content:'!'}
.contact-copy-status[hidden]{display:none}
@media(prefers-reduced-motion:reduce){.contact-copy-status{transition:none}}
@media(max-width:640px){
  .contact-copy,.wechat-trigger{min-height:44px;padding:7px 0}
  .contact-copy-status{max-width:calc(100vw - 40px);white-space:normal;text-align:center}
}
```

Keep `.contact-row > *::before` unchanged so every top-level contact item retains the current red-dot separator.

- [ ] **Step 6: Replace the duplicated clipboard code with one shared helper**

In both `index.html` and `en.html`, replace the existing second script with this implementation. Preserve the localized `data-done` / `data-fail` attributes already present on `#wechatCopy`:

```html
<script>
(function(){
  var status=document.querySelector('[data-testid="contact-copy-status"]'),
      statusTimer,
      hideTimer;

  function showCopyStatus(message,isError){
    if(!status) return;
    clearTimeout(statusTimer); clearTimeout(hideTimer);
    status.textContent=message;
    status.classList.toggle('is-error',Boolean(isError));
    status.hidden=false;
    requestAnimationFrame(function(){ status.classList.add('is-visible'); });
    statusTimer=setTimeout(function(){
      status.classList.remove('is-visible');
      hideTimer=setTimeout(function(){ status.hidden=true; },170);
    },1800);
  }

  function copyFallback(text,focusTarget,done){
    var ta=document.createElement('textarea'), success=false;
    ta.value=text; ta.setAttribute('readonly','');
    ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.focus(); ta.select(); ta.setSelectionRange(0,ta.value.length);
    try{ success=document.execCommand('copy'); }catch(e){}
    document.body.removeChild(ta);
    if(focusTarget) focusTarget.focus();
    done(success);
  }

  function copyText(text,focusTarget,done){
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ done(true); },function(){ copyFallback(text,focusTarget,done); });
    }else{ copyFallback(text,focusTarget,done); }
  }

  document.querySelectorAll('[data-copy-value]').forEach(function(button){
    button.addEventListener('click',function(){
      copyText(button.dataset.copyValue,button,function(success){
        showCopyStatus(success ? button.dataset.copyDone : button.dataset.copyFail,!success);
      });
    });
  });

  var dlg=document.getElementById('wechatDialog'); if(!dlg) return;
  var open=document.querySelector('.wechat-trigger'),
      close=document.getElementById('wechatClose'),
      copy=document.getElementById('wechatCopy'),
      id=document.getElementById('wechatId'),
      copyLabel=copy&&copy.textContent,
      resetTimer;
  if(!open||!close||!copy||!id) return;
  function show(){ if(!dlg.open){ dlg.showModal ? dlg.showModal() : dlg.setAttribute('open',''); } }
  function hide(){ if(dlg.open){ dlg.close ? dlg.close() : dlg.removeAttribute('open'); } }
  function setWechatStatus(message){
    clearTimeout(resetTimer); copy.textContent=message;
    resetTimer=setTimeout(function(){ copy.textContent=copyLabel; },1600);
  }
  open.addEventListener('click',show);
  close.addEventListener('click',hide);
  dlg.addEventListener('click',function(event){ if(event.target===dlg) hide(); });
  copy.addEventListener('click',function(){
    copyText(id.textContent.trim(),copy,function(success){
      setWechatStatus(success ? copy.dataset.done : copy.dataset.fail);
    });
  });
})();
</script>
```

- [ ] **Step 7: Run the contact tests and commit the working interaction**

Run:

```bash
NODE_PATH=/Users/a123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules DEMO_BASE_URL=http://127.0.0.1:52786 /Users/a123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /Users/a123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/cli.js test tests/resume-content.spec.js --grep "contact controls copy|contact controls report|WeChat dialog" --workers=1
```

Expected: all selected tests PASS; clipboard contents are exact, failure copy is honest, and the existing WeChat dialog behavior is unchanged.

Commit:

```bash
git add index.html en.html style.css tests/resume-content.spec.js
git commit -m "feat: add copyable resume contacts"
```

### Task 2: Lock And Implement Three-Case And Execution-Level Copy

**Files:**
- Modify: `tests/resume-content.spec.js:330-354,370-436`
- Modify: `index.html:6-12,34,40,61,114-122`
- Modify: `en.html:6-12,34,40,61,113-121`

- [ ] **Step 1: Add failing bilingual content contracts**

Replace `resume heroes use the unified five-demo count` and add the current-employer contract:

```javascript
test('resume heroes describe a portfolio of three project cases', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  await expect(page.locator('.hero-links a[href="cases.html"]')).toHaveText('作品集：3 个项目案例 →');

  await page.goto(`${BASE}/en.html`);
  await expect(page.locator('.hero-links a[href="cases.html"]')).toHaveText('Portfolio: 3 project cases →');
});

test('resume positioning and current role use the approved execution-level copy', async ({ page }) => {
  const contracts = {
    'index.html': {
      tagline: '商业化策略 × AI 产品 · 数据驱动增长 · 5 年广告运营经验',
      leadStart: '5 年商业化广告运营经验，工作重点从投放执行逐步延伸到策略、数据和产品改造。',
      employer: '北京太字流动',
      bullets: [
        '行业商业化运营：负责中医 & 大健康行业从冷启动到规模化，预算占比 5% → 90%+；参与行业商业化策略制定与落地。',
        '客户组合与预算保障：服务 60+ 客户，覆盖兴趣教育与中医大健康，年消耗 3 亿+ 量级；负责行业趋势分析、消耗监控和预算稳定性保障。',
      ],
      excluded: ['5 年商业化广告操盘者', '5 年商业化操盘', '行业变现操盘', '数据驱动决策', '素材与链路策略'],
    },
    'en.html': {
      tagline: 'Commercial Strategy × AI Product · Data-Driven Growth · 5 Years in Ad Operations',
      leadStart: 'Five years in commercial ad operations, with my work extending from campaign execution into strategy, data and product improvements.',
      employer: 'Beijing Taizi Liudong',
      bullets: [
        'Industry commercialization operations: responsible for taking TCM & healthcare from cold start to scale, growing its budget share from 5% to 90%+; participated in commercialization strategy design and execution.',
        'Client portfolio and budget stability: served 60+ clients across interest education and TCM & healthcare at ¥300M+ annual-spend scale; tracked industry trends, spend delivery and budget stability.',
      ],
      excluded: ['operator', 'owner', 'Data-driven decisions', 'Creative and funnel strategy'],
    },
  };

  for (const [file, contract] of Object.entries(contracts)) {
    await gotoWithFonts(page, file);
    await expect(page.locator('.tagline')).toHaveText(contract.tagline);
    await expect(page.locator('.lead')).toContainText(contract.leadStart);
    const employer = page.locator('.tl-card').filter({ hasText: contract.employer });
    const bullets = employer.locator('.tl-list li');
    await expect(bullets).toHaveCount(2);
    for (let index = 0; index < contract.bullets.length; index += 1) {
      expect(normalize(await bullets.nth(index).innerText())).toBe(contract.bullets[index]);
    }
    for (const excluded of contract.excluded) {
      await expect(page.locator('body')).not.toContainText(excluded);
    }
  }
});
```

In `unaffectedCards`, remove the obsolete `currentHeight` values. In `only Baidu and Yike use the compact work layout without losing copy`, replace the exact Taizi-height assertion with:

```javascript
await expect(current.locator('.tl-list li')).toHaveCount(2);
const currentGeometry = await current.evaluate((node) => ({
  clientHeight: node.clientHeight,
  clientWidth: node.clientWidth,
  scrollHeight: node.scrollHeight,
  scrollWidth: node.scrollWidth,
}));
expect(currentGeometry.scrollHeight).toBeLessThanOrEqual(currentGeometry.clientHeight + 1);
expect(currentGeometry.scrollWidth).toBeLessThanOrEqual(currentGeometry.clientWidth + 1);
```

- [ ] **Step 2: Run the new content tests and verify they fail on the old wording**

Run:

```bash
NODE_PATH=/Users/a123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules DEMO_BASE_URL=http://127.0.0.1:52786 /Users/a123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /Users/a123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/cli.js test tests/resume-content.spec.js --grep "three project cases|execution-level copy|compact work layout" --workers=1
```

Expected: FAIL because the hero still says five Demos, the Chinese page still contains `操盘`, and Taizi still has three bullets.

- [ ] **Step 3: Update Chinese metadata, hero, lead, and Taizi bullets**

Use these exact Chinese values:

```html
<meta name="description" content="王钧灏 · 商业化策略 / AI 商业化产品经理。5 年商业化广告运营经验；负责企微获客链路改造，搭建 AI 素材生产与投放验证、AI 广告日报与数据排查流程。">
<meta property="og:description" content="懂变现 · 懂数据 · 能做产品。5 年商业化广告运营经验。">
<p class="tagline">商业化策略 × AI 产品 · 数据驱动增长 · 5 年广告运营经验</p>
<a class="hero-cta" href="cases.html">作品集：3 个项目案例 →</a>
```

Replace the lead with:

```html
<p>5 年商业化广告运营经验，工作重点从投放执行逐步延伸到策略、数据和产品改造。核心能力三条：<strong>懂变现</strong>（熟悉竞价投放与流量变现机制，能从广告主 ROI 与平台收入双视角做策略取舍；负责中医 &amp; 大健康行业从冷启动到规模化）、<strong>懂数据</strong>（数据分析占工作 70-80%，将 AI 日报、Grafana-Lite 下钻与 MRD 反馈串成日常数据排查流程）、<strong>能做产品</strong>（主导企微获客链路改造；搭建从素材洞察、Agent 生产到投放验证的 AI 素材流程）。工业设计背景带来的用户视角 + 能与工程对话的技术底子。</p>
```

Replace the Taizi list with:

```html
<ul class="tl-list">
  <li><strong>行业商业化运营</strong>：负责中医 &amp; 大健康行业从冷启动到规模化，预算占比 <strong>5% → 90%+</strong>；参与行业商业化策略制定与落地。</li>
  <li><strong>客户组合与预算保障</strong>：服务 <strong>60+ 客户</strong>，覆盖兴趣教育与中医大健康，年消耗 <strong>3 亿+ 量级</strong>；负责行业趋势分析、消耗监控和预算稳定性保障。</li>
</ul>
```

- [ ] **Step 4: Mirror the approved responsibility strength in English**

Use these exact English values:

```html
<meta name="description" content="Kingho Wang · Commercial Strategy / AI Commercialization PM. Five years in commercial ad operations; delivered a WeCom acquisition-flow redesign and built AI ad-creative production, validation, reporting and data-investigation workflows.">
<meta property="og:description" content="Monetization · Data · product delivery. Five years in commercial ad operations with hands-on AI and data product work.">
<p class="tagline">Commercial Strategy × AI Product · Data-Driven Growth · 5 Years in Ad Operations</p>
<a class="hero-cta" href="cases.html">Portfolio: 3 project cases →</a>
```

Replace the lead with:

```html
<p>Five years in commercial ad operations, with my work extending from campaign execution into strategy, data and product improvements. Three core strengths: <strong>monetization</strong> (fluent in auction delivery and traffic-monetization mechanics, weighing trade-offs from both advertiser ROI and platform revenue perspectives; worked on TCM &amp; healthcare growth from cold start to scale), <strong>data</strong> (analysis was 70-80% of my work; linked AI daily reporting, Grafana-Lite drill-downs and MRD feedback into a daily data-investigation workflow), and <strong>product delivery</strong> (led a WeCom acquisition-flow redesign; built an AI creative workflow from material insight and Agent production through delivery validation). An industrial-design background grounds my user perspective, backed by the technical fluency to work directly with engineers.</p>
```

Replace the Taizi list with:

```html
<ul class="tl-list">
  <li><strong>Industry commercialization operations</strong>: responsible for taking TCM &amp; healthcare from cold start to scale, growing its budget share from <strong>5% to 90%+</strong>; participated in commercialization strategy design and execution.</li>
  <li><strong>Client portfolio and budget stability</strong>: served <strong>60+ clients</strong> across interest education and TCM &amp; healthcare at <strong>¥300M+ annual-spend scale</strong>; tracked industry trends, spend delivery and budget stability.</li>
</ul>
```

- [ ] **Step 5: Run the content tests and commit the approved copy**

Run:

```bash
NODE_PATH=/Users/a123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules DEMO_BASE_URL=http://127.0.0.1:52786 /Users/a123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /Users/a123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/cli.js test tests/resume-content.spec.js --grep "three project cases|execution-level copy|compact work layout|contribution claims" --workers=1
```

Expected: all selected tests PASS, with three-case CTAs, no inflated Chinese positioning, and exactly two Taizi bullets in both languages.

Commit:

```bash
git add index.html en.html tests/resume-content.spec.js
git commit -m "docs: align resume positioning and experience"
```

### Task 3: Responsive And Final Verification

**Files:**
- Modify: `tests/resume-content.spec.js:500-578` only if the approved contact geometry needs an explicit regression not already covered by the viewport loop
- Verify: `index.html`
- Verify: `en.html`
- Verify: `style.css`

- [ ] **Step 1: Add contact geometry checks to the existing viewport loop**

Inside each language iteration in `keeps both resume languages within the viewport`, add:

```javascript
const contactControls = page.locator('.contact-copy, .wechat-trigger');
await expect(contactControls).toHaveCount(3);
for (const control of await contactControls.all()) {
  const box = await control.boundingBox();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  if (viewport.width <= 640) expect(box.height).toBeGreaterThanOrEqual(44);
}
const contactStatus = page.locator('[data-testid="contact-copy-status"]');
await expect(contactStatus).toHaveCount(1);
```

- [ ] **Step 2: Run the full JavaScript regression once**

Run:

```bash
NODE_PATH=/Users/a123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules DEMO_BASE_URL=http://127.0.0.1:52786 /Users/a123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /Users/a123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/cli.js test --workers=1
```

Expected: all Playwright tests PASS. Do not rerun after this passes unless related HTML, CSS, JavaScript, or tests change.

- [ ] **Step 3: Run the independent local-link and creative-privacy gates once**

Run:

```bash
python3 tests/check_local_links.py
```

Expected: all local HTML references resolve with `missing=[]`.

Run:

```bash
python3 tests/public-creative-demo.py
```

Expected: privacy gate PASS with the existing sanitized material counts unchanged.

- [ ] **Step 4: Inspect four viewport screenshots and console state**

Use the local preview at `http://127.0.0.1:52786/index.html` and capture `360×800`, `390×844`, `1024×768`, and `1440×900`. Verify once per viewport:

- all three contact controls are discoverable and contained;
- the success toast is visible after copying but does not move hero content;
- `微信 / 二维码` remains readable and opens the centered dialog;
- the three-case CTA does not wrap into adjacent links;
- both Taizi bullets fit without clipping or collision;
- console and page-error collections are empty.

Expected: no overlap, horizontal overflow, clipped text, layout shift, missing assets, or browser errors.

- [ ] **Step 5: Commit final test coverage and stop before publication**

If Step 1 changed the test file after Task 2, commit it:

```bash
git add tests/resume-content.spec.js
git commit -m "test: cover responsive contact controls"
```

Then run:

```bash
git diff --check origin/main...HEAD
```

Expected: no whitespace errors. Keep the branch local, show the refreshed preview to the user, and wait for explicit publication approval before any push, PR, authority-directory sync, or Obsidian writeback.
