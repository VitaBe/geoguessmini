# Claude Code Guide: GeoGuessMini

## Project Overview

GeoGuessMini is a fully client-side location guessing game. Users upload a ZIP file containing photos and a CSV manifest, then click on a map to guess each photo's location.

## Key Technical Information

### Architecture
- **No backend required** - Pure client-side HTML/CSS/JS
- Hosted on GitHub Pages or any static hosting
- Uses CDN-loaded libraries (JSZip, PapaParse, Leaflet)

### File Structure
```
├── index.html          # Main HTML, loads CDN scripts and app modules
├── styles.css          # Responsive dark theme styles
├── js/
│   ├── utils.js        # Haversine distance calc, coordinate parsing
│   ├── zipLoader.js    # JSZip wrapper for extracting ZIP files
│   ├── csvParser.js    # PapaParse wrapper for semicolon-delimited CSV
│   ├── mapView.js      # Leaflet map initialization and click handling
│   ├── gameState.js    # Game loop: load items, track progress
│   └── main.js         # DOM wiring, controllers, event coordination
├── tests/              # Jest tests for all modules
└── sample_data/        # Example ZIP and CSV for testing
```

### Game Mechanics
- **Tolerance**: 200km (defined in `js/utils.js` as `TOLERANCE_KM`)
- **CSV Format**: Semicolon-delimited with columns `filename;description;location`
- **Location format**: `lat, lng` (e.g., `48.858, 2.294`)
- **Final row**: Non-coordinate value in location column shows completion screen

### Critical Dependencies (CDN)
```html
<script src="https://unpkg.com/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="https://unpkg.com/papaparse@5.4.1/papaparse.min.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

### Data Flow
1. User selects ZIP → `handleFileUpload` in main.js
2. ZIP extracted → `csvText` + `imageFiles` Map
3. CSV parsed → Array of `{filename, description, rawLocation}`
4. Game initialized → Load first item
5. User clicks map → Haversine check → If within 200km, advance

### Browser Global Exports
Each module exports to window for cross-module communication:
```js
// utils.js
window.parseLocation, window.haversineDistance, window.isWithinTolerance

// zipLoader.js
window.loadZipFile, window.isImageFile

// csvParser.js
window.parseGameItems

// mapView.js
window.initMap, window.showMap, window.hideMap, window.resetMap, window.clearMarkers

// gameState.js
window.initGame, window.loadCurrentItem, window.advanceToNextItem, window.getCurrentTarget
```

## Testing

Uses Jest with jsdom environment:
```bash
npm test           # Run tests once
npm run test:watch # Watch mode
npm run test:coverage # With coverage report
```

## Common Tasks

### Adding a new feature
1. Identify which module handles the concern
2. Add the function to that module
3. Export to window for browser use
4. Update tests in `tests/<module>.test.js`

### Changing tolerance distance
Edit `TOLERANCE_KM` in `js/utils.js` (currently 200)

### CSV format changes
Modify `js/csvParser.js` - look for `Papa.parse` configuration

### Debugging
Console logs are peppered throughout with prefixes:
- `[ZIPLoader]` - ZIP loading issues
- `[CSVParser]` - CSV parsing issues
- `🔍`, `✅`, `❌` - Main flow markers

## Things to Avoid

1. **Don't** add build tools (webpack, vite, etc.) - this is intentionally zero-build
2. **Don't** break CDN dependencies - always use version-pinned URLs
3. **Don't** forget to export new functions to `window` for cross-module use
4. **Don't** change the CSV delimiter without updating `csvParser.js`

## File Loading Order (index.html)

```html
1. JSZip (CDN)
2. PapaParse (CDN)
3. Leaflet (CDN)
4. js/utils.js
5. js/zipLoader.js
6. js/csvParser.js
7. js/mapView.js
8. js/gameState.js
9. js/main.js
```
