import { CAT_LOCATIONS, type CatLocationCategory } from '../data/catLocations';

type CategoryPopupProps = {
  category: CatLocationCategory | null;
  onSelectLocation: (name: string) => void;
  onClose: () => void;
};

function categoryTitle(category: CatLocationCategory) {
  if (category === 'real') {
    return 'Real Cats';
  }

  if (category === 'fictional') {
    return 'Fictional Cats';
  }

  return 'Cat Breeds';
}

export function CategoryPopup({ category, onSelectLocation, onClose }: CategoryPopupProps) {
  if (!category) {
    return null;
  }

  const locations = CAT_LOCATIONS.filter((location) => location.category === category);

  return (
    <aside
      className={`cat-popup category-popup cat-popup-${category}`}
      role="dialog"
      aria-modal="false"
      aria-label={`${categoryTitle(category)} list`}
    >
      <header className="cat-popup-header">
        <div>
          <p className="cat-popup-category">Category</p>
          <h2 className="cat-popup-title">{categoryTitle(category)}</h2>
        </div>
        <button type="button" className="cat-popup-close" onClick={onClose} aria-label="Close category list">
          Close
        </button>
      </header>

      <section className="cat-popup-section" aria-label={`${categoryTitle(category)} entries`}>
        <h3>Current entries</h3>
        <ul className="category-popup-list">
          {locations.map((location) => (
            <li key={`${location.category}-${location.name}`}>
              <button
                type="button"
                className="category-popup-item"
                onClick={() => onSelectLocation(location.name)}
              >
                <span className="search-result-media" aria-hidden="true">
                  <span className={`search-result-badge search-result-badge-${location.category}`} />
                  <img
                    className="search-result-image"
                    src={location.imageUrl ?? location.iconUrl}
                    alt=""
                    loading="lazy"
                  />
                </span>
                <span className="category-popup-item-copy">
                  <span className="category-popup-item-name">{location.name}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}