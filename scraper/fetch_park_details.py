#!/usr/bin/env python3
"""
Step 2: Fetch park detail pages and extract structured data.

For each park in the manifest, scrapes the overview page to extract:
- Park name (from page title)
- Park classification  
- Description / summary
- Activities (from section headers on the activities page)
- Facilities (from section headers on the facilities page)
- Campsite types (from camping page links and reservation links)
- Photo URLs
- Reservation URL

Also extracts coordinates from the park-locator page.

Produces: output/parks_details.json
"""

import json
import os
import re
import sys
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
MANIFEST_FILE = os.path.join(OUTPUT_DIR, "parks_manifest.json")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "parks_details.json")
LOCATOR_COORDS_FILE = os.path.join(OUTPUT_DIR, "parks_locator_coords.json")

HEADERS = {
    "User-Agent": "OntarioParksDataCollector/1.0 (research project)"
}

REQUEST_DELAY = 2.0  # seconds between requests
MAX_RETRIES = 3


# ──────────────────────────────────────────────
# Coordinate extraction from park-locator page
# ──────────────────────────────────────────────

def fetch_locator_coordinates() -> dict:
    """Extract park name -> {lat, lng} from the park-locator page."""
    if os.path.exists(LOCATOR_COORDS_FILE):
        print(f"[INFO] Loading cached locator coordinates from {LOCATOR_COORDS_FILE}")
        with open(LOCATOR_COORDS_FILE, "r") as f:
            return json.load(f)

    print("[INFO] Fetching park-locator page for coordinates...")
    resp = requests.get("https://www.ontarioparks.ca/park-locator", headers=HEADERS, timeout=30)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "lxml")
    coords = {}

    # The park-locator page has list items with park names and embedded lat/lng text
    # Structure: <li> containing park name, "Latitude: XX.XXX", "Longitude: -XX.XXX"
    text = soup.get_text()

    # Parse the lat/lng pairs associated with park names
    # Pattern: park name followed by location info then Latitude/Longitude
    park_links = soup.find_all("a", href=re.compile(r"/park/[a-z]"))
    seen_slugs = set()

    for link in park_links:
        href = link.get("href", "")
        match = re.match(r"(?:https://www\.ontarioparks\.ca)?/park/([a-z0-9\-]+)$", href, re.IGNORECASE)
        if not match:
            continue
        slug = match.group(1).lower()
        if slug in seen_slugs:
            continue
        seen_slugs.add(slug)

    # Better approach: parse the structured list items with lat/lng
    # Find all list items in the locator section
    for li in soup.find_all("li"):
        li_text = li.get_text(separator="\n", strip=True)
        lat_match = re.search(r"Latitude:\s*([\d\.\-]+)", li_text)
        lng_match = re.search(r"Longitude:\s*([\d\.\-]+)", li_text)
        if lat_match and lng_match:
            # Find the park link in this list item
            park_link = li.find("a", href=re.compile(r"/park/[a-z]"))
            if park_link:
                href = park_link.get("href", "")
                slug_match = re.match(r"(?:https://www\.ontarioparks\.ca)?/park/([a-z0-9\-]+)", href, re.IGNORECASE)
                if slug_match:
                    slug = slug_match.group(1).lower()
                    try:
                        lat = float(lat_match.group(1))
                        lng = float(lng_match.group(1))
                        coords[slug] = {"lat": lat, "lng": lng}
                    except ValueError:
                        pass

    # Cache the coordinates
    with open(LOCATOR_COORDS_FILE, "w") as f:
        json.dump(coords, f, indent=2)

    print(f"[OK] Extracted coordinates for {len(coords)} parks from park-locator")
    return coords


# ──────────────────────────────────────────────
# Activity/Facility normalization
# ──────────────────────────────────────────────

ACTIVITY_KEYWORDS = {
    "biking": "biking",
    "cycling": "biking",
    "mountain biking": "mountain-biking",
    "birding": "birding",
    "bird watching": "birding",
    "birdwatching": "birding",
    "boating": "boating",
    "motorboat": "boating",
    "canoeing": "canoeing",
    "canoe": "canoeing",
    "kayaking": "kayaking",
    "kayak": "kayaking",
    "paddling": "paddling",
    "paddle": "paddling",
    "stand up paddleboard": "paddleboarding",
    "cross-country skiing": "cross-country-skiing",
    "cross country skiing": "cross-country-skiing",
    "skiing": "cross-country-skiing",
    "snowshoeing": "snowshoeing",
    "snowshoe": "snowshoeing",
    "dog sledding": "dog-sledding",
    "fishing": "fishing",
    "angling": "fishing",
    "geocaching": "geocaching",
    "hiking": "hiking",
    "hike": "hiking",
    "trail": "hiking",
    "backpacking": "backpacking",
    "horseback riding": "horseback-riding",
    "equestrian": "horseback-riding",
    "hunting": "hunting",
    "ice fishing": "ice-fishing",
    "nature viewing": "nature-viewing",
    "nature study": "nature-viewing",
    "wildlife viewing": "wildlife-viewing",
    "wildlife": "wildlife-viewing",
    "photography": "photography",
    "picnicking": "picnicking",
    "picnic": "picnicking",
    "rock climbing": "rock-climbing",
    "climbing": "rock-climbing",
    "scuba diving": "scuba-diving",
    "diving": "scuba-diving",
    "skating": "skating",
    "ice skating": "skating",
    "snowmobiling": "snowmobiling",
    "snowmobile": "snowmobiling",
    "stargazing": "stargazing",
    "dark sky": "stargazing",
    "swimming": "swimming",
    "swim": "swimming",
    "beach": "swimming",
    "waterskiing": "waterskiing",
    "water skiing": "waterskiing",
    "windsurfing": "windsurfing",
    "discovery": "discovery-programs",
    "interpretive": "discovery-programs",
}

FACILITY_KEYWORDS = {
    "barrier free": "barrier-free",
    "accessible": "barrier-free",
    "boat launch": "boat-launch",
    "boat ramp": "boat-launch",
    "comfort station": "comfort-station",
    "flush toilet": "comfort-station",
    "day use": "day-use-area",
    "dump station": "dump-station",
    "sanitary station": "dump-station",
    "laundromat": "laundromat",
    "laundry": "laundromat",
    "parking": "parking",
    "playground": "playground",
    "store": "park-store",
    "park store": "park-store",
    "shower": "showers",
    "toilet": "vault-toilets",
    "vault toilet": "vault-toilets",
    "visitor centre": "visitor-centre",
    "visitor center": "visitor-centre",
    "beach": "beach",
    "swimming area": "beach",
    "picnic": "picnic-area",
    "picnic shelter": "picnic-shelter",
    "amphitheatre": "amphitheatre",
    "pet exercise": "pet-exercise-area",
    "dog": "pet-exercise-area",
    "recycling": "recycling",
    "firewood": "firewood",
    "water tap": "water-tap",
    "drinking water": "water-tap",
}


def normalize_activities(section_headers: list[str], description: str) -> list[str]:
    """Extract normalized activity slugs from section headers and description."""
    activities = set()
    combined_text = " ".join(section_headers).lower() + " " + description.lower()

    for keyword, activity_slug in ACTIVITY_KEYWORDS.items():
        if keyword in combined_text:
            activities.add(activity_slug)

    return sorted(activities)


def normalize_facilities(section_headers: list[str], description: str) -> list[str]:
    """Extract normalized facility slugs from section headers and description."""
    facilities = set()
    combined_text = " ".join(section_headers).lower() + " " + description.lower()

    for keyword, facility_slug in FACILITY_KEYWORDS.items():
        if keyword in combined_text:
            facilities.add(facility_slug)

    return sorted(facilities)


# ──────────────────────────────────────────────
# Campsite type detection
# ──────────────────────────────────────────────

CAMPSITE_TYPE_KEYWORDS = {
    "car camping": "car-camping",
    "car-camping": "car-camping",
    "electrical": "electrical",
    "electric": "electrical",
    "backcountry": "backcountry",
    "back country": "backcountry",
    "group camp": "group",
    "group site": "group",
    "yurt": "yurt",
    "cabin": "cabin",
    "rustic cabin": "cabin",
    "roofed accommodation": "roofed-accommodation",
    "roofed": "roofed-accommodation",
    "walk-in": "walk-in",
    "radio-free": "radio-free",
    "radio free": "radio-free",
    "tent": "tent",
    "trailer": "trailer",
    "rv": "rv",
}


def detect_campsite_types(text: str, reservation_links: list[str]) -> list[str]:
    """Detect campsite types from text and reservation link labels."""
    types = set()
    combined = text.lower() + " " + " ".join(reservation_links).lower()

    for keyword, ctype in CAMPSITE_TYPE_KEYWORDS.items():
        if keyword in combined:
            types.add(ctype)

    return sorted(types)


# ──────────────────────────────────────────────
# Scenery and tag inference
# ──────────────────────────────────────────────

def infer_scenery(description: str, name: str) -> list[str]:
    """Infer scenery tags from description and park name."""
    scenery = set()
    text = (description + " " + name).lower()

    scenery_map = {
        "lake": "lake-views",
        "river": "river",
        "waterfall": "waterfall",
        "falls": "waterfall",
        "forest": "forest",
        "woods": "forest",
        "hardwood": "forest",
        "canyon": "canyon",
        "cliff": "cliffs",
        "bluff": "cliffs",
        "beach": "beach",
        "sand dune": "sand-dunes",
        "dune": "sand-dunes",
        "wetland": "wetland",
        "marsh": "wetland",
        "bog": "wetland",
        "island": "island",
        "mountain": "mountain",
        "ridge": "mountain",
        "rock": "rock-formations",
        "petroglyph": "rock-formations",
        "wildlife": "wildlife",
        "moose": "wildlife",
        "bear": "wildlife",
        "wolf": "wildlife",
        "loon": "wildlife",
        "great lake": "great-lakes",
        "lake superior": "great-lakes",
        "lake huron": "great-lakes",
        "lake erie": "great-lakes",
        "lake ontario": "great-lakes",
        "georgian bay": "great-lakes",
        "old growth": "old-growth-forest",
        "boreal": "boreal-forest",
        "prairie": "prairie",
        "savanna": "savanna",
    }

    for keyword, tag in scenery_map.items():
        if keyword in text:
            scenery.add(tag)

    return sorted(scenery)


def infer_tags(park_data: dict) -> list[str]:
    """Infer user-facing tags from park attributes."""
    tags = set()
    desc = park_data.get("summary", "").lower()
    activities = park_data.get("activities", [])
    facilities = park_data.get("facilities", [])
    campsite_types = park_data.get("campsiteTypes", [])
    classification = park_data.get("classification", "").lower()

    # Family-friendly indicators
    if any(f in facilities for f in ["playground", "beach", "comfort-station"]):
        tags.add("family-friendly")
    if "discovery-programs" in activities:
        tags.add("family-friendly")

    # Beginner-friendly
    if "car-camping" in campsite_types and "hiking" in activities:
        tags.add("beginner-friendly")

    # Backcountry / wilderness
    if "backcountry" in campsite_types:
        tags.add("backcountry")
    if "wilderness" in classification or "waterway" in classification:
        tags.add("wilderness")

    # Waterfront
    if any(a in activities for a in ["swimming", "canoeing", "kayaking", "paddling"]):
        tags.add("waterfront")

    # Winter activities
    if any(a in activities for a in ["cross-country-skiing", "snowshoeing", "skating", "ice-fishing"]):
        tags.add("winter-activities")

    # Day trip
    if "day-use-area" in facilities and not campsite_types:
        tags.add("day-trip-only")

    # Large park
    if "large" in desc or "vast" in desc or "7635" in desc:
        tags.add("large-park")

    # Dog-friendly
    if "pet-exercise-area" in facilities:
        tags.add("dog-friendly")

    return sorted(tags)


# ──────────────────────────────────────────────
# HTTP helpers
# ──────────────────────────────────────────────

def fetch_with_retry(url: str, retries: int = MAX_RETRIES) -> requests.Response | None:
    """Fetch URL with exponential backoff retry."""
    for attempt in range(retries):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            return resp
        except requests.RequestException as e:
            wait = 2 ** (attempt + 1)
            print(f"  [WARN] Attempt {attempt+1} failed for {url}: {e}. Retrying in {wait}s...")
            time.sleep(wait)
    print(f"  [ERROR] Failed to fetch {url} after {retries} attempts")
    return None


# ──────────────────────────────────────────────
# Page parsing
# ──────────────────────────────────────────────

def parse_overview_page(html: str, slug: str) -> dict:
    """Parse the park overview page to extract structured data."""
    soup = BeautifulSoup(html, "lxml")
    data = {}

    # Extract title
    title_tag = soup.find("title")
    if title_tag:
        title = title_tag.get_text(strip=True)
        # Remove trailing " | Ontario Parks" or similar
        title = re.sub(r"\s*[\|–-]\s*Ontario Parks.*$", "", title, flags=re.IGNORECASE)
        data["name"] = title.strip()

    # Extract OG description
    og_desc = soup.find("meta", property="og:description")
    if og_desc:
        data["ogDescription"] = og_desc.get("content", "")

    # Extract OG image
    og_image = soup.find("meta", property="og:image")
    if og_image:
        img_url = og_image.get("content", "")
        if img_url:
            data["photoUrls"] = [img_url]

    # Find the main content area (after the nav)
    main_content = soup.find("main") or soup.find(id="maincontent") or soup

    # Extract "General Information" section
    general_text = ""
    for heading in main_content.find_all(["h2", "h3"]):
        heading_text = heading.get_text(strip=True)
        if "general information" in heading_text.lower():
            # Get all siblings until next heading
            sibling = heading.find_next_sibling()
            while sibling and sibling.name not in ["h2", "h3"]:
                general_text += sibling.get_text(separator=" ", strip=True) + " "
                sibling = sibling.find_next_sibling()
            break

    # Extract classification
    class_match = re.search(r"Park Classification:\s*(.+?)(?:\n|$)", general_text)
    if class_match:
        data["classification"] = class_match.group(1).strip()

    # Extract phone
    phone_match = re.search(r"Phone:\s*([\d\-\(\)\s]+)", general_text)
    if phone_match:
        data["phone"] = phone_match.group(1).strip()

    # Extract size
    size_match = re.search(r"Size:\s*([\d,\.]+)\s*ha", general_text)
    if size_match:
        data["sizeHa"] = size_match.group(1).strip()

    # Extract "What You'll Like" section for summary
    summary = ""
    for heading in main_content.find_all(["h2", "h3"]):
        heading_text = heading.get_text(strip=True)
        if "what you" in heading_text.lower() or "like" in heading_text.lower():
            sibling = heading.find_next_sibling()
            while sibling and sibling.name not in ["h2", "h3"]:
                summary += sibling.get_text(separator=" ", strip=True) + " "
                sibling = sibling.find_next_sibling()
            break

    if not summary:
        # Fallback: use OG description
        summary = data.get("ogDescription", "")

    data["summary"] = summary.strip()[:500]  # Cap at 500 chars

    # Extract Activities section headers from the overview page
    activity_headers = []
    in_activities = False
    for heading in main_content.find_all(["h2", "h3"]):
        heading_text = heading.get_text(strip=True)
        if heading_text.lower() == "activities":
            in_activities = True
            continue
        if in_activities:
            if heading.name == "h2" and heading_text.lower() not in ["activities"]:
                # We've left the activities section
                break
            activity_headers.append(heading_text)

    # Also look for the legend/icon area which has activity text
    legend_section = main_content.find(string=re.compile(r"Legend|These icons represent", re.IGNORECASE))
    legend_text = ""
    if legend_section:
        parent = legend_section.find_parent()
        if parent:
            legend_text = parent.get_text(separator=" ", strip=True)

    # Reservation links (for detecting campsite types)
    reservation_links = []
    for link in soup.find_all("a", href=re.compile(r"reservations\.ontarioparks")):
        link_text = link.get_text(strip=True)
        if link_text:
            reservation_links.append(link_text)

    data["_activityHeaders"] = activity_headers
    data["_reservationLinks"] = reservation_links
    data["_legendText"] = legend_text
    data["_fullText"] = main_content.get_text(separator=" ", strip=True)[:3000]

    return data


def parse_subpage_headers(html: str) -> list[str]:
    """Extract H2 section headers from an activities or facilities subpage."""
    soup = BeautifulSoup(html, "lxml")
    main = soup.find("main") or soup.find(id="maincontent") or soup
    headers = []

    for h2 in main.find_all("h2"):
        text = h2.get_text(strip=True)
        # Skip nav/boilerplate headers
        if text.lower() in ["ontario parks", "legend", "search by activities, facilities and rentals",
                             "locate individual parks on the map"]:
            continue
        if len(text) > 3 and not text.startswith("http"):
            headers.append(text)

    return headers


# ──────────────────────────────────────────────
# Region inference from coordinates
# ──────────────────────────────────────────────

def infer_region(lat: float, lng: float) -> str:
    """Infer Ontario region from lat/lng coordinates."""
    if lat >= 50.0:
        return "Far North Ontario"
    elif lat >= 48.0:
        if lng <= -85.0:
            return "Northwest Ontario"
        else:
            return "Northeast Ontario"
    elif lat >= 46.0:
        if lng <= -82.0:
            return "Northwest Ontario"
        else:
            return "Northeast Ontario"
    elif lat >= 44.5:
        if lng <= -80.5:
            return "Central Ontario"
        elif lng >= -76.5:
            return "Eastern Ontario"
        else:
            return "Central Ontario"
    elif lat >= 43.5:
        if lng <= -80.0:
            return "Southwestern Ontario"
        elif lng >= -77.0:
            return "Eastern Ontario"
        else:
            return "Central Ontario"
    else:
        if lng <= -80.0:
            return "Southwestern Ontario"
        else:
            return "Southern Ontario"


# ──────────────────────────────────────────────
# Main scraping loop
# ──────────────────────────────────────────────

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Load manifest
    if not os.path.exists(MANIFEST_FILE):
        print(f"[ERROR] Manifest not found at {MANIFEST_FILE}. Run fetch_park_list.py first.")
        sys.exit(1)

    with open(MANIFEST_FILE, "r") as f:
        manifest = json.load(f)

    print(f"[INFO] Loaded {len(manifest)} parks from manifest")

    # Get coordinates from park-locator
    locator_coords = fetch_locator_coordinates()

    # Load existing progress if any (for resumability)
    parks_details = {}
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r") as f:
            existing = json.load(f)
            parks_details = {p["slug"]: p for p in existing}
            print(f"[INFO] Resuming: {len(parks_details)} parks already scraped")

    total = len(manifest)
    for i, park in enumerate(manifest):
        slug = park["slug"]

        # Skip if already scraped
        if slug in parks_details:
            continue

        print(f"[{i+1}/{total}] Scraping {slug}...")

        # Fetch overview page
        overview_url = park["parkPageUrl"]
        resp = fetch_with_retry(overview_url)
        if not resp:
            print(f"  [SKIP] Could not fetch overview page for {slug}")
            continue

        overview_data = parse_overview_page(resp.text, slug)
        time.sleep(REQUEST_DELAY)

        # Fetch activities subpage
        activities_url = f"{overview_url}/activities"
        activities_headers = []
        resp_act = fetch_with_retry(activities_url)
        if resp_act:
            activities_headers = parse_subpage_headers(resp_act.text)
        time.sleep(REQUEST_DELAY)

        # Fetch facilities subpage
        facilities_url = f"{overview_url}/facilities"
        facilities_headers = []
        resp_fac = fetch_with_retry(facilities_url)
        if resp_fac:
            facilities_headers = parse_subpage_headers(resp_fac.text)
        time.sleep(REQUEST_DELAY)

        # Build the combined text for analysis
        full_text = overview_data.get("_fullText", "")
        legend_text = overview_data.get("_legendText", "")
        combined_for_activities = " ".join(activities_headers) + " " + legend_text + " " + full_text
        combined_for_facilities = " ".join(facilities_headers) + " " + full_text

        # Get coordinates
        coords = locator_coords.get(slug, None)

        # Build park record
        park_record = {
            "slug": slug,
            "name": overview_data.get("name", park["name"]),
            "classification": overview_data.get("classification", ""),
            "coordinates": coords,
            "region": infer_region(coords["lat"], coords["lng"]) if coords else "",
            "summary": overview_data.get("summary", ""),
            "activities": normalize_activities(activities_headers, combined_for_activities),
            "facilities": normalize_facilities(facilities_headers, combined_for_facilities),
            "campsiteTypes": detect_campsite_types(full_text, overview_data.get("_reservationLinks", [])),
            "scenery": infer_scenery(overview_data.get("summary", "") + " " + full_text, park["name"]),
            "operatingDates": {},
            "photoUrls": overview_data.get("photoUrls", []),
            "reservationUrl": f"https://reservations.ontarioparks.ca",
            "parkPageUrl": park["parkPageUrl"],
            "phone": overview_data.get("phone", ""),
            "sizeHa": overview_data.get("sizeHa", ""),
        }

        # Infer tags
        park_record["tags"] = infer_tags(park_record)

        parks_details[slug] = park_record

        # Save progress every 10 parks
        if (i + 1) % 10 == 0:
            _save_progress(parks_details)
            print(f"  [SAVE] Progress saved ({len(parks_details)} parks)")

    # Final save
    _save_progress(parks_details)
    print(f"[OK] Scraped details for {len(parks_details)} parks. Written to {OUTPUT_FILE}")


def _save_progress(parks_details: dict):
    """Save current progress to disk."""
    output = sorted(parks_details.values(), key=lambda p: p["slug"])
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
