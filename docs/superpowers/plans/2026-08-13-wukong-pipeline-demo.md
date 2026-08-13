# 悟空 Agent 生产管线交互 Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增一个脱敏、可操作的悟空生产管线 Demo，并将中英文简历与作品集统一重排为三组核心项目。

**Architecture:** `demo-wukong.html` 延续仓库单文件静态 Demo 模式，用原生 JavaScript 有限状态机驱动所有画面和操作，使用 `sessionStorage` 保存合成演示进度。现有 HTML 只做必要的信息架构和链接调整；PDF 与 Word 继续从 `build_resume_pdf.py` 的 `BLK` 同源生成。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、Playwright、Python `http.server`、ReportLab、python-docx、GitHub Pages

---

### Task 1: 先锁定公开行为合同

**Files:**
- Create: `tests/wukong-demo.spec.js`
- Modify: `tests/resume-content.spec.js`

- [ ] 写悟空页面隐私边界、状态机、失败停车、恢复、耳审、留言、断点续跑与四档响应式测试。
- [ ] 将简历测试改为三组核心项目，并要求数分卡含 Eval 链接、悟空卡含 `demo-wukong.html`。
- [ ] 启动 `python3 -m http.server 52784 --bind 127.0.0.1`。
- [ ] 运行 `playwright test tests/wukong-demo.spec.js tests/resume-content.spec.js --workers=1`，确认因页面与重排尚未实现而失败。

### Task 2: 实现悟空静态状态机

**Files:**
- Create: `demo-wukong.html`
- Test: `tests/wukong-demo.spec.js`

- [ ] 建立 `SETUP` 到 `COMPLETE` 的合法转移表，非法事件返回且不改变状态。
- [ ] 实现任务创建、25 卡进度、11/25 质检失败和 Agent 自述无效证据。
- [ ] 实现三项自修白名单、禁改门脚本和同一卡 `FAIL -> PASS`。
- [ ] 实现三条耳审契约、未判完禁提交、单条局部重做。
- [ ] 实现 18.4 秒留言、待审计状态和确定动作回填。
- [ ] 实现 `sessionStorage` 恢复、重置、自动演示和用户接管。
- [ ] 运行悟空专项测试直至全部通过。

### Task 3: 统一三组核心项目信息架构

**Files:**
- Modify: `index.html`
- Modify: `en.html`
- Modify: `cases.html`
- Modify: `README.md`
- Modify: `README.en.md`
- Test: `tests/resume-content.spec.js`

- [ ] 合并数分机器人与 Eval 为第一组，保留两个独立证据入口。
- [ ] 给悟空项目卡增加交互 Demo 入口。
- [ ] 将 adquery-lite 作为第三组，并收紧“替代通用 BI”的过度表述。
- [ ] 将 `cases.html` 重排为“核心项目 / 扩展 Demo / 策略产品案例”，保留五个 AI / 数据 Demo 页面。
- [ ] 更新中英文 README 的 Demo 清单和案例清单。
- [ ] 运行内容、链接与四档响应式测试。

### Task 4: 同步 PDF、Word 与权威源

**Files:**
- Modify: authoritative `build_resume_pdf.py`
- Modify: authoritative `build_resume_strategy.py`
- Regenerate: AI-PM PDF and editable Word deliverables
- Sync: authoritative website source directory

- [ ] 将 AI-PM `BLK` 收敛为三组项目，Eval 内容合入数分机器人。
- [ ] 更新“5 个在线 Demo”口径和悟空 Demo URL，策略版只澄清工具 / Eval 定义。
- [ ] 重生成 PDF 与 Word，并同步站内 PDF。
- [ ] 验证 PDF、Word 均为单页，且文字抽取包含三项目顺序与悟空 Demo。

### Task 5: 全量验证与发布

**Files:**
- Modify: `tests/check_local_links.py`（仅在新文件类型未被现有扫描覆盖时）
- Modify: `Agent_Brain/04_Projects/Resume_Portfolio/2026-08-10_GitHub公开形象整改与新仓库发布.md`

- [ ] 运行全部 Playwright 测试、链接扫描和敏感词扫描。
- [ ] 截图检查 360、390、1024、1440，确认无溢出、遮挡或空白。
- [ ] 核对仓库与权威源公开文件哈希一致。
- [ ] 使用 GitHub noreply 作者信息提交并推送 `main`。
- [ ] 验证 Pages 构建成功、线上页面可操作且关键文件哈希一致。
- [ ] 增量写回外脑项目记录并回读确认。
