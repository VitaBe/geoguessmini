/**
 * ZIP file loading functionality using JSZip
 */

/**
 * Load and parse a ZIP file
 * @param {File} file - The ZIP file to load
 * @returns {Promise<{csvText: string, imageFiles: Map<string, Object>}>} - CSV content and image files
 */
async function loadZipFile(file) {
    if (!file) {
        throw new Error('No file provided');
    }

    if (!file.name.endsWith('.zip')) {
        throw new Error('File must be a ZIP archive');
    }

    try {
        console.log('JSZip version:', typeof JSZip, JSZip ? 'loaded' : 'not loaded');
        const zip = await JSZip.loadAsync(file);
        console.log('ZIP file loaded. Total entries:', Object.keys(zip.files).length);

        // Find data.csv in the root
        let csvEntry = null;
        const imageFiles = new Map();

        for (const [path, zipEntry] of Object.entries(zip.files)) {
            // Skip directories
            if (zipEntry.dir) {
                continue;
            }

            const fileName = path.split('/').pop();
            const lowerPath = path.toLowerCase();

            // Find data.csv (case insensitive, root level)
            if (lowerPath === 'data.csv' || lowerPath.endsWith('/data.csv')) {
                csvEntry = zipEntry;
                console.log('Found CSV file at:', path);
            }
            // Collect image files
            else if (isImageFile(fileName)) {
                imageFiles.set(path, zipEntry);
            }
        }

        if (!csvEntry) {
            throw new Error('No data.csv found in ZIP file');
        }

        // Extract CSV text
        const csvText = await csvEntry.async('text');
        console.log('CSV extracted. Content length:', csvText.length);

        return { csvText, imageFiles };
    } catch (error) {
        if (error.message.includes('No data.csv found')) {
            throw error;
        }
        throw new Error(`Failed to load ZIP file: ${error.message}`);
    }
}

/**
 * Check if a filename is an image file
 * @param {string} fileName - The filename to check
 * @returns {boolean} - True if it's an image file
 */
function isImageFile(fileName) {
    if (!fileName) return false;
    const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowerName = fileName.toLowerCase();
    return extensions.some(ext => lowerName.endsWith(ext));
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadZipFile, isImageFile };
}
