import { useMemo, useState } from 'react';
import { CategoryPopup } from './components/CategoryPopup';
import { CatInfoPopup } from './components/CatInfoPopup';
import { Globe } from './components/Globe';
import { CAT_LOCATIONS, type CatLocation, type CatLocationCategory, type CatMenuCategory } from './data/catLocations';

const MARKER_CATEGORY_ORDER: CatLocationCategory[] = ['real', 'fictional', 'breed'];

function isAllFiltersSelected(filters: CatLocationCategory[]) {
  return MARKER_CATEGORY_ORDER.every((category) => filters.includes(category));
}

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
  const [selectedCategory, setSelectedCategory] = useState<CatMenuCategory | null>(null);
  const [activeMarkerFilters, setActiveMarkerFilters] = useState<CatLocationCategory[]>(MARKER_CATEGORY_ORDER);
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
  const isInfoPopupOpen = selectedLocation !== null;

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

  function openCategory(category: CatMenuCategory) {
    setSelectedLocation(null);
    setSelectedCategory(category);
  }

  function applyMarkerFilter(category: CatMenuCategory) {
    if (category === 'all') {
      setActiveMarkerFilters((currentFilters) =>
        isAllFiltersSelected(currentFilters) ? [] : MARKER_CATEGORY_ORDER
      );
      return;
    }

    setActiveMarkerFilters((currentFilters) => {
      if (currentFilters.includes(category)) {
        return currentFilters.filter((entry) => entry !== category);
      }

      const nextFilters = [...currentFilters, category];

      return MARKER_CATEGORY_ORDER.filter((entry) => nextFilters.includes(entry));
    });
  }

  function openLocationByName(name: string) {
    const location = CAT_LOCATIONS.find((entry) => entry.name === name);

    if (!location) {
      return;
    }

    openLocation(location);
  }

  function openRandomLocation() {
    if (CAT_LOCATIONS.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * CAT_LOCATIONS.length);
    openLocation(CAT_LOCATIONS[randomIndex]);
  }

  return (
    <main className="app-shell">
      <div className="top-search" role="search">
        <div className="top-search-row">
          <h1 className="top-search-logo">ฅ^•ﻌ•^ฅ Cat World</h1>

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

          <div className="top-search-actions">
            <button
              type="button"
              className="random-cat-button"
              onClick={openRandomLocation}
              aria-label="Open a random cat profile"
              title="Random cat profile"
            >
              <span className="random-cat-button-icon" aria-hidden="true">
                🔀
              </span>
            </button>

            <details className="marker-legend" open>
              <summary className="marker-legend-summary">Markers</summary>
              <ul className="marker-legend-list" aria-label="Marker color legend">
                <li className="marker-legend-item">
                  <div className="marker-legend-item-row">
                    <button type="button" className="marker-legend-button marker-legend-list-button" onClick={() => openCategory('all')}>
                      <span className="marker-dot marker-dot-all" aria-hidden="true" />
                      <span>All cats</span>
                    </button>
                    <button
                      type="button"
                      className={`marker-legend-filter-button${isAllFiltersSelected(activeMarkerFilters) ? ' marker-legend-filter-button-active' : ''}`}
                      onClick={() => applyMarkerFilter('all')}
                      aria-pressed={isAllFiltersSelected(activeMarkerFilters)}
                      aria-label="Filter globe to all cats"
                      title="Show all categories"
                    >
                      {isAllFiltersSelected(activeMarkerFilters) ? '●' : '○'}
                    </button>
                  </div>
                </li>
                <li className="marker-legend-item">
                  <div className="marker-legend-item-row">
                    <button type="button" className="marker-legend-button marker-legend-list-button" onClick={() => openCategory('real')}>
                      <span className="marker-dot marker-dot-real" aria-hidden="true" />
                      <span>Famous cats</span>
                    </button>
                    <button
                      type="button"
                      className={`marker-legend-filter-button${activeMarkerFilters.includes('real') ? ' marker-legend-filter-button-active' : ''}`}
                      onClick={() => applyMarkerFilter('real')}
                      aria-pressed={activeMarkerFilters.includes('real')}
                      aria-label="Filter globe to famous cats"
                      title="Toggle famous cats on globe"
                    >
                      {activeMarkerFilters.includes('real') ? '●' : '○'}
                    </button>
                  </div>
                </li>
                <li className="marker-legend-item">
                  <div className="marker-legend-item-row">
                    <button type="button" className="marker-legend-button marker-legend-list-button" onClick={() => openCategory('fictional')}>
                      <span className="marker-dot marker-dot-fictional" aria-hidden="true" />
                      <span>Fictional cats</span>
                    </button>
                    <button
                      type="button"
                      className={`marker-legend-filter-button${activeMarkerFilters.includes('fictional') ? ' marker-legend-filter-button-active' : ''}`}
                      onClick={() => applyMarkerFilter('fictional')}
                      aria-pressed={activeMarkerFilters.includes('fictional')}
                      aria-label="Filter globe to fictional cats"
                      title="Toggle fictional cats on globe"
                    >
                      {activeMarkerFilters.includes('fictional') ? '●' : '○'}
                    </button>
                  </div>
                </li>
                <li className="marker-legend-item">
                  <div className="marker-legend-item-row">
                    <button type="button" className="marker-legend-button marker-legend-list-button" onClick={() => openCategory('breed')}>
                      <span className="marker-dot marker-dot-breed" aria-hidden="true" />
                      <span>Cat breeds</span>
                    </button>
                    <button
                      type="button"
                      className={`marker-legend-filter-button${activeMarkerFilters.includes('breed') ? ' marker-legend-filter-button-active' : ''}`}
                      onClick={() => applyMarkerFilter('breed')}
                      aria-pressed={activeMarkerFilters.includes('breed')}
                      aria-label="Filter globe to cat breeds"
                      title="Toggle cat breeds on globe"
                    >
                      {activeMarkerFilters.includes('breed') ? '●' : '○'}
                    </button>
                  </div>
                </li>
              </ul>
            </details>
          </div>
        </div>
      </div>

      <div className={`globe-frame${isInfoPopupOpen ? ' globe-frame-locked' : ''}`}>
        <Globe
          dataUrl="/data/countries-110m.geojson"
          onMarkerSelect={handleMarkerSelect}
          isLocked={isInfoPopupOpen}
          markerFilters={activeMarkerFilters}
        />
      </div>
      <CategoryPopup
        category={selectedCategory}
        onSelectLocation={openLocationByName}
        onClose={() => setSelectedCategory(null)}
      />
      <CatInfoPopup
        location={selectedLocation}
        onSelectLocation={openLocationByName}
        onClose={() => setSelectedLocation(null)}
      />
    </main>
  );
}