# Code Issues Found

## Issue 1: CSV Location Parsing ⚠️

**File:** `csvParser.js` line 33
**Problem:** Column name extracted in lowercase with trim

```javascript
const rawLocation = row.location?.trim();
```

The header is transformed to lowercase (line 27), so it correctly looks for `row.location` (lowercase).
✓ This is correct

---

## Issue 2: Image Path Lookup Edge Cases ⚠️

**File:** `main.js` line 95-102 (`imageLoader.getImageUrl()`)
**Problem:** Filename matching might fail if:

1. CSV has full paths like "images/photo.jpg" but ZIP stores as just "photo.jpg"
2. File extensions don't match case (photo.JPG vs photo.jpg)

**Example that would fail:**
```
CSV: photo.jpg
ZIP stored as: images/photo.jpg

First lookup (line 93): zipImageFiles.get("photo.jpg") → null
Second lookup (line 95-102):
  - lowerFilename = "photo.jpg"
  - iterates: path = "images/photo.jpg"
  - pathFilename = "photo.jpg"  ✓ MATCHES!
```

Actually, this should work. But let me check the condition...

Actually, I found it! The CSV might have extra spaces:

**File:** `csvParser.js` line 42-43
```javascript
const rawLocation = row.location?.trim();
```

This trims the location. But wait, the spread of image files - let me check...

Actually no, I don't see an issue there.

---

## Issue 3: Potential Race Condition ⚠️

**File:** `main.js` line 240
```javascript
await loadCurrentItem();
```

This is an async call. But then the console logs:
```javascript
console.log('First item loaded successfully');
```

If loadCurrentItem() rejects or throws, the catch block catches it (line 245), so this is safe.

✓ This is correct

---

## Issue 4: Case Sensitive File Extensions ⚠️

**File:** `zipLoader.js` line 60-64, `isImageFile()` function
```javascript
function isImageFile(fileName) {
    if (!fileName) return false;
    const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowerName = fileName.toLowerCase();
    return extensions.some(ext => lowerName.endsWith(ext));
}
```

This correctly converts to lowercase, so `.JPG` should match `.jpg`.

✓ This is correct

---

## Issue 5: Critical - CSV Header Column Name Requirement ⚠️⚠️⚠️

**File:** `csvParser.js` line 42-45
```javascript
const filename = row.filename?.trim();
const description = row.description?.trim() || '';
const rawLocation = row.location?.trim();
```

The CSV MUST have columns named exactly: `filename`, `description`, `location`

BUT! Looking at the transformHeader on line 27:
```javascript
transformHeader: (header) => header.trim().toLowerCase()
```

So the column name gets trimmed and converted to lowercase.

**Examples that MUST match:**
| ✓ Will work | ❌ Won't work |
|---|---|
| filename | File Name |
| filename | FILENAME |
| description | Description |
| location | Location |
| location | loc |
| location | coordinates |

---

## Issue 6: Error in handleReplay() ⚠️

**File:** `main.js` line 226-227
```javascript
if (zipImageFiles.size > 0 && imageUrlCache) {
    for (const url of imageUrlCache.values()) {
        URL.revokeObjectURL(url);
    }
}
```

**Problem:** `imageUrlCache` is a global variable defined in `gameState.js`, but it's being checked directly in `main.js`. 

Since both files define globals in the same scope, this should technically work... BUT it's fragile. If gameState.js hasn't loaded or if the variable isn't defined yet, this will fail silently.

**Better approach:** Remove this cleanup (imageUrlCache cleanup is already done in gameState.js when resetting).

---

## Issue 7: mapController Functions Might Be Undefined ⚠️

**File:** `main.js` line 237
```javascript
initGame(items, imageLoader, { showMap, hideMap, resetMap }, uiController);
```

When this line runs, `showMap`, `hideMap`, and `resetMap` must be defined globally from `mapView.js`.

**Check:** Are these functions defined before main.js runs?
- mapView.js is loaded BEFORE main.js ✓
- Functions are defined at file level (not inside any condition) ✓
- They are NOT conditional exports ✓

So this should work.

✓ This is correct

---

## ACTUAL BUGS FOUND ✗

### Bug 1: Async loadCurrentItem Without Proper Error Handling
**Severity:** HIGH
**File:** `gameState.js` line 31
**Issue:** `loadCurrentItem()` is declared async but calls are awaited. However, if it throws and isn't caught, the error won't be visible.

Actually, wait - let me look at the call again:
```javascript
// In main.js
await loadCurrentItem();
```
It IS awaited, and it's in a try-catch block. So errors will be caught. But let me check gameState.js...

```javascript
// In gameState.js line 31
async function loadCurrentItem() {
    ...
    } catch (error) {
        console.error('Error loading current item:', error);
        if (uiControllerRef && typeof uiControllerRef.updateDescription === 'function') {
            uiControllerRef.updateDescription(item.description + '\n(Error loading image)');
        }
    }
}
```

The error is caught inside loadCurrentItem(), so it won't be thrown to the caller. This is actually fine.

✓ This is correct

---

## CRITICAL FINDING: Async Nothing Scenario

**File:** `gameState.js` line 90
```javascript
} catch (error) {
    console.error('Error loading current item:', error);
    // Show error in description
    if (uiControllerRef && typeof uiControllerRef.updateDescription === 'function') {
        uiControllerRef.updateDescription(item.description + '\n(Error loading image)');
    }
}
```

If `uiControllerRef` is NOT set (undefined), this error will be silent! The error is only logged to console, and the error message is only shown if uiControllerRef.updateDescription exists.

**But wait** - uiControllerRef IS set in initGame():
```javascript
function initGame(items, imageLoaderObj, mapControllerObj, uiControllerObj) {
    ...
    uiControllerRef = uiControllerObj;
}
```

And it's called with:
```javascript
initGame(items, imageLoader, { showMap, hideMap, resetMap }, uiController);
```

Where uiController is the object from main.js. So uiControllerRef should be set.

✓ This should work

---

## MOST LIKELY CULPRIT: No Error Feedback

**Scenario:** User uploads ZIP, something fails silently, nothing shows on screen.

**Why:** In `handleFileUpload()` (main.js line 245-249):
```javascript
} catch (error) {
    console.error('Upload error:', error);
    uiController.showError(error.message || 'Failed to load game data');
    if (fileInput) {
        fileInput.value = '';
    }
}
```

Errors ARE caught and displayed via `uiController.showError()`. So if an error occurred, it SHOULD show up.

Unless... `uiController` is undefined! But it's defined at line 21 of main.js as a const object.

---

## Final Analysis

The code is actually quite well-written. The most likely failure scenarios are:

1. **ZIP file format incorrect** (not valid ZIP)
2. **CSV not in root of ZIP** (stored in subdirectory)
3. **CSV filename mismatch** (wrong column names or delimiter)
4. **Image files not in ZIP** (referenced in CSV but not present)
5. **Invalid coordinates** (can't be parsed as numbers)
6. **CDN libraries not loading** (JSZip or PapaParse offline)

The code has proper error handling for all these cases, so errors SHOULD be displayed to the user via `uiController.showError()`.

If you're not seeing error messages, check:
- Browser console for JS errors
- Network tab to ensure CDN libraries loaded
- That the error message container is visible (id="upload-error")
