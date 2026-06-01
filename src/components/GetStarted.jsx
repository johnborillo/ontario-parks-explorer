import { useState, useEffect, useMemo } from 'react';
import { useParkContext } from '../context/ParkContext';
import Icon from './Icon';
import './GetStarted.css';

const STORAGE_KEY = 'op-getstarted-answers';
const VISITED_KEY = 'op-getstarted-visited';

const tripTypes = [
  {
    id: 'chill',
    label: 'Chill Weekend',
    description: 'Relaxed pace, comfortable amenities, scenic views',
    icon: 'leaf',
    preset: {
      activities: [],
      facilities: ['comfort-station'],
      scenery: ['lake-views'],
      campsiteTypes: ['electrical'],
    },
  },
  {
    id: 'adventure',
    label: 'Active Adventure',
    description: 'Hiking, paddling, exploring — high energy trip',
    icon: 'mountain',
    preset: {
      activities: ['hiking', 'canoeing'],
      facilities: [],
      scenery: ['forest'],
      campsiteTypes: ['backcountry'],
    },
  },
  {
    id: 'family',
    label: 'Family Camping',
    description: 'Kid-friendly with activities and easy access',
    icon: 'users',
    preset: {
      activities: ['swimming', 'hiking', 'fishing'],
      facilities: ['comfort-station', 'playground', 'visitor-centre'],
      scenery: ['beach', 'lake-views'],
      campsiteTypes: ['electrical', 'car-camping'],
    },
  },
  {
    id: 'group',
    label: 'Group Trip',
    description: 'Larger sites, social spaces, good facilities',
    icon: 'users',
    preset: {
      activities: ['swimming', 'canoeing'],
      facilities: ['comfort-station', 'boat-launch'],
      scenery: ['lake-views'],
      campsiteTypes: ['group', 'electrical'],
    },
  },
  {
    id: 'solo',
    label: 'Solo Retreat',
    description: 'Quiet, remote, introspective — back to nature',
    icon: 'tree',
    preset: {
      activities: ['hiking', 'wildlife-viewing'],
      facilities: [],
      scenery: ['forest', 'river'],
      campsiteTypes: ['backcountry'],
    },
  },
];

const activityChoices = [
  { id: 'hiking', label: 'Hiking' },
  { id: 'canoeing', label: 'Canoeing' },
  { id: 'kayaking', label: 'Kayaking' },
  { id: 'fishing', label: 'Fishing' },
  { id: 'swimming', label: 'Swimming' },
  { id: 'biking', label: 'Biking' },
  { id: 'mountain-biking', label: 'Mountain Biking' },
  { id: 'cross-country-skiing', label: 'Cross-country Skiing' },
  { id: 'snowshoeing', label: 'Snowshoeing' },
  { id: 'wildlife-viewing', label: 'Wildlife Viewing' },
  { id: 'birding', label: 'Birding' },
  { id: 'photography', label: 'Photography' },
  { id: 'picnicking', label: 'Picnicking' },
  { id: 'horseback-riding', label: 'Horseback Riding' },
  { id: 'rock-climbing', label: 'Rock Climbing' },
  { id: 'stargazing', label: 'Stargazing' },
];

const sceneryChoices = [
  { id: 'lake-views', label: 'Lake Views' },
  { id: 'forest', label: 'Forest' },
  { id: 'river', label: 'River' },
  { id: 'beach', label: 'Beach' },
  { id: 'waterfall', label: 'Waterfall' },
  { id: 'rock-formations', label: 'Cliffs & Rocks' },
];

const facilityChoices = [
  { id: 'comfort-station', label: 'Flush Toilets' },
  { id: 'electrical', label: 'Electrical Sites' },
  { id: 'boat-launch', label: 'Boat Launch' },
  { id: 'visitor-centre', label: 'Visitor Centre' },
  { id: 'park-store', label: 'Park Store' },
  { id: 'pet-exercise-area', label: 'Pet Friendly' },
  { id: 'barrier-free', label: 'Accessible' },
  { id: 'playground', label: 'Playground' },
  { id: 'shower', label: 'Showers' },
  { id: 'wifi', label: 'Wi-Fi' },
];

const distanceOptions = [
  { value: 100, label: 'Close to home', desc: 'Within ~1 hour' },
  { value: 200, label: 'Half-day drive', desc: 'Within ~2 hours' },
  { value: 350, label: 'Weekend trip', desc: 'Within ~4 hours' },
  { value: 500, label: 'Any distance', desc: 'Show all parks' },
];

const steps = [
  { id: 'trip', title: 'What kind of trip?', subtitle: 'Pick the vibe that best matches your plan' },
  { id: 'activities', title: 'What activities matter most?', subtitle: 'Select any that interest you (or skip)' },
  { id: 'scenery', title: 'What scenery are you after?', subtitle: 'Pick the landscapes you want to wake up to' },
  { id: 'distance', title: 'How far will you go?', subtitle: 'We will prioritize parks within this radius' },
  { id: 'mustHaves', title: 'Any must-haves?', subtitle: 'Deal-breakers that your park must include' },
];

function loadInitialAnswers() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore storage errors
  }
  return null;
}

function GetStarted({ open, onClose }) {
  const { state, dispatch } = useParkContext();
  const { parks, userLocation } = state;

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState(() => {
    const stored = loadInitialAnswers();
    return (
      stored || {
        tripType: null,
        activities: [],
        scenery: [],
        distance: 350,
        mustHaves: [],
      }
    );
  });

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  // Reset to first step whenever the modal opens
  useEffect(() => {
    if (open) {
      setStepIndex(0);
    }
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Apply the trip-type preset (merged with current selections)
  const selectTripType = (trip) => {
    setAnswers((prev) => ({
      ...prev,
      tripType: trip.id,
      activities: [...new Set([...prev.activities, ...(trip.preset.activities || [])])],
      scenery: [...new Set([...prev.scenery, ...(trip.preset.scenery || [])])],
      mustHaves: [...new Set([...prev.mustHaves, ...(trip.preset.facilities || [])])],
    }));
  };

  const toggleArrayItem = (key, value) => {
    setAnswers((prev) => {
      const list = prev[key];
      const next = list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];
      return { ...prev, [key]: next };
    });
  };

  const handleDistanceSelect = (value) => {
    setAnswers((prev) => ({ ...prev, distance: value }));
  };

  // Live preview: compute how many parks would match the current step's answers
  const previewCount = useMemo(() => {
    const distance = answers.distance;
    if (!userLocation || !parks.length) return null;

    return parks.filter((park) => {
      if (!park.coordinates) return true;

      // Activities: park must have at least one selected
      if (answers.activities.length > 0) {
        const hasAny = answers.activities.some((a) => park.activities?.includes(a));
        if (!hasAny) return false;
      }

      // Scenery: park must have at least one selected
      if (answers.scenery.length > 0) {
        const hasAny = answers.scenery.some((s) => park.scenery?.includes(s));
        if (!hasAny) return false;
      }

      // Must-haves: ALL must be present
      if (answers.mustHaves.length > 0) {
        const allPresent = answers.mustHaves.every((m) =>
          park.facilities?.includes(m) || park.campsiteTypes?.includes(m)
        );
        if (!allPresent) return false;
      }

      // Distance (skip if "any distance")
      if (distance < 500) {
        // rough haversine without bringing in scoring engine
        const R = 6371;
        const toRad = (d) => (d * Math.PI) / 180;
        const dLat = toRad(park.coordinates.lat - userLocation.lat);
        const dLng = toRad(park.coordinates.lng - userLocation.lng);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(userLocation.lat)) *
            Math.cos(toRad(park.coordinates.lat)) *
            Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const km = R * c;
        if (km > distance) return false;
      }

      return true;
    }).length;
  }, [answers, parks, userLocation]);

  const handleNext = () => {
    if (isLastStep) {
      applyAnswers();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      onClose();
    } else {
      setStepIndex((i) => i - 1);
    }
  };

  const applyAnswers = () => {
    // Merge trip-type preset filters + current selections, then dispatch
    const trip = tripTypes.find((t) => t.id === answers.tripType);
    const baseActivities = trip?.preset.activities || [];
    const baseScenery = trip?.preset.scenery || [];
    const baseFacilities = trip?.preset.facilities || [];

    const mergedActivities = [...new Set([...baseActivities, ...answers.activities])];
    const mergedScenery = [...new Set([...baseScenery, ...answers.scenery])];
    const mergedFacilities = [...new Set([...baseFacilities, ...answers.mustHaves])];

    dispatch({
      type: 'SET_FILTERS',
      payload: {
        activities: mergedActivities,
        scenery: mergedScenery,
        facilities: mergedFacilities,
        distance: answers.distance,
        strictMode: false,
        classification: '',
        searchQuery: '',
      },
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
      localStorage.setItem(VISITED_KEY, 'true');
    } catch {
      // Ignore storage errors
    }

    onClose();
  };

  const handleSkip = () => {
    try {
      localStorage.setItem(VISITED_KEY, 'true');
    } catch {
      // Ignore storage errors
    }
    onClose();
  };

  const handleReset = () => {
    setAnswers({
      tripType: null,
      activities: [],
      scenery: [],
      distance: 350,
      mustHaves: [],
    });
  };

  if (!open) return null;

  const totalSteps = steps.length;
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <div className="getstarted-overlay" role="dialog" aria-modal="true" aria-labelledby="getstarted-title">
      <div className="getstarted-backdrop" onClick={handleSkip} />

      <div className="getstarted-modal">
        <button
          type="button"
          className="getstarted-close"
          onClick={handleSkip}
          aria-label="Close"
        >
          <Icon name="close" size={18} />
        </button>

        <div className="getstarted-progress" aria-hidden="true">
          <div
            className="getstarted-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="getstarted-step-counter">
          Step {stepIndex + 1} of {totalSteps}
        </div>

        <div className="getstarted-content">
          <h2 id="getstarted-title" className="getstarted-title">{currentStep.title}</h2>
          <p className="getstarted-subtitle">{currentStep.subtitle}</p>

          {currentStep.id === 'trip' && (
            <div className="getstarted-trip-grid">
              {tripTypes.map((trip) => (
                <button
                  key={trip.id}
                  type="button"
                  className={`getstarted-trip-card ${answers.tripType === trip.id ? 'selected' : ''}`}
                  onClick={() => selectTripType(trip)}
                >
                  <div className="getstarted-trip-icon">
                    <Icon name={trip.icon} size={28} />
                  </div>
                  <div className="getstarted-trip-label">{trip.label}</div>
                  <div className="getstarted-trip-desc">{trip.description}</div>
                </button>
              ))}
            </div>
          )}

          {currentStep.id === 'activities' && (
            <div className="getstarted-choice-grid">
              {activityChoices.map((choice) => (
                <label
                  key={choice.id}
                  className={`getstarted-choice ${answers.activities.includes(choice.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={answers.activities.includes(choice.id)}
                    onChange={() => toggleArrayItem('activities', choice.id)}
                  />
                  <span className="getstarted-choice-check" aria-hidden="true" />
                  <span className="getstarted-choice-label">{choice.label}</span>
                </label>
              ))}
            </div>
          )}

          {currentStep.id === 'scenery' && (
            <div className="getstarted-choice-grid">
              {sceneryChoices.map((choice) => (
                <label
                  key={choice.id}
                  className={`getstarted-choice ${answers.scenery.includes(choice.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={answers.scenery.includes(choice.id)}
                    onChange={() => toggleArrayItem('scenery', choice.id)}
                  />
                  <span className="getstarted-choice-check" aria-hidden="true" />
                  <span className="getstarted-choice-label">{choice.label}</span>
                </label>
              ))}
            </div>
          )}

          {currentStep.id === 'distance' && (
            <div className="getstarted-distance-grid">
              {distanceOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`getstarted-distance-card ${answers.distance === opt.value ? 'selected' : ''}`}
                  onClick={() => handleDistanceSelect(opt.value)}
                >
                  <div className="getstarted-distance-label">{opt.label}</div>
                  <div className="getstarted-distance-desc">{opt.desc}</div>
                </button>
              ))}
            </div>
          )}

          {currentStep.id === 'mustHaves' && (
            <div className="getstarted-choice-grid">
              {facilityChoices.map((choice) => (
                <label
                  key={choice.id}
                  className={`getstarted-choice ${answers.mustHaves.includes(choice.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={answers.mustHaves.includes(choice.id)}
                    onChange={() => toggleArrayItem('mustHaves', choice.id)}
                  />
                  <span className="getstarted-choice-check" aria-hidden="true" />
                  <span className="getstarted-choice-label">{choice.label}</span>
                </label>
              ))}
            </div>
          )}

          {previewCount !== null && (
            <div className="getstarted-preview">
              <Icon name="compass" size={14} />
              <span>
                <strong>{previewCount}</strong> {previewCount === 1 ? 'park matches' : 'parks match'} so far
              </span>
            </div>
          )}
        </div>

        <div className="getstarted-footer">
          <button
            type="button"
            className="getstarted-btn getstarted-btn-ghost"
            onClick={stepIndex === 0 ? handleSkip : handleBack}
          >
            {stepIndex === 0 ? 'Skip' : 'Back'}
          </button>

          <button
            type="button"
            className="getstarted-btn getstarted-btn-text"
            onClick={handleReset}
          >
            Reset
          </button>

          <button
            type="button"
            className="getstarted-btn getstarted-btn-primary"
            onClick={handleNext}
          >
            {isLastStep ? 'Show My Parks' : 'Next'}
            {!isLastStep && <Icon name="chevronRight" size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GetStarted;
