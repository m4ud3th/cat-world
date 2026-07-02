import { useEffect, useMemo, useRef, useState } from 'react';
import { CAT_LOCATIONS, type CatMenuCategory } from '../data/catLocations';

type AllCatsSortMode = 'alphabetical' | 'category';

type CategoryPopupProps = {
  category: CatMenuCategory | null;
  onSelectLocation: (name: string) => void;
  onClose: () => void;
};

function categoryTitle(category: CatMenuCategory) {
  if (category === 'all') {
    return 'All Cats';
  }

  if (category === 'real') {
    return 'Famous Cats';
  }

  if (category === 'fictional') {
    return 'Fictional Cats';
  }

  return 'Cat Breeds';
}

export function CategoryPopup({ category, onSelectLocation, onClose }: CategoryPopupProps) {
  const [allCatsSortMode, setAllCatsSortMode] = useState<AllCatsSortMode>('alphabetical');
  const popupRef = useRef<HTMLElement | null>(null);
  const isOutsideCloseArmedRef = useRef(false);

  useEffect(() => {
    if (!category) {
      return;
    }

    isOutsideCloseArmedRef.current = false;
    const armTimeout = window.setTimeout(() => {
      isOutsideCloseArmedRef.current = true;
    }, 0);

    const handlePointerDown = (event: PointerEvent) => {
      if (!isOutsideCloseArmedRef.current) {
        return;
      }

      if (!popupRef.current) {
        return;
      }

      const target = event.target;
      if (target instanceof Node && !popupRef.current.contains(target)) {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.clearTimeout(armTimeout);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [category, onClose]);

  const locations = useMemo(() => {
    if (!category) {
      return [];
    }

    if (category !== 'all') {
      return CAT_LOCATIONS.filter((location) => location.category === category);
    }

    const byName = [...CAT_LOCATIONS].sort((first, second) =>
      first.name.localeCompare(second.name, undefined, { sensitivity: 'base' })
    );

    if (allCatsSortMode === 'alphabetical') {
      return byName;
    }

    const categoryOrder = {
      real: 0,
      fictional: 1,
      breed: 2
    } as const;

    return [...CAT_LOCATIONS].sort((first, second) => {
      const categoryDifference = categoryOrder[first.category] - categoryOrder[second.category];

      if (categoryDifference !== 0) {
        return categoryDifference;
      }

      return first.name.localeCompare(second.name, undefined, { sensitivity: 'base' });
    });
  }, [allCatsSortMode, category]);

  if (!category) {
    return null;
  }

  return (
    <aside
      ref={popupRef}
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
          X
        </button>
      </header>

      <section className="cat-popup-section" aria-label={`${categoryTitle(category)} entries`}>
        <div className="category-popup-section-head">
          <h3>Current entries</h3>
          {category === 'all' ? (
            <label className="category-popup-sort" htmlFor="all-cats-sort">
              <span>Sort</span>
              <select
                id="all-cats-sort"
                className="category-popup-sort-select"
                value={allCatsSortMode}
                onChange={(event) => setAllCatsSortMode(event.target.value as AllCatsSortMode)}
              >
                <option value="alphabetical">Alphabetical</option>
                <option value="category">By category</option>
              </select>
            </label>
          ) : null}
        </div>
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