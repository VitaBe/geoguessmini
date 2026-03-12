/**
 * Leaflet map initialization and control
 */

let map = null;
let clickHandler = null;
let markerLayer = null;

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

        // Pass coordinates to callback
        clickHandler({
            lat: e.latlng.lat,
            lng: e.latlng.lng
        });
    }
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
