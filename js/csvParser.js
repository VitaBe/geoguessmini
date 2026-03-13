/**
 * CSV parsing functionality using PapaParse
 */

/**
 * Debug logging prefix
 */
const CSV_LOG = '[CSVParser]';

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
  console.log(`${CSV_LOG} ====================================`);
  console.log(`${CSV_LOG} START: Parsing CSV`);
  console.time(`${CSV_LOG} Total parse time`);

  if (typeof csvText !== 'string') {
    console.error(`${CSV_LOG} ERROR: Invalid CSV content type:`, typeof csvText);
    throw new Error('Invalid CSV content: expected string, got ' + typeof csvText);
  }

  console.log(`${CSV_LOG} Input:`, {
    type: typeof csvText,
    length: csvText.length,
    preview: csvText.substring(0, 100) + (csvText.length > 100 ? '...' : '')
  });

  const trimmedText = csvText.trim();
  console.log(`${CSV_LOG} Trimmed length:`, trimmedText.length);

  if (!trimmedText) {
    console.error(`${CSV_LOG} ERROR: CSV file is empty`);
    throw new Error('CSV file is empty');
  }

  console.log(`${CSV_LOG} Checking PapaParse library...`, {
    loaded: typeof Papa !== 'undefined',
    version: typeof Papa !== 'undefined' ? 'loaded' : 'not loaded'
  });

  if (typeof Papa === 'undefined') {
    throw new Error('PapaParse library not loaded - check internet connection or script loading');
  }

  // Parse with PapaParse using semicolon delimiter
  console.log(`${CSV_LOG} Running Papa.parse with semicolon delimiter...`);
  console.time(`${CSV_LOG} Papa.parse execution`);
  const result = Papa.parse(trimmedText, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase()
  });
  console.timeEnd(`${CSV_LOG} Papa.parse execution`);

  console.log(`${CSV_LOG} Parse result:`, {
    errors: result.errors.length,
    dataRows: result.data?.length || 0,
    meta: {
      delimiter: result.meta?.delimiter,
      linebreak: result.meta?.linebreak,
      aborted: result.meta?.aborted,
      truncated: result.meta?.truncated
    }
  });

  if (result.errors && result.errors.length > 0) {
    const errorMessage = result.errors.map(e => e.message).join(', ');
    console.error(`${CSV_LOG} Papa.parse errors:`, result.errors);
    throw new Error(`CSV parse error: ${errorMessage}`);
  }

  if (!result.data || result.data.length === 0) {
    console.error(`${CSV_LOG} ERROR: CSV contains no data rows`);
    throw new Error('CSV file contains no data rows');
  }

  // Check first row to see what columns are available
  if (result.data.length > 0) {
    const firstRow = result.data[0];
    const headers = Object.keys(firstRow);
    console.log(`${CSV_LOG} Headers found:`, headers);
    console.log(`${CSV_LOG} First row raw:`, firstRow);
  }

  // Validate and transform data
  console.log(`${CSV_LOG} Validating ${result.data.length} rows...`);
  const gameItems = result.data.map((row, index) => {
    const filename = row.filename?.trim();
    const description = row.description?.trim() || '';
    const rawLocation = row.location?.trim();

    console.log(`${CSV_LOG} Row ${index + 1}:`, {
      filename: filename || '(missing!)',
      description: description ? description.substring(0, 50) + '...' : '(empty)',
      location: rawLocation || '(missing!)'
    });

    if (!filename) {
      console.warn(`${CSV_LOG} Row ${index + 1}: SKIPPED - Missing filename`);
      return null;
    }

    return { filename, description, rawLocation: rawLocation || '' };
  }).filter(item => item !== null);

  console.log(`${CSV_LOG} Validation complete:`, {
    inputRows: result.data.length,
    validItems: gameItems.length,
    skipped: result.data.length - gameItems.length
  });

  if (gameItems.length === 0) {
    console.error(`${CSV_LOG} ERROR: No valid game items found after filtering`);
    throw new Error('No valid game items found in CSV - check that each row has a filename');
  }

  console.timeEnd(`${CSV_LOG} Total parse time`);
  console.log(`${CSV_LOG} SUCCESS: Returning ${gameItems.length} game items`);
  console.log(`${CSV_LOG} ====================================`);
  return gameItems;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseGameItems };
}
