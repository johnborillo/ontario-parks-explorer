# Ontario Parks Explorer 🏕️

An interactive web app for discovering Ontario's 340+ provincial parks. Filter by activities, scenery, distance, and amenities. Save parks to a watch list, compare them side-by-side, and find nearby points of interest.

Built with React + Vite. All park data is scraped from official sources — no account required, no API keys.

## Features

- 🗺️ **Interactive map** of all 340 Ontario parks (Leaflet/OpenStreetMap)
- 🔍 **Smart filtering** by activities, scenery, facilities, distance, and classification
- 🧭 **"Get Started" questionnaire** that pre-fills filters based on your trip style
- 📍 **Manual location** input (search by address, quick-select from 8 cities, or use geolocation)
- 🅿️ **Accurate amenities** pulled from the Ontario Parks reservation system's "Map Icon Legend" (the authoritative source)
- 🖼️ **Park photos** with lightbox gallery
- 🔖 **Save parks** to a personal list (localStorage, no account)
- ⚖️ **Compare parks** side-by-side with a per-amenity checkmark matrix
- 🗺️ **Nearby attractions** from OpenStreetMap (Overpass API) — towns, waterfalls, trails, restaurants within 15/30/50 km
- 🕐 **Drive time estimates** (great-circle distance + average highway speed model)
- 🎨 **Three themes**: Campfire (warm dark), Ranger (forest green dark), Atlas (clean light)
- 📱 **Mobile-friendly** responsive layout

## Data Accuracy

This project went through three iterations of data sourcing, each more accurate:

1. **Keyword scraping** (`fetch_park_details.py`) — extracted activities/facilities from page text. **Over-matched** (e.g. Sibbald Point falsely showed "canoeing" and "fishing" because the word appeared in passing).

2. **Reservation system legend** (`fetch_legend_amenities.py`) — pulls the actual "Map Icon Legend" from `reservations.ontarioparks.ca` for each park. The **authoritative source** for what's bookable at each park. Currently overrides the keyword data for 85 parks.

3. **Per-park booking categories** (`fetch_booking_categories.py`) — distinguishes "car camping" from "backcountry" from "day use" reservations. The Campsite tab on the reservation site only shows parks with car campgrounds (bookingCategoryId 0/32) — some parks like Woodland Caribou and French River are only reservable for backcountry.

## Tech Stack

- **Frontend**: React 19, Vite 6, React Leaflet
- **Search**: Fuse.js (fuzzy matching)
- **State**: React Context + useReducer
- **Data sources**:
  - `ontarioparks.ca` (park info, photos, classification)
  - `reservations.ontarioparks.ca` (legend amenities, booking categories)
  - `overpass-api.de` (nearby attractions)
  - `nominatim.openstreetmap.org` (address geocoding)
- **Persistence**: localStorage (saved parks, manual location, theme)

## Setup

```bash
# Install JS dependencies
npm install

# (Optional) Create a Python venv for the scrapers
python3 -m venv venv
source venv/bin/activate
pip install -r scraper/requirements.txt

# Start the dev server
npm run dev
```

Open http://localhost:5173/.

The committed `src/data/parks.json` already has the full merged dataset — no scraping needed to run the app.

## Scraper Pipeline

If you want to refresh the data from the official sources, run the scrapers in order:

```bash
cd scraper
source ../venv/bin/activate

# 1. Get the list of all parks
python3 fetch_park_list.py

# 2. Fetch each park's details (keywords + summary)
python3 fetch_park_details.py

# 3. Geocode parks
python3 enrich_geospatial.py

# 4. Pull the Map Icon Legend from the reservation system
python3 fetch_legend_amenities.py

# 5. Pull park photos (header + gallery)
python3 fetch_park_photos.py

# 6. Pull the authoritative reservable parks list
python3 fetch_reservable_parks.py

# 7. Pull per-park booking categories
python3 fetch_booking_categories.py

# 8. Merge everything into the final parks.json
python3 merge_data.py
cp output/parks_database.json ../src/data/parks.json
```

All scrapers are resumable — re-running them skips parks already in the output. They use a 1 req/sec rate limit to be polite to the public APIs.

## Project Structure

```
ontario-parks-explorer/
├── public/
│   └── legend-icons/          # 88 PNG icons from the reservation system
├── scraper/                   # Data pipeline (Python)
│   ├── fetch_*.py            # One script per source
│   ├── merge_data.py         # Combine all sources
│   └── output/               # Intermediate files (gitignored)
├── src/
│   ├── components/           # React components
│   │   ├── FilterSidebar.jsx
│   │   ├── MapView.jsx
│   │   ├── ParkCard.jsx
│   │   ├── ParkDetailPanel.jsx
│   │   ├── SavedParks.jsx
│   │   ├── GetStarted.jsx
│   │   ├── NearbyAttractions.jsx
│   │   └── LocationPicker.jsx
│   ├── context/ParkContext.jsx
│   ├── data/parks.json        # Final dataset (340 parks)
│   ├── services/             # API clients
│   │   ├── overpassService.js
│   │   └── geocodingService.js
│   ├── utils/                 # Scoring, categorization, formatting
│   └── App.jsx
├── implementation_plan.md     # Original product spec
├── package.json
└── vite.config.js
```

## Roadmap (from `implementation_plan.md`)

- ✅ Phase 1: Data Pipeline
- ✅ Phase 2: Core Web App
- ✅ Phase 3: Smart Recommendations (Get Started wizard)
- ✅ Phase 4: Nearby Attractions (Overpass API)
- ⏳ Phase 5: Availability & Trip Planning (deep-links to Ontario Parks, shareable trip summary)

## Credits

- Park data from [Ontario Parks](https://www.ontarioparks.ca/) and the [Ontario Parks Reservation system](https://reservations.ontarioparks.ca/)
- Map tiles from [OpenStreetMap](https://www.openstreetmap.org/) contributors
- Nearby attractions from the [Overpass API](https://overpass-api.de/)
- Geocoding by [Nominatim](https://nominatim.org/)
