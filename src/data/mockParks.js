/**
 * Mock Ontario Parks data
 * Real coordinates, realistic amenities — ready to swap for real data pipeline output.
 */

const mockParks = [
  {
    slug: "algonquin",
    name: "Algonquin Provincial Park",
    classification: "Natural Environment",
    description: "Ontario's most iconic park spanning 7,653 sq km of dense hardwood and boreal forest. Famous for moose sightings, stunning fall foliage, and world-class canoeing through interconnected waterways.",
    coordinates: { lat: 45.5871, lng: -78.3258 },
    operatingDates: "Year-round (some campgrounds seasonal May–Oct)",
    reservationUrl: "https://reservations.ontarioparks.ca/Algonquin",
    websiteUrl: "https://www.ontarioparks.ca/park/algonquin",
    activities: [
      "Canoeing", "Kayaking", "Hiking", "Swimming", "Fishing",
      "Mountain Biking", "Cross-Country Skiing", "Snowshoeing",
      "Wildlife Viewing", "Birdwatching", "Photography"
    ],
    facilities: [
      "Flush Toilets", "Showers", "Laundry", "Camp Store",
      "Visitor Centre", "Boat Launch", "Picnic Shelters",
      "Dumping Station", "Firewood", "Recycling"
    ],
    campsiteTypes: [
      "Car Camping", "Backcountry Camping", "Yurt", "Cabin",
      "Walk-in Camping", "Group Camping", "Winter Camping"
    ],
    scenery: ["Forest", "Lakes", "Rivers", "Cliffs", "Wetlands", "Fall Foliage"],
    totalCampsites: 1257,
    highlights: ["Highway 60 Corridor", "Canoe Lake", "Algonquin Art Centre"]
  },
  {
    slug: "killarney",
    name: "Killarney Provincial Park",
    classification: "Wilderness",
    description: "A rugged wilderness of white quartzite ridges, sapphire lakes, and jack pine forests along Georgian Bay. The La Cloche Silhouette Trail is one of Ontario's most challenging and rewarding backcountry loops.",
    coordinates: { lat: 46.0135, lng: -81.4018 },
    operatingDates: "May – October",
    reservationUrl: "https://reservations.ontarioparks.ca/Killarney",
    websiteUrl: "https://www.ontarioparks.ca/park/killarney",
    activities: [
      "Canoeing", "Kayaking", "Hiking", "Swimming", "Fishing",
      "Snowshoeing", "Wildlife Viewing", "Photography", "Rock Climbing"
    ],
    facilities: [
      "Flush Toilets", "Showers", "Boat Launch", "Camp Store",
      "Firewood", "Dumping Station", "Picnic Shelters"
    ],
    campsiteTypes: [
      "Car Camping", "Backcountry Camping", "Group Camping"
    ],
    scenery: ["Mountains", "Lakes", "Georgian Bay", "Quartzite Ridges", "Boreal Forest"],
    totalCampsites: 183,
    highlights: ["La Cloche Silhouette Trail", "George Lake", "The Crack (Killarney Ridge)"]
  },
  {
    slug: "sandbanks",
    name: "Sandbanks Provincial Park",
    classification: "Natural Environment",
    description: "Home to the world's largest freshwater baymouth barrier dune system along Lake Ontario's Prince Edward County shoreline. Stunning sandy beaches and warm, shallow water make this a summer paradise.",
    coordinates: { lat: 43.9124, lng: -77.2405 },
    operatingDates: "April – October",
    reservationUrl: "https://reservations.ontarioparks.ca/Sandbanks",
    websiteUrl: "https://www.ontarioparks.ca/park/sandbanks",
    activities: [
      "Swimming", "Hiking", "Cycling", "Fishing",
      "Birdwatching", "Photography", "Windsurfing"
    ],
    facilities: [
      "Flush Toilets", "Showers", "Laundry", "Camp Store",
      "Visitor Centre", "Picnic Shelters", "Dumping Station",
      "Firewood", "Playground"
    ],
    campsiteTypes: [
      "Car Camping", "Walk-in Camping", "Group Camping"
    ],
    scenery: ["Dunes", "Beach", "Lake Ontario", "Wetlands", "Savanna"],
    totalCampsites: 550,
    highlights: ["Outlet Beach", "Dunes Beach", "Lakeshore Lodge"]
  },
  {
    slug: "bon-echo",
    name: "Bon Echo Provincial Park",
    classification: "Natural Environment",
    description: "Dominated by the towering Mazinaw Rock — a 100-metre granite cliff rising from Mazinaw Lake, adorned with over 260 Indigenous pictographs. A place of deep cultural and geological significance.",
    coordinates: { lat: 44.9068, lng: -77.1461 },
    operatingDates: "May – October",
    reservationUrl: "https://reservations.ontarioparks.ca/BonEcho",
    websiteUrl: "https://www.ontarioparks.ca/park/bonecho",
    activities: [
      "Canoeing", "Kayaking", "Swimming", "Hiking", "Fishing",
      "Rock Climbing", "Birdwatching", "Photography"
    ],
    facilities: [
      "Flush Toilets", "Showers", "Camp Store", "Boat Launch",
      "Picnic Shelters", "Firewood", "Dumping Station", "Playground"
    ],
    campsiteTypes: [
      "Car Camping", "Backcountry Camping", "Walk-in Camping", "Group Camping"
    ],
    scenery: ["Cliffs", "Lakes", "Forest", "Pictographs", "Canadian Shield"],
    totalCampsites: 528,
    highlights: ["Mazinaw Rock", "Aboriginal Pictographs", "Cliff Top Trail"]
  },
  {
    slug: "pinery",
    name: "Pinery Provincial Park",
    classification: "Natural Environment",
    description: "A rare Oak Savanna ecosystem along the sandy shores of Lake Huron. Known for spectacular sunsets, old-growth Carolinian forest, and a winding river perfect for lazy tube floats.",
    coordinates: { lat: 43.2645, lng: -81.8283 },
    operatingDates: "Year-round",
    reservationUrl: "https://reservations.ontarioparks.ca/Pinery",
    websiteUrl: "https://www.ontarioparks.ca/park/pinery",
    activities: [
      "Swimming", "Hiking", "Cycling", "Canoeing", "Kayaking",
      "Cross-Country Skiing", "Birdwatching", "Photography",
      "Fishing", "Tubing"
    ],
    facilities: [
      "Flush Toilets", "Showers", "Laundry", "Camp Store",
      "Visitor Centre", "Picnic Shelters", "Dumping Station",
      "Firewood", "Playground", "Recycling"
    ],
    campsiteTypes: [
      "Car Camping", "Yurt", "Group Camping", "Winter Camping"
    ],
    scenery: ["Beach", "Oak Savanna", "Dunes", "River", "Lake Huron", "Sunset"],
    totalCampsites: 1000,
    highlights: ["Old Ausable Channel", "Pinery Dunes Trail", "Sunset Views"]
  },
  {
    slug: "killbear",
    name: "Killbear Provincial Park",
    classification: "Natural Environment",
    description: "A stunning peninsula jutting into Georgian Bay, with windswept pines clinging to smooth granite shores. The park's rocky coastline and crystal-clear water evoke the feeling of Ontario's northern wilderness.",
    coordinates: { lat: 45.3560, lng: -80.2057 },
    operatingDates: "May – October",
    reservationUrl: "https://reservations.ontarioparks.ca/Killbear",
    websiteUrl: "https://www.ontarioparks.ca/park/killbear",
    activities: [
      "Swimming", "Hiking", "Kayaking", "Canoeing", "Fishing",
      "Cycling", "Birdwatching", "Snorkeling", "Photography"
    ],
    facilities: [
      "Flush Toilets", "Showers", "Camp Store", "Visitor Centre",
      "Boat Launch", "Picnic Shelters", "Firewood", "Playground",
      "Dumping Station"
    ],
    campsiteTypes: [
      "Car Camping", "Walk-in Camping", "Group Camping"
    ],
    scenery: ["Georgian Bay", "Granite Shores", "Windswept Pines", "Rocky Coastline"],
    totalCampsites: 882,
    highlights: ["Lighthouse Point Trail", "Harold Point Beach", "Georgian Bay Sunsets"]
  },
  {
    slug: "arrowhead",
    name: "Arrowhead Provincial Park",
    classification: "Natural Environment",
    description: "A year-round Muskoka gem famous for its winter skating trail — a magical 1.3 km path through illuminated forest. In summer, enjoy sandy beaches, waterfalls, and classic Ontario cottage country scenery.",
    coordinates: { lat: 45.3918, lng: -79.2186 },
    operatingDates: "Year-round",
    reservationUrl: "https://reservations.ontarioparks.ca/Arrowhead",
    websiteUrl: "https://www.ontarioparks.ca/park/arrowhead",
    activities: [
      "Swimming", "Hiking", "Skating", "Cross-Country Skiing",
      "Snowshoeing", "Mountain Biking", "Tubing", "Photography"
    ],
    facilities: [
      "Flush Toilets", "Showers", "Camp Store", "Visitor Centre",
      "Picnic Shelters", "Firewood", "Dumping Station", "Playground"
    ],
    campsiteTypes: [
      "Car Camping", "Cabin", "Winter Camping", "Group Camping"
    ],
    scenery: ["Forest", "Waterfalls", "Lakes", "Muskoka", "Winter Wonderland"],
    totalCampsites: 388,
    highlights: ["Skating Trail", "Stubb's Falls", "Mayflower Lake Beach"]
  },
  {
    slug: "silent-lake",
    name: "Silent Lake Provincial Park",
    classification: "Natural Environment",
    description: "A serene, motor-boat-free lake surrounded by Canadian Shield landscape. The gentle terrain and peaceful waters make it ideal for families seeking quiet canoe trips and lakeside tranquility.",
    coordinates: { lat: 44.8743, lng: -78.0560 },
    operatingDates: "May – October",
    reservationUrl: "https://reservations.ontarioparks.ca/SilentLake",
    websiteUrl: "https://www.ontarioparks.ca/park/silentlake",
    activities: [
      "Canoeing", "Kayaking", "Swimming", "Hiking", "Fishing",
      "Mountain Biking", "Cross-Country Skiing", "Snowshoeing"
    ],
    facilities: [
      "Flush Toilets", "Showers", "Camp Store", "Boat Launch",
      "Picnic Shelters", "Firewood", "Dumping Station"
    ],
    campsiteTypes: [
      "Car Camping", "Walk-in Camping", "Yurt", "Group Camping"
    ],
    scenery: ["Lakes", "Canadian Shield", "Forest", "Wetlands", "Quiet Waters"],
    totalCampsites: 164,
    highlights: ["No Motorboats Policy", "Lakeshore Trail", "Granite Outcrops"]
  },
  {
    slug: "grundy-lake",
    name: "Grundy Lake Provincial Park",
    classification: "Natural Environment",
    description: "A family-friendly park south of Sudbury featuring interconnected lakes, smooth granite swimming spots, and gentle trails through mixed boreal forest. Perfect for a quintessential Canadian Shield camping experience.",
    coordinates: { lat: 45.7817, lng: -80.5740 },
    operatingDates: "May – October",
    reservationUrl: "https://reservations.ontarioparks.ca/GrundyLake",
    websiteUrl: "https://www.ontarioparks.ca/park/grundylake",
    activities: [
      "Swimming", "Canoeing", "Kayaking", "Hiking", "Fishing",
      "Cycling", "Birdwatching"
    ],
    facilities: [
      "Flush Toilets", "Showers", "Camp Store", "Boat Launch",
      "Picnic Shelters", "Firewood", "Dumping Station", "Playground"
    ],
    campsiteTypes: [
      "Car Camping", "Backcountry Camping", "Group Camping", "Yurt"
    ],
    scenery: ["Lakes", "Canadian Shield", "Granite Shores", "Boreal Forest"],
    totalCampsites: 485,
    highlights: ["Swan Lake Trail", "Gut Lake Portage", "Granite Swimming Rocks"]
  },
  {
    slug: "sauble-falls",
    name: "Sauble Falls Provincial Park",
    classification: "Recreational",
    description: "A compact but charming park at the mouth of the Sauble River as it cascades into Lake Huron. The falls attract spawning fish in autumn, and the nearby Sauble Beach is one of Ontario's finest.",
    coordinates: { lat: 44.6285, lng: -81.2657 },
    operatingDates: "May – October",
    reservationUrl: "https://reservations.ontarioparks.ca/SaubleFalls",
    websiteUrl: "https://www.ontarioparks.ca/park/saublefalls",
    activities: [
      "Fishing", "Hiking", "Swimming", "Photography",
      "Birdwatching"
    ],
    facilities: [
      "Vault Toilets", "Picnic Shelters", "Firewood"
    ],
    campsiteTypes: [
      "Car Camping"
    ],
    scenery: ["Waterfalls", "River", "Lake Huron", "Forest"],
    totalCampsites: 144,
    highlights: ["Sauble Falls", "Salmon Run (Fall)", "Sauble Beach (nearby)"]
  }
];

export default mockParks;

/**
 * All unique activities across parks
 */
export const ALL_ACTIVITIES = [
  "Canoeing", "Kayaking", "Hiking", "Swimming", "Fishing",
  "Mountain Biking", "Cycling", "Cross-Country Skiing", "Snowshoeing",
  "Skating", "Wildlife Viewing", "Birdwatching", "Photography",
  "Rock Climbing", "Windsurfing", "Snorkeling", "Tubing"
];

/**
 * All unique facilities across parks
 */
export const ALL_FACILITIES = [
  "Flush Toilets", "Vault Toilets", "Showers", "Laundry",
  "Camp Store", "Visitor Centre", "Boat Launch", "Picnic Shelters",
  "Dumping Station", "Firewood", "Recycling", "Playground"
];

/**
 * All unique campsite types across parks
 */
export const ALL_CAMPSITE_TYPES = [
  "Car Camping", "Backcountry Camping", "Walk-in Camping",
  "Group Camping", "Winter Camping", "Yurt", "Cabin"
];

/**
 * All unique scenery tags across parks
 */
export const ALL_SCENERY = [
  "Forest", "Lakes", "Rivers", "Cliffs", "Wetlands", "Fall Foliage",
  "Mountains", "Georgian Bay", "Quartzite Ridges", "Boreal Forest",
  "Dunes", "Beach", "Lake Ontario", "Lake Huron", "Savanna",
  "Pictographs", "Canadian Shield", "Oak Savanna", "Granite Shores",
  "Windswept Pines", "Rocky Coastline", "Waterfalls", "Muskoka",
  "Winter Wonderland", "Quiet Waters", "Sunset", "River"
];

/**
 * Park classifications
 */
export const CLASSIFICATIONS = [
  "Wilderness",
  "Natural Environment",
  "Recreational"
];
