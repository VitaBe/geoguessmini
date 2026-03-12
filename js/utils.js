/**
 * Utility functions for GeoQuest
 */

const TOLERANCE_KM = 50;

/**
 * Parse a location string into lat/lng coordinates
 * @param {string} rawLocation - The raw location string from CSV
 * @returns {{lat: number, lng: number} | null} - Parsed coordinates or null if invalid
 */
function parseLocation(rawLocation) {
    if (!rawLocation || typeof rawLocation !== 'string') {
        return null;
    }

    // Trim whitespace
    const trimmed = rawLocation.trim();

    // Split by comma
    const parts = trimmed.split(',').map(part => part.trim());

    if (parts.length !== 2) {
        return null;
    }

    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);

    // Check if valid numbers
    if (isNaN(lat) || isNaN(lng)) {
        return null;
    }

    // Check valid coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return null;
    }

    return { lat, lng };
}

/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lng1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lng2 - Longitude of point 2 in degrees
 * @returns {number} - Distance in kilometers
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers

    // Convert to radians
    const lat1Rad = lat1 * (Math.PI / 180);
    const lat2Rad = lat2 * (Math.PI / 180);
    const deltaLatRad = (lat2 - lat1) * (Math.PI / 180);
    const deltaLngRad = (lng2 - lng1) * (Math.PI / 180);

    // Haversine formula
    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in km
}

/**
 * Check if a guess is within tolerance of the target
 * @param {number} guessLat - Guessed latitude
 * @param {number} guessLng - Guessed longitude
 * @param {number} targetLat - Target latitude
 * @param {number} targetLng - Target longitude
 * @returns {boolean} - True if within tolerance
 */
function isWithinTolerance(guessLat, guessLng, targetLat, targetLng) {
    const distance = haversineDistance(guessLat, guessLng, targetLat, targetLng);
    return distance <= TOLERANCE_KM;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseLocation, haversineDistance, isWithinTolerance, TOLERANCE_KM };
}
