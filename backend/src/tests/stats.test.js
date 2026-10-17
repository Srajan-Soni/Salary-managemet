import { describe, it, expect } from 'vitest';
import { percentile, summarize, histogram } from '../src/domain/stats.js';

describe('percentile', () => {
  it('returns null for empty input and the value for a single item', () => {
    expect(percentile([], 50)).toBeNull();
    expect(percentile([7], 90)).toBe(7);
  });
  it('interpolates between values', () => {
    expect(percentile([10, 20, 30, 40], 50)).toBe(25);
    expect(percentile([10, 20, 30, 40], 0)).toBe(10);
    expect(percentile([10, 20, 30, 40], 100)).toBe(40);
  });
});

describe('summarize', () => {
  it('handles empty lists', () => {
    expect(summarize([])).toMatchObject({ headcount: 0, total: 0, median: null, avg: null });
  });
  it('computes stats regardless of input order and does not mutate input', () => {
    const input = [50, 10, 30, 20, 40];
    const s = summarize(input);
    expect(s).toMatchObject({ headcount: 5, total: 150, min: 10, median: 30, avg: 30, max: 50 });
    expect(input).toEqual([50, 10, 30, 20, 40]);
  });
});

describe('histogram', () => {
  it('buckets all values and puts the max in the last bucket', () => {
    const h = histogram([0, 5, 10], 2);
    expect(h).toEqual([
      { from: 0, to: 5, count: 1 },
      { from: 5, to: 10, count: 2 },
    ]);
  });
  it('conserves the count', () => {
    const values = Array.from({ length: 101 }, (_, i) => i * 3);
    expect(histogram(values, 7).reduce((s, b) => s + b.count, 0)).toBe(101);
  });
  it('handles identical values and empty input', () => {
    expect(histogram([5, 5, 5], 4)).toEqual([{ from: 5, to: 5, count: 3 }]);
    expect(histogram([], 4)).toEqual([]);
  });
});