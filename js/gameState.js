/**
 * Game state management
 */

let gameItems = [];
let currentIndex = 0;
let imageUrlCache = new Map();
let isFinal = false;
let imageLoader = null;
let mapController = null;
let uiControllerRef = null;

/**
 * Initialize the game with dependencies
 * @param {Object[]} items - Array of game items from CSV
 * @param {Object} imageLoaderObj - Image loader with getImageUrl method
 * @param {Object} mapControllerObj - Map controller with showMap/hideMap methods
 * @param {Object} uiControllerObj - UI controller with view methods
 */
function initGame(items, imageLoaderObj, mapControllerObj, uiControllerObj) {
    gameItems = items;
    currentIndex = 0;
    imageUrlCache.clear();
    isFinal = false;
    imageLoader = imageLoaderObj;
    mapController = mapControllerObj;
    uiControllerRef = uiControllerObj;
}

/**
 * Load the current game item
 */
async function loadCurrentItem() {
    if (currentIndex >= gameItems.length) {
        // Should not happen if CSV is valid
        console.error('Game index out of bounds');
        return;
    }

    const item = gameItems[currentIndex];
    const parsedLocation = parseLocation(item.rawLocation);

    // Check if this is the final entry (non-parseable coordinates)
    if (parsedLocation === null) {
        // Final state - show final view
        isFinal = true;
        if (uiControllerRef && typeof uiControllerRef.showFinalView === 'function') {
            uiControllerRef.showFinalView(item.rawLocation);
        }
        return;
    }

    // Normal round
    isFinal = false;

    // Load image
    try {
        let imageUrl = imageUrlCache.get(item.filename);

        if (!imageUrl && imageLoader && typeof imageLoader.getImageUrl === 'function') {
            imageUrl = await imageLoader.getImageUrl(item.filename);
            if (imageUrl) {
                imageUrlCache.set(item.filename, imageUrl);
            }
        }

        // Show game view
        if (uiControllerRef) {
            if (typeof uiControllerRef.showGameView === 'function') {
                uiControllerRef.showGameView();
            }
            if (typeof uiControllerRef.updateImage === 'function') {
                uiControllerRef.updateImage(imageUrl || '');
            }
            if (typeof uiControllerRef.updateDescription === 'function') {
                uiControllerRef.updateDescription(item.description);
            }
            if (typeof uiControllerRef.updateProgress === 'function') {
                uiControllerRef.updateProgress(currentIndex + 1, gameItems.length);
            }
        }

        // Show map
        if (mapController && typeof mapController.showMap === 'function') {
            mapController.showMap();
        }

    } catch (error) {
        console.error('Error loading current item:', error);
        // Show error in description
        if (uiControllerRef && typeof uiControllerRef.updateDescription === 'function') {
            uiControllerRef.updateDescription(item.description + '\n(Error loading image)');
        }
    }
}

/**
 * Advance to the next item
 */
function advanceToNextItem() {
    currentIndex++;
    loadCurrentItem();
}

/**
 * Get the target coordinates for the current item
 * @returns {{lat: number, lng: number} | null} - Target coordinates or null
 */
function getCurrentTarget() {
    if (currentIndex >= gameItems.length) {
        return null;
    }
    return parseLocation(gameItems[currentIndex].rawLocation);
}

/**
 * Reset the game to start over
 */
function resetGame() {
    currentIndex = 0;
    isFinal = false;
    // Clear object URLs to prevent memory leaks
    for (const url of imageUrlCache.values()) {
        URL.revokeObjectURL(url);
    }
    imageUrlCache.clear();
    loadCurrentItem();
}

/**
 * Get current game state info
 * @returns {Object} - Current state
 */
function getState() {
    return {
        currentIndex,
        totalItems: gameItems.length,
        isFinal,
        currentItem: gameItems[currentIndex] || null
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initGame,
        loadCurrentItem,
        advanceToNextItem,
        getCurrentTarget,
        resetGame,
        getState
    };
}
