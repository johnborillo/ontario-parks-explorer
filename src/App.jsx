import { useEffect, useState } from 'react';
import { useParkContext } from './context/ParkContext';
import MapView from './components/MapView';
import FilterSidebar from './components/FilterSidebar';
import ParkDetailPanel from './components/ParkDetailPanel';
import GetStarted from './components/GetStarted';
import SavedParks from './components/SavedParks';
import './App.css';

const GETSTARTED_VISITED_KEY = 'op-getstarted-visited';

function App() {
  const { state, dispatch } = useParkContext();
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'campfire';
    return localStorage.getItem('op-theme') || 'campfire';
  });
  const [getStartedOpen, setGetStartedOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme === 'atlas' ? 'light' : 'dark';
    try {
      localStorage.setItem('op-theme', theme);
    } catch {
      // Ignore storage errors (private mode or blocked)
    }
  }, [theme]);

  // Auto-open the Get Started questionnaire on first visit only
  useEffect(() => {
    try {
      const visited = localStorage.getItem(GETSTARTED_VISITED_KEY);
      if (!visited) {
        // Small delay so the map has a moment to render behind the modal
        const timer = setTimeout(() => setGetStartedOpen(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  return (
    <div className="app-container">
      <div className={`sidebar-container ${state.sidebarOpen ? 'open' : 'closed'}`}>
        <FilterSidebar
          theme={theme}
          onThemeChange={setTheme}
          onOpenGetStarted={() => setGetStartedOpen(true)}
          onOpenSavedParks={() => dispatch({ type: 'OPEN_SAVED_PARKS' })}
        />
      </div>

      <main className="map-container">
        <MapView theme={theme} />
      </main>

      <div className={`detail-panel-container ${state.selectedPark ? 'open' : 'closed'}`}>
        <ParkDetailPanel />
      </div>

      <GetStarted
        open={getStartedOpen}
        onClose={() => setGetStartedOpen(false)}
      />

      <SavedParks />
    </div>
  );
}

export default App;
