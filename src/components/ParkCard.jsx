import { useParkContext } from '../context/ParkContext';
import { estimateDriveTimeMinutes, formatDriveTime } from '../utils/scoringEngine';
import Icon from './Icon';
import './ParkCard.css';

function mergeRanges(ranges) {
  if (!ranges?.length) return [];
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged = [];
  let [currentStart, currentEnd] = sorted[0];

  for (let i = 1; i < sorted.length; i += 1) {
    const [start, end] = sorted[i];
    if (start <= currentEnd + 1) {
      currentEnd = Math.max(currentEnd, end);
    } else {
      merged.push([currentStart, currentEnd]);
      currentStart = start;
      currentEnd = end;
    }
  }

  merged.push([currentStart, currentEnd]);
  return merged;
}

function getMatchRanges(matches, key) {
  if (!matches?.length) return [];
  const ranges = matches
    .filter(match => match.key === key && Array.isArray(match.indices))
    .flatMap(match => match.indices);
  return mergeRanges(ranges);
}

function findQueryRanges(text, query) {
  if (!text || !query) return [];
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter(token => token.length >= 2);
  if (!tokens.length) return [];

  const lowerText = text.toLowerCase();
  const ranges = [];
  tokens.forEach(token => {
    const lowerToken = token.toLowerCase();
    let index = 0;
    while (true) {
      const found = lowerText.indexOf(lowerToken, index);
      if (found === -1) break;
      ranges.push([found, found + lowerToken.length - 1]);
      index = found + lowerToken.length;
    }
  });

  return mergeRanges(ranges);
}

function renderHighlighted(text, ranges) {
  if (!ranges?.length) return text;
  const parts = [];
  let lastIndex = 0;

  ranges.forEach(([start, end], idx) => {
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    parts.push(
      <mark key={`match-${start}-${end}-${idx}`} className="match-highlight">
        {text.slice(start, end + 1)}
      </mark>
    );
    lastIndex = end + 1;
  });

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function ParkCard({ park }) {
  const { state, dispatch } = useParkContext();
  const isSelected = state.selectedPark?.slug === park.slug;
  const savedParks = state.savedParks;
  const searchQuery = state.filters.searchQuery;
  const nameMatchRanges = searchQuery
    ? getMatchRanges(park.searchMatches, 'name')
    : [];
  const highlightRanges = nameMatchRanges.length
    ? nameMatchRanges
    : findQueryRanges(park.name, searchQuery);

  const getClassificationColor = (classification) => {
    switch (classification) {
      case 'Recreational':
      case 'Historical':
        return 'var(--primary-500)';
      case 'Natural Environment':
      case 'Nature Reserve':
        return 'var(--secondary-500)';
      case 'Wilderness':
      case 'Waterway':
        return 'var(--accent-500)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  const scorePercentage = park.totalFilters > 0 ? (park.score / (park.totalFilters * 10)) * 100 : 100;
  const isSaved = savedParks.includes(park.slug);

  const handleSelect = () => {
    dispatch({ type: 'SELECT_PARK', payload: park });
    // On mobile, this will also open the detail panel because selectedPark becomes truthy
  };

  const handleToggleSave = (e) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_SAVE_PARK', payload: park.slug });
  };

  return (
    <div
      className={`park-card ${isSelected ? 'selected' : ''} ${park.excluded ? 'excluded' : ''}`}
      onClick={handleSelect}
    >
      <div className="park-card-header">
        <h3 className="park-card-name">
          {searchQuery ? renderHighlighted(park.name, highlightRanges) : park.name}
        </h3>
        <button
          type="button"
          className={`park-card-save ${isSaved ? 'saved' : ''}`}
          onClick={handleToggleSave}
          aria-label={isSaved ? `Remove ${park.name} from saved list` : `Save ${park.name} to list`}
          aria-pressed={isSaved}
          title={isSaved ? 'Remove from saved' : 'Save to list'}
        >
          <Icon name={isSaved ? 'bookmarkFilled' : 'bookmark'} size={14} />
        </button>
      </div>

      <div className="park-card-meta">
        <span
          className="park-card-classification"
          style={{ color: getClassificationColor(park.classification) }}
        >
          {park.classification}
        </span>
        {park.distance !== undefined && park.distance !== null && (
          <span className="park-card-distance">
            <Icon name="map-pin" size={12} /> {Math.round(park.distance)} km
            {(() => {
              const driveMins = estimateDriveTimeMinutes(park.distance);
              const driveStr = formatDriveTime(driveMins);
              return driveStr ? (
                <span className="park-card-drive" title="Estimated driving time">
                  · {driveStr}
                </span>
              ) : null;
            })()}
          </span>
        )}
      </div>

      {park.totalFilters > 0 && (
        <div className="park-card-score">
          <span className="park-card-score-label">Match Score</span>
          <div className="score-bar">
            <div className="score-bar-fill" style={{ width: `${Math.min(100, Math.max(0, scorePercentage))}%` }} />
          </div>
        </div>
      )}

      <div className="park-card-icons">
        {(park.legendAmenities
          ? park.legendAmenities.slice(0, 4)
          : park.activities?.slice(0, 4).map(a => ({ label: a, icon: null }))
        ).map(item => (
          <div
            key={item.label}
            className="park-card-icon"
            title={item.label}
          >
            {item.icon ? (
              <img
                src={`/legend-icons/${item.icon}`}
                alt={item.label}
                className="park-card-icon-img"
                loading="lazy"
              />
            ) : (
              <Icon name={item.label} />
            )}
          </div>
        ))}
        {(() => {
          const total = park.legendAmenities
            ? park.legendAmenities.length
            : park.activities?.length || 0;
          return total > 4 ? (
            <div className="park-card-more">+{total - 4}</div>
          ) : null;
        })()}
      </div>
    </div>
  );
}

export default ParkCard;
