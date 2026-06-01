/**
 * Overpass API service — finds nearby points of interest around a park.
 *
 * Uses the public Overpass API (https://overpass-api.de/) which queries
 * OpenStreetMap data. No API key required.
 *
 * Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
 *
 * Data is cached in localStorage for 30 days per park (OSM data is reasonably
 * stable, and re-querying for the same park on every visit would be wasteful
 * and risk hitting the public server's rate limit).
 */

const ENDPOINT = "https://overpass-api.de/api/interpreter";
const CACHE_PREFIX = "op-nearby-";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Build the Overpass QL query for a park's coordinates and radius.
 * Looks for: towns/villages, viewpoints, attractions, natural features,
 * waterfalls, restaurants/cafes, picnic sites, museums, and campgrounds.
 */
function buildQuery(lat, lng, radiusMeters) {
  return `
[out:json][timeout:25];
(
  // Towns and villages
  node["place"~"town|village|hamlet|suburb|locality"](around:${radiusMeters}, ${lat}, ${lng});
  // Viewpoints, attractions, museums, campgrounds, info
  node["tourism"~"viewpoint|attraction|museum|camp_site|information|picnic_site|artwork"](around:${radiusMeters}, ${lat}, ${lng});
  // Natural features
  node["natural"~"peak|waterfall|beach|cave_entrance|spring"](around:${radiusMeters}, ${lat}, ${lng});
  // Waterfalls on waterways
  node["waterway"="waterfall"](around:${radiusMeters}, ${lat}, ${lng});
  // Restaurants, cafes, fuel
  node["amenity"~"restaurant|cafe|fast_food|pub|fuel"](around:${radiusMeters}, ${lat}, ${lng});
  // Parks and nature reserves
  node["leisure"~"park|nature_reserve|pitch"](around:${radiusMeters}, ${lat}, ${lng});
  // Historic sites
  node["historic"~"memorial|monument|castle|ruins|archaeological_site"](around:${radiusMeters}, ${lat}, ${lng});
  // Ways (paths, areas) for trails
  way["highway"~"path|footway|cycleway"]["name"](around:${radiusMeters}, ${lat}, ${lng});
);
out tags center 200;
`;
}

/**
 * Categorize a result into a human-readable group.
 * @returns {{group: string, icon: string, label: string}}
 */
export function categorizeAttraction(tags) {
  if (tags.place) {
    return { group: 'Towns & Villages', icon: 'building', label: tags.place };
  }
  if (tags.tourism === 'viewpoint') {
    return { group: 'Lookouts & Viewpoints', icon: 'binoculars', label: 'Viewpoint' };
  }
  if (tags.tourism === 'attraction') {
    return { group: 'Attractions', icon: 'compass', label: 'Attraction' };
  }
  if (tags.tourism === 'museum') {
    return { group: 'Culture & Museums', icon: 'museum', label: 'Museum' };
  }
  if (tags.tourism === 'camp_site') {
    return { group: 'Other Campgrounds', icon: 'tent', label: 'Campground' };
  }
  if (tags.tourism === 'information') {
    return { group: 'Visitor Info', icon: 'info', label: tags.information || 'Information' };
  }
  if (tags.tourism === 'picnic_site') {
    return { group: 'Picnic Areas', icon: 'picnic', label: 'Picnic Site' };
  }
  if (tags.tourism === 'artwork') {
    return { group: 'Art & Monuments', icon: 'artwork', label: 'Artwork' };
  }
  if (tags.natural === 'peak') {
    return { group: 'Peaks & Cliffs', icon: 'mountain', label: 'Peak' };
  }
  if (tags.natural === 'waterfall' || tags.waterway === 'waterfall') {
    return { group: 'Waterfalls', icon: 'waterfall', label: 'Waterfall' };
  }
  if (tags.natural === 'beach') {
    return { group: 'Beaches', icon: 'beach', label: 'Beach' };
  }
  if (tags.natural === 'cave_entrance') {
    return { group: 'Caves', icon: 'cave', label: 'Cave' };
  }
  if (tags.natural === 'spring') {
    return { group: 'Springs', icon: 'spring', label: 'Spring' };
  }
  if (tags.amenity === 'restaurant') {
    return { group: 'Restaurants', icon: 'restaurant', label: 'Restaurant' };
  }
  if (tags.amenity === 'cafe') {
    return { group: 'Cafés', icon: 'cafe', label: 'Café' };
  }
  if (tags.amenity === 'fast_food') {
    return { group: 'Restaurants', icon: 'fastfood', label: 'Fast Food' };
  }
  if (tags.amenity === 'pub') {
    return { group: 'Restaurants', icon: 'pub', label: 'Pub' };
  }
  if (tags.amenity === 'fuel') {
    return { group: 'Services', icon: 'fuel', label: 'Gas Station' };
  }
  if (tags.leisure === 'park' || tags.leisure === 'nature_reserve') {
    return { group: 'Parks & Reserves', icon: 'tree', label: tags.leisure === 'nature_reserve' ? 'Nature Reserve' : 'Park' };
  }
  if (tags.leisure === 'pitch') {
    return { group: 'Parks & Reserves', icon: 'pitch', label: 'Sports Field' };
  }
  if (tags.historic) {
    return { group: 'Historic Sites', icon: 'historic', label: tags.historic };
  }
  if (tags.highway && (tags.highway === 'path' || tags.highway === 'footway' || tags.highway === 'cycleway')) {
    return { group: 'Trails', icon: 'trail', label: 'Trail' };
  }
  return { group: 'Other', icon: 'pin', label: 'Point of Interest' };
}

/**
 * Convert Overpass elements to a clean array of nearby attractions.
 */
function parseElements(elements) {
  const results = [];
  for (const el of elements) {
    const tags = el.tags || {};
    // Use lat/lon (node) or center (way)
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat == null || lon == null) continue;
    const name = tags.name || tags['name:en'] || tags.ref;
    if (!name) continue; // skip unnamed features to keep the list clean
    const category = categorizeAttraction(tags);
    results.push({
      id: `${el.type}-${el.id}`,
      name,
      lat,
      lon,
      osmId: el.id,
      osmType: el.type,
      tags,
      category,
    });
  }
  return results;
}

/**
 * Compute great-circle distance (km) between two coordinates.
 */
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Group attractions by category, sort each group by distance.
 */
export function groupAttractions(attractions) {
  const groups = new Map();
  for (const a of attractions) {
    if (!groups.has(a.category.group)) {
      groups.set(a.category.group, []);
    }
    groups.get(a.category.group).push(a);
  }
  // Sort each group by distance
  for (const list of groups.values()) {
    list.sort((a, b) => a.distance - b.distance);
  }
  // Order groups in a sensible way
  const order = [
    'Towns & Villages',
    'Lookouts & Viewpoints',
    'Waterfalls',
    'Beaches',
    'Peaks & Cliffs',
    'Trails',
    'Picnic Areas',
    'Attractions',
    'Culture & Museums',
    'Historic Sites',
    'Art & Monuments',
    'Parks & Reserves',
    'Caves',
    'Springs',
    'Cafés',
    'Restaurants',
    'Visitor Info',
    'Other Campgrounds',
    'Services',
    'Other',
  ];
  const sorted = new Map();
  for (const name of order) {
    if (groups.has(name)) sorted.set(name, groups.get(name));
  }
  // Add any remaining groups not in the order list
  for (const [name, list] of groups) {
    if (!sorted.has(name)) sorted.set(name, list);
  }
  return sorted;
}

/**
 * Fetch nearby attractions for a park from Overpass (with caching).
 * @param {string} slug — park slug (used for cache key)
 * @param {number} lat — park latitude
 * @param {number} lng — park longitude
 * @param {number} radiusKm — search radius in km (default 15)
 * @returns {Promise<{attractions: Array, radiusKm: number, fetchedAt: number, fromCache: boolean}>}
 */
export async function fetchNearbyAttractions(slug, lat, lng, radiusKm = 15) {
  if (lat == null || lng == null) {
    return { attractions: [], radiusKm, fetchedAt: 0, fromCache: false, error: 'No coordinates' };
  }

  // Check cache first
  const cacheKey = `${CACHE_PREFIX}${slug}-${radiusKm}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS) {
        return { ...parsed, fromCache: true };
      }
    }
  } catch {
    // Ignore cache errors
  }

  const radiusMeters = Math.round(radiusKm * 1000);
  const query = buildQuery(lat, lng, radiusMeters);

  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: 'data=' + encodeURIComponent(query),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    return { attractions: [], radiusKm, fetchedAt: 0, fromCache: false, error: `Network error: ${err.message}` };
  }

  if (!response.ok) {
    return { attractions: [], radiusKm, fetchedAt: 0, fromCache: false, error: `Overpass returned HTTP ${response.status}` };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    return { attractions: [], radiusKm, fetchedAt: 0, fromCache: false, error: 'Invalid JSON from Overpass' };
  }

  const elements = Array.isArray(data.elements) ? data.elements : [];
  const attractions = parseElements(elements);

  // Compute distance from park for each result
  for (const a of attractions) {
    a.distance = distanceKm(lat, lng, a.lat, a.lon);
  }

  const result = {
    attractions,
    radiusKm,
    fetchedAt: Date.now(),
    fromCache: false,
  };

  // Cache it
  try {
    localStorage.setItem(cacheKey, JSON.stringify(result));
  } catch {
    // Ignore cache errors (quota exceeded, etc.)
  }

  return result;
}

/**
 * Clear all cached nearby attractions.
 */
export function clearNearbyCache() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    for (const k of keys) localStorage.removeItem(k);
  } catch {
    // Ignore
  }
}
