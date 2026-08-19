# Resume Education-Only Tail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the skills/certifications section from both resume pages, promote education to section 3, and add the verified university leadership honor in Chinese and English.

**Architecture:** Keep the existing static HTML and timeline component. Add one small education-note style, update only the two language pages, and lock the behavior with Playwright content and geometry assertions.

**Tech Stack:** Static HTML, CSS, Playwright.

---

### Task 1: Add failing resume-tail regressions

**Files:**
- Modify: `tests/resume-content.spec.js`

- [ ] **Step 1: Replace the obsolete fixed education height with the new content contract**

Use this data shape:

```js
const unaffectedCards = {
  'index.html': {
    currentEmployer: '北京太字流动',
    educationHeading: '教育经历',
    educationDetail: '校团委宣传部学生干部，获校级优秀学生干部（前 10%）。',
  },
  'en.html': {
    currentEmployer: 'Beijing Taizi Liudong',
    educationHeading: 'Education',
    educationDetail: "Student leader in the University Youth League Committee's Publicity Department; recognized as an Outstanding Student Leader (top 10%).",
  },
};
```

In `only Baidu and Yike use the compact work layout without losing copy`, replace the fixed education-height assertion with exact detail text plus client/scroll geometry checks.

- [ ] **Step 2: Add the explicit tail-structure test**

Add a test that, for both language files, asserts:

```js
test('resume tail contains education as section 3 and no skills wall', async ({ page }) => {
  const contracts = {
    'index.html': {
      heading: '教育经历',
      detail: '校团委宣传部学生干部，获校级优秀学生干部（前 10%）。',
      removed: ['技能 & 证书', 'SQL（ODPS / MySQL）', '腾讯广告认证营销顾问'],
    },
    'en.html': {
      heading: 'Education',
      detail: "Student leader in the University Youth League Committee's Publicity Department; recognized as an Outstanding Student Leader (top 10%).",
      removed: ['Skills & Certifications', 'SQL (ODPS / MySQL)', 'Tencent Ads Certified Marketing Consultant'],
    },
  };

  for (const [file, contract] of Object.entries(contracts)) {
    await page.goto(`${BASE}/${file}`);
    const headings = page.locator('section.section > .section-title');
    await expect(headings).toHaveCount(3);
    const educationSection = page.locator('section.section', {
      has: page.locator('.section-title', { hasText: contract.heading }),
    });
    await expect(educationSection.locator('.section-title .icon')).toHaveText('3');
    await expect(educationSection.locator('.education-note')).toHaveText(contract.detail);
    await expect(page.locator('.section-title .icon', { hasText: '4' })).toHaveCount(0);
    await expect(page.locator('.info-grid')).toHaveCount(0);
    for (const text of contract.removed) await expect(page.locator('body')).not.toContainText(text);
  }
});
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
playwright test tests/resume-content.spec.js --grep "resume tail|only Baidu" --workers=1
```

Expected: FAIL because the skills wall still exists, education is section 4, and `.education-note` is absent.

### Task 2: Implement the education-only tail

**Files:**
- Modify: `index.html`
- Modify: `en.html`
- Modify: `style.css`
- Test: `tests/resume-content.spec.js`

- [ ] **Step 1: Remove both skills sections and renumber education**

Delete the full `info-grid` sections in both language files. Change the education section icon from `4` to `3` and update the Chinese source comment to describe education as section 3.

- [ ] **Step 2: Add the verified education evidence**

Inside each education `.tl-card`, immediately after `.tl-header`, add:

```html
<p class="education-note">校团委宣传部学生干部，获校级优秀学生干部（前 10%）。</p>
```

and:

```html
<p class="education-note">Student leader in the University Youth League Committee's Publicity Department; recognized as an Outstanding Student Leader (top 10%).</p>
```

- [ ] **Step 3: Add the minimal secondary-text style**

After the timeline list rules in `style.css`, add:

```css
.education-note{color:var(--muted);font-size:.9rem;line-height:1.65}
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
playwright test tests/resume-content.spec.js --grep "resume tail|only Baidu" --workers=1
```

Expected: all focused tests PASS.

### Task 3: Verify scope, responsiveness, and full regression suite

**Files:**
- Verify: `index.html`
- Verify: `en.html`
- Verify: `style.css`
- Verify: `tests/resume-content.spec.js`

- [ ] **Step 1: Prove sections 1 and 2 were not altered**

Run:

```bash
git diff --word-diff=porcelain HEAD^ -- index.html en.html
```

Expected: changes occur only after the work-experience closing section; project and work copy remain unchanged.

- [ ] **Step 2: Run the full browser suite**

Run:

```bash
playwright test tests/*.spec.js --workers=1
```

Expected: all tests PASS, including the existing 360 / 390 / 768 / 1024 / 1440 responsive geometry checks.

- [ ] **Step 3: Run static checks**

Run:

```bash
git diff --check
rg -n "技能 & 证书|Skills & Certifications|SQL \(ODPS / MySQL\)|腾讯广告认证营销顾问|Tencent Ads Certified Marketing Consultant" index.html en.html
```

Expected: `git diff --check` returns no output and the `rg` command returns no matches.

- [ ] **Step 4: Commit the implementation**

```bash
git add index.html en.html style.css tests/resume-content.spec.js
git commit -m "feat: simplify resume tail to education"
```
