import { describe, it, expect } from 'vitest';
import { toQuery, ApiError } from '../lib/api.js';
import { formatMoney, formatUsd, bucketLabel, formatNumber } from '../lib/format.js';

describe('toQuery', () => {
  it('skips empty values and encodes the rest', () => {
    expect(toQuery({ a: 1, b: '', c: undefined, d: null, e: 'x y' })).toBe('?a=1&e=x+y');
  });
  it('returns an empty string when there is nothing to send', () => {
    expect(toQuery({})).toBe('');
    expect(toQuery()).toBe('');
  });
});

describe('ApiError', () => {
  it('exposes the server error shape', () => {
    const e = new ApiError(400, { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: [{ path: 'salary', message: 'bad' }] } });
    expect(e).toMatchObject({ status: 400, code: 'VALIDATION_ERROR', message: 'Invalid input' });
    expect(e.details[0].path).toBe('salary');
  });
  it('falls back to a generic message', () => {
    expect(new ApiError(500, null).message).toBe('Request failed (500)');
  });
});

describe('formatting', () => {
  it('formats money in the right currency', () => {
    expect(formatMoney(1500, 'USD')).toBe('$1,500');
    expect(formatMoney(2400000, 'INR')).toContain('2,400,000');
    expect(formatMoney(null)).toBe('—');
  });
  it('supports compact notation and bucket labels', () => {
    expect(formatUsd(25500, { compact: true })).toBe('$25.5K');
    expect(bucketLabel({ from: 40000, to: 60000 })).toBe('$40K–$60K');
  });
  it('formats counts', () => {
    expect(formatNumber(10000)).toBe('10,000');
  });
});