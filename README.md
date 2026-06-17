# Cat World Globe

Interactive 3D globe app built with React, TypeScript, Vite, and Three.js.

## What This App Includes

- 3D globe with drag rotate + scroll zoom controls
- Country rendering from GeoJSON (`countries-110m.geojson`)
- Marker system for:
	- real famous cats
	- fictional cats
	- cat breeds
- Category color legend in the header
- Search bar for cat/breed names
- Popup info cards with category-specific content templates
- Marker and search thumbnail images loaded from `public/imgs`

## Quick Start

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Build & Preview

```bash
npm run build
npm run preview
```

## Main Files

- `src/App.tsx`
	- Header/search/legend UI
	- Search result list
	- Marker popup mounting
- `src/components/Globe.tsx`
	- Globe scene, rendering, controls, marker interaction
- `src/components/CatInfoPopup.tsx`
	- Popup layout and category-specific sections
- `src/data/catLocations.ts`
	- Marker coordinates
	- Marker images
	- Popup text content per category
- `src/styles.css`
	- App, header, legend, search, popup styling

## Marker Data Model

All cat markers are managed in:

- `src/data/catLocations.ts`

Each marker has core fields:

- `name`
- `latitude`, `longitude`
- `category` (`real` | `fictional` | `breed`)
- `iconUrl`
- optional `imageUrl`, `imageAlt`
- `info` (category-specific structure)

### Real Cats (`category: 'real'`)

Info fields:

- `origin`
- `backstoryBiography`
- `timeline[]` (`date`, `event`)
- `associatedHumansAccounts[]`

### Fictional Cats (`category: 'fictional'`)

Info fields:

- `originSource`
- `universeFranchiseCreator`
- `roleInStory`
- `personalityTraits[]`
- `abilitiesOrSpecialTraits[]`
- `firstAppearance` (`year`, `work`)

### Cat Breeds (`category: 'breed'`)

Info fields:

- `origin`
- `history`
- `physicalCharacteristics`
- `temperament[]`
- `careRequirements`
- `lifespan`
- optional `similarBreeds[]`

## How To Add A New Marker

1. Add a new object in `src/data/catLocations.ts`.
2. Set coordinates (`latitude`, `longitude`).
3. Set `category` and fill the matching `info` schema.
4. Add image file to `public/imgs/` and set `imageUrl`.
5. Run `npm run build`.

## Globe Dataset

The globe base map is loaded from:

- `public/data/countries-110m.geojson`

Expected format:

- GeoJSON `FeatureCollection`
- `Polygon` / `MultiPolygon` country geometries

Optional supported properties:

- Name fields: `NAME`, `NAME_LONG`, `ADMIN`
- Label fields: `LABEL_X`, `LABEL_Y`
- ISO fields: `A3`, `ISO_A3`, `iso_a3`, `ISO3`, `iso3`, `adm0_a3`, `ADM0_A3`