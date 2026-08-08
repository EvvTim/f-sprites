#!/usr/bin/env python3
"""Refresh src/data/sprites.json and src/assets/sprites/*.webp from fortnite.gg.

fortnite.gg/sprites sits behind a Cloudflare JS challenge, so it can't be
curled directly. Instead this fetches pages through the r.jina.ai reader
proxy (https://r.jina.ai/<url>), which renders the page server-side and is
not Cloudflare-gated, and parses the sprite cards out of the resulting HTML.
The sprite icon images themselves are NOT behind Cloudflare and are
downloaded straight from fortnite.gg.

(This used to go through Wayback Machine snapshots, but archive.org's
crawler can lag the live site by days or more, so newly added/released
sprites wouldn't show up until archive.org happened to recrawl the page.)

Besides the sprite-grid listing, this also visits each sprite's own detail
page (fortnite.gg/sprites/<slug>) to pull its ability description, squad
buff, location/summon-cost facts, and per-source drop chances. That's one
extra proxied request per sprite, and the reader proxy is rate-limited to
~20 requests/minute, so detail fetching is incremental: a sprite is only
re-fetched if it doesn't already have detail fields cached in sprites.json.
On a full backfill (nothing cached yet) this makes the script take several
minutes for ~100+ sprites - that's expected, not a hang.

Usage:
    python3 scripts/update-sprites.py

All network calls go through `curl` (not Python's urllib) since this
environment's Python SSL trust store can't validate these hosts' certs
directly.
"""

import html
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "src" / "data" / "sprites.json"
IMAGES_DIR = ROOT / "src" / "assets" / "sprites"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
SPRITES_URL = "https://fortnite.gg/sprites"
READER_URL = "https://r.jina.ai/" + SPRITES_URL
# r.jina.ai allows ~20 requests/minute; stay comfortably under that.
DETAIL_FETCH_DELAY_S = 3.2
DETAIL_FETCH_RETRIES = 2

CARD_RE = re.compile(r'<div class="sprite-card"([^>]*)>(.*?)</div></div>', re.DOTALL)
ATTR_RE = re.compile(r'([\w-]+)="([^"]*)"')
HREF_RE = re.compile(r'href="[^"]*(/sprites/\d+-[a-z0-9-]+)"')
IMG_RE = re.compile(
    r'<img src="[^"]*(/img/x/sprites/icons/[^"]+\.webp)"[^>]*alt="([^"]*)"'
)
NAME_RE = re.compile(r'class="sprite-name"[^>]*>([^<]*)</a>')
RARITY_PILL_RE = re.compile(r'sprite-pill sprite-rarity-(\w+)">(\w+)</span>')
PCT_RE = re.compile(r'sprite-pill">([\d.]+%)</span>')

DETAIL_PANEL_RE = re.compile(r'class="sprite-detail-panel">(.*)', re.DOTALL)
DESC_SPECIAL_RE = re.compile(r'class="sprite-desc-special">([^<]*)<')
DESC_RE = re.compile(r'class="sprite-desc">([^<]*)<')
FACT_RE = re.compile(r'class="sprite-fact"><span>([^<]*)</span>\s*<b>([^<]*)</b>')
DETAIL_FIELDS = ("squadBonus", "effect", "facts", "dropChances")


def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"command failed: {' '.join(cmd)}\n{result.stderr}", file=sys.stderr)
        sys.exit(1)
    return result.stdout


def curl(url: str, *extra_args: str) -> str:
    return run(["curl", "-s", "-A", USER_AGENT, "-L", *extra_args, url])


def curl_to_file(url: str, dest: Path) -> None:
    run(["curl", "-s", "-A", USER_AGENT, "-L", url, "-o", str(dest)])


def fetch_live_html() -> str:
    print(f"Fetching live page via reader proxy: {READER_URL}")
    return curl(READER_URL, "-H", "X-Return-Format: html")


def fetch_sprite_detail_html(slug: str) -> str:
    url = f"{SPRITES_URL}/{slug}"
    return curl("https://r.jina.ai/" + url, "-H", "X-Return-Format: html")


def parse_sprite_detail(html_text: str) -> dict | None:
    panel_match = DETAIL_PANEL_RE.search(html_text)
    if not panel_match:
        return None
    # Bound the panel so a regex mishap can't run off into unrelated markup
    # (related-variants grid, footer, scripts) further down the page.
    panel = panel_match.group(1)[:4000]

    squad_match = DESC_SPECIAL_RE.search(panel)
    squad_bonus = html.unescape(squad_match.group(1)).strip() if squad_match else None

    effect = [html.unescape(p).strip() for p in DESC_RE.findall(panel)]

    facts_html, _, drop_html = panel.partition('class="sprite-facts-subtitle"')
    facts = [
        {"label": html.unescape(label).strip(), "value": html.unescape(value).strip()}
        for label, value in FACT_RE.findall(facts_html)
        if label.strip() != "Variant"  # redundant with the sprite's own variant field
    ]
    drop_chances = [
        {"label": html.unescape(label).strip(), "value": html.unescape(value).strip()}
        for label, value in FACT_RE.findall(drop_html)
    ]

    if not effect and not facts:
        return None

    return {
        "squadBonus": squad_bonus,
        "effect": effect,
        "facts": facts,
        "dropChances": drop_chances,
    }


def has_details(cached: dict) -> bool:
    # squadBonus is legitimately null/absent for every non-"special" sprite,
    # so it can't be part of the "already fetched" check (that would make
    # every run re-fetch the ~90% of sprites without a squad buff). A
    # successful parse always yields a non-empty effect and/or facts list -
    # see the early-return guard in parse_sprite_detail - so checking those
    # two is the reliable "did we already get this one" signal.
    return bool(cached.get("effect")) or bool(cached.get("facts"))


def fetch_missing_details(sprites: list[dict], old_by_id: dict[int, dict]) -> int:
    fetched = 0
    pending = [s for s in sprites if not has_details(old_by_id.get(s["id"], {}))]
    if not pending:
        return 0

    print(
        f"\nFetching detail info for {len(pending)} sprite(s) "
        f"(~{len(pending) * DETAIL_FETCH_DELAY_S:.0f}s, rate-limited)..."
    )
    for i, sprite in enumerate(pending):
        if i > 0:
            time.sleep(DETAIL_FETCH_DELAY_S)

        detail = None
        for attempt in range(DETAIL_FETCH_RETRIES + 1):
            if attempt > 0:
                # Back off harder than the steady-state pace: a failure here
                # usually means the shared rate limit was momentarily blown
                # (e.g. another update-sprites run going at the same time).
                time.sleep(DETAIL_FETCH_DELAY_S * 3)
            detail = parse_sprite_detail(fetch_sprite_detail_html(sprite["slug"]))
            if detail is not None:
                break

        if detail is None:
            print(f"  [{i + 1}/{len(pending)}] FAILED to parse {sprite['slug']}", file=sys.stderr)
            continue
        sprite.update(detail)
        fetched += 1
        print(f"  [{i + 1}/{len(pending)}] {sprite['name']}")

    return fetched


def parse_page(html_text: str) -> list[dict]:
    start = html_text.find("sprites-grid")
    end = html_text.find('id="ad-btf"')
    section = html_text[start:end] if start != -1 else html_text

    results = []
    for match in CARD_RE.finditer(section):
        attrs = dict(ATTR_RE.findall(match.group(1)))
        body = match.group(2)

        href_match = HREF_RE.search(body)
        slug = href_match.group(1).replace("/sprites/", "") if href_match else None

        img_match = IMG_RE.search(body)
        image_path = img_match.group(1) if img_match else None

        name_match = NAME_RE.search(body)
        name = html.unescape(name_match.group(1)) if name_match else None

        pct_match = PCT_RE.search(body)
        drop_chance = pct_match.group(1) if pct_match else "0%"

        unreleased = attrs.get("data-unreleased") == "1" or "Unreleased" in body

        if "data-sprite" not in attrs or not slug or not image_path or not name:
            continue

        results.append(
            {
                "id": int(attrs["data-sprite"]),
                "slug": slug,
                "name": name,
                "parent": attrs.get("data-parent", ""),
                "rarity": attrs.get("data-rarity", ""),
                "variant": attrs.get("data-variant", ""),
                "image": "/sprites/" + os.path.basename(image_path),
                "_source_image_path": image_path,
                "dropChance": drop_chance,
                "unreleased": unreleased,
            }
        )

    results.sort(key=lambda d: d["id"])
    return results


def download_missing_images(sprites: list[dict]) -> int:
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    downloaded = 0
    for sprite in sprites:
        dest = IMAGES_DIR / os.path.basename(sprite["_source_image_path"])
        if dest.exists():
            continue
        url = "https://fortnite.gg" + sprite["_source_image_path"]
        curl_to_file(url, dest)
        if dest.exists() and dest.stat().st_size > 0:
            downloaded += 1
            print(f"  downloaded {dest.name}")
        else:
            print(f"  FAILED to download {url}", file=sys.stderr)
    return downloaded


def diff_and_report(old: list[dict], new: list[dict]) -> None:
    old_by_id = {d["id"]: d for d in old}
    new_by_id = {d["id"]: d for d in new}

    added = [new_by_id[i] for i in new_by_id if i not in old_by_id]
    removed = [old_by_id[i] for i in old_by_id if i not in new_by_id]
    changed = []
    for i in new_by_id:
        if i in old_by_id:
            fields = ("name", "parent", "rarity", "variant", "dropChance", "unreleased")
            if any(old_by_id[i].get(f) != new_by_id[i].get(f) for f in fields):
                changed.append((old_by_id[i], new_by_id[i]))

    print(f"\nTotal sprites: {len(old)} -> {len(new)}")
    if added:
        print(f"\nAdded ({len(added)}):")
        for d in added:
            print(f"  + [{d['id']}] {d['name']} ({d['parent']}, {d['variant']})")
    if removed:
        print(f"\nRemoved ({len(removed)}):")
        for d in removed:
            print(f"  - [{d['id']}] {d['name']} ({d['parent']}, {d['variant']})")
    if changed:
        print(f"\nChanged ({len(changed)}):")
        for old_d, new_d in changed:
            print(f"  ~ [{new_d['id']}] {new_d['name']}")
            for f in ("name", "parent", "rarity", "variant", "dropChance", "unreleased"):
                if old_d.get(f) != new_d.get(f):
                    print(f"      {f}: {old_d.get(f)!r} -> {new_d.get(f)!r}")
    if not (added or removed or changed):
        print("\nNo changes since last update.")


def main() -> None:
    live_html = fetch_live_html()
    if len(live_html) < 5000:
        print("Page response looks too small, aborting.", file=sys.stderr)
        sys.exit(1)

    sprites = parse_page(live_html)
    if not sprites:
        print("Parsed 0 sprites, site markup may have changed.", file=sys.stderr)
        sys.exit(1)

    print(f"Parsed {len(sprites)} sprite cards from live page.")

    print("\nDownloading any new images...")
    downloaded = download_missing_images(sprites)
    print(f"Downloaded {downloaded} new image(s).")

    old_sprites = []
    if DATA_PATH.exists():
        old_sprites = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    old_by_id = {d["id"]: d for d in old_sprites}

    # Carry over already-scraped detail info so re-runs only fetch what's new.
    for sprite in sprites:
        cached = old_by_id.get(sprite["id"])
        if cached:
            for field in DETAIL_FIELDS:
                if cached.get(field):
                    sprite[field] = cached[field]

    fetched = fetch_missing_details(sprites, old_by_id)
    print(f"\nFetched detail info for {fetched} sprite(s).")

    clean_sprites = [{k: v for k, v in d.items() if not k.startswith("_")} for d in sprites]
    diff_and_report(old_sprites, clean_sprites)

    DATA_PATH.write_text(
        json.dumps(clean_sprites, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"\nWrote {DATA_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
