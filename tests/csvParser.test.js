/**
 * @jest-environment jsdom
 */

require('../js/csvParser.js');

describe('csvParser.js', () => {
  beforeEach(() => {
    // Reset any state if needed
    console.log = jest.fn();
    console.error = jest.fn();
    console.time = jest.fn();
    console.timeEnd = jest.fn();
  });

  describe('parseGameItems', () => {
    test('should parse valid CSV with semicolon delimiter', () => {
      const csv = `filename;description;location
image1.jpg;A beautiful beach;48.858, 2.294
image2.jpg;A mountain view;40.689, -74.044`;

      const result = parseGameItems(csv);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        filename: 'image1.jpg',
        description: 'A beautiful beach',
        rawLocation: '48.858, 2.294'
      });
      expect(result[1]).toEqual({
        filename: 'image2.jpg',
        description: 'A mountain view',
        rawLocation: '40.689, -74.044'
      });
    });

    test('should parse CSV with final message row', () => {
      const csv = `filename;description;location
image.jpg;A location;48.858, 2.294
final.txt;Congratulations! You won!;This is not a coordinate`;

      const result = parseGameItems(csv);

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        filename: 'final.txt',
        description: 'Congratulations! You won!',
        rawLocation: 'This is not a coordinate'
      });
    });

    test('should handle empty description', () => {
      const csv = `filename;description;location
image.jpg;;48.858, 2.294`;

      const result = parseGameItems(csv);

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('');
    });

    test('should handle empty location', () => {
      const csv = `filename;description;location
image.jpg;A test;`;

      const result = parseGameItems(csv);

      expect(result).toHaveLength(1);
      expect(result[0].rawLocation).toBe('');
    });

    test('should skip rows with missing filename', () => {
      const csv = `filename;description;location
;A test;48.858, 2.294
image2.jpg;Valid image;40.689, -74.044`;

      const result = parseGameItems(csv);

      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('image2.jpg');
    });

    test('should handle whitespace trimming', () => {
      const csv = `filename; description;location
  image.jpg  ;  A description  ;  48.858, 2.294  `;

      const result = parseGameItems(csv);

      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('image.jpg');
      expect(result[0].description).toBe('A description');
    });

    test('should throw error for empty CSV', () => {
      expect(() => parseGameItems('')).toThrow('CSV file is empty');
    });

    test('should throw error for whitespace-only CSV', () => {
      expect(() => parseGameItems('   \n\t\n   ')).toThrow('CSV file is empty');
    });

    test('should throw error for non-string input', () => {
      expect(() => parseGameItems(null)).toThrow('Invalid CSV content: expected string, got object');
      expect(() => parseGameItems(123)).toThrow('Invalid CSV content: expected string, got number');
    });

    test('should throw error when no valid game items found', () => {
      const csv = `filename;description;location
;A;A;A;`;

      expect(() => parseGameItems(csv)).toThrow('No valid game items found');
    });

    test('should handle CSV without headers if first row matches expected format', () => {
      // PapaParse with header: true will use first row as headers if it looks like headers
      const csv = `filename;description;location
image.jpg;A test;48.858, 2.294`;

      const result = parseGameItems(csv);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        filename: 'image.jpg',
        description: 'A test',
        rawLocation: '48.858, 2.294'
      });
    });

    test('should handle PapaParse errors', () => {
      // Invalid Papa parse case - malformed data
      // This CSV will parse but may not have expected structure
      const csv = `filename;description
image.jpg`;

      // Should still parse but with missing location
      const result = parseGameItems(csv);

      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('image.jpg');
      expect(result[0].rawLocation).toBe('');
    });

    test('should handle very long descriptions', () => {
      const longDesc = 'A'.repeat(1000);
      const csv = `filename;description;location
image.jpg;${longDesc};48.858, 2.294`;

      const result = parseGameItems(csv);

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe(longDesc);
    });

    test('should handle special characters in description', () => {
      const csv = `filename;description;location
image.jpg;Location with "quotes" and $ymbols;48.858, 2.294`;

      const result = parseGameItems(csv);

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Location with "quotes" and $ymbols');
    });

    test('should handle multiple rows correctly', () => {
      const csv = `filename;description;location
eiffel.jpg;A famous iron tower;48.858, 2.294
liberty.jpg;Statue of Liberty;40.689, -74.044
colosseum.jpg;Ancient amphitheatre;41.890, 12.492
opera.jpg;Sydney Opera House;-33.857, 151.215`;

      const result = parseGameItems(csv);

      expect(result).toHaveLength(4);
      expect(result[0].filename).toBe('eiffel.jpg');
      expect(result[1].filename).toBe('liberty.jpg');
      expect(result[2].filename).toBe('colosseum.jpg');
      expect(result[3].filename).toBe('opera.jpg');
    });
  });
});
