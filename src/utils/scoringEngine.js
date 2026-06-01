import Fuse from 'fuse.js';

/**
 * Park Scoring Engine
 *
 * Calculates a relevance score for each park based on active filters.
 * Returns parks sorted by score (descending), with metadata for the UI.
 */

const FUSE_OPTIONS = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.32,
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'summary', weight: 0.2 },
    { name: 'description', weight: 0.15 },
    { name: 'region', weight: 0.07 },
    { name: 'classification', weight: 0.04 },
    { name: 'tags', weight: 0.03 },
    { name: 'highlights', weight: 0.03 },
    { name: 'activities', weight: 0.03 },
    { name: 'facilities', weight: 0.02 },
    { name: 'scenery', weight: 0.02 },
    { name: 'campsiteTypes', weight: 0.02 },
    { name: 'slug', weight: 0.01 },
  ],
};

/**
 * Calculate the great-circle distance between two points using the Haversine formula.
 * @returns distance in kilometers
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * Math.PI / 180;
}

/**
 * Estimate driving time in minutes from a straight-line (great-circle) distance.
 *
 * This is a rough approximation. Real driving time depends on highway vs. local
 * road mix, traffic, construction, and the exact route. We use a piecewise
 * model that reflects typical Ontario road conditions:
 *   - 0–50 km:   ~50 km/h average (urban + arterial mix)
 *   - 50–200 km: ~75 km/h average (highway + some secondary)
 *   - 200+ km:   ~90 km/h average (mostly highway)
 *
 * @param {number} distanceKm great-circle distance in kilometers
 * @returns {number} estimated driving time in minutes
 */
export function estimateDriveTimeMinutes(distanceKm) {
  if (distanceKm == null || isNaN(distanceKm) || distanceKm <= 0) return 0;

  const MIN_KMH = 50;
  const MID_KMH = 75;
  const HIGH_KMH = 90;

  if (distanceKm <= 50) {
    return Math.round((distanceKm / MIN_KMH) * 60);
  }
  if (distanceKm <= 200) {
    // 50 km at 50 km/h + remainder at 75 km/h
    const firstLeg = 50 / MIN_KMH;
    const remaining = (distanceKm - 50) / MID_KMH;
    return Math.round((firstLeg + remaining) * 60);
  }
  // 50 km at 50, 150 km at 75, rest at 90
  const firstLeg = 50 / MIN_KMH;
  const midLeg = 150 / MID_KMH;
  const remaining = (distanceKm - 200) / HIGH_KMH;
  return Math.round((firstLeg + midLeg + remaining) * 60);
}

/**
 * Format a drive-time minutes value into a human-readable string.
 *   47    -> "45m"
 *   75    -> "1h 15m"
 *   185   -> "3h 5m"
 *   720   -> "12h"
 */
export function formatDriveTime(minutes) {
  if (minutes == null || isNaN(minutes) || minutes <= 0) return null;
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Check how many items from a filter list match the park's data.
 * @returns { matched: number, total: number }
 */
function matchList(filterItems, parkItems) {
  if (!filterItems || filterItems.length === 0) return { matched: 0, total: 0 };
  const parkSet = new Set(parkItems || []);
  const matched = filterItems.filter(item => parkSet.has(item)).length;
  return { matched, total: filterItems.length };
}

function buildSearchIndex(parks, query) {
  if (!query || !query.trim()) return null;
  const fuse = new Fuse(parks, FUSE_OPTIONS);
  const results = fuse.search(query.trim());
  if (!results.length) {
    return { resultsBySlug: new Map(), maxScore: 1 };
  }

  let maxScore = 0;
  const resultsBySlug = new Map();
  results.forEach(result => {
    const score = result.score ?? 1;
    resultsBySlug.set(result.item.slug, {
      score,
      matches: result.matches || [],
    });
    if (score > maxScore) maxScore = score;
  });

  return { resultsBySlug, maxScore: maxScore || 1 };
}

/**
 * Score a single park against the current filters.
 */
function scorePark(park, filters, userLocation, searchIndex) {
  let score = 0;
  let matchCount = 0;
  let totalFilters = 0;
  let excluded = false;
  let searchMatches = null;

  // --- Activity matching ---
  const activityMatch = matchList(filters.activities, park.activities);
  if (activityMatch.total > 0) {
    totalFilters += activityMatch.total;
    matchCount += activityMatch.matched;
    score += activityMatch.matched * 10;
    if (filters.strictMode && activityMatch.matched < activityMatch.total) {
      excluded = true;
    }
  }

  // --- Facility matching ---
  const facilityMatch = matchList(filters.facilities, park.facilities);
  if (facilityMatch.total > 0) {
    totalFilters += facilityMatch.total;
    matchCount += facilityMatch.matched;
    score += facilityMatch.matched * 8;
    if (filters.strictMode && facilityMatch.matched < facilityMatch.total) {
      excluded = true;
    }
  }

  // --- Campsite type matching ---
  const campsiteMatch = matchList(filters.campsiteTypes, park.campsiteTypes);
  if (campsiteMatch.total > 0) {
    totalFilters += campsiteMatch.total;
    matchCount += campsiteMatch.matched;
    score += campsiteMatch.matched * 10;
    if (filters.strictMode && campsiteMatch.matched < campsiteMatch.total) {
      excluded = true;
    }
  }

  // --- Scenery matching ---
  const sceneryMatch = matchList(filters.scenery, park.scenery);
  if (sceneryMatch.total > 0) {
    totalFilters += sceneryMatch.total;
    matchCount += sceneryMatch.matched;
    score += sceneryMatch.matched * 5;
    if (filters.strictMode && sceneryMatch.matched < sceneryMatch.total) {
      excluded = true;
    }
  }

  // --- Classification matching ---
  if (filters.classification) {
    totalFilters += 1;
    if (park.classification === filters.classification) {
      matchCount += 1;
      score += 5;
    } else if (filters.strictMode) {
      excluded = true;
    }
  }

  // --- Distance matching ---
  let distance = null;
  if (userLocation && park.coordinates) {
    distance = haversineDistance(
      userLocation.lat, userLocation.lng,
      park.coordinates.lat, park.coordinates.lng
    );

    if (filters.distance && filters.distance < 500) {
      totalFilters += 1;
      if (distance <= filters.distance) {
        matchCount += 1;
        // Graduated scoring: closer = more points (max 15)
        const ratio = 1 - (distance / filters.distance);
        score += Math.round(15 * ratio);
      } else if (filters.strictMode) {
        excluded = true;
      }
    }
  }

  // --- Text search matching (Fuse.js) ---
  if (filters.searchQuery && filters.searchQuery.trim()) {
    totalFilters += 1;
    const searchMeta = searchIndex?.resultsBySlug.get(park.slug);
    if (searchMeta != null) {
      matchCount += 1;
      const normalized = 1 - Math.min(searchMeta.score / searchIndex.maxScore, 1);
      score += Math.round(30 * normalized);
      searchMatches = searchMeta.matches;
    } else if (filters.strictMode) {
      excluded = true;
    }
  }

  // --- Reservable-only filter (always strict — these parks can't be booked) ---
  if (filters.reservableOnly && park.reservableCamping !== true) {
    excluded = true;
  }

  if (excluded) {
    score = -1;
  }

  return {
    ...park,
    score,
    matchCount,
    totalFilters,
    excluded,
    searchMatches,
    distance: distance !== null ? Math.round(distance) : null,
  };
}

/**
 * Score and sort all parks.
 * @param {Array} parks - all parks
 * @param {Object} filters - current filter state
 * @param {Object|null} userLocation - { lat, lng }
 * @returns {Array} scored and sorted parks
 */
export function scoreParks(parks, filters, userLocation) {
  const searchIndex = buildSearchIndex(parks, filters.searchQuery);
  const scored = parks.map(park => scorePark(park, filters, userLocation, searchIndex));

  // Sort: non-excluded first, then by score descending, then by name
  return scored.sort((a, b) => {
    if (a.excluded && !b.excluded) return 1;
    if (!a.excluded && b.excluded) return -1;
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Get the maximum possible score for the current filters.
 */
export function getMaxScore(filters) {
  let max = 0;
  if (filters.activities?.length) max += filters.activities.length * 10;
  if (filters.facilities?.length) max += filters.facilities.length * 8;
  if (filters.campsiteTypes?.length) max += filters.campsiteTypes.length * 10;
  if (filters.scenery?.length) max += filters.scenery.length * 5;
  if (filters.classification) max += 5;
  if (filters.distance && filters.distance < 500) max += 15;
  if (filters.searchQuery?.trim()) max += 30;
  return max || 1; // avoid division by zero
}
