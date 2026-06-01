import { createContext, useContext, useReducer, useEffect } from 'react';
import parksData from '../data/parks.json';
import { scoreParks } from '../utils/scoringEngine.js';

const ParkContext = createContext(null);

const LOCATION_STORAGE_KEY = 'op-user-location';
const LOCATION_SOURCE_KEY = 'op-user-location-source';
const SAVED_PARKS_KEY = 'op-saved-parks';

function loadStoredLocation() {
  try {
    const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

function loadStoredLocationSource() {
  try {
    return localStorage.getItem(LOCATION_SOURCE_KEY) || null;
  } catch {
    return null;
  }
}

function loadSavedParks() {
  try {
    const stored = localStorage.getItem(SAVED_PARKS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter(s => typeof s === 'string');
      }
    }
  } catch {
    // Ignore storage errors
  }
  return [];
}

const initialFilters = {
  searchQuery: '',
  activities: [],
  facilities: [],
  campsiteTypes: [],
  scenery: [],
  distance: 500, // km
  classification: '',
  strictMode: false,
  reservableOnly: false,
};

const sanitizeParks = (data) => {
  return data.map(park => {
    let cleanClass = 'Natural Environment';
    const c = (park.classification || '').toLowerCase();
    if (c.includes('wilderness')) cleanClass = 'Wilderness';
    else if (c.includes('natural environment')) cleanClass = 'Natural Environment';
    else if (c.includes('recreational')) cleanClass = 'Recreational';
    else if (c.includes('waterway')) cleanClass = 'Waterway';
    else if (c.includes('nature reserve')) cleanClass = 'Nature Reserve';
    else if (c.includes('historical') || c.includes('cultural heritage')) cleanClass = 'Historical';

    // Handle invalid coordinates (like Amable du Fond River)
    let cleanCoords = park.coordinates;
    if (cleanCoords && cleanCoords.lat === 0 && cleanCoords.lng === 0) {
      cleanCoords = null;
    }

    return {
      ...park,
      classification: cleanClass,
      coordinates: cleanCoords,
    };
  });
};

const sanitizedParksData = sanitizeParks(parksData);

const storedLocation = loadStoredLocation();
const storedLocationSource = loadStoredLocationSource();
const storedSavedParks = loadSavedParks();

const initialState = {
  parks: sanitizedParksData,
  filteredParks: sanitizedParksData.map(p => ({ ...p, score: 0, matchCount: 0, totalFilters: 0, excluded: false })),
  selectedPark: null,
  filters: initialFilters,
  userLocation: storedLocation,
  locationSource: storedLocationSource,
  sidebarOpen: true,
  savedParks: storedSavedParks,
  savedParksOpen: false,
  comparisonMode: false,
};

function parkReducer(state, action) {
  switch (action.type) {
    case 'SET_PARKS':
      return { ...state, parks: action.payload };

    case 'SET_FILTERS': {
      const newFilters = { ...state.filters, ...action.payload };
      const scored = scoreParks(state.parks, newFilters, state.userLocation);
      return { ...state, filters: newFilters, filteredParks: scored };
    }

    case 'CLEAR_FILTERS': {
      const scored = scoreParks(state.parks, initialFilters, state.userLocation);
      return { ...state, filters: initialFilters, filteredParks: scored };
    }

    case 'SELECT_PARK':
      return { ...state, selectedPark: action.payload };

    case 'SET_USER_LOCATION': {
      const payload = action.payload || {};
      const scored = scoreParks(state.parks, state.filters, payload);
      return {
        ...state,
        userLocation: payload,
        locationSource: payload?.source || 'geolocation',
        locationLabel: payload?.label || state.locationLabel,
        filteredParks: scored,
      };
    }

    case 'CLEAR_USER_LOCATION': {
      const scored = scoreParks(state.parks, state.filters, null);
      return {
        ...state,
        userLocation: null,
        locationSource: null,
        locationLabel: null,
        filteredParks: scored,
      };
    }

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case 'TOGGLE_SAVE_PARK': {
      const slug = action.payload;
      const isSaved = state.savedParks.includes(slug);
      const newSaved = isSaved
        ? state.savedParks.filter(s => s !== slug)
        : [...state.savedParks, slug];
      return { ...state, savedParks: newSaved };
    }

    case 'CLEAR_SAVED_PARKS':
      return { ...state, savedParks: [] };

    case 'OPEN_SAVED_PARKS':
      return { ...state, savedParksOpen: true };

    case 'CLOSE_SAVED_PARKS':
      return { ...state, savedParksOpen: false, comparisonMode: false };

    case 'TOGGLE_COMPARISON_MODE':
      return { ...state, comparisonMode: !state.comparisonMode };

    case 'RECALCULATE': {
      const scored = scoreParks(state.parks, state.filters, state.userLocation);
      return { ...state, filteredParks: scored };
    }

    default:
      return state;
  }
}

export function ParkProvider({ children }) {
  const [state, dispatch] = useReducer(parkReducer, initialState);

  // Get user location on mount — skip if we already have a stored manual location
  useEffect(() => {
    if (storedLocation) {
      // Re-dispatch to ensure scoring has run with this location
      dispatch({ type: 'SET_USER_LOCATION', payload: storedLocation });
      return;
    }

    if (!('geolocation' in navigator)) {
      dispatch({
        type: 'SET_USER_LOCATION',
        payload: { lat: 43.6532, lng: -79.3832, label: 'Toronto (default)', source: 'default' },
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        dispatch({
          type: 'SET_USER_LOCATION',
          payload: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            label: 'Current location',
            source: 'geolocation',
          },
        });
      },
      () => {
        // Geolocation denied/failed — default to Toronto
        dispatch({
          type: 'SET_USER_LOCATION',
          payload: { lat: 43.6532, lng: -79.3832, label: 'Toronto (default)', source: 'default' },
        });
      },
      { timeout: 5000 }
    );
  }, []);

  // Persist manual locations so they survive reloads
  useEffect(() => {
    try {
      if (state.userLocation && state.locationSource && state.locationSource !== 'geolocation') {
        const { lat, lng } = state.userLocation;
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({ lat, lng }));
        localStorage.setItem(LOCATION_SOURCE_KEY, state.locationSource);
      } else if (!state.userLocation) {
        localStorage.removeItem(LOCATION_STORAGE_KEY);
        localStorage.removeItem(LOCATION_SOURCE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [state.userLocation, state.locationSource]);

  // Persist saved parks to localStorage
  useEffect(() => {
    try {
      if (state.savedParks.length > 0) {
        localStorage.setItem(SAVED_PARKS_KEY, JSON.stringify(state.savedParks));
      } else {
        localStorage.removeItem(SAVED_PARKS_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [state.savedParks]);

  // Initial scoring
  useEffect(() => {
    dispatch({ type: 'RECALCULATE' });
  }, []);

  return (
    <ParkContext.Provider value={{ state, dispatch }}>
      {children}
    </ParkContext.Provider>
  );
}

export function useParkContext() {
  const context = useContext(ParkContext);
  if (!context) {
    throw new Error('useParkContext must be used within a ParkProvider');
  }
  return context;
}

export { initialFilters };
export default ParkContext;
