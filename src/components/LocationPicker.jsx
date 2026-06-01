import { useState, useEffect, useRef } from 'react';
import { useParkContext } from '../context/ParkContext';
import { geocodeAddress, quickCities } from '../services/geocodingService';
import Icon from './Icon';
import './LocationPicker.css';

function LocationPicker() {
  const { state, dispatch } = useParkContext();
  const { userLocation, locationSource, locationLabel } = state;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return undefined;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      // Cancel any in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSearching(true);
      setError(null);
      const found = await geocodeAddress(query, { signal: controller.signal });
      setSearching(false);
      if (found.length === 0) {
        setError('No matches found');
      }
      setResults(found);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (abortRef.current) abortRef.current.abort();
  }, []);

  const handleSelectResult = (result) => {
    dispatch({
      type: 'SET_USER_LOCATION',
      payload: {
        lat: result.lat,
        lng: result.lng,
        label: result.label,
        source: 'manual',
      },
    });
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleSelectCity = (city) => {
    dispatch({
      type: 'SET_USER_LOCATION',
      payload: {
        lat: city.lat,
        lng: city.lng,
        label: city.label,
        source: 'quick',
      },
    });
    setOpen(false);
  };

  const handleUseCurrent = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported');
      return;
    }
    setError(null);
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
        setOpen(false);
      },
      (err) => {
        setError(`Location error: ${err.message}`);
      },
      { timeout: 8000 }
    );
  };

  const handleClear = () => {
    dispatch({ type: 'CLEAR_USER_LOCATION' });
  };

  const displayLabel = locationLabel || (userLocation ? 'Custom location' : 'Not set');

  return (
    <div className={`location-picker ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="location-picker-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="location-picker-trigger-main">
          <Icon name="map-pin" size={12} className="location-picker-icon" />
          <div className="location-picker-text">
            <div className="location-picker-label">Starting from</div>
            <div className="location-picker-value">{displayLabel}</div>
          </div>
        </div>
        <Icon name={open ? 'chevronDown' : 'chevronRight'} size={12} />
      </button>

      {open && (
        <div className="location-picker-panel">
          <div className="location-picker-search">
            <Icon name="search" size={12} className="location-picker-search-icon" />
            <input
              type="text"
              placeholder="Enter address or city..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="location-picker-input"
            />
            {searching && (
              <span className="location-picker-spinner" aria-label="Searching" />
            )}
          </div>

          {error && !searching && (
            <div className="location-picker-error">{error}</div>
          )}

          {results.length > 0 && (
            <ul className="location-picker-results">
              {results.map((r, i) => (
                <li key={`${r.lat}-${r.lng}-${i}`}>
                  <button
                    type="button"
                    onClick={() => handleSelectResult(r)}
                    className="location-picker-result"
                  >
                    <Icon name="map-pin" size={11} />
                    <div className="location-picker-result-text">
                      <div className="location-picker-result-label">{r.label}</div>
                      {r.fullLabel !== r.label && (
                        <div className="location-picker-result-full">{r.fullLabel}</div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="location-picker-section">
            <div className="location-picker-section-label">Quick cities</div>
            <div className="location-picker-cities">
              {quickCities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleSelectCity(city)}
                  className={`location-picker-city ${userLocation?.lat === city.lat ? 'active' : ''}`}
                >
                  {city.label}
                </button>
              ))}
            </div>
          </div>

          <div className="location-picker-actions">
            <button
              type="button"
              onClick={handleUseCurrent}
              className="location-picker-action btn-ghost"
            >
              <Icon name="navigation" size={12} />
              Use current location
            </button>
            {userLocation && locationSource !== 'geolocation' && (
              <button
                type="button"
                onClick={handleClear}
                className="location-picker-action btn-ghost"
              >
                <Icon name="close" size={12} />
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationPicker;
