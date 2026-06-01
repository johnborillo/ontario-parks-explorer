#!/usr/bin/env python3
"""
Step 5: Fetch park-specific amenities (legend icons) from the Ontario Parks
reservation system.

The reservation site renders a park-specific "Map Icon Legend" on each park's
booking page. That legend data is the authoritative source for what amenities
are actually available at each park (vs. what the public ontarioparks.ca site
mentions in passing).

Flow:
  1. GET /api/maps/root  -> 134 map links (regions + individual parks)
  2. For each park link: GET /api/maps?resourceLocationId=X
     -> list of map objects, each with mapLegendItems[]
  3. Collect union of legendItemType IDs across all the park's maps
  4. GET /api/maps/legendicons?mapLegendTypes=[<ids>]
     -> [{legendItemType, localizationKey, encodedImage}, ...]
  5. Decode base64 PNGs into scraper/output/legend-icons/<id>.png
  6. Write scraper/output/legend_data.json: {<parkSlug>: [legendItemType, ...]}

This script is resumable — if it crashes partway, re-running it will pick up
where it left off (parks already in legend_data.json are skipped).
"""

import base64
import json
import os
import sys
import time
from urllib.parse import urlencode

import requests

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
ICONS_DIR = os.path.join(OUTPUT_DIR, "legend-icons")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "legend_data.json")
ICON_INDEX_FILE = os.path.join(OUTPUT_DIR, "legend_icon_index.json")

BASE_URL = "https://reservations.ontarioparks.ca"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Referer": f"{BASE_URL}/",
    "Origin": BASE_URL,
}

REQUEST_DELAY = 1.0  # seconds between requests (be polite)
TIMEOUT = 30
MAX_RETRIES = 3


def slugify_for_lookup(title: str) -> str:
    """Best-effort match from reservation site title (e.g. 'Sibbald Point')
    to the slug we use in parks.json (e.g. 'sibbaldpoint').

    The reservation site uses display names. Our parks.json uses slugs from
    ontarioparks.ca/park/<slug>. This function does a normalized substring
    match; the caller should still verify against the actual parks.json.
    """
    return "".join(c.lower() for c in title if c.isalnum())


def load_existing_data() -> dict:
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def load_icon_index() -> dict:
    if os.path.exists(ICON_INDEX_FILE):
        with open(ICON_INDEX_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_json(path: str, data) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def fetch_json(url: str, params: dict = None) -> list | dict | None:
    """GET a URL with browser headers and return parsed JSON. Retries on failure."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.get(url, params=params, headers=HEADERS, timeout=TIMEOUT)
            if resp.status_code == 200:
                return resp.json()
            print(f"  [!] HTTP {resp.status_code} (attempt {attempt}/{MAX_RETRIES})")
        except requests.RequestException as e:
            print(f"  [!] Request error (attempt {attempt}/{MAX_RETRIES}): {e}")
        time.sleep(REQUEST_DELAY * attempt)
    return None


def collect_root_parks() -> list:
    """GET /api/maps/root and return the list of all park map-links (filter out region maps)."""
    print("[1/4] Fetching root maps from /api/maps/root...")
    data = fetch_json(f"{BASE_URL}/api/maps/root")
    if not data or not isinstance(data, list):
        print("[ERROR] Could not fetch root maps")
        return []

    parks = []
    seen_resource_ids = set()
    for region in data:
        for link in region.get("mapLinks", []):
            resource_id = link.get("resourceLocationId")
            transaction_id = link.get("transactionLocationId")
            title = next(
                (l.get("title") for l in link.get("localizations", []) if l.get("cultureName") == "en-CA"),
                None,
            )
            child_map_id = link.get("childMapId")
            if not (resource_id and title and child_map_id):
                continue
            # Filter out region maps (they have no resourceLocationId transaction)
            if resource_id in seen_resource_ids:
                continue
            # Region-level links have resourceLocationId but no specific park
            # in the title; skip if the title is something like "Northern Parks"
            # (we'll let the matching step handle it — keep all for now)
            seen_resource_ids.add(resource_id)
            parks.append({
                "title": title,
                "resourceLocationId": resource_id,
                "transactionLocationId": transaction_id,
                "childMapId": child_map_id,
                "slugGuess": slugify_for_lookup(title),
            })

    print(f"  Found {len(parks)} candidate park links")
    return parks


def fetch_park_legend_types(resource_location_id: int) -> list:
    """Fetch all maps for a park and return the union of legendItemType IDs."""
    data = fetch_json(f"{BASE_URL}/api/maps", params={"resourceLocationId": resource_location_id})
    if not data or not isinstance(data, list):
        return []

    types = set()
    for m in data:
        for item in m.get("mapLegendItems", []):
            t = item.get("legendItemType")
            if t is not None:
                types.add(t)
    return sorted(types)


def fetch_legend_icons(legend_types: list) -> list:
    """GET /api/maps/legendicons for the given type IDs and return the list of icons."""
    if not legend_types:
        return []
    params = {"mapLegendTypes": json.dumps(legend_types)}
    data = fetch_json(f"{BASE_URL}/api/maps/legendicons", params=params)
    if not data or not isinstance(data, list):
        return []
    return data


def save_icons(icons: list, icon_index: dict) -> None:
    """Decode base64 PNG icons and save them to the icons directory.
    Updates icon_index in place: {legendItemType_str: {label, file}}"""
    os.makedirs(ICONS_DIR, exist_ok=True)
    for icon in icons:
        t = icon.get("legendItemType")
        b64 = icon.get("encodedImage")
        label = icon.get("localizationKey", "")
        if t is None or not b64:
            continue
        key = str(t)
        if key in icon_index:
            continue  # already saved
        filename = f"{t}.png"
        filepath = os.path.join(ICONS_DIR, filename)
        try:
            png_bytes = base64.b64decode(b64)
            with open(filepath, "wb") as f:
                f.write(png_bytes)
            icon_index[key] = {"label": label, "file": filename}
        except Exception as e:
            print(f"  [!] Failed to decode icon {t}: {e}")


def load_parks_json() -> list:
    """Load src/data/parks.json to get the authoritative slug list."""
    candidates = [
        os.path.join(os.path.dirname(__file__), "..", "src", "data", "parks.json"),
        os.path.join(OUTPUT_DIR, "parks_database.json"),
    ]
    for path in candidates:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    return []


def match_park_slug(title: str, parks: list) -> str | None:
    """Find the best-matching park slug for a given reservation-site title."""
    title_norm = slugify_for_lookup(title)
    # Exact match
    for p in parks:
        if p.get("slug") == title_norm:
            return p["slug"]
    # Substring match (e.g., "Sibbald Point" -> "sibbaldpoint" matches "sibbald")
    for p in parks:
        slug = p.get("slug", "")
        if slug and (slug in title_norm or title_norm in slug):
            return slug
    return None


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    parks_data = load_parks_json()
    if not parks_data:
        print("[WARN] Could not load parks.json — results will use guessed slugs")
    park_slugs = {p.get("slug"): p for p in parks_data}
    print(f"[INFO] Loaded {len(park_slugs)} parks from parks.json")

    legend_data = load_existing_data()
    icon_index = load_icon_index()
    print(f"[INFO] Resuming with {len(legend_data)} parks already in legend_data.json")
    print(f"[INFO] Resuming with {len(icon_index)} icons already in icon index")

    parks = collect_root_parks()
    if not parks:
        sys.exit(1)

    total = len(parks)
    processed = 0
    skipped = 0
    matched = 0
    unmatched = []

    print(f"\n[2/4] Processing {total} parks...")
    for i, park in enumerate(parks, 1):
        title = park["title"]
        slug_guess = park["slugGuess"]
        resource_id = park["resourceLocationId"]

        # Try to match to our known slug list
        slug = slug_guess if slug_guess in park_slugs else match_park_slug(title, parks_data)
        if not slug:
            unmatched.append(title)
            continue
        matched += 1

        # Skip if already processed
        if slug in legend_data:
            skipped += 1
            if i % 20 == 0:
                print(f"  [{i}/{total}] (skipping already-processed) Last: {title}")
            continue

        print(f"  [{i}/{total}] {title} -> {slug} (resourceLocationId={resource_id})")
        time.sleep(REQUEST_DELAY)

        # Fetch all map legend types for this park
        legend_types = fetch_park_legend_types(resource_id)
        if not legend_types:
            print(f"    [WARN] No legend types found for {title}")
            legend_data[slug] = []
            save_json(OUTPUT_FILE, legend_data)
            continue
        print(f"    -> {len(legend_types)} unique legend types")
        time.sleep(REQUEST_DELAY)

        # Fetch the actual icon metadata + images
        icons = fetch_legend_icons(legend_types)
        if not icons:
            print(f"    [WARN] No icons returned for {title}")
            legend_data[slug] = legend_types
            save_json(OUTPUT_FILE, legend_data)
            continue
        print(f"    -> {len(icons)} icons resolved")

        # Save icons and update index
        save_icons(icons, icon_index)

        # Store just the legendItemTypes (icons are in the shared index)
        legend_data[slug] = sorted(set(icon.get("legendItemType") for icon in icons))

        # Save progress after each park
        save_json(OUTPUT_FILE, legend_data)
        save_json(ICON_INDEX_FILE, icon_index)
        processed += 1

    print(f"\n[3/4] Summary:")
    print(f"  Total parks:        {total}")
    print(f"  Matched to slugs:   {matched}")
    print(f"  Unmatched titles:   {len(unmatched)}")
    if unmatched:
        print(f"    {unmatched[:10]}")
    print(f"  Newly processed:    {processed}")
    print(f"  Skipped (cached):   {skipped}")
    print(f"  Total in dataset:   {len(legend_data)}")
    print(f"  Total icons:        {len(icon_index)}")

    print(f"\n[4/4] Done!")
    print(f"  Legend data:  {OUTPUT_FILE}")
    print(f"  Icon index:   {ICON_INDEX_FILE}")
    print(f"  Icon files:   {ICONS_DIR}/")


if __name__ == "__main__":
    main()
