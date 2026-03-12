/**
 * Main application - DOM wiring, controllers, and event coordination
 */

// References to DOM elements
let fileInput = null;
let uploadError = null;
let gamePhoto = null;
let gameDescription = null;
let progressFill = null;
let progressText = null;
let replayBtn = null;
let finalMessage = null;

// Store ZIP data for image loading
let zipImageFiles = new Map();

/**
 * UI Controller - manages view visibility and updates
 */
const uiController = {
    showUploadView() {
        hideAllViews();
        document.getElementById('upload-view').classList.add('active');
    },

    showGameView() {
        hideAllViews();
        document.getElementById('game-view').classList.add('active');
    },

    showFinalView(text) {
        hideAllViews();
        const finalView = document.getElementById('final-view');
        finalView.classList.add('active');

        // Set final message
        if (finalMessage) {
            // Convert plain text to HTML with line breaks
            const formattedText = escapeHtml(text).replace(/\n/g, '<br>');
            finalMessage.innerHTML = `<h2>🎉 Congratulations!</h2><p>${formattedText}</p>`;
        }
    },

    updateImage(url) {
        if (gamePhoto) {
            if (url) {
                gamePhoto.src = url;
                gamePhoto.style.display = 'block';
            } else {
                gamePhoto.style.display = 'none';
            }
        }
    },

    updateDescription(text) {
        if (gameDescription) {
            gameDescription.textContent = text || '';
        }
    },

    updateProgress(current, total) {
        if (progressFill && progressText) {
            const percentage = (current / total) * 100;
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `${current} / ${total}`;
        }
    },

    showError(message) {
        if (uploadError) {
            uploadError.textContent = message;
            uploadError.classList.remove('hidden');
        }
    },

    hideError() {
        if (uploadError) {
            uploadError.classList.add('hidden');
        }
    }
};

/**
 * Image Loader - creates blob URLs from ZIP files
 */
const imageLoader = {
    async getImageUrl(filename) {
        if (!filename) return null;

        // Try exact match first
        let zipEntry = zipImageFiles.get(filename);

        // Try case-insensitive match
        if (!zipEntry) {
            const lowerFilename = filename.toLowerCase();
            for (const [path, entry] of zipImageFiles) {
                const pathFilename = path.split('/').pop();
                if (pathFilename.toLowerCase() === lowerFilename) {
                    zipEntry = entry;
                    break;
                }
            }
        }

        if (!zipEntry) {
            console.warn(`Image not found in ZIP: ${filename}`);
            return null;
        }

        try {
            const blob = await zipEntry.async('blob');
            const blobUrl = URL.createObjectURL(blob);
            return blobUrl;
        } catch (error) {
            console.error(`Failed to load image ${filename}:`, error);
            return null;
        }
    }
};

/**
 * Initialize DOM references
 */
function initDOMReferences() {
    fileInput = document.getElementById('zip-input');
    uploadError = document.getElementById('upload-error');
    gamePhoto = document.getElementById('game-photo');
    gameDescription = document.getElementById('game-description');
    progressFill = document.getElementById('progress-fill');
    progressText = document.getElementById('progress-text');
    replayBtn = document.getElementById('replay-btn');
    finalMessage = document.getElementById('final-message');
    
    // Debug: Log if critical elements are missing
    if (!fileInput) {
        console.error('Critical: zip-input element not found');
    }
    if (!uploadError) {
        console.error('Critical: upload-error element not found');
    }
    if (typeof JSZip === 'undefined') {
        console.error('Critical: JSZip library not loaded');
    }
    if (typeof Papa === 'undefined') {
        console.error('Critical: PapaParse library not loaded');
    }
}

/**
 * Hide all view sections
 */
function hideAllViews() {
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.remove('active'));
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Handle map click for guessing
 * @param {Object} coords - Clicked coordinates {lat, lng}
 */
function handleMapClick(coords) {
    const target = getCurrentTarget();

    if (!target) {
        // Current item is not a coordinate location (final message)
        return;
    }

    // Check if within tolerance
    const withinTolerance = isWithinTolerance(coords.lat, coords.lng, target.lat, target.lng);

    if (withinTolerance) {
        // Clear markers before advancing
        if (typeof clearMarkers === 'function') {
            clearMarkers();
        }
        advanceToNextItem();
    }
    // Silent return if outside tolerance (no feedback)
}

/**
 * Handle file upload
 * @param {Event} event - Change event from file input
 */
async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
        console.warn('No file selected');
        return;
    }

    console.log('File selected:', file.name, file.type, file.size);
    uiController.hideError();

    try {
        // Check if required libraries are available
        console.log('🔍 Checking libraries...');
        if (typeof JSZip === 'undefined') {
            console.error('❌ JSZip library not loaded');
            throw new Error('JSZip library not loaded - refresh the page');
        }
        console.log('✅ JSZip loaded');
        if (typeof Papa === 'undefined') {
            console.error('❌ PapaParse library not loaded');
            throw new Error('PapaParse library not loaded - refresh the page');
        }
        console.log('✅ PapaParse loaded');

        // Load ZIP file
        console.log('Loading ZIP file...');
        const { csvText, imageFiles } = await loadZipFile(file);
        console.log('ZIP loaded successfully. CSV text length:', csvText.length, 'Image files:', imageFiles.size);

        // Store image files for later use
        zipImageFiles = imageFiles;

        // Parse CSV
        console.log('Parsing CSV...');
        const items = parseGameItems(csvText);
        console.log('CSV parsed. Items found:', items.length);

        if (items.length === 0) {
            throw new Error('No valid game items found');
        }

        // Initialize game
        console.log('Initializing game...');
        initGame(items, imageLoader, { showMap, hideMap, resetMap }, uiController);

        // Load first item
        console.log('Loading first item...');
        await loadCurrentItem();
        console.log('First item loaded successfully');

    } catch (error) {
        console.error('Upload error:', error);
        uiController.showError(error.message || 'Failed to load game data');
        // Reset file input
        if (fileInput) {
            fileInput.value = '';
        }
    }
}

/**
 * Handle replay button click
 */
function handleReplay() {
    // Clean up old blob URLs
    if (zipImageFiles.size > 0 && imageUrlCache) {
        for (const url of imageUrlCache.values()) {
            URL.revokeObjectURL(url);
        }
    }

    // Reset game state
    zipImageFiles.clear();

    // Reset file input
    if (fileInput) {
        fileInput.value = '';
    }

    // Reset map
    if (typeof resetMap === 'function') {
        resetMap();
    }

    // Show upload view
    uiController.showUploadView();
}

/**
 * Initialize application on DOM ready
 */
function initApplication() {
    console.log('Initializing application...');
    initDOMReferences();
    console.log('DOM references initialized');

    // Initialize map with click handler
    if (typeof initMap === 'function') {
        console.log('Initializing map...');
        initMap(handleMapClick);
    } else {
        console.error('initMap function not found');
    }

    // Bind file input
    if (fileInput) {
        console.log('Binding file input event listener');
        fileInput.addEventListener('change', handleFileUpload);
        console.log('File input event listener bound successfully');
    } else {
        console.error('File input element (zip-input) not found');
    }

    // Bind replay button
    if (replayBtn) {
        console.log('Binding replay button event listener');
        replayBtn.addEventListener('click', handleReplay);
    } else {
        console.warn('Replay button element not found');
    }

    // Show upload view initially
    uiController.showUploadView();
    console.log('Application initialized successfully');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    console.log('DOM is loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', initApplication);
} else {
    console.log('DOM already loaded');
    initApplication();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initApplication
    };
}
