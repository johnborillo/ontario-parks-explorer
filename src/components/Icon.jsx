/**
 * SVG Icon Library
 * Inline SVG icons for the entire application — no external dependencies.
 */

export const icons = {
  // Navigation & UI
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  ),
  filter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  chevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  bookmark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  bookmarkFilled: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  columns: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  externalLink: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  mapPin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  
  // Activities
  canoe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20c2-2 4-3.5 8-3.5s6 1.5 8 3.5" />
      <path d="M4 17l3-9h10l3 9" />
      <line x1="12" y1="4" x2="12" y2="8" />
    </svg>
  ),
  canoeing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20c2-2 4-3.5 8-3.5s6 1.5 8 3.5" />
      <path d="M4 17l3-9h10l3 9" />
      <line x1="12" y1="4" x2="12" y2="8" />
    </svg>
  ),
  kayaking: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20l10-6 10 6" />
      <path d="M5 17l2-9h10l2 9" />
      <line x1="12" y1="2" x2="12" y2="8" />
      <path d="M18 4l2-2" />
      <path d="M4 4l2-2" />
    </svg>
  ),
  paddling: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20l10-6 10 6" />
      <path d="M5 17l2-9h10l2 9" />
      <line x1="12" y1="2" x2="12" y2="8" />
      <path d="M18 4l2-2" />
      <path d="M4 4l2-2" />
    </svg>
  ),
  paddleboarding: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="20" x2="17" y2="4" />
      <line x1="4" y1="20" x2="14" y2="6" />
      <line x1="18" y1="14" x2="12" y2="20" />
      <line x1="6" y1="20" x2="10" y2="20" />
    </svg>
  ),
  boating: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20c2-2 4-3.5 8-3.5s6 1.5 8 3.5" />
      <path d="M4 17l3-9h10l3 9" />
      <line x1="12" y1="4" x2="12" y2="8" />
      <path d="M10 4l-2 2m6-2l2 2" />
    </svg>
  ),
  windsurfing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20l4-14 2 2" />
      <path d="M10 8l10 2-4 4" />
      <path d="M14 14l-2 6" />
    </svg>
  ),
  hiking: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
      <path d="M10.5 21l3-9-2.5-1L8 17" />
      <path d="M14 7l-2 4 4 2 3 7" />
      <path d="M5.5 21l3-7" />
    </svg>
  ),
  swimming: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20c1.5-1.5 3.5-2 5-2s3.5.5 5 2 3.5 2 5 2 3.5-.5 5-2" />
      <circle cx="12" cy="7" r="2" />
      <path d="M8 14l2-4 2 1 2-1 2 4" />
    </svg>
  ),
  fishing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 3v7" />
      <path d="M18 10a4 4 0 0 1-4 4H8" />
      <circle cx="6" cy="14" r="2" />
      <path d="M6 16v5" />
      <path d="M4 21h4" />
    </svg>
  ),
  cycling: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M12 5l4 12H5" />
      <circle cx="12" cy="5" r="1" />
    </svg>
  ),
  skiing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="4" r="2" />
      <path d="M8 21l4-8-4-3 2-4" />
      <path d="M6 12l10 4" />
      <path d="M4 21h16" />
    </svg>
  ),
  'cross-country-skiing': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="4" r="2" />
      <path d="M8 21l4-8-4-3 2-4" />
      <path d="M6 12l10 4" />
      <path d="M4 21h16" />
    </svg>
  ),
  snowshoeing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="4" r="2" />
      <path d="M8 21l4-5 3 2 2-3 3 4" />
      <path d="M4 21h16" />
    </svg>
  ),
  snowmobiling: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 17l4-2h6l4 2" />
      <path d="M4 15l-1-3 3-1" />
      <path d="M18 15l1-3-3-1" />
      <line x1="8" y1="15" x2="8" y2="3" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  skating: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 13h12" />
      <path d="M8 13V9l4-1 4 1v4" />
      <path d="M16 13l2 4 2 2" />
      <path d="M8 13l-2 4-2 2" />
    </svg>
  ),
  backpacking: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="2" width="10" height="14" rx="2" />
      <path d="M7 16l-4 3v2h18v-2l-4-3" />
      <line x1="12" y1="22" x2="12" y2="19" />
      <line x1="9" y1="6" x2="15" y2="6" />
    </svg>
  ),
  biking: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M12 5l4 12H5" />
      <circle cx="12" cy="5" r="1" />
    </svg>
  ),
  'mountain-biking': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M12 5l4 12H5" />
      <circle cx="12" cy="5" r="1" />
      <path d="M12 5l-3 4" />
    </svg>
  ),
  birding: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="17" r="3" />
      <circle cx="17" cy="17" r="3" />
      <path d="M7 14V6a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v3" />
      <path d="M17 14V6a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v3" />
      <path d="M11 9h2" />
    </svg>
  ),
  'wildlife-viewing': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="17" r="3" />
      <circle cx="17" cy="17" r="3" />
      <path d="M7 14V6a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v3" />
      <path d="M17 14V6a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v3" />
      <path d="M11 9h2" />
    </svg>
  ),
  'nature-viewing': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8a7.001 7.001 0 0 1-7 7H11z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  ),
  'horseback-riding': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21a1 1 0 0 1-1-1v-2a1 1 0 0 1 2 0v1h5l3-5h2l3 5h1a1 1 0 0 1 1 1v1" />
      <circle cx="14" cy="7" r="2" />
      <path d="M14 9l-1 5" />
      <path d="M10 12h4" />
    </svg>
  ),
  hunting: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="1" />
      <circle cx="17" cy="7" r="1" />
      <path d="M5 7L2 2" />
      <path d="M19 7l3-5" />
      <path d="M8 7l4 10 4-10" />
      <line x1="12" y1="17" x2="12" y2="22" />
    </svg>
  ),
  photography: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  picnicking: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 21h12" />
      <path d="M12 21v-5" />
      <path d="M3 16h18" />
      <path d="M5 16L7 8h10l2 8" />
      <circle cx="9" cy="4" r="1" />
      <circle cx="15" cy="4" r="1" />
    </svg>
  ),
  'rock-climbing': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21l4-10 4 10" />
      <path d="M2 21h20" />
      <path d="M12 11V2" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="9" r="1" />
    </svg>
  ),
  'discovery-programs': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  ),
  stargazing: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  camera: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  binoculars: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="17" r="3" />
      <circle cx="17" cy="17" r="3" />
      <path d="M7 14V6a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v3" />
      <path d="M17 14V6a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v3" />
      <path d="M11 9h2" />
    </svg>
  ),

  // Facilities
  shower: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4v16" />
      <path d="M4 8h9a3 3 0 0 1 3 3v1" />
      <path d="M14 16v2" />
      <path d="M12 18v2" />
      <path d="M16 18v2" />
      <path d="M10 16v2" />
    </svg>
  ),
  store: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9h18v12H3z" />
      <path d="M3 9l2-6h14l2 6" />
      <path d="M9 21V14h6v7" />
    </svg>
  ),
  campfire: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c0 4-4 6-4 10a4 4 0 0 0 8 0c0-4-4-6-4-10z" />
      <path d="M5 21l7-4 7 4" />
    </svg>
  ),

  // Campsite types  
  tent: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 20h20L12 2z" />
      <path d="M9 20v-6l3-3 3 3v6" />
    </svg>
  ),
  cabin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
      <rect x="9" y="9" width="6" height="4" />
    </svg>
  ),

  // Scenery
  mountain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21l4-10 4 10" />
      <path d="M2 21h20" />
      <path d="M15 10l4 11" />
      <path d="M12 11l-2 5" />
    </svg>
  ),
  tree: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L4 15h5v6h6v-6h5L12 3z" />
    </svg>
  ),
  waves: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6c1.5 1.5 3.5 2 5 2s3.5-.5 5-2 3.5-2 5-2 3.5.5 5 2" />
      <path d="M2 12c1.5 1.5 3.5 2 5 2s3.5-.5 5-2 3.5-2 5-2 3.5.5 5 2" />
      <path d="M2 18c1.5 1.5 3.5 2 5 2s3.5-.5 5-2 3.5-2 5-2 3.5.5 5 2" />
    </svg>
  ),
  
  // Misc
  compass: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  ),
  building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="15" rx="1" />
      <path d="M3 6l9-4 9 4" />
      <line x1="9" y1="10" x2="9" y2="14" />
      <line x1="15" y1="10" x2="15" y2="14" />
      <line x1="9" y1="17" x2="9" y2="21" />
      <line x1="15" y1="17" x2="15" y2="21" />
    </svg>
  ),
  museum: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M3 10h18" />
      <path d="M5 6l7-3 7 3" />
      <path d="M4 10v11" />
      <path d="M20 10v11" />
      <path d="M8 14v4" />
      <path d="M12 14v4" />
      <path d="M16 14v4" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  picnic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18h18" />
      <path d="M4 18l2-8h12l2 8" />
      <line x1="6" y1="6" x2="6" y2="10" />
      <line x1="18" y1="6" x2="18" y2="10" />
    </svg>
  ),
  waterfall: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c-2 4 2 4 0 8" />
      <path d="M8 6c-2 4 2 4 0 8" />
      <path d="M16 6c2 4-2 4 0 8" />
      <path d="M6 18h12" />
      <path d="M5 22h14" />
    </svg>
  ),
  beach: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 22c4-4 6-4 10 0s6 4 10 0" />
      <path d="M2 17c4-4 6-4 10 0s6 4 10 0" />
      <circle cx="7" cy="7" r="2" />
      <line x1="12" y1="3" x2="12" y2="7" />
    </svg>
  ),
  cave: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V12a9 9 0 0 1 18 0v9" />
      <path d="M3 21h18" />
      <path d="M9 21v-5a3 3 0 0 1 6 0v5" />
    </svg>
  ),
  restaurant: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h2v11" />
      <path d="M7 2v20" />
      <path d="M21 2v7c0 1.1-.9 2-2 2h-2v4" />
      <path d="M17 2v20" />
    </svg>
  ),
  cafe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  ),
  pub: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 22h14" />
      <path d="M7 8h10v6a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4z" />
      <path d="M7 8V5l5-3 5 3v3" />
    </svg>
  ),
  fastfood: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11h18" />
      <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
      <path d="M5 11l-1 9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1l-1-9" />
      <path d="M9 7V4" />
      <path d="M15 7V4" />
    </svg>
  ),
  fuel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18" />
      <line x1="3" y1="13" x2="13" y2="13" />
      <path d="M16 10h2a2 2 0 0 1 2 2v6a2 2 0 0 0 2 2" />
      <line x1="19" y1="6" x2="19" y2="10" />
    </svg>
  ),
  trail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
      <circle cx="6" cy="6" r="1.5" />
      <circle cx="12" cy="9" r="1.5" />
      <circle cx="18" cy="6" r="1.5" />
    </svg>
  ),
  historic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="15" />
      <path d="M3 6l9-4 9 4" />
      <line x1="12" y1="9" x2="12" y2="17" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  artwork: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  leaf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8a7.001 7.001 0 0 1-7 7H11z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  navigation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  ),
};

/**
 * Icon component wrapper with consistent sizing
 */
export default function Icon({ name, size = 16, className = '', style = {} }) {
  const icon = icons[name];
  if (!icon) return null;

  return (
    <span
      className={`icon ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        ...style,
      }}
    >
      {icon}
    </span>
  );
}
