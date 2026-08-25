# KW Folded Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the font-based red "王" favicon with the approved KW folded-plate mark while preserving crisp optical masters for small and large sizes.

**Architecture:** Keep the existing HTML references and swap only the two favicon assets. `favicon.svg` carries the 16px optical master for browser tabs, while `favicon.png` is rasterized at 256px from the approved 64px optical master. A focused Playwright contract locks geometry, colors, page references, PNG dimensions, and representative pixels before full-site regression and publication.

**Tech Stack:** Static SVG/PNG assets, Playwright Test, bundled Node.js + Sharp, Python local HTTP server, GitHub Pages.

**Runtime-only variables:** Resolve `WORKSPACE_NODE` and `WORKSPACE_NODE_MODULES` with the Codex workspace dependency loader, and resolve `RESUME_AUTHORITY_DIR` from the local external-brain project route. Inject all three values only at execution time; never write their resolved values to the public repository.

---

## File Map

- Modify `tests/resume-content.spec.js`: add the favicon asset and page-reference contract.
- Modify `favicon.svg`: replace the font-dependent mark with the 16px KW optical master.
- Modify `favicon.png`: replace the old raster asset with the 256px output from the 64px optical master.
- Create temporarily `/tmp/kw-folded-logo-64.svg`: untracked large optical source used only to render the PNG.
- Sync after verification to the runtime-resolved local authority directory (`$RESUME_AUTHORITY_DIR`): `favicon.svg` and `favicon.png`.
- Do not modify HTML, CSS, OG image, PDF, Word, copy, avatar, QR code, Demo files, or `.superpowers/` visual drafts.

### Task 1: Lock the approved favicon contract

**Files:**
- Modify: `tests/resume-content.spec.js`
- Test: `tests/resume-content.spec.js`

- [ ] **Step 1: Add the focused failing test at the end of `tests/resume-content.spec.js`**

```javascript
test('site favicon uses the approved KW folded optical masters', async ({ page, request }) => {
  const svgResponse = await request.get(`${BASE}/favicon.svg`);
  expect(svgResponse.ok()).toBe(true);
  const svg = await svgResponse.text();
  expect(svg).toContain('viewBox="0 0 16 16"');
  expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  expect(svg).toContain('<rect width="16" height="16" rx="2" fill="#18211e"/>');
  expect(svg).toContain('d="M4 3V13 M4 8L8 4 M4 8L8 12L10 5L12 12L14 4"');
  expect(svg).toContain('fill="#18211e"');
  expect(svg).toContain('stroke="#ffffff"');
  expect(svg).toContain('stroke-width="2"');
  expect(svg).toContain('stroke-linecap="square"');
  expect(svg).toContain('stroke-linejoin="miter"');
  expect(svg).toContain('fill="#c0392b"');
  expect(svg).toContain('<rect x="7" y="7" width="2" height="2" fill="#c0392b"/>');
  expect(svg.replace('http://www.w3.org/2000/svg', '')).not.toMatch(/<text|<script|font-family|https?:\/\/|(?:href|xlink:href)=/i);

  for (const file of ['index.html', 'en.html', 'cases.html']) {
    await page.goto(`${BASE}/${file}`);
    const icons = await page.locator('link[rel="icon"]').evaluateAll((nodes) => nodes.map((node) => ({
      href: node.getAttribute('href'),
      type: node.getAttribute('type'),
      sizes: node.getAttribute('sizes'),
    })));
    expect(icons).toEqual([
      { href: 'favicon.svg', type: 'image/svg+xml', sizes: null },
      { href: 'favicon.png', type: 'image/png', sizes: '256x256' },
    ]);
  }

  await page.goto(`${BASE}/favicon.png`);
  const png = await page.locator('img').evaluate((image) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const pixel = (x, y) => Array.from(context.getImageData(x, y, 1, 1).data);
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      corner: pixel(0, 0),
      background: pixel(128, 230),
      whiteStroke: pixel(60, 80),
      redHinge: pixel(124, 128),
    };
  });
  expect(png).toEqual({
    width: 256,
    height: 256,
    corner: [0, 0, 0, 0],
    background: [24, 33, 30, 255],
    whiteStroke: [255, 255, 255, 255],
    redHinge: [192, 57, 43, 255],
  });
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
DEMO_BASE_URL=http://127.0.0.1:52784 NODE_PATH="$WORKSPACE_NODE_MODULES" "$WORKSPACE_NODE" "$WORKSPACE_NODE_MODULES/playwright/cli.js" test tests/resume-content.spec.js --grep "approved KW folded" --workers=1
```

Expected: one failure because the old SVG has `viewBox="0 0 64 64"`, contains `<text>王</text>`, and the old PNG uses the red background rather than the approved dark optical master.

### Task 2: Build the two approved optical masters

**Files:**
- Modify: `favicon.svg`
- Modify: `favicon.png`
- Create temporarily: `/tmp/kw-folded-logo-64.svg`
- Test: `tests/resume-content.spec.js`

- [ ] **Step 1: Replace `favicon.svg` with the exact 16px optical master**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" shape-rendering="geometricPrecision">
  <rect width="16" height="16" rx="2" fill="#18211e"/>
  <path d="M4 3V13 M4 8L8 4 M4 8L8 12L10 5L12 12L14 4" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"/>
  <rect x="7" y="7" width="2" height="2" fill="#c0392b"/>
</svg>
```

- [ ] **Step 2: Create `/tmp/kw-folded-logo-64.svg` with the approved large optical master**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" shape-rendering="geometricPrecision">
  <rect width="64" height="64" rx="8" fill="#18211e"/>
  <path d="M15 12V52 M15 32L31 14 M15 32L31 50L39 22L47 50L55 14" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter"/>
  <rect x="28" y="29" width="7" height="7" fill="#c0392b"/>
</svg>
```

- [ ] **Step 3: Rasterize the 64px master to `favicon.png` with Sharp**

Run:

```bash
NODE_PATH="$WORKSPACE_NODE_MODULES" "$WORKSPACE_NODE" -e "const sharp=require('sharp'); sharp('/tmp/kw-folded-logo-64.svg').resize(256,256,{fit:'fill'}).png({compressionLevel:9}).toFile('favicon.png').catch((error)=>{console.error(error);process.exit(1);});"
```

Expected: `favicon.png` is a `256×256` RGBA PNG generated from the large optical master.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run the Task 1 focused command again.

Expected: `1 passed`.

- [ ] **Step 5: Inspect real asset sizes**

Run:

```bash
sips -g pixelWidth -g pixelHeight -g hasAlpha favicon.png
```

Expected: `pixelWidth: 256`, `pixelHeight: 256`, `hasAlpha: yes`.

- [ ] **Step 6: Commit the implementation**

```bash
git add favicon.svg favicon.png tests/resume-content.spec.js
git commit -m "feat: replace favicon with KW folded mark"
```

### Task 3: Verify, synchronize, and publish

**Files:**
- Verify: all tracked files
- Sync: `$RESUME_AUTHORITY_DIR/favicon.svg` in the runtime-resolved local authority directory
- Sync: `$RESUME_AUTHORITY_DIR/favicon.png` in the runtime-resolved local authority directory

- [ ] **Step 1: Run full regression**

Run:

```bash
DEMO_BASE_URL=http://127.0.0.1:52784 NODE_PATH="$WORKSPACE_NODE_MODULES" "$WORKSPACE_NODE" "$WORKSPACE_NODE_MODULES/playwright/cli.js" test tests/*.spec.js --workers=1
python3 tests/check_local_links.py
python3 tests/public-creative-demo.py
git diff --check origin/main..HEAD
```

Expected: all Playwright tests pass, local references report `missing=[]`, creative Demo consistency reports `PASS`, and `git diff --check` prints nothing.

- [ ] **Step 2: Perform visual QA at native sizes**

Render the SVG at `16px` and `32px`, and the PNG at `64px` and `256px`. Confirm all four are nonblank, neither white strokes nor the red hinge are clipped, and the 16px mark remains distinct in an actual browser tab on both light and dark surrounding chrome.

- [ ] **Step 3: Confirm the public Diff is limited to the approved scope**

Run:

```bash
git diff --name-status origin/main..HEAD
git log --format='%h | %an <%ae> | %cn <%ce>' origin/main..HEAD
```

Expected: only the approved spec, this plan, `favicon.svg`, `favicon.png`, and `tests/resume-content.spec.js` appear; every author and committer email ends in `@users.noreply.github.com`. `.superpowers/` must not appear.

- [ ] **Step 4: Synchronize the two verified assets to the authority directory**

```bash
cp favicon.svg favicon.png "$RESUME_AUTHORITY_DIR/"
cmp -s favicon.svg "$RESUME_AUTHORITY_DIR/favicon.svg"
cmp -s favicon.png "$RESUME_AUTHORITY_DIR/favicon.png"
```

Expected: both `cmp` commands exit `0`.

- [ ] **Step 5: Push the verified branch tip to `main`**

```bash
git fetch origin
git merge-base --is-ancestor origin/main HEAD
git push origin HEAD:main
git branch -f main origin/main
```

Expected: the ancestry check exits `0`; the push fast-forwards `main`; local `main`, `origin/main`, and `HEAD` point to the same implementation commit.

- [ ] **Step 6: Verify Pages and deployed assets**

Run:

```bash
gh run list --repo KinghoWang/kingho-resume --branch main --limit 3 --json databaseId,headSha,status,conclusion,url
curl -fsSL --max-time 20 -o /tmp/kingho-kw-favicon.svg "https://kinghowang.github.io/kingho-resume/favicon.svg?nc=$(git rev-parse --short HEAD)"
curl -fsSL --max-time 20 -o /tmp/kingho-kw-favicon.png "https://kinghowang.github.io/kingho-resume/favicon.png?nc=$(git rev-parse --short HEAD)"
shasum -a 256 favicon.svg /tmp/kingho-kw-favicon.svg "$RESUME_AUTHORITY_DIR/favicon.svg"
shasum -a 256 favicon.png /tmp/kingho-kw-favicon.png "$RESUME_AUTHORITY_DIR/favicon.png"
```

If the matching run is not yet complete, run `gh run watch <databaseId> --repo KinghoWang/kingho-resume --exit-status` with the ID returned by the first command, then repeat the two `curl` and two `shasum` commands.

Expected: Pages build and deployment both succeed; deployed, repository, and authority hashes match for both assets.
