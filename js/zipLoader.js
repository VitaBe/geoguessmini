/**
 * ZIP file loading functionality using JSZip
 */

/**
 * Debug logging prefix
 */
const ZIP_LOG = '[ZIPLoader]';

/**
 * Load and parse a ZIP file
 * @param {File} file - The ZIP file to load
 * @returns {Promise<{csvText: string, imageFiles: Map<string, Object>}>} - CSV content and image files
 */
async function loadZipFile(file) {
  console.log(`${ZIP_LOG} ====================================`);
  console.log(`${ZIP_LOG} START: Processing file: ${file?.name || 'unknown'}`);
  console.time(`${ZIP_LOG} Total load time`);

  if (!file) {
    console.error(`${ZIP_LOG} ERROR: No file provided`);
    throw new Error('No file provided');
  }

  console.log(`${ZIP_LOG} File details:`, {
    name: file.name,
    type: file.type,
    size: file.size + ' bytes',
    sizeKB: Math.round(file.size / 1024) + 'KB'
  });

  if (!file.name.endsWith('.zip')) {
    console.error(`${ZIP_LOG} ERROR: Invalid file type - expected .zip, got: ${file.name}`);
    throw new Error('File must be a ZIP archive');
  }

  try {
    console.log(`${ZIP_LOG} Checking JSZip library...`, {
      loaded: typeof JSZip !== 'undefined',
      version: typeof JSZip !== 'undefined' ? (JSZip.version || 'unknown') : 'not loaded'
    });

    if (typeof JSZip === 'undefined') {
      throw new Error('JSZip library not loaded - check internet connection or script loading');
    }

    console.log(`${ZIP_LOG} Loading ZIP with JSZip...`);
    console.time(`${ZIP_LOG} JSZip.loadAsync`);
    const zip = await JSZip.loadAsync(file);
    console.timeEnd(`${ZIP_LOG} JSZip.loadAsync`);

    const fileEntries = Object.keys(zip.files);
    console.log(`${ZIP_LOG} ZIP loaded. Total entries:`, fileEntries.length);
    console.log(`${ZIP_LOG} All ZIP entries:`, fileEntries);

    // Find data.csv in the root
    let csvEntry = null;
    const imageFiles = new Map();
    const foundFiles = { csv: null, images: [], other: [] };

    console.log(`${ZIP_LOG} Scanning ZIP contents:`);
    for (const [path, zipEntry] of Object.entries(zip.files)) {
      // Skip directories
      if (zipEntry.dir) {
        console.log(`${ZIP_LOG}   [DIR]  ${path}`);
        continue;
      }

      const fileName = path.split('/').pop();
      const lowerPath = path.toLowerCase();

      // Find data.csv (case insensitive, root level)
      if (lowerPath === 'data.csv' || lowerPath.endsWith('/data.csv')) {
        csvEntry = zipEntry;
        foundFiles.csv = path;
        console.log(`${ZIP_LOG}   [CSV]  ${path} <-- FOUND`);
      }
      // Collect image files
      else if (isImageFile(fileName)) {
        imageFiles.set(path, zipEntry);
        foundFiles.images.push(path);
        console.log(`${ZIP_LOG}   [IMG]  ${path}`);
      } else {
        foundFiles.other.push(path);
        console.log(`${ZIP_LOG}   [FILE] ${path}`);
      }
    }

    console.log(`${ZIP_LOG} Scan complete:`, {
      csvFound: !!csvEntry,
      csvPath: foundFiles.csv,
      imageCount: imageFiles.size,
      images: foundFiles.images,
      otherFiles: foundFiles.other
    });

    if (!csvEntry) {
      const availableFiles = fileEntries.filter(e => !zip.files[e].dir).join(', ') || 'none';
      const error = new Error(`No data.csv found in ZIP file. Available files: ${availableFiles}`);
      console.error(`${ZIP_LOG} ERROR:`, error.message);
      throw error;
    }

    // Extract CSV text
    console.log(`${ZIP_LOG} Extracting CSV text...`);
    console.time(`${ZIP_LOG} CSV extraction`);
    const csvText = await csvEntry.async('text');
    console.timeEnd(`${ZIP_LOG} CSV extraction`);
    console.log(`${ZIP_LOG} CSV extracted:`, {
      length: csvText.length,
      first200Chars: csvText.substring(0, 200) + (csvText.length > 200 ? '...' : '')
    });

    console.timeEnd(`${ZIP_LOG} Total load time`);
    console.log(`${ZIP_LOG} SUCCESS: Returning ${csvText.length} chars CSV and ${imageFiles.size} images`);
    console.log(`${ZIP_LOG} ====================================`);
    return { csvText, imageFiles };
  } catch (error) {
    console.error(`${ZIP_LOG} FATAL ERROR:`, error);
    console.timeEnd(`${ZIP_LOG} Total load time`);
    console.log(`${ZIP_LOG} ====================================`);
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
