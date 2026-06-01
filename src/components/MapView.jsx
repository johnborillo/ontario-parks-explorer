import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useParkContext } from '../context/ParkContext.jsx';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Fix Leaflet's default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const THEME_STYLES = {
  campfire: {
    tiles: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    },
    colors: {
      Wilderness: '#7cc4e3',
      Waterway: '#7cc4e3',
      'Natural Environment': '#6fb38a',
      'Nature Reserve': '#6fb38a',
      Recreational: '#e0a84b',
      Historical: '#e0a84b',
      default: '#6fb38a',
    },
  },
  atlas: {
    tiles: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    },
    colors: {
      Wilderness: '#2f6d8c',
      Waterway: '#2f6d8c',
      'Natural Environment': '#3f7d5a',
      'Nature Reserve': '#3f7d5a',
      Recreational: '#c0712a',
      Historical: '#c0712a',
      default: '#3f7d5a',
    },
  },
  ranger: {
    tiles: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    },
    colors: {
      Wilderness: '#4b6b8f',
      Waterway: '#4b6b8f',
      'Natural Environment': '#4a7a5a',
      'Nature Reserve': '#4a7a5a',
      Recreational: '#d37a2a',
      Historical: '#d37a2a',
      default: '#4a7a5a',
    },
  },
};

/**
 * Sub-component that handles fly-to animation when a park is selected
 */
function FlyToSelected({ selectedPark }) {
  const map = useMap();

  useEffect(() => {
    if (selectedPark?.coordinates) {
      map.flyTo(
        [selectedPark.coordinates.lat, selectedPark.coordinates.lng],
        10,
        { duration: 1.2, easeLinearity: 0.25 }
      );
    }
  }, [selectedPark, map]);

  return null;
}

/**
 * Custom user location marker with pulsing effect
 */
function UserLocationMarker({ position }) {
  if (!position) return null;

  const userIcon = L.divIcon({
    className: 'user-marker-wrapper',
    html: '<div class="user-marker"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <Marker position={[position.lat, position.lng]} icon={userIcon}>
      <Popup>
        <div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
          <strong>Your Location</strong>
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapView({ theme }) {
  const { state, dispatch } = useParkContext();
  const { filteredParks, selectedPark, userLocation } = state;
  const themeStyle = THEME_STYLES[theme] || THEME_STYLES.campfire;

  const handleParkClick = (park) => {
    dispatch({ type: 'SELECT_PARK', payload: park });
  };

  // Determine which parks are "active" (matching filters)
  const hasActiveFilters = state.filters.searchQuery ||
    state.filters.activities.length > 0 ||
    state.filters.facilities.length > 0 ||
    state.filters.campsiteTypes.length > 0 ||
    state.filters.scenery.length > 0 ||
    state.filters.classification;

  return (
    <div className="map-container">
      <MapContainer
        center={[49.5, -84.5]}
        zoom={6}
        zoomControl={true}
        attributionControl={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          key={themeStyle.tiles.url}
          attribution={themeStyle.tiles.attribution}
          url={themeStyle.tiles.url}
          maxZoom={19}
        />

        <FlyToSelected selectedPark={selectedPark} />
        <UserLocationMarker position={userLocation} />

        {filteredParks.map((park) => {
          if (!park.coordinates) return null;
          const isSelected = selectedPark?.slug === park.slug;
          const isDimmed = hasActiveFilters && (park.excluded || park.score <= 0);
          const color = themeStyle.colors[park.classification] || themeStyle.colors.default;

          return (
            <CircleMarker
              key={park.slug}
              center={[park.coordinates.lat, park.coordinates.lng]}
              radius={isSelected ? 12 : 8}
              pathOptions={{
                fillColor: color,
                fillOpacity: isDimmed ? 0.15 : 0.85,
                color: isSelected ? '#e8e4de' : color,
                weight: isSelected ? 3 : 2,
                opacity: isDimmed ? 0.2 : 1,
              }}
              eventHandlers={{
                click: () => handleParkClick(park),
              }}
            >
              <Popup>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                }}>
                  {park.name}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  marginTop: '2px',
                }}>
                  {park.classification}
                  {park.distance != null && ` · ${park.distance} km`}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <div className="map-legend">
        <div className="map-legend-item">
          <div className="map-legend-dot wilderness" />
          <span>Wilderness</span>
        </div>
        <div className="map-legend-item">
          <div className="map-legend-dot natural-environment" />
          <span>Natural Environment</span>
        </div>
        <div className="map-legend-item">
          <div className="map-legend-dot recreational" />
          <span>Recreational</span>
        </div>
      </div>
    </div>
  );
}
