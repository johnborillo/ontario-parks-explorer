#!/usr/bin/env python3
"""
Step 1: Fetch the complete list of Ontario Parks from the sitemap.xml.

Produces: output/parks_manifest.json
Each entry contains: slug, name (derived from slug), parkPageUrl.
"""

import json
import os
import re
import time

import requests
from bs4 import BeautifulSoup

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "parks_manifest.json")

SITEMAP_URL = "https://www.ontarioparks.ca/sitemap.xml"

HEADERS = {
    "User-Agent": "OntarioParksDataCollector/1.0 (research project; +https://github.com/example)"
}

# Pattern to match park detail pages: /park/{slug}
PARK_URL_PATTERN = re.compile(r"https://www\.ontarioparks\.ca/park/([a-z0-9\-]+)$", re.IGNORECASE)


def slug_to_name(slug: str) -> str:
    """Convert a URL slug to a human-readable park name."""
    return slug.replace("-", " ").title() + " Provincial Park"


def fetch_sitemap(url: str) -> str:
    """Fetch sitemap XML content."""
    print(f"[INFO] Fetching sitemap from {url}")
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.text


def parse_park_urls(xml_content: str) -> list[dict]:
    """Extract park page URLs from sitemap XML."""
    soup = BeautifulSoup(xml_content, "lxml-xml")
    urls = soup.find_all("url")
    
    parks = []
    seen_slugs = set()
    
    for url_tag in urls:
        loc = url_tag.find("loc")
        if loc is None:
            continue
        
        url_text = loc.get_text(strip=True)
        match = PARK_URL_PATTERN.match(url_text)
        if match:
            slug = match.group(1).lower()
            # Skip duplicates and non-park pages
            if slug in seen_slugs:
                continue
            # Filter out known non-park slugs
            if slug in ("locator", "park-locator", "search", "reservation", "reservations"):
                continue
            
            seen_slugs.add(slug)
            parks.append({
                "slug": slug,
                "name": slug_to_name(slug),
                "parkPageUrl": url_text
            })
    
    return parks


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Fetch and parse sitemap
    xml_content = fetch_sitemap(SITEMAP_URL)
    parks = parse_park_urls(xml_content)
    
    if not parks:
        print("[WARN] No park URLs found in sitemap. Trying fallback approach...")
        # Fallback: try fetching the park-locator page for links
        parks = fetch_from_park_locator()
    
    # Sort alphabetically by slug
    parks.sort(key=lambda p: p["slug"])
    
    # Write manifest
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(parks, f, indent=2, ensure_ascii=False)
    
    print(f"[OK] Found {len(parks)} parks. Manifest written to {OUTPUT_FILE}")
    return parks


def fetch_from_park_locator() -> list[dict]:
    """Fallback: scrape park links from the park-locator page."""
    print("[INFO] Attempting fallback: scraping park-locator page")
    url = "https://www.ontarioparks.ca/park-locator"
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    
    soup = BeautifulSoup(resp.text, "lxml")
    parks = []
    seen_slugs = set()
    
    for link in soup.find_all("a", href=True):
        href = link["href"]
        # Match relative or absolute park URLs
        match = re.match(r"(?:https://www\.ontarioparks\.ca)?/park/([a-z0-9\-]+)$", href, re.IGNORECASE)
        if match:
            slug = match.group(1).lower()
            if slug not in seen_slugs:
                seen_slugs.add(slug)
                full_url = f"https://www.ontarioparks.ca/park/{slug}"
                parks.append({
                    "slug": slug,
                    "name": slug_to_name(slug),
                    "parkPageUrl": full_url
                })
    
    return parks


if __name__ == "__main__":
    main()
