# GeoQuest

A fully client-side location guessing game. Upload a ZIP file with photos and a CSV manifest, then click on the map to guess where each photo was taken.

## How to Play

1. Upload a ZIP file containing:
   - `data.csv` - A semicolon-delimited CSV with columns: `filename`, `description`, `location`
   - Image files referenced in the CSV

2. For each photo:
   - Read the description
   - Click on the map where you think it was taken
   - Get within 50km to advance to the next photo

3. The final row of the CSV should contain a non-coordinate value in the location column to trigger the completion screen

## CSV Format

```csv
filename;description;location
eiffel.jpg;A famous tower in France;48.858, 2.294
liberty.jpg;Statue in New York;40.689, -74.044
final.txt;Complete!;Final message displayed on completion
```

- **filename**: Name of the image file (must exist in the ZIP)
- **description**: Text shown below the photo
- **location**: Either `lat, lng` coordinates or text for the final row

## Hosting

This is a static site that can be hosted on GitHub Pages or any static hosting service. No backend required.

## Development

Open `index.html` in any modern browser to run locally.

## File Structure

```
├── index.html          # Main HTML with CDN imports
├── styles.css          # Responsive styles
├── js/
│   ├── utils.js        # Haversine distance calculations
│   ├── zipLoader.js    # JSZip integration
│   ├── csvParser.js    # PapaParse CSV parsing
│   ├── mapView.js      # Leaflet map control
│   ├── gameState.js    # Game logic
│   └── main.js         # Application bootstrap
└── sample_data/        # Example data for testing
```
