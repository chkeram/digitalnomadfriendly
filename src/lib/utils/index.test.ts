import { describe, it, expect } from 'vitest';
import { calculateDistance, formatDistance, formatRating, getStarRating } from './index';

describe('Utils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      // Distance between San Francisco and Los Angeles (approx 560km)
      const distance = calculateDistance(37.7749, -122.4194, 34.0522, -118.2437);
      expect(distance).toBeCloseTo(560, -1); // Within 10km accuracy
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(37.7749, -122.4194, 37.7749, -122.4194);
      expect(distance).toBe(0);
    });
  });

  describe('formatDistance', () => {
    it('should format distance in meters for values < 1km', () => {
      expect(formatDistance(0.5)).toBe('500m');
      expect(formatDistance(0.123)).toBe('123m');
    });

    it('should format distance in kilometers for values >= 1km', () => {
      expect(formatDistance(1.2)).toBe('1.2km');
      expect(formatDistance(5.67)).toBe('5.7km');
    });
  });

  describe('formatRating', () => {
    it('should format rating to 1 decimal place', () => {
      expect(formatRating(4.567)).toBe('4.6');
      expect(formatRating(3)).toBe('3.0');
    });
  });

  describe('getStarRating', () => {
    it('should generate correct star rating', () => {
      expect(getStarRating(5)).toBe('★★★★★');
      expect(getStarRating(4)).toBe('★★★★☆');
      expect(getStarRating(4.5)).toBe('★★★★☆');
      expect(getStarRating(0)).toBe('☆☆☆☆☆');
    });
  });
});