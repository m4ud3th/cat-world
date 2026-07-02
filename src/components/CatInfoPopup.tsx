import { useEffect, useRef } from 'react';
import { CAT_LOCATIONS, type CatLocation } from '../data/catLocations';

type CatInfoPopupProps = {
  location: CatLocation | null;
  onSelectLocation: (name: string) => void;
  onClose: () => void;
};

function categoryLabel(category: CatLocation['category']) {
  if (category === 'real') {
    return 'Famous cats';
  }

  if (category === 'fictional') {
    return 'Fictional cats';
  }

  return 'Cat breeds';
}

export function CatInfoPopup({ location, onSelectLocation, onClose }: CatInfoPopupProps) {
  const popupRef = useRef<HTMLElement | null>(null);
  const isOutsideCloseArmedRef = useRef(false);

  useEffect(() => {
    if (!location) {
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
  }, [location, onClose]);

  if (!location) {
    return null;
  }

  const breedNamesOnSite = new Set(
    CAT_LOCATIONS.filter((entry) => entry.category === 'breed').map((entry) => entry.name)
  );

  const quickFacts =
    location.category === 'real'
      ? [
          { label: 'Type', value: 'Famous cat' },
          { label: 'Breed', value: location.info.breed },
          { label: 'City of origin', value: location.cityOfOrigin },
          { label: 'Origin', value: location.info.origin }
        ]
      : location.category === 'fictional'
      ? [
          { label: 'Type', value: 'Fictional cat' },
          { label: 'City of origin', value: location.cityOfOrigin },
          { label: 'Origin source', value: location.info.originSource },
          { label: 'Role', value: location.info.roleInStory },
          {
            label: 'First appearance',
            value: `${location.info.firstAppearance.year} - ${location.info.firstAppearance.work}`
          }
        ]
      : [
          { label: 'Type', value: 'Cat breed' },
          { label: 'City of origin', value: location.cityOfOrigin },
          { label: 'Origin', value: location.info.origin },
          { label: 'Size', value: location.info.physicalCharacteristics.size },
          { label: 'Lifespan', value: location.info.lifespan }
        ];

  return (
    <aside
      ref={popupRef}
      className={`cat-popup cat-popup-${location.category}`}
      role="dialog"
      aria-modal="false"
      aria-label={`${location.name} info`}
    >
      <header className="cat-popup-header">
        <div>
          <p className="cat-popup-category">{categoryLabel(location.category)}</p>
          <h2 className="cat-popup-title">{location.name}</h2>
        </div>
        <button type="button" className="cat-popup-close" onClick={onClose} aria-label="Close info">
          X
        </button>
      </header>

      <div className="cat-popup-top">
        {location.imageUrl ? (
          <figure className="cat-popup-media">
            <img
              className="cat-popup-image"
              src={location.imageUrl}
              alt={location.imageAlt ?? `${location.name} image`}
              loading="lazy"
            />
          </figure>
        ) : null}

        <section className="cat-popup-quickfacts" aria-label="Quick facts">
          <h3>Quick Facts</h3>
          <ul>
            {quickFacts.map((fact) => (
              <li key={`${fact.label}-${fact.value}`}>
                <strong>{fact.label}:</strong> {fact.value}
              </li>
            ))}
          </ul>
          {location.category !== 'breed' ? (
            <p className="cat-popup-story">{location.info.story}</p>
          ) : null}
        </section>
      </div>

      {location.category === 'real' ? (
        <div className="cat-popup-content">
          <section className="cat-popup-section">
            <h3>Origin</h3>
            <p>{location.info.origin}</p>
          </section>
          <section className="cat-popup-section">
            <h3>Backstory / Biography</h3>
            <p>{location.info.backstoryBiography}</p>
          </section>
          <section className="cat-popup-section">
            <h3>Timeline</h3>
            <ul>
              {location.info.timeline.map((item) => (
                <li key={`${item.date}-${item.event}`}>
                  <strong>{item.date}:</strong> {item.event}
                </li>
              ))}
            </ul>
          </section>
          <section className="cat-popup-section">
            <h3>Associated Humans / Accounts</h3>
            <ul>
              {location.info.associatedHumansAccounts.map((entry) => (
                <li key={`${entry.kind}-${entry.label}-${entry.handle ?? ''}`}>
                  <strong>{entry.kind}:</strong>{' '}
                  {entry.url ? (
                    <a href={entry.url} target="_blank" rel="noreferrer">
                      {entry.label}
                      {entry.handle ? ` (${entry.handle})` : ''}
                    </a>
                  ) : (
                    <span>
                      {entry.label}
                      {entry.handle ? ` (${entry.handle})` : ''}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {location.category === 'fictional' ? (
        <div className="cat-popup-content">
          <section className="cat-popup-section">
            <h3>Origin Source</h3>
            <p>{location.info.originSource}</p>
          </section>
          <section className="cat-popup-section">
            <h3>Universe / Franchise / Creator</h3>
            <p>{location.info.universeFranchiseCreator}</p>
          </section>
          <section className="cat-popup-section">
            <h3>Role In Story</h3>
            <p>{location.info.roleInStory}</p>
          </section>
          <section className="cat-popup-section">
            <h3>Personality Traits</h3>
            <ul>
              {location.info.personalityTraits.map((trait) => (
                <li key={trait}>{trait}</li>
              ))}
            </ul>
          </section>
          <section className="cat-popup-section">
            <h3>Abilities Or Special Traits</h3>
            <ul>
              {location.info.abilitiesOrSpecialTraits.map((trait) => (
                <li key={trait}>{trait}</li>
              ))}
            </ul>
          </section>
          <section className="cat-popup-section">
            <h3>First Appearance</h3>
            <p>
              <strong>{location.info.firstAppearance.year}:</strong> {location.info.firstAppearance.work}
            </p>
          </section>
        </div>
      ) : null}

      {location.category === 'breed' ? (
        <div className="cat-popup-content">
          <section className="cat-popup-section">
            <h3>Origin</h3>
            <p>{location.info.origin}</p>
          </section>
          <section className="cat-popup-section">
            <h3>History</h3>
            <p>{location.info.history}</p>
          </section>
          <section className="cat-popup-section">
            <h3>Physical Characteristics</h3>
            <ul>
              <li>
                <strong>Size:</strong> {location.info.physicalCharacteristics.size}
              </li>
              <li>
                <strong>Coat type:</strong> {location.info.physicalCharacteristics.coatType}
              </li>
              <li>
                <strong>Color patterns:</strong> {location.info.physicalCharacteristics.colorPatterns.join(', ')}
              </li>
            </ul>
          </section>
          <section className="cat-popup-section">
            <h3>Temperament</h3>
            <ul>
              {location.info.temperament.map((trait) => (
                <li key={trait}>{trait}</li>
              ))}
            </ul>
          </section>
          <section className="cat-popup-section">
            <h3>Care Requirements</h3>
            <ul>
              <li>
                <strong>Grooming needs:</strong> {location.info.careRequirements.groomingNeeds}
              </li>
              <li>
                <strong>Exercise level:</strong> {location.info.careRequirements.exerciseLevel}
              </li>
              <li>
                <strong>Health considerations:</strong> {location.info.careRequirements.healthConsiderations.join(', ')}
              </li>
            </ul>
          </section>
          <section className="cat-popup-section">
            <h3>Lifespan</h3>
            <p>{location.info.lifespan}</p>
          </section>
          {location.info.similarBreeds && location.info.similarBreeds.length > 0 ? (
            <section className="cat-popup-section">
              <h3>Similar Breeds</h3>
              <ul>
                {location.info.similarBreeds.map((breed) => {
                  const canOpenBreedProfile = breedNamesOnSite.has(breed);

                  return (
                    <li key={breed}>
                      {canOpenBreedProfile ? (
                        <button
                          type="button"
                          className="cat-popup-inline-link"
                          onClick={() => onSelectLocation(breed)}
                        >
                          {breed}
                        </button>
                      ) : (
                        <span>{breed}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}