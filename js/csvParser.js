/**
 * CSV parsing functionality using PapaParse
 */

/**
 * @typedef {Object} GameItem
 * @property {string} filename - The image filename
 * @property {string} description - The description text
 * @property {string} rawLocation - The raw location string (coordinates or final message)
 */

/**
 * Parse CSV text into game items
 * @param {string} csvText - The raw CSV content
 * @returns {GameItem[]} - Array of game items
 */
function parseGameItems(csvText) {
    if (!csvText || typeof csvText !== 'string') {
        throw new Error('Invalid CSV content');
    }

    const trimmedText = csvText.trim();
    if (!trimmedText) {
        throw new Error('CSV file is empty');
    }

    console.log('CSV content preview:', trimmedText.substring(0, 200));

    // Parse with PapaParse using semicolon delimiter
    const result = Papa.parse(trimmedText, {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase()
    });

    console.log('Papa.parse result - errors:', result.errors.length, 'data rows:', result.data.length);

    if (result.errors && result.errors.length > 0) {
        const errorMessage = result.errors.map(e => e.message).join(', ');
        throw new Error(`CSV parse error: ${errorMessage}`);
    }

    if (!result.data || result.data.length === 0) {
        throw new Error('CSV file contains no data rows');
    }

    // Validate and transform data
    const gameItems = result.data.map((row, index) => {
        const filename = row.filename?.trim();
        const description = row.description?.trim() || '';
        const rawLocation = row.location?.trim();

        if (!filename) {
            console.warn(`Row ${index + 1}: Missing filename, skipping`);
            return null;
        }

        console.log(`Row ${index + 1}: filename="${filename}", location="${rawLocation}"`);

        return {
            filename,
            description,
            rawLocation: rawLocation || ''
        };
    }).filter(item => item !== null);

    if (gameItems.length === 0) {
        throw new Error('No valid game items found in CSV');
    }

    return gameItems;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseGameItems };
}
