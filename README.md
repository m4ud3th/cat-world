# Cat World Globe

Interactive 3D globe built with React, TypeScript, Vite, and Three.js.

## Features

- Scroll zoom and mouse drag rotation with orbit controls
- Pastel-colored country rendering from GeoJSON
- Country labels rendered on top of the globe
- Label placement from `LABEL_X` / `LABEL_Y` when available, with centroid fallback
- Label scaling that shrinks when zooming in
- Starfield background and subtle atmosphere

## Getting Started

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Build

```bash
npm run build
```

To preview a production build:

```bash
npm run preview
```

## Data File

The app currently loads this file:

- `public/data/countries-110m.geojson`

The GeoJSON must be a `FeatureCollection` with country features using `Polygon` and/or `MultiPolygon` geometries.

Useful properties:

- Country name fields: `NAME`, `NAME_LONG`, `ADMIN`
- Label position fields: `LABEL_X`, `LABEL_Y`
- ISO code fields (supported): `A3`, `ISO_A3`, `iso_a3`, `ISO3`, `iso3`, `adm0_a3`, `ADM0_A3`

## Notes

- If labels appear too large/small at different zoom levels, tune the label scale factors in the globe component.
- If you swap datasets, keep longitude/latitude values in decimal degrees.