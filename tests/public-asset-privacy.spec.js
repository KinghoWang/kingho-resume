const { test, expect } = require('playwright/test');
const fs = require('fs');
const path = require('path');

function readCreativeDemo() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'demo-creative.html'), 'utf8');
  const match = source.match(/^const DB = (\{.*\});$/m);
  expect(match, 'embedded creative-demo JSON').not.toBeNull();
  return { source, data: JSON.parse(match[1]) };
}

test('creative demo uses non-linkable public identifiers and unique segment ids', () => {
  const { data } = readCreativeDemo();
  const materialKeys = new Set(data.materials.map(material => material.key));
  const segmentIds = data.materials.flatMap(material => material.segments.map(segment => segment.uid));
  const creativeIds = new Set(data.materials.flatMap(material => material.merged_ids));

  expect(data.materials).toHaveLength(78);
  expect([...materialKeys]).toHaveLength(78);
  expect([...materialKeys].every(key => /^MAT_\d{3}$/.test(key))).toBe(true);
  expect(Object.keys(data.seconds).sort()).toEqual([...materialKeys].sort());
  expect(new Set(segmentIds).size).toBe(segmentIds.length);

  for (const material of data.materials) {
    expect(material.creative_id).toMatch(/^CREATIVE_DEMO_\d{3}$/);
    expect(material.material_id).toBe('');
    expect(material.md5).toBe('');
    expect(material.merged_ids.every(id => /^CREATIVE_DEMO_\d{3}$/.test(id))).toBe(true);
    expect(material.segments.every(segment => segment.uid.startsWith(`${material.key}__SEG_`))).toBe(true);
  }

  for (const groups of Object.values(data.actions_lv)) {
    for (const [materialKey, actions] of Object.entries(groups)) {
      expect(materialKeys.has(materialKey)).toBe(true);
      expect(actions.every(action => segmentIds.includes(action.uid))).toBe(true);
    }
  }
  for (const groups of Object.values(data.role_top_lv)) {
    for (const entries of Object.values(groups)) {
      for (const entry of entries) {
        expect(materialKeys.has(entry.material_key)).toBe(true);
        expect(creativeIds.has(entry.creative_id)).toBe(true);
      }
    }
  }

  const serialized = JSON.stringify(data);
  expect(serialized).not.toMatch(/\b[a-f0-9]{32}\b/i);
  expect(serialized).not.toMatch(/CREATIVE_\d{10,}/);
  expect(serialized).not.toMatch(/material_CREATIVE_/);
  expect(serialized).not.toMatch(/\b\d{13,}\b/);
});

test('creative demo removes identifying entities and discloses synthetic metrics', () => {
  const { source, data } = readCreativeDemo();
  const sensitiveTerms = [
    '红松', '兴趣岛', '平安中心', '太字流动', '票圈',
    '凯粤', '宋伶俐', '墨恒', '李在峰', '陈明', '蓝总', '康起',
    '及象书画院', '中国岛派', '北京', '上海', '深圳', '华为',
  ];

  for (const term of sensitiveTerms) {
    expect(source, `public demo must not contain ${term}`).not.toContain(term);
  }
  expect(data.meta.loop_note).toContain('主体、文本与经营指标');
  expect(data.meta.loop_note).toContain('确定性规则合成');
  expect(source).toContain('本页所有主体、文本与经营指标均由确定性规则合成');
});

test('sanitized creative metrics remain internally consistent', () => {
  const { data } = readCreativeDemo();
  const totals = data.materials.reduce((sum, material) => {
    const perf = material.performance;
    expect(material.exposure).toBe(perf.total_view);
    expect(material.ctr).toBeCloseTo(perf.total_click / perf.total_view * 100, 3);
    expect(material.cvr).toBeCloseTo(perf.total_tran / perf.total_click * 100, 3);
    expect(material.close_rate_overall).toBeCloseTo(perf.total_close / perf.total_click, 3);
    sum.view += perf.total_view;
    sum.click += perf.total_click;
    sum.tran += perf.total_tran;
    sum.close += perf.total_close;
    return sum;
  }, { view: 0, click: 0, tran: 0, close: 0 });

  expect(data.pool.total_view).toBe(totals.view);
  expect(data.pool.total_click).toBe(totals.click);
  expect(data.pool.total_tran).toBe(totals.tran);
  expect(data.pool.total_close).toBe(totals.close);
  expect(data.pool.avg_ctr).toBeCloseTo(totals.click / totals.view * 100, 3);
  expect(data.pool.avg_cvr).toBeCloseTo(totals.tran / totals.click * 100, 3);
  expect(data.pool.avg_close).toBeCloseTo(totals.close / totals.click, 3);
});
