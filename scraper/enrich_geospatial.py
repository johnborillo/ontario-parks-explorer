#!/usr/bin/env python3
"""
Step 3: Fetch geospatial data from Ontario GeoHub ArcGIS REST API.

Enriches park data with:
- Official park name
- Park classification  
- Centroid coordinates (computed from polygon geometry)
- Regulated area
- Year established
- Admin zone / cluster name

Produces: output/parks_geo.json
"""

import json
import os
import re
import sys
import time

import requests

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "parks_geo.json")

ARCGIS_BASE = "https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open03/MapServer/4/query"

HEADERS = {
    "User-Agent": "OntarioParksDataCollector/1.0 (research project)"
}

# Fields we need from the API (skip geometry to reduce payload for the attribute query)
NEEDED_FIELDS = [
    "PROTECTED_AREA_NAME_ENG",
    "COMMON_SHORT_NAME",
    "TYPE_ENG",
    "PROVINCIAL_PARK_CLASS_ENG",
    "OPERATING_STATUS_IND",
    "PROTDATE",
    "REGULATED_AREA",
    "LOCATION_ENG",
    "CLUSTER_NAME",
    "PROV_PARK_ADMIN_ZONE_ID",
    "URL",
    "OBJECTID",
]


def fetch_all_parks() -> list[dict]:
    """Fetch all parks from the ArcGIS API with pagination."""
    all_features = []
    offset = 0
    batch_size = 200  # ArcGIS typically limits to 1000 per request

    print("[INFO] Fetching park data from Ontario GeoHub ArcGIS API...")

    while True:
        params = {
            "where": "1=1",
            "outFields": ",".join(NEEDED_FIELDS),
            "f": "json",
            "resultRecordCount": batch_size,
            "resultOffset": offset,
            "returnGeometry": "false",
        }

        try:
            resp = requests.get(ARCGIS_BASE, params=params, headers=HEADERS, timeout=60)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            print(f"[ERROR] Failed to fetch from ArcGIS API: {e}")
            break

        features = data.get("features", [])
        if not features:
            break

        all_features.extend(features)
        print(f"  Fetched {len(all_features)} records so far...")

        # Check if there are more records
        if len(features) < batch_size:
            break

        offset += batch_size
        time.sleep(1)  # Be polite

    print(f"[OK] Fetched {len(all_features)} total records from ArcGIS API")
    return all_features


def fetch_centroids() -> dict:
    """Fetch centroid coordinates for parks using returnCentroid parameter.
    Falls back to envelope-based centroid if not supported."""
    centroids = {}
    offset = 0
    batch_size = 200

    print("[INFO] Fetching centroid coordinates from ArcGIS API...")

    while True:
        params = {
            "where": "1=1",
            "outFields": "OBJECTID,COMMON_SHORT_NAME,PROTECTED_AREA_NAME_ENG",
            "f": "json",
            "resultRecordCount": batch_size,
            "resultOffset": offset,
            "returnGeometry": "true",
            "returnCentroid": "true",
            "outSR": "4326",
            "geometryPrecision": 6,
        }

        try:
            resp = requests.get(ARCGIS_BASE, params=params, headers=HEADERS, timeout=60)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            print(f"[WARN] Centroid fetch failed: {e}")
            break

        features = data.get("features", [])
        if not features:
            break

        for feat in features:
            attrs = feat.get("attributes", {})
            short_name = (attrs.get("COMMON_SHORT_NAME") or "").strip()
            full_name = attrs.get("PROTECTED_AREA_NAME_ENG", "")

            # Try centroid first, then compute from geometry rings
            centroid = feat.get("centroid")
            if centroid:
                lat = centroid.get("y")
                lng = centroid.get("x")
            else:
                # Compute centroid from geometry (average of ring points)
                geometry = feat.get("geometry", {})
                rings = geometry.get("rings", [])
                if rings:
                    all_points = [pt for ring in rings for pt in ring]
                    if all_points:
                        lng = sum(p[0] for p in all_points) / len(all_points)
                        lat = sum(p[1] for p in all_points) / len(all_points)
                    else:
                        continue
                else:
                    continue

            if short_name:
                centroids[short_name.upper()] = {"lat": round(lat, 6), "lng": round(lng, 6)}
            if full_name:
                centroids[full_name.upper()] = {"lat": round(lat, 6), "lng": round(lng, 6)}

        if len(features) < batch_size:
            break

        offset += batch_size
        time.sleep(1)

    print(f"[OK] Computed centroids for {len(centroids)} park names")
    return centroids


def normalize_name(name: str) -> str:
    """Create a slug-friendly key from a park name."""
    name = name.lower().strip()
    # Remove "provincial park" and classification suffixes
    name = re.sub(r"\s*\(.*?\)\s*$", "", name)
    name = re.sub(r"\s*provincial\s*park\s*$", "", name)
    name = re.sub(r"\s*conservation\s*reserve\s*$", "", name)
    name = name.strip()
    # Convert to slug
    slug = re.sub(r"[^a-z0-9]+", "", name)
    return slug


def build_geo_index(features: list[dict], centroids: dict) -> dict:
    """Build a slug -> geo data index."""
    geo_index = {}

    for feat in features:
        attrs = feat.get("attributes", {})
        full_name = attrs.get("PROTECTED_AREA_NAME_ENG", "")
        short_name = (attrs.get("COMMON_SHORT_NAME") or "").strip()
        park_type = attrs.get("TYPE_ENG", "")
        classification = attrs.get("PROVINCIAL_PARK_CLASS_ENG", "")
        operating = attrs.get("OPERATING_STATUS_IND", "")
        year_est = attrs.get("PROTDATE")
        area = attrs.get("REGULATED_AREA")
        cluster = attrs.get("CLUSTER_NAME", "")
        location = attrs.get("LOCATION_ENG", "")

        # Create slug from short name or full name
        slug = normalize_name(short_name or full_name)
        if not slug:
            continue

        # Get centroid
        coords = None
        for lookup_name in [short_name.upper(), full_name.upper()]:
            if lookup_name in centroids:
                coords = centroids[lookup_name]
                break

        geo_data = {
            "slug": slug,
            "officialName": full_name,
            "shortName": short_name,
            "type": park_type,
            "classification": classification,
            "operating": operating == "Yes",
            "yearEstablished": year_est,
            "regulatedAreaHa": area,
            "cluster": cluster,
            "location": location,
            "coordinates": coords,
        }

        # If multiple entries for same slug, prefer operating parks
        if slug not in geo_index or (operating == "Yes" and not geo_index[slug].get("operating")):
            geo_index[slug] = geo_data

    return geo_index


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Fetch all feature attributes
    features = fetch_all_parks()

    # Fetch centroids
    centroids = fetch_centroids()

    # Build index
    geo_index = build_geo_index(features, centroids)

    # Write output
    output = sorted(geo_index.values(), key=lambda p: p["slug"])
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"[OK] Wrote geo data for {len(output)} parks to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
