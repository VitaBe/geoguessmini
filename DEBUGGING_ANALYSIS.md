# GeoQuest ZIP Upload Debug Analysis

## Script Loading Order (from index.html)
1. **utils.js** - Utility functions (parseLocation, haversineDistance, isWithinTolerance)
2. **zipLoader.js** - ZIP file loading (loadZipFile, isImageFile)
3. **csvParser.js** - CSV parsing (parseGameItems)
4. **mapView.js** - Map functions (initMap, showMap, hideMap, resetMap, clearMarkers)
5. **gameState.js** - Game state management (initGame, loadCurrentItem, advanceToNextItem)
6. **main.js** - Main application (uiController, imageLoader, handleFileUpload, initApplication)

⚠️ **Critical:** Each module must be loaded before it's used in subsequent modules.

## ZIP Upload Flow

### Step 1: User Selects File
**File:** `main.js` → `handleFileUpload()` (line 195-249)

```
File selected
  ↓
Check if JSZip and Papa are loaded
  ↓
Call loadZipFile(file)
```

**Potential Issues:**
- ❌ JSZip not loaded from CDN (line 219-221)
- ❌ PapaParse not loaded from CDN (line 222-224)
- ❌ File is not a .zip file (zipLoader.js line 9)

---

### Step 2: Load ZIP File
**File:** `zipLoader.js` → `loadZipFile()` (line 8-53)

**What happens:**
1. Validates file is a ZIP archive (line 9)
2. Calls `JSZip.loadAsync(file)` (line 13)
3. Iterates through ZIP entries:
   - Skips directories
   - Finds `data.csv` (case-insensitive, line 27-30)
   - Collects all image files into a Map (line 33-36)
4. Extracts CSV as text (line 45)
5. Returns `{csvText, imageFiles}` (line 47)

**Potential Issues:**
- ❌ NO `data.csv` found in ZIP → Error: "No data.csv found in ZIP file" (line 41)
- ❌ CSV file is in subdirectory but not root (zipLoader only checks root level - line 29 condition)
- ❌ ZIP is corrupted or invalid format

**Check Your ZIP Structure:**
```
✅ Correct:
my_game.zip
├── data.csv
├── image1.jpg
├── image2.jpg
└── image3.jpg

❌ Wrong:
my_game.zip
└── subfolder/
    ├── data.csv
    ├── image1.jpg
    └── image2.jpg
```

---

### Step 3: Parse CSV
**File:** `csvParser.js` → `parseGameItems()` (line 8-57)

**CSV Format Expected:**
```
filename;description;location
image1.jpg;Description here;LATITUDE,LONGITUDE
image2.jpg;Description here;LATITUDE,LONGITUDE
final_message.txt;Any text;;Final message text (no coordinates)
```

**Delimiter:** Semicolon (`;`) - NOT comma!

**Column Names (case-insensitive, trimmed):**
- `filename` - Required, cannot be empty
- `description` - Optional
- `location` - Required for game items, can be empty for final message

**What happens:**
1. Validates CSV not empty (line 17-19)
2. Uses PapaParse with semicolon delimiter (line 23-30)
3. Validates parsed data (line 32-35)
4. Maps each row to GameItem object (line 38-60)
5. Filters out invalid rows (missing filename) (line 61)

**Potential Issues:**
- ❌ CSV uses comma (`,`) instead of semicolon (`;`) → Will fail to parse
- ❌ Empty CSV or no data rows → Error: "CSV file contains no data rows"
- ❌ CSV has no `filename` column → Rows will be skipped
- ❌ CSV has no `location` column → Rows will fail (undefined rawLocation)
- ❌ All rows have missing filename → Error: "No valid game items found in CSV"

**Debug with these test rows:**
```
filename;description;location
test1.jpg;A test image;0,0
```

---

### Step 4: Initialize Game
**File:** `main.js` → `handleFileUpload()` (line 237)

```javascript
initGame(items, imageLoader, { showMap, hideMap, resetMap }, uiController);
```

Passes to `gameState.js` → `initGame()`:
- `gameItems` ← items array from CSV
- `imageLoader` ← object from main.js that can fetch images from ZIP
- `mapController` ← object with showMap/hideMap/resetMap functions from mapView.js
- `uiControllerRef` ← object with UI update methods

**Potential Issues:**
- ❌ `showMap`, `hideMap`, `resetMap` undefined if mapView.js didn't load
- ❌ `imageLoader` methods not properly bound

---

### Step 5: Load First Item
**File:** `gameState.js` → `loadCurrentItem()` (line 32-93)

**What happens:**
1. Gets current item from gameItems array (line 35)
2. Parses location string (line 36)
3. If location can't be parsed:
   - Shows final view (line 48)
   - Returns early
4. If location is valid:
   - Tries to load image using `imageLoader.getImageUrl(filename)` (line 59)
   - Updates UI with image, description, progress (line 68-79)
   - Shows map (line 82)

**Potential Issues:**
- ❌ Image file not found in ZIP → imageUrl is null
- ❌ Image filename in CSV doesn't match filename in ZIP → imageUrl is null
- ❌ JSZip extract fails → Error caught and shown in description
- ❌ Map not initialized → mapController methods won't exist

---

### Step 6: Image Lookup
**File:** `main.js` → `imageLoader.getImageUrl()` (line 88-113)

**Search strategy (in order):**
1. Exact filename match in zipImageFiles Map (line 93)
2. Case-insensitive filename match (line 95-102):
   - Extracts just the filename from full ZIP path
   - Compares case-insensitively

**Example:**
```
CSV says: "photo.jpg"
ZIP contains: "images/photo.jpg"
Result: ✓ Found (case-insensitive search matches)

CSV says: "photo.jpg"
ZIP contains: "images/Photo.JPG"  
Result: ✓ Found (case-insensitive match)

CSV says: "photo.jpg"
ZIP contains: "other.jpg"
Result: ❌ Not found → imageUrl = null
```

**Potential Issues:**
- ❌ Filename mismatch between CSV and ZIP
- ❌ Image file not in ZIP at all
- ❌ JSZip blob extraction fails

---

## Most Common Failure Points

### 1. ❌ CSV File Not at Root Level
**Symptom:** "No data.csv found in ZIP file"
**Cause:** zipLoader only looks for `data.csv` at root
**Fix:** Ensure `data.csv` is directly in ZIP root, not in a subfolder

### 2. ❌ Wrong CSV Delimiter
**Symptom:** Only one column found or empty rows
**Cause:** CSV uses comma instead of semicolon
**Fix:** Use semicolon (`;`) as delimiter in CSV file

### 3. ❌ Image Files Not Found
**Symptom:** Game loads but images display broken/empty
**Cause:** Filename in CSV doesn't match filename in ZIP
**Fix:** Check exact filename spelling and extension

### 4. ❌ CSV Header Names Wrong
**Symptom:** Parsing succeeds but "No valid game items found"
**Cause:** Missing or misspelled column names
**Fix:** Ensure columns are exactly: `filename`, `description`, `location`

### 5. ❌ Missing Location Data
**Symptom:** Parsing succeeds but item doesn't load
**Cause:** Location column empty or invalid coordinates
**Fix:** Provide valid "LATITUDE,LONGITUDE" or text for final item

---

## Testing Checklist

```
☐ ZIP file is valid and not corrupted
☐ data.csv is at the ROOT level in the ZIP (not in a subfolder)
☐ CSV uses SEMICOLON (;) as delimiter, not comma
☐ CSV has exactly these columns: filename;description;location
☐ All image files referenced in CSV are actually in the ZIP
☐ Filenames match exactly (including case for case-sensitive systems)
☐ Each location is either "LAT,LNG" format or text (for final item)
☐ No empty filename cells
☐ Browser console shows no JS errors
☐ Console logs show: "File selected", "Loading ZIP...", "ZIP loaded", "Parsing CSV...", etc.
```

---

## Debug Steps

1. **Open Browser DevTools** (F12 or Cmd+Option+I)
2. **Check Console tab** for errors
3. **Select a ZIP file** and watch the console logs
4. **Each step should log:**
   - "File selected: ..."
   - "Loading ZIP file..."
   - "ZIP loaded successfully..."
   - "Parsing CSV..."
   - "CSV parsed. Items found: X"
   - "Initializing game..."
   - "Loading first item..."
   - "First item loaded successfully"

5. **If any step is missing**, that's where it's failing
6. **Check error messages** for specific issue

---

## Sample Valid ZIP Structure

Create a ZIP file with this exact structure:

```
my_game.zip/
├── data.csv
├── photo1.jpg
├── photo2.jpg
└── photo3.jpg
```

**data.csv content:**
```
filename;description;location
photo1.jpg;First location;40.7128,-74.0060
photo2.jpg;Second location;51.5074,-0.1278
photo3.jpg;Third location;35.6762,139.6503
final.txt;You won!;Game completed
```

This should work when uploaded to the application.
