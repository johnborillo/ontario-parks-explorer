import { useState, useEffect } from 'react';
import { useParkContext } from '../context/ParkContext';
import Icon from './Icon';
import { estimateDriveTimeMinutes, formatDriveTime } from '../utils/scoringEngine';
import { categorizeLegendAmenities } from '../utils/legendCategories';
import NearbyAttractions from './NearbyAttractions';
import './ParkDetailPanel.css';

// Maps each park classification to a CSS color variable. Used to colour the
// "Type" badge in the detail panel header so the badge background matches
// the park category.
function getClassificationColor(c) {
  switch (c) {
    case 'Wilderness':
      return 'var(--accent-500)';
    case 'Natural Environment':
      return 'var(--secondary-500)';
    case 'Recreational':
      return 'var(--primary-500)';
    case 'Waterway':
      return 'var(--accent-500)';
    case 'Nature Reserve':
      return '#7c5db5';
    case 'Historical':
      return '#a45a3a';
    default:
      return 'var(--text-tertiary)';
  }
}

function ParkDetailPanel() {
  const { state, dispatch } = useParkContext();
  const park = state.selectedPark;
  const { userLocation, locationLabel, savedParks } = state;

  const [imageErrored, setImageErrored] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reset image state when the selected park changes
  useEffect(() => {
    setImageErrored(false);
    setGalleryOpen(false);
    setActiveImageIndex(0);
  }, [park?.slug]);

  if (!park) return null;

  const distance = park.distance;
  const driveMinutes = distance != null ? estimateDriveTimeMinutes(distance) : null;
  const driveStr = formatDriveTime(driveMinutes);

  const closePanel = () => {
    dispatch({ type: 'SELECT_PARK', payload: null });
  };

  // Build srcset for the hero image
  const srcset = park.heroImageSrcset
    ? Object.entries(park.heroImageSrcset)
        .map(([size, url]) => `${url} ${size}w`)
        .join(', ')
    : null;
  const heroUrl = park.heroImage || (park.photoUrls && park.photoUrls[0]) || null;
  const gallery = park.galleryImages || [];
  const allImages = heroUrl ? [heroUrl, ...gallery] : gallery;

  return (
    <div className="park-detail">
      <div className="detail-header">
        <button className="close-btn" onClick={closePanel}>×</button>
        {heroUrl && !imageErrored && (
          <img
            className="hero-image"
            src={heroUrl}
            srcSet={srcset}
            sizes="(max-width: 600px) 480px, (max-width: 1200px) 768px, 1200px"
            alt={park.name}
            loading="eager"
            decoding="async"
            onError={() => setImageErrored(true)}
          />
        )}
        {imageErrored && (
          <div className="hero-image hero-image-fallback">
            <Icon name="mountain" size={48} />
          </div>
        )}
        <div className="header-content">
          <div className="header-badges">
            <div className="header-badge-group">
              <span className="badge-prefix">Type</span>
              <span
                className="classification-badge"
                style={{ '--badge-color': getClassificationColor(park.classification) }}
              >
                {park.classification}
              </span>
            </div>
            <div className="header-badge-group">
              <span className="badge-prefix">Status</span>
              <ReservableBadge park={park} />
            </div>
          </div>
          <h2>{park.name}</h2>
          <p className="region">{park.region}</p>
        </div>
      </div>

      <div className="detail-content">
        <p className="summary">{park.summary}</p>

        <div className="action-buttons">
          {park.reservableCamping && park.reservationUrl && (
            <a href={park.reservationUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
              Check Availability
            </a>
          )}
          {park.reservable && !park.reservableCamping && park.reservationUrl && (
            <a href={park.reservationUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
              Reserve on Ontario Parks
            </a>
          )}
          {!park.reservable && park.parkPageUrl && (
            <a href={park.parkPageUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
              View Park Info
            </a>
          )}
          {park.parkPageUrl && (
            <a href={park.parkPageUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
              Ontario Parks Site
            </a>
          )}
          <button
            type="button"
            className={`btn ${savedParks.includes(park.slug) ? 'btn-saved' : 'btn-outline'}`}
            onClick={() => dispatch({ type: 'TOGGLE_SAVE_PARK', payload: park.slug })}
            aria-pressed={savedParks.includes(park.slug)}
          >
            <Icon name={savedParks.includes(park.slug) ? 'bookmarkFilled' : 'bookmark'} size={14} />
            {savedParks.includes(park.slug) ? 'Saved' : 'Save'}
          </button>
        </div>

        {distance != null && (
          <div className="distance-info">
            <div className="distance-info-item">
              <Icon name="map-pin" size={14} />
              <div>
                <div className="distance-info-value">{Math.round(distance)} km</div>
                <div className="distance-info-label">
                  from {locationLabel || 'your location'}
                </div>
              </div>
            </div>
            {driveStr && (
              <div className="distance-info-item">
                <Icon name="navigation" size={14} />
                <div>
                  <div className="distance-info-value">{driveStr}</div>
                  <div className="distance-info-label">est. driving time</div>
                </div>
              </div>
            )}
          </div>
        )}

        {gallery.length > 0 && (
          <div className="info-section">
            <div className="gallery-header">
              <h3>Photos</h3>
              <button
                type="button"
                className="btn btn-text"
                onClick={() => { setActiveImageIndex(1); setGalleryOpen(true); }}
              >
                View all ({gallery.length})
              </button>
            </div>
            <div className="gallery-strip">
              {gallery.slice(0, 5).map((url, i) => (
                <button
                  key={url}
                  type="button"
                  className="gallery-thumb"
                  onClick={() => { setActiveImageIndex(i + 1); setGalleryOpen(true); }}
                  aria-label={`View photo ${i + 2} of ${allImages.length}`}
                >
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.opacity = '0.3'; }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {galleryOpen && (
          <GalleryModal
            images={allImages}
            parkName={park.name}
            activeIndex={activeImageIndex}
            onClose={() => setGalleryOpen(false)}
            onChange={setActiveImageIndex}
          />
        )}

        {park.legendAmenities && park.legendAmenities.length > 0 ? (
          <LegendSection park={park} />
        ) : (
          <>
            {park.campsiteTypes && park.campsiteTypes.length > 0 && (
              <div className="info-section">
                <h3>Camping & Lodging</h3>
                <div className="icon-grid">
                  {park.campsiteTypes.map(type => {
                    const getCampsiteIcon = (t) => {
                      if (t.includes('backcountry')) return 'compass';
                      if (t.includes('roofed') || t.includes('cabin') || t.includes('yurt')) return 'cabin';
                      if (t.includes('group')) return 'users';
                      if (t.includes('rv')) return 'navigation';
                      return 'tent';
                    };
                    return (
                      <div key={type} className="icon-item">
                        <Icon name={getCampsiteIcon(type)} />
                        <span>{type.replace(/-/g, ' ')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {park.activities && park.activities.length > 0 && (
              <div className="info-section">
                <h3>Activities</h3>
                <div className="icon-grid">
                  {park.activities.map(act => (
                    <div key={act} className="icon-item">
                      <Icon name={act} />
                      <span>{act.replace(/-/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {park.facilities && park.facilities.length > 0 && (
              <div className="info-section">
                <h3>Facilities</h3>
                <div className="icon-grid">
                  {park.facilities.map(fac => (
                    <div key={fac} className="icon-item">
                      <Icon name={fac} />
                      <span>{fac.replace(/-/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="info-section-subtitle">
              Amenities from ontarioparks.ca — may include things not in the reservation system
            </p>
          </>
        )}

        <NearbyAttractions park={park} />
      </div>
    </div>
  );
}

/**
 * Renders the legend amenities grouped by category (Activities, Facilities,
 * Campsite Types). Uses the official PNG icons from the reservation system.
 * Shows an "Official" badge so users know this is authoritative data.
 */
/**
 * Renders the booking-status badge for a park.
 *
 * - Camping available (most common): green "Reservable" badge
 * - Other reservation types only (backcountry, day-use, roofed, group, backcountry reg): muted badge listing what's available
 * - No reservations: muted "Day use only" badge
 */
function ReservableBadge({ park }) {
  if (park.reservableCamping) {
    return (
      <span
        className="reservable-badge badge-reservable"
        title="Camping available to book on the Ontario Parks reservation system"
      >
        <Icon name="check" size={11} />
        Reservable
      </span>
    );
  }

  // Park supports reservations but NOT camping — show what it does support
  const otherOptions = [];
  if (park.reservableRoofed) otherOptions.push('Roofed');
  if (park.reservableBackcountry) otherOptions.push('Backcountry');
  if (park.reservableBackcountryReg) otherOptions.push('Backcountry Reg.');
  if (park.reservableGroupCamping) otherOptions.push('Group');
  if (park.reservableDayUse) otherOptions.push('Day Use');

  if (otherOptions.length > 0) {
    const label = otherOptions.length === 1 ? otherOptions[0] : `${otherOptions.length} options`;
    return (
      <span
        className="reservable-badge badge-other-reservation"
        title={`Reservable for: ${otherOptions.join(', ')} (no car camping)`}
      >
        <Icon name="info" size={11} />
        {label}
      </span>
    );
  }

  // No online reservations at all
  return (
    <span
      className="reservable-badge badge-day-use"
      title="This park has no online reservations — typically a day-use or undeveloped park"
    >
      <Icon name="info" size={11} />
      Day use only
    </span>
  );
}

function LegendSection({ park }) {
  // Build a label -> icon lookup for fast rendering
  const iconByLabel = {};
  for (const item of park.legendAmenities) {
    iconByLabel[item.label] = item.icon;
  }

  const { activities, facilities, campsiteTypes } = categorizeLegendAmenities(park.legendAmenities);

  const renderGroup = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="info-section">
        <h3>{title}</h3>
        <div className="legend-grid">
          {items.map(label => {
            const icon = iconByLabel[label];
            return (
              <div key={label} className="legend-item" title={label}>
                {icon && (
                  <img
                    src={`/legend-icons/${icon}`}
                    alt=""
                    className="legend-item-icon"
                    loading="lazy"
                  />
                )}
                <span className="legend-item-label">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="info-section legend-section">
      <div className="legend-section-header">
        <h3>Park Amenities</h3>
        <span className="legend-official-badge" title="Data from Ontario Parks reservation system">
          ✓ Official
        </span>
      </div>
      {renderGroup('Activities', activities)}
      {renderGroup('Facilities', facilities)}
      {renderGroup('Campsite Types', campsiteTypes)}
    </div>
  );
}

export default ParkDetailPanel;

/**
 * Lightbox gallery that shows all photos for a park. Keyboard nav (left/right
 * arrows, Esc) and click on backdrop closes. Prevents body scroll while open.
 */
function GalleryModal({ images, parkName, activeIndex, onClose, onChange }) {
  // Lock body scroll while open
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onChange((activeIndex - 1 + images.length) % images.length);
      else if (e.key === 'ArrowRight') onChange((activeIndex + 1) % images.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeIndex, images.length, onClose, onChange]);

  if (!images.length) return null;

  const current = images[activeIndex];
  const goPrev = () => onChange((activeIndex - 1 + images.length) % images.length);
  const goNext = () => onChange((activeIndex + 1) % images.length);

  return (
    <div className="gallery-modal" role="dialog" aria-modal="true" aria-label={`Photos of ${parkName}`}>
      <div className="gallery-backdrop" onClick={onClose} />
      <button
        type="button"
        className="gallery-close"
        onClick={onClose}
        aria-label="Close gallery"
      >
        <Icon name="close" size={20} />
      </button>
      <button
        type="button"
        className="gallery-nav gallery-nav-prev"
        onClick={goPrev}
        disabled={images.length <= 1}
        aria-label="Previous photo"
      >
        <Icon name="chevronLeft" size={20} />
      </button>
      <button
        type="button"
        className="gallery-nav gallery-nav-next"
        onClick={goNext}
        disabled={images.length <= 1}
        aria-label="Next photo"
      >
        <Icon name="chevronRight" size={20} />
      </button>
      <figure className="gallery-figure">
        <img
          src={current}
          alt={`${parkName} photo ${activeIndex + 1} of ${images.length}`}
          className="gallery-image"
          decoding="async"
        />
        <figcaption className="gallery-caption">
          {activeIndex + 1} of {images.length}
        </figcaption>
      </figure>
    </div>
  );
}
