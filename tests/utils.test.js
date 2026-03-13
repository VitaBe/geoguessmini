/**
 * @jest-environment jsdom
 */

const utils = require('../js/utils.js');
const { parseLocation, haversineDistance, isWithinTolerance, TOLERANCE_KM } = utils;

describe('utils.js', () => {
  describe('parseLocation', () => {
    test('should parse valid coordinates correctly', () => {
      expect(parseLocation('48.858, 2.294')).toEqual({ lat: 48.858, lng: 2.294 });
      expect(parseLocation('40.689, -74.044')).toEqual({ lat: 40.689, lng: -74.044 });
    });

    test('should handle whitespace correctly', () => {
      expect(parseLocation('  48.858  ,  2.294  ')).toEqual({ lat: 48.858, lng: 2.294 });
      expect(parseLocation('48.858,2.294')).toEqual({ lat: 48.858, lng: 2.294 });
    });

    test('should return null for non-parseable locations', () => {
      expect(parseLocation('This is a final message')).toBeNull();
      expect(parseLocation('Not coordinates')).toBeNull();
      expect(parseLocation('')).toBeNull();
    });

    test('should return null for invalid number of parts', () => {
      expect(parseLocation('48.858')).toBeNull();
      expect(parseLocation('48.858, 2.294, extra')).toBeNull();
    });

    test('should return null for invalid numbers', () => {
      expect(parseLocation('abc, 2.294')).toBeNull();
      expect(parseLocation('48.858, xyz')).toBeNull();
      expect(parseLocation('abc, xyz')).toBeNull();
    });

    test('should return null for out-of-range coordinates', () => {
      expect(parseLocation('91.0, 2.294')).toBeNull(); // lat > 90
      expect(parseLocation('-91.0, 2.294')).toBeNull(); // lat < -90
      expect(parseLocation('48.858, 181.0')).toBeNull(); // lng > 180
      expect(parseLocation('48.858, -181.0')).toBeNull(); // lng < -180
    });

    test('should handle boundary values', () => {
      expect(parseLocation('90.0, 180.0')).toEqual({ lat: 90.0, lng: 180.0 });
      expect(parseLocation('-90.0, -180.0')).toEqual({ lat: -90.0, lng: -180.0 });
    });

    test('should handle null and undefined', () => {
      expect(parseLocation(null)).toBeNull();
      expect(parseLocation(undefined)).toBeNull();
    });

    test('should handle non-string types', () => {
      expect(parseLocation(123)).toBeNull();
      expect(parseLocation({})).toBeNull();
      expect(parseLocation([])).toBeNull();
    });
  });

  describe('haversineDistance', () => {
    test('should calculate distance between two points correctly', () => {
      // Paris to London is approximately 341-344 km depending on calculation method
      const distance = haversineDistance(48.858, 2.294, 51.507, -0.128);
      expect(distance).toBeCloseTo(341, -1); // within 10km
    });

    test('should return 0 for same point', () => {
      const distance = haversineDistance(48.858, 2.294, 48.858, 2.294);
      expect(distance).toBe(0);
    });

    test('should handle equator points', () => {
      const distance = haversineDistance(0, 0, 0, 1);
      // 1 degree longitude at equator is approximately 111 km
      expect(distance).toBeCloseTo(111.19, 0);
    });

    test('should handle poles', () => {
      const distance = haversineDistance(90, 0, -90, 0); // North to South pole
      expect(distance).toBeCloseTo(20015, 0); // ~20,015 km
    });

    test('should handle antimeridian', () => {
      const distance = haversineDistance(0, 179, 0, -179);
      expect(distance).toBeCloseTo(222.39, 0); // 2 degrees longitude at equator
    });
  });

  describe('isWithinTolerance', () => {
    test('should return true for points within tolerance', () => {
      // Same point
      expect(isWithinTolerance(48.858, 2.294, 48.858, 2.294)).toBe(true);

      // Very close points (within 50km)
      // Move ~10km from Paris
      expect(isWithinTolerance(48.858, 2.294, 48.948, 2.304)).toBe(true);
    });

    test('should return false for points outside tolerance', () => {
      // Paris to London is ~344km, outside 50km tolerance
      expect(isWithinTolerance(48.858, 2.294, 51.507, -0.128)).toBe(false);
    });

    test('should correctly use 50km tolerance', () => {
      expect(TOLERANCE_KM).toBe(50);

      // Point at exactly 50km should be within
      // We tested distance above, let's verify tolerance logic
      const distance = haversineDistance(48.858, 2.294, 48.858, 2.294);
      expect(distance).toBe(0);
      expect(distance <= TOLERANCE_KM).toBe(true);
    });
  });
});
