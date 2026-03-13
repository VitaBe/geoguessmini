/**
 * Leaflet map initialization and control
 * @typedef {Object} LatLng
 * @property {number} lat
 * @property {number} lng
 */

let map = null;
let clickHandler = null;
let markerLayer = null;

// Red marker icon for wrong guesses
const redIcon = L.icon({
 iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAzNiIgd2lkdGg9IjI1IiBoZWlnaHQ9IjQxIj48cGF0aCBmaWxsPSIjZTc0YzNjIiBzdHJva2U9IiNjMDM5MmIiIHN0cm9rZS13aWR0aD0iMiIgZD0iTTEyIDBDNS4zODMgMCAwIDUuMzgzIDAgMTJjMCA5IDEyIDI0IDEyIDI0czEyLTE1IDEyLTI0QzI0IDUuMzgzIDE4LjYxNyAwIDEyIDB6Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==',
 iconSize: [25, 41],
 iconAnchor: [12, 41],
 popupAnchor: [1, -34],
 tooltipAnchor: [16, -28],
 shadowSize: [41, 41]
});

let currentGuessMarker = null;

/**
 * Initialize the Leaflet map
 * @param {Function} onMapClickCallback - Callback function receiving {lat, lng} on click
 */
function initMap(onMapClickCallback) {
 // Create map centered on global view
 map = L.map('map', {
  center: [20, 0],
  zoom: 2,
  minZoom: 2,
  worldCopyJump: true
 });

 // Add OpenStreetMap tiles
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
 }).addTo(map);

 // Store click handler for later
 clickHandler = onMapClickCallback;

 // Create marker layer group
 markerLayer = L.layerGroup().addTo(map);

 // Bind click event
 map.on('click', handleMapClick);

 return map;
}

/**
 * Handle map click events
 * @param {L.LeafletMouseEvent} e - The click event
 */
function handleMapClick(e) {
 if (clickHandler && typeof clickHandler === 'function') {
  // Clear existing markers
  clearMarkers();

  // Add a marker at click location
  const marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(markerLayer);

  // Create visual feedback ripple effect at click position
  showClickFeedback(e.latlng);

  // Pass coordinates to callback
  clickHandler({
   lat: e.latlng.lat,
   lng: e.latlng.lng
  });
 }
}

/**
 * Show visual feedback when user clicks on map
 * @param {L.LatLng} latlng - Click coordinates
 */
function showClickFeedback(latlng) {
 const mapContainer = document.getElementById('map');
 if (!mapContainer || !map) return;

 // Create ripple element
 const ripple = document.createElement('div');
 ripple.className = 'click-feedback';

 // Position in DOM (relative to map container)
 const containerPoint = map.latLngToContainerPoint(latlng);
 ripple.style.left = containerPoint.x + 'px';
 ripple.style.top = containerPoint.y + 'px';

 mapContainer.appendChild(ripple);

 // Remove after animation completes
 setTimeout(() => {
  if (ripple.parentNode) {
   ripple.remove();
  }
 }, 600);
}

/**
 * Clear all markers from the map
 */
function clearMarkers() {
 if (markerLayer) {
  markerLayer.clearLayers();
 }
}

/**
 * Show the map view
 * Resizes map to ensure proper rendering after being hidden
 */
function showMap() {
 const mapContainer = document.getElementById('map');
 if (mapContainer) {
  mapContainer.style.display = 'block';
 }

 if (map) {
  // Invalidate size to fix any rendering issues after being hidden
  setTimeout(() => {
   map.invalidateSize();
  }, 100);
 }
}

/**
 * Hide the map view
 */
function hideMap() {
 const mapContainer = document.getElementById('map');
 if (mapContainer) {
  mapContainer.style.display = 'none';
 }
}

/**
 * Reset map to initial global view
 */
function resetMap() {
 if (map) {
  map.setView([20, 0], 2);
  clearMarkers();
 }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
 module.exports = { initMap, showMap, hideMap, resetMap, clearMarkers };
}
