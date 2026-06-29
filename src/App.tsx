import { useMemo, useState } from 'react';
import { CategoryPopup } from './components/CategoryPopup';
import { CatInfoPopup } from './components/CatInfoPopup';
import { Globe } from './components/Globe';
import { CAT_LOCATIONS, type CatLocation, type CatLocationCategory } from './data/catLocations';

function categoryClass(category: CatLocationCategory) {
  if (category === 'real') {
    return 'search-result-badge-real';
  }

  if (category === 'fictional') {
    return 'search-result-badge-fictional';
  }

  return 'search-result-badge-breed';
}

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState<CatLocation | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CatLocationCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return CAT_LOCATIONS.filter((location) =>
      location.name.toLowerCase().includes(normalizedQuery)
    );
  }, [searchQuery]);

  const hasQuery = searchQuery.trim().length > 0;
  const isPopupOpen = selectedLocation !== null || selectedCategory !== null;

  function openLocation(location: CatLocation) {
    setSelectedCategory(null);
    setSelectedLocation(location);
  }

  function handleMarkerSelect(location: CatLocation | null) {
    if (!location) {
      setSelectedLocation(null);
      return;
    }

    openLocation(location);
  }

  function openCategory(category: CatLocationCategory) {
    setSelectedLocation(null);
    setSelectedCategory(category);
  }

  function openLocationByName(name: string) {
    const location = CAT_LOCATIONS.find((entry) => entry.name === name);

    if (!location) {
      return;
    }

    openLocation(location);
  }

  return (
    <main className="app-shell">
      <div className="top-search" role="search">
        <div className="top-search-row">
          <div className="top-search-searchbox">
            <label className="top-search-label" htmlFor="cat-search-input">
              Search Cats & Breeds
            </label>
            <input
              id="cat-search-input"
              className="top-search-input"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Type a name..."
              autoComplete="off"
            />
            {hasQuery ? (
              <div className="top-search-results" aria-label="Search results">
                {searchResults.length > 0 ? (
                  <ul className="top-search-results-list">
                    {searchResults.map((location) => (
                      <li key={`${location.category}-${location.name}`}>
                        <button
                          type="button"
                          className="search-result-button"
                          onClick={() => {
                            openLocation(location);
                            setSearchQuery('');
                          }}
                        >
                          <span className="search-result-media">
                            <span
                              className={`search-result-badge ${categoryClass(location.category)}`}
                              aria-hidden="true"
                            />
                            <img
                              className="search-result-image"
                              src={location.imageUrl ?? location.iconUrl}
                              alt={location.imageAlt ?? `${location.name} thumbnail`}
                              loading="lazy"
                            />
                          </span>
                          <span className="search-result-name">{location.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="top-search-empty">No results found.</p>
                )}
              </div>
            ) : null}
          </div>

          <details className="marker-legend" open>
            <summary className="marker-legend-summary">Markers</summary>
            <ul className="marker-legend-list" aria-label="Marker color legend">
              <li className="marker-legend-item">
                <button type="button" className="marker-legend-button" onClick={() => openCategory('real')}>
                  <span className="marker-dot marker-dot-real" aria-hidden="true" />
                  <span>Real cats</span>
                </button>
              </li>
              <li className="marker-legend-item">
                <button type="button" className="marker-legend-button" onClick={() => openCategory('fictional')}>
                  <span className="marker-dot marker-dot-fictional" aria-hidden="true" />
                  <span>Fictional cats</span>
                </button>
              </li>
              <li className="marker-legend-item">
                <button type="button" className="marker-legend-button" onClick={() => openCategory('breed')}>
                  <span className="marker-dot marker-dot-breed" aria-hidden="true" />
                  <span>Cat breeds</span>
                </button>
              </li>
            </ul>
          </details>
        </div>
      </div>

      <div className={`globe-frame${isPopupOpen ? ' globe-frame-locked' : ''}`}>
        <Globe dataUrl="/data/countries-110m.geojson" onMarkerSelect={handleMarkerSelect} isLocked={isPopupOpen} />
      </div>
      <CategoryPopup
        category={selectedCategory}
        onSelectLocation={openLocationByName}
        onClose={() => setSelectedCategory(null)}
      />
      <CatInfoPopup location={selectedLocation} onClose={() => setSelectedLocation(null)} />
    </main>
  );
}