#!/usr/bin/env python3
"""
Step 7: Fetch the authoritative list of reservable parks.

The Ontario Parks reservation site (reservations.ontarioparks.ca) is the
authoritative source for which parks accept online reservations. Its
homepage Park dropdown is populated from the same /api/maps/root endpoint
that drives the booking flow.

Flow:
  1. GET /api/maps/root  -> list of regions and their map links
  2. Each mapLink has a resourceLocationId, transactionLocationId, childMapId,
     and an English localization with the park title
  3. We collect unique park titles and normalize them to slugs matching our
     parks.json format

Result: scraper/output/reservable_parks.json
  {
    "sibbaldpoint": { "title": "Sibbald Point", "resourceLocationId": -2147483544 },
    "algonquin":    { "title": "Algonquin - Achray / Sand Lake Gate", ... },
    ...
  }
"""

import json
import os
import re
import sys
import time

import requests

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "reservable_parks.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Referer": "https://reservations.ontarioparks.ca/",
    "Origin": "https://reservations.ontarioparks.ca",
}

REQUEST_DELAY = 1.0
TIMEOUT = 30


def normalize_to_slug(title: str) -> str:
    """Normalize a reservation-site title to a slug matching our parks.json.
    Examples:
      "Sibbald Point"                  -> "sibbaldpoint"
      "Blue Mountain - Metcalfe Rock"  -> "bluemountain"
      "Algonquin - Achray / Sand Lake Gate" -> "algonquin"
      "René Brunelle"                  -> "renebrunelle"
      "Lake of the Mountain"           -> "lakeonthemountain"
    """
    # Strip accents
    import unicodedata
    nfkd = unicodedata.normalize("NFKD", title)
    ascii_only = "".join(c for c in nfkd if not unicodedata.combining(c))
    # Lowercase
    lower = ascii_only.lower()
    # Strip all non-alphanumeric (we want a single token, no separators)
    slug = re.sub(r"[^a-z0-9]", "", lower)
    return slug


def main():
    print("[1/3] Fetching /api/maps/root from reservations.ontarioparks.ca...")
    resp = requests.get(
        "https://reservations.ontarioparks.ca/api/maps/root",
        headers=HEADERS, timeout=TIMEOUT,
    )
    if resp.status_code != 200:
        print(f"[ERROR] HTTP {resp.status_code}")
        sys.exit(1)
    data = resp.json()
    time.sleep(REQUEST_DELAY)

    # Build a flat list of all park links
    print("\n[2/3] Extracting park links...")
    all_links = []
    for region in data:
        for link in region.get("mapLinks", []):
            rid = link.get("resourceLocationId")
            if not rid:
                continue
            title = next(
                (l.get("title") for l in link.get("localizations", [])
                 if l.get("cultureName") == "en-CA"),
                None,
            )
            if not title:
                continue
            slug = normalize_to_slug(title)
            all_links.append({
                "title": title,
                "slugGuess": slug,
                "resourceLocationId": rid,
                "transactionLocationId": link.get("transactionLocationId"),
                "childMapId": link.get("childMapId"),
            })

    print(f"  Found {len(all_links)} raw park links (includes sub-areas)")

    # Try to match each link to our existing parks
    candidates = [
        os.path.join(OUTPUT_DIR, "parks_database.json"),
        os.path.join(os.path.dirname(__file__), "..", "src", "data", "parks.json"),
    ]
    our_parks = []
    for path in candidates:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                our_parks = json.load(f)
            break
    if not our_parks:
        print("[ERROR] No parks found in parks_database.json or src/data/parks.json")
        sys.exit(1)

    our_slugs = {p.get("slug"): p for p in our_parks if p.get("slug")}
    print(f"  Our database has {len(our_slugs)} parks")

    # Two output structures:
    #  1. By reservation link (so we can re-fetch details later if needed)
    #  2. By our slug (so merge_data.py can flag parks easily)
    by_link = {}
    matched_to_our_slugs = {}

    for link in all_links:
        # Try exact slug match
        slug = link["slugGuess"] if link["slugGuess"] in our_slugs else None
        # Try substring match for sub-areas (e.g. "Algonquin - Achray" -> "algonquin")
        if not slug:
            for our_slug in our_slugs:
                if link["slugGuess"] == our_slug:
                    slug = our_slug
                    break
                if our_slug and (our_slug in link["slugGuess"] or link["slugGuess"] in our_slug):
                    slug = our_slug
                    break

        if slug:
            matched_to_our_slugs[slug] = True

        key = f"{link['title']}|{link['resourceLocationId']}"
        by_link[key] = link

    # Write output
    result = {
        "bySlug": sorted(matched_to_our_slugs.keys()),
        "byLink": list(by_link.values()),
        "fetchedAt": int(time.time() * 1000),
    }
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"\n[3/3] Wrote {OUTPUT_FILE}")
    print(f"  Matched to our slugs: {len(matched_to_our_slugs)}")
    print(f"  Total raw links: {len(by_link)}")

    # Show a few examples of unmatched links (so we can see what's missing)
    unmatched_titles = sorted({
        link["title"] for link in by_link.values()
        if not any(s in link["slugGuess"] for s in our_slugs)
    })[:10]
    if unmatched_titles:
        print(f"\n  Sample unmatched (sub-area) titles:")
        for t in unmatched_titles:
            print(f"    - {t}")


if __name__ == "__main__":
    main()
