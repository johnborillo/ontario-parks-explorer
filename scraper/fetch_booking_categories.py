#!/usr/bin/env python3
"""
Step 8: Fetch per-park booking categories from the Ontario Parks reservation API.

The /api/resourceLocation endpoint returns detailed information about each
reservable park, including a `similarExperiences` array that lists every
bookingCategoryId the park supports. This is the authoritative source for
whether a park is reservable for camping, day use, backcountry, etc.

Booking category IDs (from /api/searchcriteriatabs):
  - 0, 32: Campsite (the default tab)
  - 33, 7, 48, 51: Day Use
  - 4, 5, 13, 3, 24: Backcountry
  - 2: Roofed Accommodations
  - 6: Group Campsite
  - 11: Backcountry Registration

Output: scraper/output/booking_categories.json
  {
    "sibbaldpoint": { "camping": true, "dayUse": true, "backcountry": false, ... },
    "woodlandcaribou": { "camping": false, "dayUse": false, "backcountry": true, ... },
    ...
  }
"""

import json
import os
import re
import sys
import time
import unicodedata

import requests

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "booking_categories.json")
PROGRESS_FILE = os.path.join(OUTPUT_DIR, "_park_progress.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Referer": "https://reservations.ontarioparks.ca/",
    "Origin": "https://reservations.ontarioparks.ca",
}

REQUEST_DELAY = 0.5
TIMEOUT = 30

# Booking category IDs grouped by the user-facing tab they fall under
CATEGORY_TO_TAB = {
    0: "camping", 32: "camping",
    33: "dayUse", 7: "dayUse", 48: "dayUse", 51: "dayUse",
    4: "backcountry", 5: "backcountry", 13: "backcountry", 3: "backcountry", 24: "backcountry",
    2: "roofedAccommodation",
    6: "groupCampsite",
    11: "backcountryRegistration",
}


def normalize_to_slug(name: str) -> str:
    """Normalize a park name to the same slug format used in parks.json.

    The /api/resourceLocation names come back as e.g. "Sibbald Point Provincial
    Park" while our parks.json uses "Sibbald Point" -> "sibbaldpoint". We strip
    the "Provincial Park" / "Conservation Reserve" / etc. suffix to align them.
    """
    # Strip common park suffixes
    suffixes = [
        "Provincial Park", "Provincial Park Reserve", "Conservation Reserve",
        "Conservation Area", "Wilderness Area", "National Wildlife Area",
        "Wildlife Area", "Natural Environment",
    ]
    cleaned = name
    for suffix in suffixes:
        # Case-insensitive removal (prefer longer suffixes first to avoid partial matches)
        pattern = re.compile(re.escape(suffix), re.IGNORECASE)
        cleaned = pattern.sub("", cleaned)

    # Strip sub-area markers like "Algonquin - Brent Campground" -> "Algonquin"
    # The first segment before " - " or " (" is the main park
    if " - " in cleaned:
        cleaned = cleaned.split(" - ")[0]
    if " (" in cleaned:
        cleaned = cleaned.split(" (")[0]

    # Normalize Unicode and remove all non-alphanumeric
    nfkd = unicodedata.normalize("NFKD", cleaned)
    ascii_only = "".join(c for c in nfkd if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]", "", ascii_only.lower())


def main():
    print("[1/3] Fetching /api/resourceLocation...")
    resp = requests.get(
        "https://reservations.ontarioparks.ca/api/resourceLocation",
        headers=HEADERS, timeout=TIMEOUT,
    )
    if resp.status_code != 200:
        print(f"[ERROR] HTTP {resp.status_code}")
        sys.exit(1)
    data = resp.json()
    print(f"  Got {len(data)} resource locations")

    # Load our parks database to match slugs
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
    our_slugs = {p.get("slug"): p for p in our_parks if p.get("slug")}
    print(f"  Our database has {len(our_slugs)} parks")

    # Build the result: for each resource location, determine which tabs
    # it supports, and try to match to our slug
    print("\n[2/3] Extracting booking categories per park...")
    result = {}
    for item in data:
        # Get the English name
        name = next(
            (l.get("fullName") for l in item.get("localizedValues", [])
             if l.get("cultureName") == "en-CA"),
            None,
        )
        if not name:
            continue
        slug = normalize_to_slug(name)

        # Collect all bookingCategoryIds for this park
        category_ids = set()
        for exp in item.get("similarExperiences", []):
            cid = exp.get("bookingCategoryId")
            if cid is not None:
                category_ids.add(cid)

        # Map to tabs
        tabs = set()
        for cid in category_ids:
            tab = CATEGORY_TO_TAB.get(cid)
            if tab:
                tabs.add(tab)

        if not tabs:
            continue  # Skip if no recognized categories

        result[slug] = {
            "name": name,
            "resourceLocationId": item.get("resourceLocationId"),
            "categoryIds": sorted(category_ids),
            "camping": "camping" in tabs,
            "dayUse": "dayUse" in tabs,
            "backcountry": "backcountry" in tabs,
            "roofedAccommodation": "roofedAccommodation" in tabs,
            "groupCampsite": "groupCampsite" in tabs,
            "backcountryRegistration": "backcountryRegistration" in tabs,
            "anyReservable": True,
        }

    # Stats
    by_tab = {
        "camping": sum(1 for v in result.values() if v["camping"]),
        "dayUse": sum(1 for v in result.values() if v["dayUse"]),
        "backcountry": sum(1 for v in result.values() if v["backcountry"]),
        "roofedAccommodation": sum(1 for v in result.values() if v["roofedAccommodation"]),
        "groupCampsite": sum(1 for v in result.values() if v["groupCampsite"]),
        "backcountryRegistration": sum(1 for v in result.values() if v["backcountryRegistration"]),
    }

    # Save output
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"\n[3/3] Wrote {OUTPUT_FILE}")
    print(f"  Matched parks: {len(result)} / {len(our_slugs)}")
    print(f"\n  Per-tab counts:")
    for tab, n in by_tab.items():
        print(f"    {tab}: {n}")

    # Verify the user's specific examples
    print(f"\n  User-reported cases:")
    for name, slug_guess in [("Sibbald Point", "sibbaldpoint"),
                              ("Woodland Caribou", "woodlandcaribou"),
                              ("French River", "frenchriver"),
                              ("The Massasauga", "themassasauga"),
                              ("Aaron", "aaron"),
                              ("Algonquin", "algonquin")]:
        # Find the matching entry
        for k, v in result.items():
            if k == slug_guess or slug_guess in k:
                print(f"    {v['name']} (slug={k}):")
                for tab in ["camping", "dayUse", "backcountry", "roofedAccommodation", "groupCampsite", "backcountryRegistration"]:
                    if v.get(tab):
                        print(f"      - {tab}: YES")
                break


if __name__ == "__main__":
    main()
