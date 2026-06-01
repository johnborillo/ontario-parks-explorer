import { useState, useMemo } from 'react';
import { useParkContext } from '../context/ParkContext';
import ParkCard from './ParkCard';
import Icon from './Icon';
import LocationPicker from './LocationPicker';
import { buildFilterOptionsFromParks } from '../utils/legendCategories';
import './FilterSidebar.css';

const themeOptions = [
  { id: 'atlas', label: 'Atlas' },
  { id: 'campfire', label: 'Campfire' },
  { id: 'ranger', label: 'Ranger' },
];

const allScenery = [
  { id: "lake-views", label: "Lake Views" },
  { id: "forest", label: "Forest" },
  { id: "river", label: "River" },
  { id: "beach", label: "Beach" },
  { id: "waterfall", label: "Waterfall" },
  { id: "rock-formations", label: "Cliffs/Rocks" }
];

const allClassifications = [
  { id: "", label: "All Classifications" },
  { id: "Wilderness", label: "Wilderness" },
  { id: "Natural Environment", label: "Natural Environment" },
  { id: "Recreational", label: "Recreational" },
  { id: "Waterway", label: "Waterway" },
  { id: "Nature Reserve", label: "Nature Reserve" },
  { id: "Historical", label: "Historical" }
];

function FilterSidebar({ theme, onThemeChange, onOpenGetStarted, onOpenSavedParks }) {
  const { state, dispatch } = useParkContext();
  const { filters, filteredParks, userLocation, parks, savedParks } = state;

  // Build filter options dynamically from all parks' legend amenities
  const filterOptions = useMemo(
    () => buildFilterOptionsFromParks(parks),
    [parks]
  );
  const allActivities = filterOptions.activities;
  const allFacilities = filterOptions.facilities;
  const allCampsiteTypes = filterOptions.campsiteTypes;

  const [accordions, setAccordions] = useState({
    activities: true,
    campsites: false,
    facilities: false,
    scenery: false,
    location: false,
  });

  const toggleAccordion = (section) => {
    setAccordions(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSearch = (e) => {
    dispatch({ type: 'SET_FILTERS', payload: { searchQuery: e.target.value } });
  };

  const handleFilterToggle = (category, value) => {
    const activeList = filters[category] || [];
    const newList = activeList.includes(value)
      ? activeList.filter(item => item !== value)
      : [...activeList, value];
    dispatch({ type: 'SET_FILTERS', payload: { [category]: newList } });
  };

  const handleSliderChange = (e) => {
    dispatch({ type: 'SET_FILTERS', payload: { distance: parseInt(e.target.value, 10) } });
  };

  const handleClassificationChange = (e) => {
    dispatch({ type: 'SET_FILTERS', payload: { classification: e.target.value } });
  };

  const handleStrictToggle = () => {
    dispatch({ type: 'SET_FILTERS', payload: { strictMode: !filters.strictMode } });
  };

  const clearAllFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  const hasActiveFilters = 
    filters.searchQuery ||
    filters.activities.length > 0 ||
    filters.facilities.length > 0 ||
    filters.campsiteTypes.length > 0 ||
    filters.scenery.length > 0 ||
    filters.classification ||
    filters.distance < 500 ||
    filters.strictMode ||
    filters.reservableOnly;

  const strongMatchCount = hasActiveFilters
    ? filteredParks.filter(p => p.score > 0).length
    : filteredParks.length;

  return (
    <div className="filter-sidebar">
      {/* Header section with branding & theme options */}
      <div className="sidebar-header">
        <div className="title-block">
          <h1>Ontario Parks</h1>
          <p className="subtitle">Expedition Planner & Companion</p>
        </div>
        <div className="theme-switch">
          <span className="theme-label">Atmosphere</span>
          <div className="theme-options" role="radiogroup" aria-label="Theme selection">
            {themeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`theme-option ${option.id} ${theme === option.id ? 'active' : ''}`}
                onClick={() => onThemeChange(option.id)}
                aria-pressed={theme === option.id}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {onOpenGetStarted && (
          <button
            type="button"
            className="getstarted-trigger btn btn-primary"
            onClick={onOpenGetStarted}
          >
            <Icon name="compass" size={14} />
            Get Started
          </button>
        )}

        {onOpenSavedParks && (
          <button
            type="button"
            className={`saved-parks-trigger btn ${savedParks.length > 0 ? 'btn-saved' : 'btn-outline'}`}
            onClick={onOpenSavedParks}
          >
            <Icon
              name={savedParks.length > 0 ? 'bookmarkFilled' : 'bookmark'}
              size={14}
            />
            Saved Parks
            {savedParks.length > 0 && (
              <span className="saved-parks-badge">{savedParks.length}</span>
            )}
          </button>
        )}
      </div>

      {/* Main filter controls - scrollable container */}
      <div className="filters-scroll-area">
        {/* Basic Search & Strict Mode section */}
        <div className="filter-section search-strict-box">
          <div className="search-wrapper">
            <Icon name="search" className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search runes, names, highlights..."
              value={filters.searchQuery}
              onChange={handleSearch}
              className="search-input input"
            />
          </div>
          <div className="strict-mode-container">
            <label className="toggle-wrapper">
              <input
                type="checkbox"
                checked={filters.strictMode}
                onChange={handleStrictToggle}
              />
              <span className="toggle-track" />
              <span className="toggle-label checkbox-label">Strict Filtering (Hard Match)</span>
            </label>
            <label className="toggle-wrapper" title="Only show parks with campgrounds bookable on the Ontario Parks reservation system">
              <input
                type="checkbox"
                checked={filters.reservableOnly}
                onChange={() => dispatch({ type: 'SET_FILTERS', payload: { reservableOnly: !filters.reservableOnly } })}
              />
              <span className="toggle-track" />
              <span className="toggle-label checkbox-label">Camping Available</span>
            </label>
          </div>
        </div>

        {/* Location picker (starting point) */}
        <LocationPicker />

        {/* Accordion 1: Location & Proximity */}
        <div className={`accordion-item ${accordions.location ? 'open' : ''}`}>
          <button 
            type="button" 
            className="accordion-header" 
            onClick={() => toggleAccordion('location')}
          >
            <span>Location & Proximity</span>
            <Icon name={accordions.location ? 'chevronDown' : 'chevronRight'} size={14} />
          </button>
          {accordions.location && (
            <div className="accordion-content">
              <div className="filter-group">
                <label className="filter-label">Park Classification</label>
                <div className="select-wrapper">
                  <select 
                    value={filters.classification} 
                    onChange={handleClassificationChange}
                    className="input select-input"
                  >
                    {allClassifications.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {userLocation && (
                <div className="filter-group slider-group">
                  <div className="slider-header">
                    <label className="filter-label">Distance Radius</label>
                    <span className="slider-value">
                      {filters.distance >= 500 ? 'Any Distance' : `Within ${filters.distance} km`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="25"
                    value={filters.distance}
                    onChange={handleSliderChange}
                    className="distance-range"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Accordion 2: Activities */}
        <div className={`accordion-item ${accordions.activities ? 'open' : ''}`}>
          <button 
            type="button" 
            className="accordion-header" 
            onClick={() => toggleAccordion('activities')}
          >
            <span>Activities</span>
            <Icon name={accordions.activities ? 'chevronDown' : 'chevronRight'} size={14} />
          </button>
          {accordions.activities && (
            <div className="accordion-content">
              <div className="checkbox-grid">
                {allActivities.map(activity => (
                  <label key={activity.id} className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={filters.activities.includes(activity.id)}
                      onChange={() => handleFilterToggle('activities', activity.id)}
                    />
                    <span className="checkbox-custom" aria-hidden="true" />
                    <span className="checkbox-label">{activity.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Accordion 3: Campsites & Amenities */}
        <div className={`accordion-item ${accordions.campsites ? 'open' : ''}`}>
          <button 
            type="button" 
            className="accordion-header" 
            onClick={() => toggleAccordion('campsites')}
          >
            <span>Campsites & Facilities</span>
            <Icon name={accordions.campsites ? 'chevronDown' : 'chevronRight'} size={14} />
          </button>
          {accordions.campsites && (
            <div className="accordion-content">
              <h4 className="sub-section-title">Campground Options</h4>
              <div className="checkbox-grid mb-4">
                {allCampsiteTypes.map(campsite => (
                  <label key={campsite.id} className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={filters.campsiteTypes.includes(campsite.id)}
                      onChange={() => handleFilterToggle('campsiteTypes', campsite.id)}
                    />
                    <span className="checkbox-custom" aria-hidden="true" />
                    <span className="checkbox-label">{campsite.label}</span>
                  </label>
                ))}
              </div>

              <h4 className="sub-section-title">Essential Facilities</h4>
              <div className="checkbox-grid">
                {allFacilities.map(facility => (
                  <label key={facility.id} className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={filters.facilities.includes(facility.id)}
                      onChange={() => handleFilterToggle('facilities', facility.id)}
                    />
                    <span className="checkbox-custom" aria-hidden="true" />
                    <span className="checkbox-label">{facility.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Accordion 4: Scenery & Vibes */}
        <div className={`accordion-item ${accordions.scenery ? 'open' : ''}`}>
          <button 
            type="button" 
            className="accordion-header" 
            onClick={() => toggleAccordion('scenery')}
          >
            <span>Scenery & Vibes</span>
            <Icon name={accordions.scenery ? 'chevronDown' : 'chevronRight'} size={14} />
          </button>
          {accordions.scenery && (
            <div className="accordion-content">
              <div className="checkbox-grid">
                {allScenery.map(sc => (
                  <label key={sc.id} className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={filters.scenery.includes(sc.id)}
                      onChange={() => handleFilterToggle('scenery', sc.id)}
                    />
                    <span className="checkbox-custom" aria-hidden="true" />
                    <span className="checkbox-label">{sc.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Header (collapsible actions if filters are active) */}
      <div className="results-header">
        {hasActiveFilters ? (
          <div className="results-count">
            <span className="results-count-primary">
              <strong>{strongMatchCount}</strong> {strongMatchCount === 1 ? 'match' : 'matches'}
            </span>
            <span className="results-count-divider">·</span>
            <span className="results-count-secondary">
              {filteredParks.length - strongMatchCount} nearby
            </span>
          </div>
        ) : (
          <span>{filteredParks.length} Parks Found</span>
        )}
        {hasActiveFilters && (
          <button
            type="button"
            className="clear-btn btn-ghost"
            onClick={clearAllFilters}
          >
            Reset Runes
          </button>
        )}
      </div>

      {/* Search results list container */}
      <div className="sidebar-results">
        <div className="results-list">
          {filteredParks.length === 0 ? (
            <div className="no-results-placeholder">
              <Icon name="compass" size={32} className="mb-2 placeholder-icon" />
              <p>No parks match these criteria.</p>
              <p className="subtext">Loosen your parameters or reset the runes.</p>
            </div>
          ) : (
            filteredParks.slice(0, 80).map(park => (
              <ParkCard key={park.slug} park={park} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default FilterSidebar;
