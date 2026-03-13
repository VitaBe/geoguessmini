/**
 * @jest-environment jsdom
 */

const JSZip = require('jszip');
require('../js/zipLoader.js');

describe('zipLoader.js', () => {
  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.time = jest.fn();
    console.timeEnd = jest.fn();
  });

  describe('isImageFile', () => {
    test('should return true for valid image extensions', () => {
      expect(isImageFile('photo.jpg')).toBe(true);
      expect(isImageFile('photo.JPG')).toBe(true);
      expect(isImageFile('photo.jpeg')).toBe(true);
      expect(isImageFile('photo.png')).toBe(true);
      expect(isImageFile('photo.gif')).toBe(true);
      expect(isImageFile('photo.webp')).toBe(true);
      expect(isImageFile('photo.bmp')).toBe(true);
      expect(isImageFile('photo.svg')).toBe(true);
    });

    test('should be case insensitive', () => {
      expect(isImageFile('photo.JPG')).toBe(true);
      expect(isImageFile('photo.PNG')).toBe(true);
      expect(isImageFile('photo.JPEG')).toBe(true);
    });

    test('should return false for non-image files', () => {
      expect(isImageFile('document.txt')).toBe(false);
      expect(isImageFile('data.csv')).toBe(false);
      expect(isImageFile('script.js')).toBe(false);
      expect(isImageFile('style.css')).toBe(false);
      expect(isImageFile('archive.zip')).toBe(false);
    });

    test('should return false for null/undefined', () => {
      expect(isImageFile(null)).toBe(false);
      expect(isImageFile(undefined)).toBe(false);
      expect(isImageFile('')).toBe(false);
    });

    test('should handle filenames with paths', () => {
      expect(isImageFile('images/photos/pic.jpg')).toBe(true);
      expect(isImageFile('/path/to/image.png')).toBe(true);
      expect(isImageFile('folder/photo.JPEG')).toBe(true);
    });

    test('should handle edge cases', () => {
      expect(isImageFile('.jpg')).toBe(true); // Just extension
      expect(isImageFile('file.png.txt')).toBe(false); // Double extension
      expect(isImageFile('jpg')).toBe(false); // No dot
    });
  });

  describe('loadZipFile', () => {
    test('should throw error when no file provided', async () => {
      await expect(loadZipFile(null)).rejects.toThrow('No file provided');
      await expect(loadZipFile(undefined)).rejects.toThrow('No file provided');
    });

    test('should throw error for non-zip files', async () => {
      const mockFile = new Blob(['not a zip'], { type: 'text/plain' });
      mockFile.name = 'document.txt';

      await expect(loadZipFile(mockFile)).rejects.toThrow('File must be a ZIP archive');
    });

    test('should extract CSV and images from valid ZIP', async () => {
      const zip = new JSZip();
      zip.file('data.csv', 'filename;description;location\nimage1.jpg;A test;48.858, 2.294');
      zip.file('image1.jpg', 'fake-image-data-1');
      zip.file('image2.png', 'fake-image-data-2');

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([zipBlob], 'test.zip', { type: 'application/zip' });

      const result = await loadZipFile(zipFile);

      expect(result.csvText).toContain('filename;description;location');
      expect(result.csvText).toContain('image1.jpg');
      expect(result.imageFiles.size).toBe(2);
      expect(result.imageFiles.has('image1.jpg')).toBe(true);
      expect(result.imageFiles.has('image2.png')).toBe(true);
    });

    test('should throw error when data.csv is missing', async () => {
      const zip = new JSZip();
      zip.file('image1.jpg', 'fake-image-data');
      zip.file('notes.txt', 'some notes');

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([zipBlob], 'test.zip', { type: 'application/zip' });

      await expect(loadZipFile(zipFile)).rejects.toThrow(/No data\.csv found/);
    });

    test('should handle nested data.csv paths', async () => {
      const zip = new JSZip();
      zip.folder('folder').file('data.csv', 'filename;description;location\nimage1.jpg;A test;48.858, 2.294');
      zip.file('image1.jpg', 'fake-image-data-1');

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([zipBlob], 'test.zip', { type: 'application/zip' });

      const result = await loadZipFile(zipFile);

      expect(result.csvText).toContain('filename;description;location');
      expect(result.csvText).toContain('image1.jpg');
      expect(result.imageFiles.size).toBe(1);
    });

    test('should handle case-insensitive data.csv', async () => {
      const zip = new JSZip();
      zip.file('DATA.CSV', 'filename;description;location\nimage1.jpg;A test;48.858, 2.294');
      zip.file('image1.jpg', 'fake-image-data');

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([zipBlob], 'test.zip', { type: 'application/zip' });

      const result = await loadZipFile(zipFile);

      expect(result.csvText).toContain('filename;description;location');
    });

    test('should handle images in subdirectories', async () => {
      const zip = new JSZip();
      zip.file('data.csv', 'filename;description;location\nimage1.jpg;A test;48.858, 2.294\nfolder/image2.png');
      zip.folder('folder').file('image2.png', 'fake-image-data');

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([zipBlob], 'test.zip', { type: 'application/zip' });

      const result = await loadZipFile(zipFile);

      expect(result.imageFiles.size).toBe(1);
      expect(result.imageFiles.has('folder/image2.png')).toBe(true);
    });

    test('should skip directories in image counting', async () => {
      const zip = new JSZip();
      zip.file('data.csv', 'filename;description;location\nimage1.jpg;A test;48.858, 2.294');
      zip.file('image1.jpg', 'fake-image-data');
      zip.folder('empty-folder');

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([zipBlob], 'test.zip', { type: 'application/zip' });

      const result = await loadZipFile(zipFile);

      expect(result.imageFiles.size).toBe(1);
    });

    test('should handle non-image files being ignored', async () => {
      const zip = new JSZip();
      zip.file('data.csv', 'filename;description;location\nimage1.jpg;A test;48.858, 2.294');
      zip.file('image1.jpg', 'fake-image-data');
      zip.file('README.txt', 'Some readme');
      zip.file('.DS_Store', 'mac file');

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([zipBlob], 'test.zip', { type: 'application/zip' });

      const result = await loadZipFile(zipFile);

      expect(result.imageFiles.size).toBe(1);
      expect(result.imageFiles.has('image1.jpg')).toBe(true);
    });

    test('should handle empty ZIP file', async () => {
      const zip = new JSZip();

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([zipBlob], 'test.zip', { type: 'application/zip' });

      await expect(loadZipFile(zipFile)).rejects.toThrow(/No data\.csv found/);
    });

    test('should include file details in logs', async () => {
      const zip = new JSZip();
      zip.file('data.csv', 'filename;description;location\nimage1.jpg;A test;48.858, 2.294');

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([zipBlob], 'test.zip', { type: 'application/zip' });

      await loadZipFile(zipFile);

      // Check that some logging happened
      expect(console.log).toHaveBeenCalled();
    });
  });
});
