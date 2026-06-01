import { useState, useEffect, useMemo } from 'react';
import { fetchNearbyAttractions, groupAttractions } from '../services/overpassService';
import { estimateDriveTimeMinutes, formatDriveTime } from '../utils/scoringEngine';
import Icon from './Icon';
import './NearbyAttractions.css';

const RADIUS_OPTIONS = [
  { value: 15, label: '15 km' },
  { value: 30, label: '30 km' },
  { value: 50, label: '50 km' },
];

function NearbyAttractions({ park }) {
  const [radius, setRadius] = useState(15);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const coords = park.coordinates;

  // Reset when park changes
  useEffect(() => {
    setData(null);
    setError(null);
    setExpandedGroups(new Set());
  }, [park.slug]);

  // Load data when park or radius changes
  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchNearbyAttractions(park.slug, coords.lat, coords.lng, radius)
      .then(result => {
        if (cancelled) return;
        setData(result);
        if (result.error) setError(result.error);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [park.slug, coords?.lat, coords?.lng, radius]);

  const grouped = useMemo(() => {
    if (!data?.attractions) return null;
    return groupAttractions(data.attractions);
  }, [data]);

  const toggleGroup = (name) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleRefresh = () => {
    // Clear cache and refetch by removing the entry then triggering a reload
    try {
      localStorage.removeItem(`op-nearby-${park.slug}-${radius}`);
    } catch {}
    setData(null);
    setError(null);
    setLoading(true);
    fetchNearbyAttractions(park.slug, coords.lat, coords.lng, radius)
      .then(result => {
        setData(result);
        if (result.error) setError(result.error);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  if (!coords) {
    return (
      <div className="info-section nearby-section">
        <h3>Nearby Attractions</h3>
        <p className="nearby-empty">No coordinates available for this park.</p>
      </div>
    );
  }

  return (
    <div className="info-section nearby-section">
      <div className="nearby-header">
        <h3>Nearby Attractions</h3>
        <div className="nearby-controls">
          <div className="nearby-radius-group" role="radiogroup" aria-label="Search radius">
            {RADIUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`nearby-radius-btn ${radius === opt.value ? 'active' : ''}`}
                onClick={() => setRadius(opt.value)}
                aria-pressed={radius === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="nearby-refresh"
            onClick={handleRefresh}
            disabled={loading}
            aria-label="Refresh results"
            title="Refresh from OpenStreetMap"
          >
            <Icon name="refresh" size={12} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {data?.fromCache && (
        <p className="nearby-source-note">
          Cached result from OpenStreetMap
        </p>
      )}

      {loading && !data && (
        <div className="nearby-loading">
          <Icon name="compass" size={20} className="spinning" />
          <span>Searching OpenStreetMap within {radius} km…</span>
        </div>
      )}

      {error && !loading && (
        <div className="nearby-error">
          <Icon name="info" size={14} />
          <span>Couldn't load nearby places: {error}</span>
          <button type="button" className="btn-text" onClick={handleRefresh}>
            Try again
          </button>
        </div>
      )}

      {grouped && grouped.size === 0 && !loading && !error && (
        <div className="nearby-empty">
          <Icon name="pin" size={20} />
          <span>No notable places found within {radius} km.</span>
        </div>
      )}

      {grouped && grouped.size > 0 && (
        <div className="nearby-groups">
          {Array.from(grouped.entries()).map(([groupName, items]) => {
            const isExpanded = expandedGroups.has(groupName) || items.length <= 3;
            const visibleItems = isExpanded ? items : items.slice(0, 3);
            const hasMore = items.length > 3;
            const iconName = items[0]?.category?.icon || 'pin';
            return (
              <div key={groupName} className="nearby-group">
                <div className="nearby-group-header">
                  <Icon name={iconName} size={12} />
                  <span className="nearby-group-name">{groupName}</span>
                  <span className="nearby-group-count">{items.length}</span>
                </div>
                <ul className="nearby-list">
                  {visibleItems.map(item => {
                    const driveMins = estimateDriveTimeMinutes(item.distance);
                    const driveStr = formatDriveTime(driveMins);
                    const osmUrl = `https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lon}#map=14/${item.lat}/${item.lon}`;
                    return (
                      <li key={item.id}>
                        <a
                          href={osmUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="nearby-item"
                          title="Open in OpenStreetMap"
                        >
                          <span className="nearby-item-name">{item.name}</span>
                          <span className="nearby-item-meta">
                            {item.distance.toFixed(1)} km
                            {driveStr && <span className="nearby-item-drive"> · {driveStr}</span>}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
                {hasMore && (
                  <button
                    type="button"
                    className="nearby-show-more"
                    onClick={() => toggleGroup(groupName)}
                  >
                    {isExpanded
                      ? `Show less`
                      : `Show all ${items.length}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="nearby-attribution">
        Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors
      </p>
    </div>
  );
}

export default NearbyAttractions;
