"""Check the channel-operations PDF's content, links and single-page layout."""
import re
from pathlib import Path

import pdfplumber
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "kingho-resume-ai-pm.pdf"
reader = PdfReader(PDF)
assert len(reader.pages) == 1
page = reader.pages[0]
assert len(page.images) == 1, "Keep the photo; do not restore the removed QR code"
text = re.sub(r"\s+", "", page.extract_text())
assert "求职意向：渠道运营" in text
assert "主要供内部运营使用" in text
assert "面向外部的应用仍在开发" in text

titles = [
    "01代理商激励与预算保障",
    "02AI广告日报与数据排查流程",
    "03基于广告数据的AI素材生产与投放验证",
    "04企微获客链路改造",
]
positions = [text.index(title) for title in titles]
assert positions == sorted(positions)
wecom = text[positions[3]:text.index("工作经历")]
assert "前转效率改善集中在部分行业" in wecom
assert "不熟悉长按扫码的人群加微率提升明显" in wecom
assert "此前观测：北极星曝光-加微率+50%+" in wecom
assert "曝光-地址率+40%+" in wecom
assert "广告主后转无损" in wecom
channel = text[positions[0] + 2:positions[1]]
assert not re.search(r"[0-9%]|ROI|反作弊|系数|时段", channel)
assert "专项消耗超过原定预算" in channel
assert "点击打开↗" in text
assert "查看3个项目案例↗" in text
assert "github.com/KinghoWang" in text
assert not re.search(r"[\u25a0\ufffd]", text), "Unexpected replacement glyph"

annotations = [item.get_object() for item in page.get("/Annots", [])]
uris = [item.get("/A", {}).get("/URI") for item in annotations]
assert len(uris) == 5
assert set(uris) == {
    "mailto:kinghowang@foxmail.com",
    "tel:+8617512006748",
    "https://kinghowang.github.io/kingho-resume/",
    "https://kinghowang.github.io/kingho-resume/cases.html",
    "https://github.com/KinghoWang",
}
for item in annotations:
    x0, y0, x1, y1 = map(float, item["/Rect"])
    assert item["/Subtype"] == "/Link"
    assert 0 <= x0 < x1 <= float(page.mediabox.width)
    assert 0 <= y0 < y1 <= float(page.mediabox.height)

with pdfplumber.open(PDF) as document:
    rendered_page = document.pages[0]
    words = rendered_page.extract_words()
    bottom = rendered_page.height - max(word["bottom"] for word in words)
    assert 50 <= bottom <= 110, bottom
    assert all(40 <= char["x0"] < char["x1"] <= rendered_page.width - 40
               for char in rendered_page.chars)
print(f"PASS: one page, one photo, four ordered projects, five links, {bottom:.1f}pt bottom margin")
