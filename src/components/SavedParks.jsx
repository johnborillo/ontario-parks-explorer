import { useState, useEffect, useMemo } from 'react';
import { useParkContext } from '../context/ParkContext';
import { estimateDriveTimeMinutes, formatDriveTime } from '../utils/scoringEngine';
import Icon from './Icon';
import './SavedParks.css';

function SavedParks() {
  const { state, dispatch } = useParkContext();
  const { savedParks, savedParksOpen, comparisonMode, parks, userLocation, locationLabel } = state;
  const [view, setView] = useState('list'); // 'list' | 'compare'

  // Lock body scroll while open
  useEffect(() => {
    if (!savedParksOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [savedParksOpen]);

  // Esc to close
  useEffect(() => {
    if (!savedParksOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [savedParksOpen]);

  // Reset view when reopening
  useEffect(() => {
    if (savedParksOpen) setView('list');
  }, [savedParksOpen]);

  // Build the list of saved park objects (preserve saved order)
  const savedParkObjects = useMemo(() => {
    return savedParks
      .map(slug => parks.find(p => p.slug === slug))
      .filter(Boolean);
  }, [savedParks, parks]);

  if (!savedParksOpen) return null;

  const handleClose = () => dispatch({ type: 'CLOSE_SAVED_PARKS' });
  const handleRemove = (slug) => dispatch({ type: 'TOGGLE_SAVE_PARK', payload: slug });
  const handleClearAll = () => {
    if (window.confirm(`Remove all ${savedParks.length} saved parks?`)) {
      dispatch({ type: 'CLEAR_SAVED_PARKS' });
    }
  };
  const handleOpenPark = (park) => {
    dispatch({ type: 'SELECT_PARK', payload: park });
    handleClose();
  };
  const handleToggleCompare = () => {
    setView(view === 'compare' ? 'list' : 'compare');
  };

  return (
    <div className="saved-parks-overlay" role="dialog" aria-modal="true" aria-labelledby="saved-parks-title">
      <div className="saved-parks-backdrop" onClick={handleClose} />

      <div className="saved-parks-modal">
        <div className="saved-parks-header">
          <div>
            <h2 id="saved-parks-title">
              {view === 'compare' ? 'Compare Parks' : 'Saved Parks'}
            </h2>
            <p className="saved-parks-subtitle">
              {savedParkObjects.length === 0
                ? 'Parks you save will appear here'
                : `${savedParkObjects.length} park${savedParkObjects.length === 1 ? '' : 's'} on your list`}
              {locationLabel && view === 'list' && ` · ${locationLabel}`}
            </p>
          </div>
          <button
            type="button"
            className="saved-parks-close"
            onClick={handleClose}
            aria-label="Close"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {view === 'list' && savedParkObjects.length === 0 && (
          <div className="saved-parks-empty">
            <Icon name="bookmark" size={48} />
            <h3>No saved parks yet</h3>
            <p>
              Tap the star icon on any park card or in the detail panel to add it to your
              list. Your list is stored on this device only — no account needed.
            </p>
          </div>
        )}

        {view === 'list' && savedParkObjects.length > 0 && (
          <>
            <div className="saved-parks-toolbar">
              {savedParkObjects.length >= 2 && (
                <button
                  type="button"
                  className="saved-parks-toolbar-btn btn btn-primary"
                  onClick={handleToggleCompare}
                >
                  <Icon name="columns" size={14} />
                  Compare side by side
                </button>
              )}
              <button
                type="button"
                className="saved-parks-toolbar-btn btn btn-ghost"
                onClick={handleClearAll}
              >
                <Icon name="trash" size={14} />
                Clear all
              </button>
            </div>

            <div className="saved-parks-list">
              {savedParkObjects.map(park => {
                const driveMins = park.distance != null ? estimateDriveTimeMinutes(park.distance) : null;
                const driveStr = formatDriveTime(driveMins);
                return (
                  <article key={park.slug} className="saved-park-card">
                    {park.heroImage && (
                      <button
                        type="button"
                        className="saved-park-card-image"
                        onClick={() => handleOpenPark(park)}
                        aria-label={`Open ${park.name}`}
                      >
                        <img src={park.heroImage} alt="" loading="lazy" />
                      </button>
                    )}
                    <div className="saved-park-card-body">
                      <div className="saved-park-card-header">
                        <span
                          className="saved-park-classification"
                          style={{ color: getClassificationColor(park.classification) }}
                        >
                          {park.classification}
                        </span>
                        <button
                          type="button"
                          className="saved-park-remove"
                          onClick={() => handleRemove(park.slug)}
                          aria-label={`Remove ${park.name} from list`}
                          title="Remove from list"
                        >
                          <Icon name="close" size={12} />
                        </button>
                      </div>
                      <h3 className="saved-park-name">
                        <button type="button" onClick={() => handleOpenPark(park)}>
                          {park.name}
                        </button>
                      </h3>
                      <p className="saved-park-region">{park.region}</p>
                      <div className="saved-park-meta">
                        {park.distance != null && (
                          <span>
                            <Icon name="map-pin" size={11} />
                            {Math.round(park.distance)} km
                            {driveStr && <span className="saved-park-drive"> · {driveStr}</span>}
                          </span>
                        )}
                        {park.legendAmenities && (
                          <span className="saved-park-count">
                            {park.legendAmenities.length} amenities
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {view === 'compare' && (
          <CompareView
            parks={savedParkObjects}
            onRemove={handleRemove}
            onOpen={handleOpenPark}
            onBack={() => setView('list')}
            userLocation={userLocation}
          />
        )}
      </div>
    </div>
  );
}

function CompareView({ parks, onRemove, onOpen, onBack, userLocation }) {
  // Build a unified list of all unique amenity labels across these parks
  const allLabels = useMemo(() => {
    const set = new Set();
    for (const park of parks) {
      if (park.legendAmenities) {
        for (const item of park.legendAmenities) {
          set.add(item.label);
        }
      }
    }
    return Array.from(set).sort();
  }, [parks]);

  return (
    <div className="compare-view">
      <div className="compare-view-toolbar">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          <Icon name="chevronLeft" size={14} />
          Back to list
        </button>
      </div>

      <div className="compare-grid" style={{ gridTemplateColumns: `220px repeat(${parks.length}, 1fr)` }}>
        <div className="compare-cell compare-header-spacer" />
        {parks.map(park => (
          <div key={park.slug} className="compare-cell compare-header">
            <button
              type="button"
              className="saved-park-remove"
              onClick={() => onRemove(park.slug)}
              aria-label={`Remove ${park.name}`}
              title="Remove from list"
            >
              <Icon name="close" size={12} />
            </button>
            {park.heroImage && <img src={park.heroImage} alt="" className="compare-park-thumb" />}
            <h4>
              <button type="button" onClick={() => onOpen(park)}>{park.name}</button>
            </h4>
            <p className="compare-park-class">{park.classification}</p>
            <p className="compare-park-region">{park.region}</p>
          </div>
        ))}

        <div className="compare-cell compare-row-label">Distance</div>
        {parks.map(park => {
          const driveMins = park.distance != null ? estimateDriveTimeMinutes(park.distance) : null;
          const driveStr = formatDriveTime(driveMins);
          return (
            <div key={park.slug} className="compare-cell compare-value">
              {park.distance != null ? `${Math.round(park.distance)} km` : '—'}
              {driveStr && <div className="compare-meta">{driveStr}</div>}
            </div>
          );
        })}

        <div className="compare-cell compare-row-label">Activities</div>
        {parks.map(park => (
          <div key={park.slug} className="compare-cell compare-value">
            {park.activities && park.activities.length > 0
              ? park.activities.length
              : '—'}
            <div className="compare-meta">
              {park.activities && park.activities.slice(0, 2).join(', ')}
              {park.activities && park.activities.length > 2 && `, +${park.activities.length - 2} more`}
            </div>
          </div>
        ))}

        <div className="compare-cell compare-row-label">Facilities</div>
        {parks.map(park => (
          <div key={park.slug} className="compare-cell compare-value">
            {park.facilities && park.facilities.length > 0
              ? park.facilities.length
              : '—'}
            <div className="compare-meta">
              {park.facilities && park.facilities.slice(0, 2).join(', ')}
              {park.facilities && park.facilities.length > 2 && `, +${park.facilities.length - 2} more`}
            </div>
          </div>
        ))}

        <div className="compare-cell compare-row-label">Campground</div>
        {parks.map(park => (
          <div key={park.slug} className="compare-cell compare-value">
            {park.campsiteTypes && park.campsiteTypes.length > 0
              ? park.campsiteTypes.length
              : '—'}
            <div className="compare-meta">
              {park.campsiteTypes && park.campsiteTypes.slice(0, 2).join(', ')}
              {park.campsiteTypes && park.campsiteTypes.length > 2 && `, +${park.campsiteTypes.length - 2} more`}
            </div>
          </div>
        ))}

        {allLabels.length > 0 && (
          <>
            <div className="compare-cell compare-row-label compare-section-divider">
              Amenities
            </div>
            {parks.map(park => (
              <div key={park.slug} className="compare-cell compare-section-spacer" />
            ))}
            {allLabels.map(label => (
              <RowFragment
                key={label}
                label={label}
                parks={parks}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function RowFragment({ label, parks }) {
  return (
    <>
      <div className="compare-cell compare-row-label">{label}</div>
      {parks.map(park => {
        const has = park.legendAmenities?.some(a => a.label === label);
        return (
          <div key={park.slug} className={`compare-cell compare-value ${has ? 'has' : 'lacks'}`}>
            {has ? <Icon name="check" size={14} /> : <span className="dash">—</span>}
          </div>
        );
      })}
    </>
  );
}

const CLASSIFICATION_COLORS = {
  'Wilderness': '#4a7c4e',
  'Natural Environment': '#5a8a3e',
  'Recreational': '#c97f3a',
  'Waterway': '#3a7ca8',
  'Nature Reserve': '#6a4a8a',
  'Historical': '#8a5a4a',
};

function getClassificationColor(c) {
  return CLASSIFICATION_COLORS[c] || '#888';
}

export default SavedParks;
