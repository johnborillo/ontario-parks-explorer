#!/usr/bin/env python3
"""
Step 6: Fetch park photos from the live Ontario Parks site.

Two kinds of photos per park:
  1. Header image (always one): /images/headers/parks/{slug}-summer-{480,768,1200}.jpg
  2. Gallery images (0 to many):  /images/gallery/{slug}/{descriptive}_{flickrId}_o.jpg
     The gallery is only available for parks that have photos on the official
     site — the URLs are scraped from the park's HTML page since the
     filenames use unpredictable Flickr IDs.

The script writes scraper/output/photo_data.json:
  {
    "sibbaldpoint": {
      "header": "https://www.ontarioparks.ca/images/headers/parks/sibbaldpoint-summer-1200.jpg",
      "headerSrcset": {
        "480": ".../sibbaldpoint-summer-480.jpg",
        "768": ".../sibbaldpoint-summer-768.jpg",
        "1200": ".../sibbaldpoint-summer-1200.jpg"
      },
      "gallery": [
        "https://www.ontarioparks.ca/images/gallery/sibbaldpoint/photo1_o.jpg",
        ...
      ]
    },
    ...
  }

Resumable: re-running skips parks already in the output.
"""

import json
import os
import re
import sys
import time

import requests

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "photo_data.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}

BASE_URL = "https://www.ontarioparks.ca"
REQUEST_DELAY = 0.8  # seconds
TIMEOUT = 30
MAX_RETRIES = 2

# Match image srcset entries and plain img src references for gallery photos
GALLERY_IMG_RE = re.compile(
    r'src="(/images/gallery/[a-z0-9_-]+/[^"]+\.jpg)"',
    re.IGNORECASE,
)
# Header srcset (we can extract all 3 sizes from a single page)
HEADER_SRCSET_RE = re.compile(
    r'srcset="(/images/headers/parks/[^"]+\.jpg)[^"]*"',
    re.IGNORECASE,
)


def load_existing() -> dict:
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_json(data: dict) -> None:
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def fetch_park_page(slug: str) -> str | None:
    url = f"{BASE_URL}/park/{slug}"
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
            if resp.status_code == 200:
                return resp.text
            print(f"  [!] HTTP {resp.status_code} for {slug} (attempt {attempt})")
        except requests.RequestException as e:
            print(f"  [!] Request error for {slug}: {e} (attempt {attempt})")
        time.sleep(REQUEST_DELAY * attempt)
    return None


def parse_photos(html: str, slug: str) -> dict:
    """Extract header and gallery photo URLs from a park's HTML page."""
    result = {
        "header": f"{BASE_URL}/images/headers/parks/{slug}-summer-1200.jpg",
        "headerSrcset": {
            "480": f"{BASE_URL}/images/headers/parks/{slug}-summer-480.jpg",
            "768": f"{BASE_URL}/images/headers/parks/{slug}-summer-768.jpg",
            "1200": f"{BASE_URL}/images/headers/parks/{slug}-summer-1200.jpg",
        },
        "gallery": [],
    }

    # Find gallery image URLs (de-duplicate, preserve order)
    seen = set()
    for match in GALLERY_IMG_RE.finditer(html):
        path = match.group(1)
        if path in seen:
            continue
        seen.add(path)
        result["gallery"].append(f"{BASE_URL}{path}")

    return result


def main():
    # Load parks list to know which slugs to process
    candidates = [
        os.path.join(OUTPUT_DIR, "parks_database.json"),
        os.path.join(os.path.dirname(__file__), "..", "src", "data", "parks.json"),
    ]
    parks = []
    for path in candidates:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                parks = json.load(f)
            break
    if not parks:
        print("[ERROR] No parks found in parks_database.json or src/data/parks.json")
        sys.exit(1)
    print(f"[INFO] Loaded {len(parks)} parks")

    photo_data = load_existing_data()
    print(f"[INFO] Resuming with {len(photo_data)} parks already in {OUTPUT_FILE}")

    total = len(parks)
    processed = 0
    skipped = 0
    failed = 0
    with_gallery = 0

    print(f"\n[1/2] Fetching park pages for {total} parks...")
    for i, park in enumerate(parks, 1):
        slug = park.get("slug")
        if not slug:
            continue

        if slug in photo_data:
            skipped += 1
            if i % 50 == 0:
                print(f"  [{i}/{total}] (skipping already-processed) Last: {slug}")
            continue

        if i % 10 == 1 or i == total:
            print(f"  [{i}/{total}] Fetching {slug}...")

        html = fetch_park_page(slug)
        if html is None:
            failed += 1
            # Store a header-only entry so we don't retry forever
            photo_data[slug] = {
                "header": f"{BASE_URL}/images/headers/parks/{slug}-summer-1200.jpg",
                "headerSrcset": {
                    "480": f"{BASE_URL}/images/headers/parks/{slug}-summer-480.jpg",
                    "768": f"{BASE_URL}/images/headers/parks/{slug}-summer-768.jpg",
                    "1200": f"{BASE_URL}/images/headers/parks/{slug}-summer-1200.jpg",
                },
                "gallery": [],
            }
            save_json(photo_data)
            continue

        photos = parse_photos(html, slug)
        photo_data[slug] = photos
        if photos["gallery"]:
            with_gallery += 1
        save_json(photo_data)
        processed += 1
        time.sleep(REQUEST_DELAY)

    # Stats
    total_gallery = sum(len(p.get("gallery", [])) for p in photo_data.values())
    print(f"\n[2/2] Summary:")
    print(f"  Total parks:        {total}")
    print(f"  Newly processed:    {processed}")
    print(f"  Skipped (cached):   {skipped}")
    print(f"  Failed:             {failed}")
    print(f"  With gallery:       {with_gallery}")
    print(f"  Total gallery imgs: {total_gallery}")
    print(f"\n[OK] Wrote {OUTPUT_FILE}")


def load_existing_data() -> dict:
    return load_existing()


if __name__ == "__main__":
    main()
