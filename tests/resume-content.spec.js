const { test, expect } = require('playwright/test');

const BASE = process.env.DEMO_BASE_URL || 'http://127.0.0.1:52784';

const normalize = (value) => value.replace(/\s+/g, ' ').trim();
const expectWithinOnePixel = (actual, expected) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);

function parseComputedSrgb(value) {
  const channels = value.match(/[\d.]+/g)?.map(Number);
  if (!/^rgba?\(/.test(value) || !channels || channels.length < 3) {
    throw new Error(`Unsupported computed color: ${value}`);
  }
  return { red: channels[0], green: channels[1], blue: channels[2], alpha: channels[3] ?? 1 };
}

function compositeOver(foreground, background) {
  const alpha = foreground.alpha + background.alpha * (1 - foreground.alpha);
  const channel = (key) => (
    foreground[key] * foreground.alpha + background[key] * background.alpha * (1 - foreground.alpha)
  ) / alpha;
  return { red: channel('red'), green: channel('green'), blue: channel('blue'), alpha };
}

function relativeLuminance(color) {
  const linearize = (value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linearize(color.red) + 0.7152 * linearize(color.green) + 0.0722 * linearize(color.blue);
}

function contrastRatio(foregroundValue, backgroundValue) {
  const white = { red: 255, green: 255, blue: 255, alpha: 1 };
  const background = compositeOver(parseComputedSrgb(backgroundValue), white);
  const foreground = compositeOver(parseComputedSrgb(foregroundValue), background);
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

async function gotoWithFonts(page, file) {
  await page.goto(`${BASE}/${file}`);
  await page.evaluate(() => document.fonts.ready);
}

const compactJobs = {
  'index.html': [
    {
      name: '百度(中国)',
      baseline: 213.65625,
      text: '百度(中国)有限公司深圳分公司 · 客户运营 百度 2022.11 - 2023.07 教育 医疗 变现模式创新 + 方法论复制：设计「直播 + 低价体验 + 附赠图书」线上闭环组合并优化线索筛选与投放方法，线索有效率 20% → 60%；封装为行业方法论后在 5 家客户复制落地，获「最佳新人奖」',
    },
    {
      name: '深圳市亿科',
      baseline: 213.65625,
      text: '深圳市亿科数字科技有限公司 · 广告运营 亿科数字 2020.06 - 2022.07 金融 金融 0-1 增长体系：从零搭建微信 + 抖音跨端投放体系（年预算过亿量级）；相似人群分层测试使转化率 +27%、转化成本 -13%；主导的创意素材投放成本较大盘低 14%，获「金狮创意」奖',
    },
  ],
  'en.html': [
    {
      name: 'Baidu (China)',
      baseline: 237.421875,
      text: 'Baidu (China) Co., Ltd., Shenzhen Branch · Client Operations Baidu 2022.11 - 2023.07 Education Healthcare Monetization model design and playbook replication: designed a "livestream + low-cost trial + bundled books" closed-loop offer and refined lead-screening and delivery practices, lifting lead qualification rate from 20% to 60%; codified it into a playbook rolled out across five clients; received the "Best Newcomer" award',
    },
    {
      name: 'Yike Digital',
      baseline: 237.421875,
      text: 'Shenzhen Yike Digital Technology Co., Ltd. · Ad Operations Yike Digital 2020.06 - 2022.07 Finance Finance 0→1 growth system: built a WeChat + Douyin delivery system from scratch (¥100M+ annual-budget scale); lookalike audience tests lifted conversion +27% and reduced conversion cost 13%; creative assets I led ran at 14% below the overall cost benchmark and received the company’s "Golden Lion Creative" award',
    },
  ],
};

const unaffectedCards = {
  'index.html': {
    currentEmployer: '北京太字流动',
    currentHeight: 332.65625,
    educationHeading: '教育经历',
    educationDetail: '校团委宣传部学生干部，获校级优秀学生干部（前 10%）。',
  },
  'en.html': {
    currentEmployer: 'Beijing Taizi Liudong',
    currentHeight: 356.421875,
    educationHeading: 'Education',
    educationDetail: "Student leader in the University Youth League Committee's Publicity Department; recognized as an Outstanding Student Leader (top 10%).",
  },
};

const compactFontSizes = {
  h3: '17.28px',
  li: '14.4px',
  '.company-tag': '12px',
  '.date-tag': '13.12px',
  '.tag': '11.52px',
};

const projectRails = [
  { number: '01', category: 'PRODUCT' },
  { number: '02', category: 'AI CREATIVE' },
  { number: '03', category: 'ANALYTICS' },
];

const projectContracts = {
  'index.html': {
    projects: [
      {
        title: '企微获客链路改造：把长按识别改成点击',
        role: '产品改造 · 已上线 · 数据验证',
        steps: [
          ['用户卡在哪', '原链路要求用户在 H5 长按二维码，再从系统菜单选择识别。中老年主力用户不熟悉这一步，容易中途退出。'],
          ['我怎么改', '用小程序可以打开的企微客服会话做中转，自动发送文案和卡片，两者都指向同一获客链接。用户点击任一入口即可继续添加微信。'],
          ['上线结果', '曝光-加微率提升 50% 以上，曝光-地址率提升 40% 以上；广告主后续转化未下降，CPM 同步提升。'],
        ],
        boundary: '相对提升，绝对值已脱敏',
        links: [
          ['demo-wecom-flow.html', '体验企微链路 Demo'],
          ['cases.html#case-lianlu', '查看案例'],
        ],
      },
      {
        title: '用广告数据指导 AI 生产新素材，再用投放结果验证',
        role: '人工分析 · Agent 执行 · 人工抽检',
        steps: [
          ['先看数据', '查看广告素材的逐秒表现和分段数据，人工找出值得复用和需要优化的部分，再形成新 SKU 的制作建议。'],
          ['再做素材', '基于 grok-built 自建悟空 Agent，把剪辑拆成任务卡，用剪辑脚本和自动质检约束非多模态模型；基本能一次生成待抽检成片，再由人工抽检。'],
          ['最后看投放', '新素材的 CPM 与 CTCVR 综合表现，处于同期同 SKU 全量素材中上游；减少人工逐条跟进和重复制作。'],
        ],
        boundary: '人工判断方向，Agent 负责执行',
        links: [
          ['demo-creative.html', '体验创意分析 Demo'],
          ['demo-wukong.html', '体验悟空生产流程'],
        ],
      },
      {
        title: 'AI 广告日报与问题排查',
        role: 'AI 初筛 · 人工核验 · MRD 反馈',
        steps: [
          ['AI 先找线索', '数分机器人每天按固定指标口径汇总核心表现、异常变化和待排查线索，把日报整理和数据排查从小时级缩短到分钟级。'],
          ['运营再核验', '运营进入公司内部大数据看板 Grafana-Lite 下钻，用明细数据确认问题及其影响范围，不直接采用 AI 结论。'],
          ['反馈产研', '把确认的问题和数据证据整理成 MRD，每周向产研提交 1 至 2 份。'],
        ],
        boundary: 'AI 提供线索，人工核验并最终判断',
        links: [
          ['demo-shufen.html', '体验数分机器人'],
          ['demo-eval.html', '查看 Eval 证据'],
        ],
      },
    ],
    excludedTitle: /^广告归因质量 Eval 评测体系$/,
    languageLink: { name: 'English', href: 'en.html' },
  },
  'en.html': {
    projects: [
      {
        title: 'WeCom acquisition flow: replacing long-press QR recognition with a tap',
        role: 'Product redesign · Deployed · Validated with post-launch data',
        steps: [
          ['Where users dropped', 'The old H5 flow required users to long-press a QR code, then choose recognition from the system menu. Many older users were unfamiliar with this step and left before adding WeCom.'],
          ['What I changed', 'I used a WeCom customer-service chat that the mini-program could open as a bridge. It automatically sent text and a card, both pointing to the same acquisition link, so a tap on either entry continued the add-contact flow.'],
          ['Post-launch result', 'Impression-to-WeCom-contact conversion rose 50%+, and impression-to-address conversion rose 40%+. Downstream advertiser conversion held flat while CPM improved.'],
        ],
        boundary: 'Relative lifts; absolute values sanitized',
        links: [
          ['demo-wecom-flow.html', 'Try the WeCom flow demo'],
          ['cases.html#case-lianlu', 'View case'],
        ],
      },
      {
        title: 'Using ad data to guide AI creative production, then validating it in delivery',
        role: 'Manual analysis · Agent execution · Human spot checks',
        steps: [
          ['Analyze the data', 'I reviewed second-by-second creative performance and segment-level data, manually identified reusable and weak parts, and turned them into production recommendations for a new SKU.'],
          ['Produce the creative', 'I built Wukong Agent on grok-built, split editing into task cards, and used editing scripts and automated QA to constrain a non-multimodal model. It generally produced a review-ready cut in one pass, followed by human spot checks.'],
          ['Validate in delivery', 'Combined CPM and CTCVR performance ranked upper-middle within the same-period, same-SKU full creative set, while reducing manual follow-up and repeat production.'],
        ],
        boundary: 'People set the direction; the Agent executes',
        links: [
          ['demo-creative.html', 'Try the creative analysis demo'],
          ['demo-wukong.html', 'Try the Wukong production workflow'],
        ],
      },
      {
        title: 'AI ad reporting and issue investigation',
        role: 'AI triage · Human verification · MRD feedback',
        steps: [
          ['AI flags leads', 'The analytics agent uses fixed metric definitions to summarize core performance, anomalies and investigation leads each day, reducing report preparation and data investigation from hours to minutes.'],
          ['Operators verify', 'Operators drill down in the internal big-data dashboard Grafana-Lite to verify the issue and its affected scope from detailed data instead of directly accepting AI conclusions.'],
          ['Feed back to product and engineering', 'I turn confirmed issues and supporting data into one to two MRDs per week for product and engineering review.'],
        ],
        boundary: 'AI provides leads; people verify and make the final call',
        links: [
          ['demo-shufen.html', 'Try the analytics agent'],
          ['demo-eval.html', 'View Eval evidence'],
        ],
      },
    ],
    excludedTitle: /^Attribution Quality Eval Harness$/,
    languageLink: { name: '中文版简历', href: 'index.html' },
  },
};

async function expectProjectContract(page, file) {
  await page.goto(`${BASE}/${file}`);
  const contract = projectContracts[file];
  const projects = page.locator('.resume-project-list > .resume-project');
  await expect(projects).toHaveCount(3);

  for (let projectIndex = 0; projectIndex < contract.projects.length; projectIndex += 1) {
    const project = projects.nth(projectIndex);
    const expectedProject = contract.projects[projectIndex];
    await expect(project.locator('.resume-project__header h3')).toHaveText(expectedProject.title);
    await expect(project.locator('.resume-project__meta')).toHaveText(expectedProject.role);
    await expect(project.locator('.resume-project__step')).toHaveCount(3);
    await expect(project.locator('.resume-project__boundary')).toHaveCount(1);

    for (let stepIndex = 0; stepIndex < expectedProject.steps.length; stepIndex += 1) {
      const step = project.locator('.resume-project__step').nth(stepIndex);
      const [heading, body] = expectedProject.steps[stepIndex];
      await expect(step.locator('h4')).toHaveText(heading);
      await expect(step.locator('p')).toHaveText(body);
    }

    await expect(project.locator('.resume-project__boundary')).toHaveText(expectedProject.boundary);
    await expect(project.locator('.project-link')).toHaveCount(2);
    for (const [href, label] of expectedProject.links) {
      await expect(project.locator(`a.project-link[href="${href}"]`)).toHaveText(label);
    }
  }

  await expect(projects.locator('.project-link')).toHaveCount(6);
  await expect(projects.locator('h3').filter({ hasText: 'adquery-lite' })).toHaveCount(0);
  await expect(projects.locator('h3').filter({ hasText: contract.excludedTitle })).toHaveCount(0);
  await expect(page.getByRole('link', { name: contract.languageLink.name })).toHaveAttribute('href', contract.languageLink.href);
}

test('resume contact details use real email and phone links', async ({ page }) => {
  for (const file of ['index.html', 'en.html']) {
    await gotoWithFonts(page, file);
    const contacts = page.locator('.contact-row');
    await expect(contacts.locator('a[href="mailto:kinghowang@foxmail.com"]')).toHaveCount(1);
    await expect(contacts.locator('a[href="tel:+8617512006748"]')).toHaveCount(1);
    await expect(contacts.locator('a[href^="mailto:"]')).toHaveCount(1);
    await expect(contacts.locator('a[href^="tel:"]')).toHaveCount(1);

    const trigger = page.locator('[data-testid="wechat-trigger"]');
    const dialog = page.locator('[data-testid="wechat-dialog"]');
    const qr = dialog.locator('img[src="wechat-qr.png"]');
    await expect(trigger).toBeVisible();
    await expect(dialog).not.toBeVisible();
    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/微信扫码添加|Scan to connect/);
    await expect(dialog.locator('.wechat-id')).toHaveText('WJH748247724');
    await expect(page.getByText('WJH748247724', { exact: true })).toHaveCount(1);
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

test('mobile WeChat dialog is centered and contained within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await gotoWithFonts(page, 'index.html');
  await page.locator('[data-testid="wechat-trigger"]').click();
  const geometry = await page.locator('[data-testid="wechat-dialog"]').evaluate((dialog) => {
    const box = dialog.getBoundingClientRect();
    return {
      horizontalOffset: Math.abs((box.left + box.right) / 2 - innerWidth / 2),
      verticalOffset: Math.abs((box.top + box.bottom) / 2 - innerHeight / 2),
      inside: box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight,
      documentWidth: document.documentElement.scrollWidth,
    };
  });
  expect(geometry.horizontalOffset).toBeLessThanOrEqual(1);
  expect(geometry.verticalOffset).toBeLessThanOrEqual(1);
  expect(geometry.inside).toBe(true);
  expect(geometry.documentWidth).toBeLessThanOrEqual(360);
});

test('WeChat dialog copies the ID and reports clipboard failures honestly', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  await page.goto(`${BASE}/index.html`);
  await page.locator('[data-testid="wechat-trigger"]').click();
  const copy = page.locator('#wechatCopy');
  await copy.click();
  await expect(copy).toHaveText('已复制');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('WJH748247724');

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('blocked')) },
    });
    document.execCommand = () => false;
  });
  await page.goto(`${BASE}/en.html`);
  await page.locator('[data-testid="wechat-trigger"]').click();
  await page.locator('#wechatCopy').click();
  await expect(page.locator('#wechatCopy')).toHaveText('Copy manually');
});

test('Chinese resume presents three product, AI and data projects with WeCom first', async ({ page }) => {
  await expectProjectContract(page, 'index.html');
});

test('English resume presents three product, AI and data projects with WeCom first', async ({ page }) => {
  await expectProjectContract(page, 'en.html');
});

test('project role metadata meets WCAG AA text contrast', async ({ page }) => {
  for (const file of ['index.html', 'en.html']) {
    await gotoWithFonts(page, file);
    const samples = await page.locator('.resume-project-list > .resume-project').evaluateAll((projects) => projects.map((project) => {
      const meta = project.querySelector('.resume-project__meta');
      return {
        background: getComputedStyle(project).backgroundColor,
        foreground: getComputedStyle(meta).color,
      };
    }));
    expect(samples).toHaveLength(3);
    for (let index = 0; index < samples.length; index += 1) {
      const sample = samples[index];
      expect(contrastRatio(sample.foreground, sample.background), `${file} project ${index + 1} role metadata`).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test('resume heroes use the unified five-demo count', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  await expect(page.locator('.hero-links a[href="cases.html"]')).toContainText('5 个在线 Demo');

  await page.goto(`${BASE}/en.html`);
  await expect(page.locator('.hero-links a[href="cases.html"]')).toContainText('5 live demos');
});

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

test('both resume languages promote WeCom out of work bullets without duplicating it', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  await expect(page.locator('li').filter({ hasText: '链路产品优化' })).toHaveCount(0);
  await expect(page.locator('.resume-project').first()).toContainText('长按二维码');

  await page.goto(`${BASE}/en.html`);
  await expect(page.locator('li').filter({ hasText: 'Funnel product optimization' })).toHaveCount(0);
  await expect(page.locator('.resume-project').first()).toContainText('long-press a QR code');
});

test('resume keeps contribution claims tied to their verified evidence', async ({ page }) => {
  for (const file of ['index.html', 'en.html']) {
    await page.goto(`${BASE}/${file}`);
    await expect(page.locator('.stat')).toHaveCount(0);
    await expect(page.locator('.statwall')).toHaveCount(0);
    await expect(page.locator('.resume-project-list > .resume-project')).toHaveCount(3);
    await expect(page.locator('body')).toContainText(/5%\s*(?:→|to)\s*90%\+/);
    await expect(page.locator('body')).toContainText(/低于大盘.*14%|较大盘低\s*14%|14%\s*below.*benchmark/i);
    await expect(page.locator('body')).toContainText(/20%\s*(?:→|to)\s*60%/i);
    await expect(page.locator('body')).not.toContainText('+287%');
    await expect(page.locator('body')).not.toContainText('opening a new closed-loop');
  }
});

test('resume tail contains education as section 3 and no skills wall', async ({ page }) => {
  const contracts = {
    'index.html': {
      educationHeading: '教育经历',
      educationDetail: '校团委宣传部学生干部，获校级优秀学生干部（前 10%）。',
      excludedCopy: ['技能 & 证书', 'SQL（ODPS / MySQL）', '腾讯广告认证营销顾问'],
    },
    'en.html': {
      educationHeading: 'Education',
      educationDetail: "Student leader in the University Youth League Committee's Publicity Department; recognized as an Outstanding Student Leader (top 10%).",
      excludedCopy: ['Skills & Certifications', 'SQL (ODPS / MySQL)', 'Tencent Ads Certified Marketing Consultant'],
    },
  };

  for (const [file, contract] of Object.entries(contracts)) {
    await gotoWithFonts(page, file);
    const sectionTitles = page.locator('.section-title');
    const educationSection = page.locator('section.section', {
      has: page.locator('.section-title', { hasText: contract.educationHeading }),
    });
    await expect(sectionTitles).toHaveCount(3);
    await expect(educationSection).toHaveCount(1);
    await expect(educationSection.locator('.section-title .icon')).toHaveText('3');
    await expect(educationSection.locator('.education-note')).toHaveText(contract.educationDetail);
    await expect(sectionTitles.locator('.icon').filter({ hasText: /^4$/ })).toHaveCount(0);
    await expect(page.locator('.info-grid')).toHaveCount(0);
    for (const copy of contract.excludedCopy) {
      await expect(page.locator('body')).not.toContainText(copy);
    }
  }
});

test('only Baidu and Yike use the compact work layout without losing copy', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [file, jobs] of Object.entries(compactJobs)) {
    await gotoWithFonts(page, file);
    await expect(page.locator('.tl-card--compact')).toHaveCount(2);
    const unaffected = unaffectedCards[file];
    const current = page.locator('.tl-card').filter({ hasText: unaffected.currentEmployer });
    const educationSection = page.locator('section.section', {
      has: page.locator('.section-title', { hasText: unaffected.educationHeading }),
    });
    await expect(educationSection).toHaveCount(1);
    const education = educationSection.locator('.tl-card');
    await expect(current).not.toHaveClass(/tl-card--compact/);
    await expect(education).not.toHaveClass(/tl-card--compact/);
    expectWithinOnePixel(await current.evaluate((node) => node.getBoundingClientRect().height), unaffected.currentHeight);
    await expect(education.locator('.education-note')).toHaveText(unaffected.educationDetail);
    const educationGeometry = await education.evaluate((node) => ({
      clientHeight: node.clientHeight,
      clientWidth: node.clientWidth,
      scrollHeight: node.scrollHeight,
      scrollWidth: node.scrollWidth,
    }));
    expect(educationGeometry.scrollHeight).toBeLessThanOrEqual(educationGeometry.clientHeight + 1);
    expect(educationGeometry.scrollWidth).toBeLessThanOrEqual(educationGeometry.clientWidth + 1);

    for (const job of jobs) {
      const card = page.locator('.tl-card').filter({ hasText: job.name });
      await expect(card).toBeVisible();
      await expect(card).toHaveClass(/tl-card--compact/);
      expect(normalize(await card.innerText())).toBe(job.text);
      const cardGeometry = await card.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return {
          box: { left: box.left, right: box.right, top: box.top, bottom: box.bottom },
          clientHeight: node.clientHeight,
          clientWidth: node.clientWidth,
          height: box.height,
          scrollHeight: node.scrollHeight,
          scrollWidth: node.scrollWidth,
        };
      });
      expect(cardGeometry.height).toBeLessThanOrEqual(job.baseline * 0.75 + 1);
      expect(cardGeometry.scrollHeight).toBeLessThanOrEqual(cardGeometry.clientHeight + 1);
      expect(cardGeometry.scrollWidth).toBeLessThanOrEqual(cardGeometry.clientWidth + 1);

      for (const [selector, baseline] of Object.entries(compactFontSizes)) {
        const contents = card.locator(selector);
        const count = await contents.count();
        expect(count).toBeGreaterThan(0);
        for (let index = 0; index < count; index += 1) {
          await expect(contents.nth(index)).toBeVisible();
        }
        const contentGeometry = await contents.evaluateAll((nodes) => nodes.map((node) => {
          const box = node.getBoundingClientRect();
          return {
            bottom: box.bottom,
            clientHeight: node.clientHeight,
            clientWidth: node.clientWidth,
            fontSize: getComputedStyle(node).fontSize,
            left: box.left,
            right: box.right,
            scrollHeight: node.scrollHeight,
            scrollWidth: node.scrollWidth,
            top: box.top,
          };
        }));
        expect(contentGeometry.map(({ fontSize }) => fontSize)).toEqual(contentGeometry.map(() => baseline));
        for (const box of contentGeometry) {
          expect(box.scrollHeight).toBeLessThanOrEqual(box.clientHeight + 1);
          expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth + 1);
          expect(box.left).toBeGreaterThanOrEqual(cardGeometry.box.left - 1);
          expect(box.right).toBeLessThanOrEqual(cardGeometry.box.right + 1);
          expect(box.top).toBeGreaterThanOrEqual(cardGeometry.box.top - 1);
          expect(box.bottom).toBeLessThanOrEqual(cardGeometry.box.bottom + 1);
        }
      }
    }
  }
});

test('Baidu keeps the evidenced model, rollout and lead qualification result', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  const zhBaidu = page.locator('.tl-card').filter({ hasText: '百度(中国)' });
  await expect(zhBaidu).toContainText('直播 + 低价体验 + 附赠图书');
  await expect(zhBaidu).toContainText('5 家客户');
  await expect(zhBaidu).toContainText('最佳新人奖');
  await expect(zhBaidu).toContainText(/20%\s*→\s*60%/);

  await page.goto(`${BASE}/en.html`);
  const enBaidu = page.locator('.tl-card').filter({ hasText: 'Baidu (China)' });
  await expect(enBaidu).toContainText('livestream + low-cost trial + bundled books');
  await expect(enBaidu).toContainText('five clients');
  await expect(enBaidu).toContainText('Best Newcomer');
  await expect(enBaidu).toContainText(/20%\s*(?:to|→)\s*60%/i);
});

test('Chinese primary resume no longer routes readers to the stale ad-operations page', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  await expect(page.locator('a[href="resume-adops.html"]')).toHaveCount(0);
  const heroLinks = page.locator('.hero-links > a');
  await expect(heroLinks).toHaveCount(3);
  await expect(heroLinks.nth(0)).toHaveAttribute('href', 'cases.html');
  await expect(heroLinks.nth(1)).toHaveAttribute('href', 'kingho-resume-ai-pm.pdf');
  await expect(heroLinks.nth(2)).toHaveAttribute('href', 'en.html');
});

for (const viewport of [
  { name: 'narrow mobile', width: 360, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`${viewport.name} keeps both resume languages within the viewport`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const file of ['index.html', 'en.html']) {
      await gotoWithFonts(page, file);
      const geometry = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        statsInsideCards: [...document.querySelectorAll('.stat')].every((card) => {
          const cardBox = card.getBoundingClientRect();
          return [...card.querySelectorAll('.s-num, .s-lab')].every((content) => {
            const box = content.getBoundingClientRect();
            return box.left >= cardBox.left - 0.5 && box.right <= cardBox.right + 0.5;
          });
        }),
      }));
      expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth);
      expect(geometry.statsInsideCards).toBe(true);
      const projects = page.locator('.resume-project-list > .resume-project');
      await expect(projects).toHaveCount(3);

      for (let projectIndex = 0; projectIndex < 3; projectIndex += 1) {
        const project = projects.nth(projectIndex);
        const rail = project.locator('.resume-project__rail');
        const expectedRail = projectRails[projectIndex];
        await expect(rail).toHaveCount(1);
        await expect(rail.locator('strong')).toHaveText(expectedRail.number);
        await expect(rail.locator('span')).toHaveText(expectedRail.category);
        expect(await rail.evaluate((node) => getComputedStyle(node).flexDirection)).toBe(viewport.width <= 520 ? 'row' : 'column');

        const stepBoxes = await project.locator('.resume-project__step').evaluateAll((steps) =>
          steps.map((step) => {
            const box = step.getBoundingClientRect();
            return { left: box.left, top: box.top };
          })
        );
        expect(stepBoxes).toHaveLength(3);
        if (viewport.width <= 840) {
          expectWithinOnePixel(stepBoxes[1].left, stepBoxes[0].left);
          expectWithinOnePixel(stepBoxes[2].left, stepBoxes[0].left);
          expect(stepBoxes[1].top).toBeGreaterThan(stepBoxes[0].top);
          expect(stepBoxes[2].top).toBeGreaterThan(stepBoxes[1].top);
        } else {
          expectWithinOnePixel(stepBoxes[1].top, stepBoxes[0].top);
          expectWithinOnePixel(stepBoxes[2].top, stepBoxes[0].top);
          expect(stepBoxes[1].left).toBeGreaterThan(stepBoxes[0].left);
          expect(stepBoxes[2].left).toBeGreaterThan(stepBoxes[1].left);
        }
      }

      const listBox = await page.locator('.resume-project-list').evaluate((list) => {
        const box = list.getBoundingClientRect();
        return { left: box.left, right: box.right, width: box.width };
      });
      const projectBoxes = await projects.evaluateAll((items) => items.map((item) => {
        const box = item.getBoundingClientRect();
        return { left: box.left, right: box.right, width: box.width };
      }));
      for (const box of projectBoxes) {
        expectWithinOnePixel(box.left, listBox.left);
        expectWithinOnePixel(box.right, listBox.right);
        expectWithinOnePixel(box.width, listBox.width);
      }

      await expect(page.locator('body > footer.footer')).toBeVisible();
    }
  });
}

test('site favicon uses the approved KW folded optical masters', async ({ page, request }) => {
  const svgResponse = await request.get(`${BASE}/favicon.svg`);
  expect(svgResponse.ok()).toBe(true);
  const svg = await svgResponse.text();
  expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  expect(svg).toContain('viewBox="0 0 16 16"');
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
    const icons = await page.locator('link[rel="icon"]').evaluateAll((nodes) => nodes.map((node) => ({ href: node.getAttribute('href'), type: node.getAttribute('type'), sizes: node.getAttribute('sizes') })));
    expect(icons).toEqual([{ href: 'favicon.svg', type: 'image/svg+xml', sizes: null }, { href: 'favicon.png', type: 'image/png', sizes: '256x256' }]);
  }
  await page.goto(`${BASE}/favicon.png`);
  const png = await page.locator('img').evaluate((image) => {
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
    const pixel = (x, y) => Array.from(context.getImageData(x, y, 1, 1).data);
    return { width: image.naturalWidth, height: image.naturalHeight, corner: pixel(0, 0), background: pixel(128, 230), whiteStroke: pixel(60, 80), redHinge: pixel(124, 128) };
  });
  expect(png).toEqual({ width: 256, height: 256, corner: [0, 0, 0, 0], background: [24, 33, 30, 255], whiteStroke: [255, 255, 255, 255], redHinge: [192, 57, 43, 255] });
});
