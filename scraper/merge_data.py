#!/usr/bin/env python3
"""
Step 4: Merge all data sources into the final parks_database.json.

Combines:
- parks_details.json (scraped park data with activities, facilities, etc.)
- parks_geo.json (geospatial data from Ontario GeoHub)
- parks_manifest.json (park URLs as fallback)

Produces: output/parks_database.json
"""

import json
import os
import re
import sys

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
DETAILS_FILE = os.path.join(OUTPUT_DIR, "parks_details.json")
GEO_FILE = os.path.join(OUTPUT_DIR, "parks_geo.json")
MANIFEST_FILE = os.path.join(OUTPUT_DIR, "parks_manifest.json")
DATABASE_FILE = os.path.join(OUTPUT_DIR, "parks_database.json")
LEGEND_DATA_FILE = os.path.join(OUTPUT_DIR, "legend_data.json")
LEGEND_ICON_INDEX_FILE = os.path.join(OUTPUT_DIR, "legend_icon_index.json")
PHOTO_DATA_FILE = os.path.join(OUTPUT_DIR, "photo_data.json")
RESERVABLE_PARKS_FILE = os.path.join(OUTPUT_DIR, "reservable_parks.json")
BOOKING_CATEGORIES_FILE = os.path.join(OUTPUT_DIR, "booking_categories.json")


def load_json(filepath: str) -> list | dict:
    """Load a JSON file, returning empty list if not found."""
    if not os.path.exists(filepath):
        print(f"[WARN] File not found: {filepath}")
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def build_geo_lookup(geo_data: list) -> dict:
    """Build a slug -> geo record lookup."""
    lookup = {}
    for record in geo_data:
        slug = record.get("slug", "")
        if slug:
            lookup[slug] = record
    return lookup


# Mirror of src/utils/legendCategories.js — kept in sync so the merge step
# can categorize legend labels into activities / facilities / campsiteTypes
# without needing the Node toolchain.
LEGEND_CATEGORY_MAP = {
    # Activities
    "Hiking": "activities", "Biking": "activities", "Swimming": "activities",
    "Beach": "activities", "Canoeing": "activities", "Canoe Access": "activities",
    "Canoe Launch": "activities", "Boat Launch": "activities",
    "Boat Rental": "activities", "Portage": "activities",
    "Rentals (Boat/Canoe/Bike)": "activities", "Canoe Rack": "activities",
    "Fishing": "activities", "Fish Cleaning Station": "activities",
    "Playground": "activities", "Play Field": "activities",
    "Ball Diamond / Play Field": "activities", "Basketball": "activities",
    "Volleyball": "activities", "Volleyball / Basketball Court": "activities",
    "Tennis": "activities", "Horseshoes": "activities",
    "Amphitheatre": "activities", "Theatre": "activities",
    "Museum": "activities", "Lighthouse": "activities", "Lookout": "activities",
    "Interpretation Centre": "activities", "Information": "activities",
    "Picnic Area": "activities", "Day Use Area": "activities",
    "Self-Serve Feestation": "activities",
    # Facilities
    "Accessible": "facilities", "Accessible Parking": "facilities",
    "Parking": "facilities", "Bus Parking": "facilities",
    "Park Office": "facilities", "Visitor Centre": "facilities",
    "Gatehouse": "facilities", "Comfort Station": "facilities",
    "Comfort Station & Showers": "facilities", "Comfort House": "facilities",
    "Showers": "facilities", "Vault Toilet": "facilities",
    "Restroom": "facilities", "Change House": "facilities",
    "Pay Phone": "facilities", "Emergency Phone": "facilities",
    "Water Tap": "facilities", "Water": "facilities", "Store": "facilities",
    "Groceries / Shopping": "facilities", "Food Locker": "facilities",
    "Laundry Building": "facilities", "Laundry Facilities": "facilities",
    "Dishwashing Station": "facilities", "First Aid": "facilities",
    "Firewood": "facilities", "Recycling": "facilities", "Garbage": "facilities",
    "Building": "facilities", "Picnic Shelter": "facilities",
    "Radio-Free": "facilities", "Generator Free": "facilities",
    "Pet Area": "facilities", "Pet-Free Area": "facilities",
    "Dog Beach": "facilities", "Dog Run": "facilities",
    "Dogs on Leash": "facilities", "Cemetery": "facilities",
    "Church": "facilities", "Marsh": "facilities",
    "Campfire Circle": "facilities",
    # Campsite types
    "Camping": "campsiteTypes", "Group Camping": "campsiteTypes",
    "Backcountry Camping": "campsiteTypes", "Walk-in Camping": "campsiteTypes",
    "Electrical Camping": "campsiteTypes", "Non-Electrical Camping": "campsiteTypes",
    "Roofed Accommodation": "campsiteTypes", "Cabin": "campsiteTypes",
}


def _categorize_legend(legend_amenities: list) -> dict:
    """Categorize a park's legend amenities into activities/facilities/campsiteTypes."""
    result = {"activities": [], "facilities": [], "campsiteTypes": []}
    for item in legend_amenities:
        label = item.get("label", "")
        category = LEGEND_CATEGORY_MAP.get(label, "facilities")
        result[category].append(label)
    for k in result:
        result[k] = sorted(set(result[k]))
    return result


def _humanize_label(raw: str) -> str:
    """Convert reservation legend labels to a human-readable form.

    Many reservation labels are CamelCase or concatenated lowercase words with
    trailing digits. We use an explicit mapping table for the 88 known labels,
    falling back to a best-effort humanizer for anything new.
    """
    if not raw:
        return ""

    # Explicit mapping for all known labels (curated for clarity).
    overrides = {
        "Accessible": "Accessible",
        "Accessibleparking": "Accessible Parking",
        "Amphitheater": "Amphitheatre",
        "Backcountrycamping": "Backcountry Camping",
        "balldiamondplayfield": "Ball Diamond / Play Field",
        "Basketball": "Basketball",
        "Beach": "Beach",
        "Biking": "Biking",
        "BoatLaunch": "Boat Launch",
        "BoatLaunch3": "Boat Launch",
        "Boatrental": "Boat Rental",
        "BuildingGeneral": "Building",
        "Busparking": "Bus Parking",
        "Cabin": "Cabin",
        "campfireCircle1": "Campfire Circle",
        "CanoeAccess": "Canoe Access",
        "Canoelaunch": "Canoe Launch",
        "Cemetery": "Cemetery",
        "Changehouse": "Change House",
        "Church": "Church",
        "Comforthouse": "Comfort House",
        "ComfortStation": "Comfort Station",
        "ComfortStationShowers": "Comfort Station & Showers",
        "DayUseArea": "Day Use Area",
        "Dayusearea2": "Day Use Area",
        "DishwashStation": "Dishwashing Station",
        "DogBeach": "Dog Beach",
        "Dogrun": "Dog Run",
        "Dogsonleash": "Dogs on Leash",
        "Firewood2": "Firewood",
        "Firstaid": "First Aid",
        "FishCleaning": "Fish Cleaning Station",
        "Foodlocker": "Food Locker",
        "Garbage2": "Garbage",
        "Gatehouse": "Gatehouse",
        "GeneratorFree": "Generator Free",
        "Groceriesshopping": "Groceries / Shopping",
        "GroupCamping": "Group Camping",
        "Grouppicnicarea": "Group Picnic Area",
        "Hiking": "Hiking",
        "Horseshoes": "Horseshoes",
        "Information": "Information",
        "Interpretationcentre": "Interpretation Centre",
        "LaundryBuilding": "Laundry Building",
        "LaundryFacilities": "Laundry Facilities",
        "Lighthouse": "Lighthouse",
        "Lookoutright": "Lookout",
        "Marsh": "Marsh",
        "Museum": "Museum",
        "OPCanoeing": "Canoeing",
        "OPCanoeRack": "Canoe Rack",
        "OPElectricalCamping": "Electrical Camping",
        "OPEmergencyPhone": "Emergency Phone",
        "OPFishingCleaningStation": "Fish Cleaning Station",
        "OPNonElectricalCamping": "Non-Electrical Camping",
        "OPPetFree": "Pet-Free Area",
        "OPRoofedAccomodation": "Roofed Accommodation",
        "Parking": "Parking",
        "Parkoffice": "Park Office",
        "PayPhone": "Pay Phone",
        "PetsOrPetsArea": "Pet Area",
        "Picnicarea2": "Picnic Area",
        "PicnicShelter2": "Picnic Shelter",
        "Playfield": "Play Field",
        "Playground4": "Playground",
        "Playground5": "Playground",
        "Portage": "Portage",
        "RadioFree": "Radio-Free",
        "Recycling": "Recycling",
        "RentalsBoatCanoeBike": "Rentals (Boat/Canoe/Bike)",
        "Restroom": "Restroom",
        "Selfservefeestation": "Self-Serve Feestation",
        "SKVolleyballBasketballCourt": "Volleyball / Basketball Court",
        "Store": "Store",
        "Swimming": "Swimming",
        "Tennis2": "Tennis",
        "Theatre": "Theatre",
        "Trailerdumping2": "Trailer Dumping Station",
        "Trailerfilling": "Trailer Filling Station",
        "VaultToilet": "Vault Toilet",
        "VisitorCentre1": "Visitor Centre",
        "VisitorCentre2": "Visitor Centre",
        "Volleyball": "Volleyball",
        "Volleyball1": "Volleyball",
        "WalkInCamping": "Walk-in Camping",
        "Water2": "Water",
        "WaterTap2": "Water Tap",
        "watertap3": "Water Tap",
    }

    if raw in overrides:
        return overrides[raw]

    # Fallback for any new label: strip trailing digits, split CamelCase.
    text = re.sub(r'\d+$', '', raw)
    text = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', text)
    return text.strip()


def merge_park(detail: dict, geo_lookup: dict, legend_data: dict, legend_icon_index: dict, photo_data: dict, reservable_slugs: set, booking_categories: dict) -> dict:
    """Merge a park detail record with geo data, legend amenities, and photos."""
    slug = detail["slug"]
    geo = geo_lookup.get(slug, {})

    # Pull per-park booking categories (camping, day-use, backcountry, etc.)
    # from the authoritative reservation API data.
    cats = booking_categories.get(slug) or {}

    # Use detail data as base, enrich with geo data
    merged = {
        "slug": slug,
        "name": detail.get("name", ""),
        "classification": detail.get("classification") or geo.get("classification", ""),
        "coordinates": detail.get("coordinates") or geo.get("coordinates"),
        "region": detail.get("region", ""),
        "summary": detail.get("summary", ""),
        "scenery": detail.get("scenery", []),
        "operatingDates": detail.get("operatingDates", {}),
        "photoUrls": detail.get("photoUrls", []),
        "reservationUrl": detail.get("reservationUrl", "https://reservations.ontarioparks.ca"),
        "parkPageUrl": detail.get("parkPageUrl", f"https://www.ontarioparks.ca/park/{slug}"),
        "tags": detail.get("tags", []),
        # Per-category reservable flags. `reservable` is the umbrella flag
        # and is true if the park supports ANY booking category.
        "reservable": slug in reservable_slugs,
        "reservableCamping": bool(cats.get("camping")),
        "reservableDayUse": bool(cats.get("dayUse")),
        "reservableBackcountry": bool(cats.get("backcountry")),
        "reservableRoofed": bool(cats.get("roofedAccommodation")),
        "reservableGroupCamping": bool(cats.get("groupCampsite")),
        "reservableBackcountryReg": bool(cats.get("backcountryRegistration")),
    }

    # Replace the dead /images/ogmetadata URLs with the live header image and
    # gallery photos fetched from ontarioparks.ca.
    photos = photo_data.get(slug) or {}
    if photos:
        merged["heroImage"] = photos.get("header", "")
        merged["heroImageSrcset"] = photos.get("headerSrcset", {})
        gallery = photos.get("gallery", [])
        if gallery:
            merged["galleryImages"] = gallery
        # Keep the legacy photoUrls pointing to the new header too so the
        # existing ParkDetailPanel renders the right image (it's a list).
        merged["photoUrls"] = [photos.get("header", "")]

    # Start with the keyword-scraped amenities as a fallback, then override with
    # legend data (authoritative) where available. Track the source for the UI.
    merged["activities"] = list(detail.get("activities", []))
    merged["facilities"] = list(detail.get("facilities", []))
    merged["campsiteTypes"] = list(detail.get("campsiteTypes", []))
    merged["amenitiesSource"] = "keyword"

    # Enrich from geo if available
    if geo:
        if not merged["classification"] and geo.get("classification"):
            merged["classification"] = geo["classification"]
        if geo.get("yearEstablished"):
            merged["yearEstablished"] = geo["yearEstablished"]
        if geo.get("operating") is not None:
            merged["operating"] = geo["operating"]

    # Enrich with legend amenities (from reservation system — authoritative).
    # When legend data is available, it REPLACES the keyword-scraped activities,
    # facilities, and campsiteTypes so the data source is unambiguous.
    legend_types = legend_data.get(slug) or []
    if legend_types and legend_icon_index:
        legend_amenities = []
        for t in legend_types:
            icon_entry = legend_icon_index.get(str(t))
            if icon_entry:
                legend_amenities.append({
                    "legendItemType": t,
                    "label": _humanize_label(icon_entry.get("label", "")),
                    "icon": icon_entry.get("file", ""),
                })
        if legend_amenities:
            merged["legendAmenities"] = legend_amenities
            categorized = _categorize_legend(legend_amenities)
            merged["activities"] = categorized["activities"]
            merged["facilities"] = categorized["facilities"]
            merged["campsiteTypes"] = categorized["campsiteTypes"]
            merged["amenitiesSource"] = "legend"

    # Clean up: remove empty/null fields
    if merged["coordinates"] is None:
        merged["coordinates"] = {"lat": 0, "lng": 0}

    # Ensure region is set
    if not merged["region"] and merged["coordinates"]["lat"] != 0:
        from fetch_park_details import infer_region
        merged["region"] = infer_region(
            merged["coordinates"]["lat"],
            merged["coordinates"]["lng"]
        )

    return merged


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Load all data sources
    details = load_json(DETAILS_FILE)
    geo_data = load_json(GEO_FILE)
    manifest = load_json(MANIFEST_FILE)
    legend_data = load_json(LEGEND_DATA_FILE)
    legend_icon_index = load_json(LEGEND_ICON_INDEX_FILE)
    photo_data = load_json(PHOTO_DATA_FILE)
    reservable = load_json(RESERVABLE_PARKS_FILE)
    booking_categories = load_json(BOOKING_CATEGORIES_FILE) or {}

    if not details:
        print("[ERROR] No park details found. Run fetch_park_details.py first.")
        sys.exit(1)

    reservable_slugs = set(reservable.get("bySlug", [])) if reservable else set()

    print(f"[INFO] Loaded: {len(details)} details, {len(geo_data)} geo records, {len(manifest)} manifest entries")
    print(f"[INFO] Legend data: {len(legend_data)} parks, {len(legend_icon_index)} unique icons")
    print(f"[INFO] Photo data:  {len(photo_data)} parks")
    print(f"[INFO] Reservable:  {len(reservable_slugs)} parks can be booked online")
    print(f"[INFO] Booking categories: {len(booking_categories)} parks with category detail")

    # Build lookup tables
    geo_lookup = build_geo_lookup(geo_data)

    # Merge all parks
    database = []
    for detail in details:
        merged = merge_park(detail, geo_lookup, legend_data, legend_icon_index, photo_data, reservable_slugs, booking_categories)
        database.append(merged)

    # Sort alphabetically
    database.sort(key=lambda p: p["slug"])

    # Write final database
    with open(DATABASE_FILE, "w", encoding="utf-8") as f:
        json.dump(database, f, indent=2, ensure_ascii=False)

    # Print summary stats
    with_coords = sum(1 for p in database if p["coordinates"]["lat"] != 0)
    with_activities = sum(1 for p in database if p["activities"])
    with_facilities = sum(1 for p in database if p["facilities"])
    with_classification = sum(1 for p in database if p["classification"])
    with_summary = sum(1 for p in database if p["summary"])
    with_legend = sum(1 for p in database if p.get("legendAmenities"))
    with_hero = sum(1 for p in database if p.get("heroImage"))
    with_gallery = sum(1 for p in database if p.get("galleryImages"))
    reservable_count = sum(1 for p in database if p.get("reservable"))
    camping_count = sum(1 for p in database if p.get("reservableCamping"))
    day_use_count = sum(1 for p in database if p.get("reservableDayUse"))
    backcountry_count = sum(1 for p in database if p.get("reservableBackcountry"))
    roofed_count = sum(1 for p in database if p.get("reservableRoofed"))

    print(f"\n{'='*50}")
    print(f"  PARKS DATABASE SUMMARY")
    print(f"{'='*50}")
    print(f"  Total parks:        {len(database)}")
    print(f"  With coordinates:   {with_coords}")
    print(f"  With activities:    {with_activities}")
    print(f"  With facilities:    {with_facilities}")
    print(f"  With classification:{with_classification}")
    print(f"  With summary:       {with_summary}")
    print(f"  With legend amenities:{with_legend}")
    print(f"  With hero image:    {with_hero}")
    print(f"  With gallery images:{with_gallery}")
    print(f"  Reservable (any):   {reservable_count}")
    print(f"    - camping:        {camping_count}")
    print(f"    - day use:        {day_use_count}")
    print(f"    - backcountry:    {backcountry_count}")
    print(f"    - roofed accom:   {roofed_count}")
    print(f"{'='*50}")
    print(f"\n[OK] Final database written to {DATABASE_FILE}")


if __name__ == "__main__":
    main()
