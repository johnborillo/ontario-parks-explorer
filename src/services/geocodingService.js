/**
 * Geocoding service — converts addresses to lat/lng coordinates.
 *
 * Uses Nominatim (OpenStreetMap) — free, no API key required.
 * Rate-limited to 1 request per second per their usage policy.
 *
 * https://operations.osmfoundation.org/policies/nominatim/
 */

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'OntarioParksExplorer/1.0 (https://github.com/local/ontario-parks-searcher)';

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 1100; // slightly over 1s to be safe

function waitForRateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    return new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed));
  }
  return Promise.resolve();
}

/**
 * Geocode a free-form address query (e.g. "Barrie, ON" or "100 Main St, Toronto").
 * Returns an array of results, each with: label, lat, lng, type, importance.
 * Returns [] on error or no match.
 */
export async function geocodeAddress(query, { signal } = {}) {
  if (!query || !query.trim()) return [];

  await waitForRateLimit();
  lastRequestTime = Date.now();

  const params = new URLSearchParams({
    q: query.trim(),
    format: 'json',
    addressdetails: '1',
    limit: '5',
    countrycodes: 'ca', // bias to Canada
    'accept-language': 'en',
  });

  try {
    const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal,
    });

    if (!response.ok) {
      console.warn('[geocode] Non-OK response:', response.status);
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((item) => formatResult(item));
  } catch (err) {
    if (err.name === 'AbortError') return [];
    console.warn('[geocode] Error:', err.message);
    return [];
  }
}

function formatResult(item) {
  const a = item.address || {};
  const city = a.city || a.town || a.village || a.municipality || a.county || a.region || a.state;
  const province = a.state_code || a.state || a.region;
  const country = a.country_code?.toUpperCase();

  const parts = [];
  if (item.display_name) {
    // Prefer a short label: city + province + country
    const short = [city, province, country].filter(Boolean).join(', ');
    parts.push(short || item.display_name.split(',').slice(0, 2).join(','));
  }

  return {
    label: parts[0] || item.display_name,
    fullLabel: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    type: item.type,
    importance: item.importance,
  };
}

/**
 * Quick-select cities for common Ontario starting points.
 * Pre-defined to avoid hitting Nominatim every time.
 */
export const quickCities = [
  { id: 'toronto', label: 'Toronto', lat: 43.6532, lng: -79.3832 },
  { id: 'ottawa', label: 'Ottawa', lat: 45.4215, lng: -75.6972 },
  { id: 'hamilton', label: 'Hamilton', lat: 43.2557, lng: -79.8711 },
  { id: 'london', label: 'London', lat: 42.9849, lng: -81.2453 },
  { id: 'kingston', label: 'Kingston', lat: 44.2312, lng: -76.4860 },
  { id: 'sudbury', label: 'Sudbury', lat: 46.4917, lng: -80.9930 },
  { id: 'thunder-bay', label: 'Thunder Bay', lat: 48.3809, lng: -89.2477 },
  { id: 'windsor', label: 'Windsor', lat: 42.3149, lng: -83.0364 },
];
