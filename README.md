# GeoQuest

A fully client-side location guessing game. Upload a ZIP file with photos and a CSV manifest, then click on the map to guess where each photo was taken.

![Game Screenshot](screenshot.png)

## How to Play

1. **Upload a ZIP file** containing:
   - `data.csv` - A semicolon-delimited CSV with columns: `filename`, `description`, `location`
   - Image files referenced in the CSV

2. **For each photo**:
   - Read the description
   - Click on the map where you think it was taken
   - Get within **200km** to advance to the next photo

3. **Win**: Complete all locations to see the final message

## CSV Format

```csv
filename;description;location
eiffel.jpg;A famous tower in France;48.858, 2.294
liberty.jpg;Statue in New York;40.689, -74.044
final.txt;You completed all locations!;END
```

- **filename**: Name of the image file (must exist in the ZIP)
- **description**: Text shown below the photo
- **location**: Either `lat, lng` coordinates or text for the final row

The final row should have a non-coordinate value in the location column to trigger the completion screen.

## Creating a Game Pack

1. Create a CSV file named `data.csv` with semicolon delimiters
2. Add image files to the same folder
3. Zip everything together (the CSV can be at root or in a subfolder)
4. Upload the ZIP to play

## Hosting

This is a static site that can be hosted on GitHub Pages, Netlify, Vercel, or any static hosting service. No backend required.

### Deploy to GitHub Pages
1. Fork/clone this repository
2. Enable GitHub Pages in repository settings
3. Set source to "Deploy from a branch" → select `main`

## Development

### Local Setup

Open `index.html` directly in any modern browser:
```bash
# macOS
open index.html

# Windows
start index.html

# Linux
xdg-open index.html
```

Or use a simple HTTP server:
```bash
python3 -m http.server 8000
# Then open http://localhost:8000
```

### Project Structure

```
├── index.html          # Main HTML with CDN imports
├── styles.css          # Responsive dark theme styles
├── js/
│   ├── utils.js        # Haversine distance calculations
│   ├── zipLoader.js    # JSZip integration
│   ├── csvParser.js    # PapaParse CSV parsing
│   ├── mapView.js      # Leaflet map control
│   ├── gameState.js    # Game logic
│   └── main.js         # Application bootstrap
├── tests/              # Jest unit tests
└── sample_data/        # Example data for testing
```

### Testing

Tests use Jest with a jsdom environment:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### External Dependencies

Loaded via CDN (no npm install needed for browser):
- [Leaflet](https://leafletjs.com/) 1.9.4 - Interactive maps
- [JSZip](https://stuk.github.io/jszip/) 3.10.1 - ZIP file handling
- [PapaParse](https://www.papaparse.com/) 5.4.1 - CSV parsing

### Configuration

The only configurable value is the tolerance distance:

```javascript
// js/utils.js
const TOLERANCE_KM = 200;  // Change this to adjust difficulty
```

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13.1+
- Mobile browsers (iOS Safari, Chrome Android)

Requires ES6 (let/const, arrow functions, async/await) and modern DOM APIs.

## License

MIT License - feel free to use and modify as needed.
