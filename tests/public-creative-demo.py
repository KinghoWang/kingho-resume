#!/usr/bin/env python3
"""Validate the public creative demo's aliases, references, and synthetic metrics."""
import collections
import hashlib
import json
import math
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SAMPLE_VIDEO = ROOT / "demo-creative-sample.mp4"
SAMPLE_VIDEO_SHA256 = "7d3b35ef6bca4c9399690b22ad73463af69ddee233d505047168828cfb2f3c6d"


def load_db(path: Path):
    source = path.read_text(encoding="utf-8")
    marker = "const DB = "
    start = source.index(marker) + len(marker)
    return json.JSONDecoder().raw_decode(source[start:])[0]


def close_enough(actual, expected, tolerance=0.002):
    return math.isclose(float(actual), float(expected), rel_tol=0, abs_tol=tolerance)


def walk(value, path="DB"):
    yield path, value
    if isinstance(value, dict):
        for key, child in value.items():
            yield from walk(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from walk(child, f"{path}[{index}]")


def verify(path: Path):
    db = load_db(path)
    errors = []

    def check(condition, message):
        if not condition:
            errors.append(message)

    materials = db.get("materials", [])
    expected_keys = {f"MAT_{index:03d}" for index in range(1, 79)}
    material_keys = {item.get("key") for item in materials}
    check(len(materials) == 78, f"materials: expected 78, got {len(materials)}")
    check(material_keys == expected_keys, "material aliases are not exactly MAT_001..MAT_078")

    by_key = {item.get("key"): item for item in materials}
    all_creatives = [cid for item in materials for cid in item.get("merged_ids", [])]
    expected_creatives = {f"CREATIVE_DEMO_{index:03d}" for index in range(1, 86)}
    check(len(all_creatives) == 85, f"creative aliases: expected 85, got {len(all_creatives)}")
    check(set(all_creatives) == expected_creatives, "creative aliases are not exactly CREATIVE_DEMO_001..085")
    check(len(set(all_creatives)) == len(all_creatives), "creative alias appears in more than one material")
    check(
        collections.Counter(item.get("merged_count") for item in materials)
        == collections.Counter({1: 74, 2: 2, 3: 1, 4: 1}),
        "merged-group distribution changed",
    )

    uid_owner = {}
    segment_total = 0
    for item in materials:
        key = item.get("key")
        merged_ids = item.get("merged_ids", [])
        check(item.get("merged_count") == len(merged_ids), f"{key}: merged_count mismatch")
        check(item.get("creative_id") in merged_ids, f"{key}: representative creative is not in merged_ids")
        check(item.get("md5") in ("", None), f"{key}: md5 was not cleared")
        check(item.get("material_id") in ("", None), f"{key}: material_id was not cleared")
        if key == "MAT_045":
            check(item.get("video_url") == SAMPLE_VIDEO.name, f"{key}: unexpected sample video")
            check(item.get("title") == "素材045 ▶ 含示意视频", f"{key}: unexpected sample-video title")
        else:
            check(item.get("video_url") in ("", None), f"{key}: video_url was not cleared")
            check(bool(re.fullmatch(r"素材\d{3}", item.get("title", ""))), f"{key}: invalid title alias")
        check(item.get("post_url") in ("", None), f"{key}: post_url was not cleared")
        check(bool(re.fullmatch(r"VIDEO_DEMO_\d{3}", item.get("post_id", ""))), f"{key}: invalid post_id alias")

        performance = item.get("performance", {})
        view = performance.get("total_view", 0)
        click = performance.get("total_click", 0)
        tran = performance.get("total_tran", 0)
        close = performance.get("total_close", 0)
        check(item.get("exposure") == view, f"{key}: exposure != total_view")
        check(close_enough(item.get("ctr", 0), click / view * 100 if view else 0), f"{key}: CTR formula mismatch")
        check(close_enough(item.get("cvr", 0), tran / click * 100 if click else 0), f"{key}: CVR formula mismatch")
        check(close_enough(item.get("close_rate_overall", 0), close / click if click else 0), f"{key}: close-rate formula mismatch")

        segments = item.get("segments", [])
        segment_total += len(segments)
        check(performance.get("segment_count") == len(segments), f"{key}: segment_count mismatch")
        check(
            performance.get("data_segment_count") == sum(bool(seg.get("performance", {}).get("has_data")) for seg in segments),
            f"{key}: data_segment_count mismatch",
        )
        for index, segment in enumerate(segments, 1):
            expected_segment = f"SEG_{index:03d}"
            expected_uid = f"{key}__{expected_segment}"
            uid = segment.get("uid")
            check(bool(re.fullmatch(r"SEG_\d{3}", segment.get("paragraph_id", ""))), f"{key}: paragraph alias invalid at {index}")
            check(uid == expected_uid, f"{key}: UID alias mismatch at {index}")
            check(uid not in uid_owner, f"duplicate segment UID: {uid}")
            uid_owner[uid] = key

            perf = segment.get("performance", {})
            rows = perf.get("level_breakdown", [])
            if not rows:
                continue
            for row_index, row in enumerate(rows):
                row_click = row.get("click_uv", 0)
                expected_cvr = row.get("tran_uv", 0) / row_click * 100 if row_click else 0
                expected_close = row.get("close_uv", 0) / row_click if row_click else 0
                check(close_enough(row.get("src_cvr", 0), expected_cvr, 0.006), f"{uid}: row {row_index} src_cvr mismatch")
                check(close_enough(row.get("src_close", 0), expected_close, 0.006), f"{uid}: row {row_index} src_close mismatch")

            view_sum = sum(row.get("view_uv", 0) for row in rows)
            click_sum = sum(row.get("click_uv", 0) for row in rows)
            tran_sum = sum(row.get("tran_uv", 0) for row in rows)
            close_sum = sum(row.get("close_uv", 0) for row in rows)
            check(perf.get("view_uv") == view_sum, f"{uid}: view_uv aggregate mismatch")
            check(perf.get("click_uv") == click_sum, f"{uid}: click_uv aggregate mismatch")
            check(perf.get("tran_uv") == tran_sum, f"{uid}: tran_uv aggregate mismatch")
            check(perf.get("close_uv") == close_sum, f"{uid}: close_uv aggregate mismatch")
            check(perf.get("total_view") == max(row.get("total_view", 0) for row in rows), f"{uid}: total_view mismatch")
            check(perf.get("total_click") == max(row.get("total_click", 0) for row in rows), f"{uid}: total_click mismatch")
            check(perf.get("total_tran") == max(row.get("total_tran", 0) for row in rows), f"{uid}: total_tran mismatch")
            if view_sum:
                weighted_ctr = sum(row.get("src_ctr", 0) * row.get("view_uv", 0) for row in rows) / view_sum
                weighted_cvr = sum(row.get("src_cvr", 0) * row.get("view_uv", 0) for row in rows) / view_sum
                weighted_close = sum(row.get("src_close", 0) * row.get("view_uv", 0) for row in rows) / view_sum
                check(close_enough(perf.get("segment_ctr", 0), weighted_ctr, 0.006), f"{uid}: segment_ctr mismatch")
                check(close_enough(perf.get("segment_cvr", 0), weighted_cvr, 0.006), f"{uid}: segment_cvr mismatch")
                check(close_enough(perf.get("close_rate", 0), weighted_close, 0.006), f"{uid}: close_rate mismatch")
            expected_ctcvr = perf.get("segment_ctr", 0) * perf.get("segment_cvr", 0) / 100
            check(close_enough(perf.get("segment_ctcvr", 0), expected_ctcvr, 0.006), f"{uid}: segment_ctcvr mismatch")
            expected_share = tran_sum / perf.get("total_tran", 0) * 100 if perf.get("total_tran", 0) else 0
            check(close_enough(perf.get("tran_share", 0), expected_share, 0.006), f"{uid}: tran_share mismatch")
            check(close_enough(perf.get("signal_score", 0), min(100, max(0, expected_ctcvr * 10)), 0.02), f"{uid}: signal_score mismatch")

    check(segment_total == 1100, f"segments: expected 1100, got {segment_total}")
    check(len(uid_owner) == segment_total, "segment UIDs are not unique")
    check(SAMPLE_VIDEO.exists(), f"sample video is missing: {SAMPLE_VIDEO.name}")
    if SAMPLE_VIDEO.exists():
        sample_hash = hashlib.sha256(SAMPLE_VIDEO.read_bytes()).hexdigest()
        check(sample_hash == SAMPLE_VIDEO_SHA256, "sample video hash changed without review")

    seconds = db.get("seconds", {})
    check(set(seconds) == material_keys, "seconds keys do not exactly match material keys")
    second_columns = ("sec", "lv", "v", "c", "t", "cu", "ctr", "cvr", "cl")
    for key, columns in seconds.items():
        lengths = {name: len(columns.get(name, [])) for name in second_columns}
        check(len(set(lengths.values())) == 1, f"{key}: seconds column lengths differ: {lengths}")
        secs = columns.get("sec", [])
        item = by_key[key]
        check(item.get("seconds_max") == (max(secs) if secs else 0), f"{key}: seconds_max mismatch")
        check(item.get("seconds_count") == len(set(secs)), f"{key}: seconds_count mismatch")
        for index, click in enumerate(columns.get("c", [])):
            tran = columns["t"][index]
            close = columns["cu"][index]
            expected_cvr = tran / click * 100 if click else 0
            expected_close = close / click if click else 0
            check(close_enough(columns["cvr"][index], expected_cvr, 0.06), f"{key}: seconds[{index}] cvr mismatch")
            check(close_enough(columns["cl"][index], expected_close, 0.006), f"{key}: seconds[{index}] close mismatch")
            check(0 <= columns["lv"][index] < len(db.get("sec_levels", [])), f"{key}: seconds[{index}] invalid level")

    for level, actions_by_key in db.get("actions_lv", {}).items():
        for key, actions in actions_by_key.items():
            check(key in material_keys, f"actions_lv.{level}: unknown material {key}")
            for action in actions:
                check(uid_owner.get(action.get("uid")) == key, f"actions_lv.{level}.{key}: dangling UID {action.get('uid')}")
                if action.get("metric") in ("ctr", "ctcvr"):
                    expected_metric = action.get(action["metric"], 0)
                    check(close_enough(action.get("metric_val", 0), expected_metric, 0.006), f"actions_lv.{level}.{key}: metric_val mismatch")
                if action.get("role_p50"):
                    expected_ratio = action.get("metric_val", action.get("ctcvr", 0)) / action["role_p50"]
                    check(close_enough(action.get("ratio", 0), expected_ratio, 0.011), f"actions_lv.{level}.{key}: ratio mismatch")

    def check_templates(value, path="role_top_lv"):
        if isinstance(value, dict):
            if "material_key" in value:
                key = value.get("material_key")
                check(key in material_keys, f"{path}: unknown material {key}")
                if key in by_key:
                    check(value.get("creative_id") == by_key[key].get("creative_id"), f"{path}: creative/material mismatch")
            for key, child in value.items():
                check_templates(child, f"{path}.{key}")
        elif isinstance(value, list):
            for index, child in enumerate(value):
                check_templates(child, f"{path}[{index}]")

    check_templates(db.get("role_top_lv", {}))

    pool = db.get("pool", {})
    pool_view = sum(item["performance"]["total_view"] for item in materials)
    pool_click = sum(item["performance"]["total_click"] for item in materials)
    pool_tran = sum(item["performance"]["total_tran"] for item in materials)
    pool_close = sum(item["performance"]["total_close"] for item in materials)
    check(pool.get("total_view") == pool_view, "pool total_view mismatch")
    check(pool.get("total_click") == pool_click, "pool total_click mismatch")
    check(pool.get("total_tran") == pool_tran, "pool total_tran mismatch")
    check(pool.get("total_close") == pool_close, "pool total_close mismatch")
    check(close_enough(pool.get("avg_ctr", 0), pool_click / pool_view * 100 if pool_view else 0), "pool avg_ctr mismatch")
    check(close_enough(pool.get("avg_cvr", 0), pool_tran / pool_click * 100 if pool_click else 0), "pool avg_cvr mismatch")
    check(close_enough(pool.get("avg_close", 0), pool_close / pool_click if pool_click else 0), "pool avg_close mismatch")

    field_names = {path.rsplit(".", 1)[-1] for path, _ in walk(db)}
    for field in ("generated_at", "replace_plan", "script"):
        check(field not in field_names, f"{field} still present")

    serialized = json.dumps(db, ensure_ascii=False)
    leak_patterns = {
        "32-char hex identifier": r"\b[0-9a-fA-F]{32}\b",
        "raw creative id": r"\bCREATIVE_(?!DEMO_)\d+\b",
        "long numeric id": r"\b\d{12,}\b",
        "absolute local path": r"(?:/Users/|/var/folders/|[A-Za-z]:\\)",
        "URL": r"https?://",
        "credential-like token": r"(?:github_pat_|gh[pousr]_|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{20,})",
    }
    for label, pattern in leak_patterns.items():
        match = re.search(pattern, serialized)
        check(match is None, f"{label} remains: {match.group(0) if match else ''}")

    if errors:
        print(f"FAIL: {len(errors)} checks failed")
        for error in errors[:100]:
            print(f"- {error}")
        if len(errors) > 100:
            print(f"- ... {len(errors) - 100} more")
        raise SystemExit(1)

    print(
        "PASS: public demo is internally consistent; "
        f"materials={len(materials)}, creatives={len(all_creatives)}, segments={segment_total}"
    )


if __name__ == "__main__":
    verify(Path(sys.argv[1]) if len(sys.argv) == 2 else ROOT / "demo-creative.html")
