/**
 * Legend Amenity Categorization
 *
 * Maps the Ontario Parks reservation system's "Map Icon Legend" labels into
 * the three categories our app uses: activities, facilities, and campsiteTypes.
 *
 * The reservation system stores amenity types as opaque integer IDs and shows
 * each with a label + PNG icon. We classify each label here so the frontend
 * can:
 *   1. Group amenities in the detail panel
 *   2. Provide categorized filter checkboxes in the sidebar
 *
 * Labels not in this table fall into "facilities" by default.
 */

export const LEGEND_CATEGORIES = {
  // ─── Activities (things visitors DO) ─────────────────────
  'Hiking': 'activities',
  'Biking': 'activities',
  'Swimming': 'activities',
  'Beach': 'activities',
  'Canoeing': 'activities',
  'Canoe Access': 'activities',
  'Canoe Launch': 'activities',
  'Boat Launch': 'activities',
  'Boat Rental': 'activities',
  'Portage': 'activities',
  'Rentals (Boat/Canoe/Bike)': 'activities',
  'Canoe Rack': 'activities',
  'Fishing': 'activities', // we no longer have a bare "Fishing" but legacy fallback
  'Fish Cleaning Station': 'activities',
  'Playground': 'activities',
  'Play Field': 'activities',
  'Ball Diamond / Play Field': 'activities',
  'Basketball': 'activities',
  'Volleyball': 'activities',
  'Volleyball / Basketball Court': 'activities',
  'Tennis': 'activities',
  'Horseshoes': 'activities',
  'Amphitheatre': 'activities',
  'Theatre': 'activities',
  'Museum': 'activities',
  'Lighthouse': 'activities',
  'Lookout': 'activities',
  'Interpretation Centre': 'activities',
  'Information': 'activities',
  'Picnic Area': 'activities', // recreational use
  'Day Use Area': 'activities',
  'Self-Serve Feestation': 'activities',

  // ─── Facilities (infrastructure & services) ──────────────
  'Accessible': 'facilities',
  'Accessible Parking': 'facilities',
  'Parking': 'facilities',
  'Bus Parking': 'facilities',
  'Park Office': 'facilities',
  'Visitor Centre': 'facilities',
  'Gatehouse': 'facilities',
  'Comfort Station': 'facilities',
  'Comfort Station & Showers': 'facilities',
  'Comfort House': 'facilities',
  'Showers': 'facilities',
  'Vault Toilet': 'facilities',
  'Restroom': 'facilities',
  'Change House': 'facilities',
  'Pay Phone': 'facilities',
  'Emergency Phone': 'facilities',
  'Water Tap': 'facilities',
  'Water': 'facilities',
  'Store': 'facilities',
  'Groceries / Shopping': 'facilities',
  'Food Locker': 'facilities',
  'Laundry Building': 'facilities',
  'Laundry Facilities': 'facilities',
  'Dishwashing Station': 'facilities',
  'First Aid': 'facilities',
  'Firewood': 'facilities',
  'Recycling': 'facilities',
  'Garbage': 'facilities',
  'Building': 'facilities',
  'Picnic Shelter': 'facilities',
  'Radio-Free': 'facilities',
  'Generator Free': 'facilities',
  'Pet Area': 'facilities',
  'Pet-Free Area': 'facilities',
  'Dog Beach': 'facilities',
  'Dog Run': 'facilities',
  'Dogs on Leash': 'facilities',
  'Cemetery': 'facilities',
  'Church': 'facilities',
  'Marsh': 'facilities',
  'Campfire Circle': 'facilities',

  // ─── Campsite types ─────────────────────────────────────
  'Camping': 'campsiteTypes',
  'Group Camping': 'campsiteTypes',
  'Backcountry Camping': 'campsiteTypes',
  'Walk-in Camping': 'campsiteTypes',
  'Electrical Camping': 'campsiteTypes',
  'Non-Electrical Camping': 'campsiteTypes',
  'Roofed Accommodation': 'campsiteTypes',
  'Cabin': 'campsiteTypes',
};

/**
 * Group an array of legend amenities into the three categories.
 * @returns {{activities: string[], facilities: string[], campsiteTypes: string[]}}
 */
export function categorizeLegendAmenities(legendAmenities) {
  const result = { activities: [], facilities: [], campsiteTypes: [] };
  if (!legendAmenities) return result;

  for (const item of legendAmenities) {
    const category = LEGEND_CATEGORIES[item.label] || 'facilities';
    result[category].push(item.label);
  }

  // Sort each category alphabetically
  result.activities.sort();
  result.facilities.sort();
  result.campsiteTypes.sort();

  return result;
}

/**
 * Build the full set of filter options from all parks' legendAmenities.
 * Returns an object { activities: [{id, label}], facilities: [...], campsiteTypes: [...] }
 * sorted by label.
 */
export function buildFilterOptionsFromParks(parks) {
  const sets = { activities: new Set(), facilities: new Set(), campsiteTypes: new Set() };

  for (const park of parks) {
    const categorized = categorizeLegendAmenities(park.legendAmenities);
    categorized.activities.forEach(a => sets.activities.add(a));
    categorized.facilities.forEach(f => sets.facilities.add(f));
    categorized.campsiteTypes.forEach(c => sets.campsiteTypes.add(c));
  }

  const toOptions = (set) =>
    Array.from(set).sort().map(label => ({ id: label, label }));

  return {
    activities: toOptions(sets.activities),
    facilities: toOptions(sets.facilities),
    campsiteTypes: toOptions(sets.campsiteTypes),
  };
}
