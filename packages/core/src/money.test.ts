import { describe, expect, it } from 'vitest';

import { formatPaise, parseRupees, percentOff } from './money';

describe('formatPaise', () => {
  it('drops the decimals for whole rupees', () => {
    expect(formatPaise(24900)).toBe('₹249');
    expect(formatPaise(0)).toBe('₹0');
  });

  it('keeps two decimals otherwise', () => {
    expect(formatPaise(24950)).toBe('₹249.50');
    expect(formatPaise(5)).toBe('₹0.05');
  });

  it('groups digits the Indian way', () => {
    expect(formatPaise(99900)).toBe('₹999');
    expect(formatPaise(100000)).toBe('₹1,000');
    expect(formatPaise(12499900)).toBe('₹1,24,999');
    expect(formatPaise(1234567800)).toBe('₹1,23,45,678');
  });

  it('handles negatives', () => {
    expect(formatPaise(-1050)).toBe('-₹10.50');
  });
});

describe('parseRupees', () => {
  it('reads plain and decimal amounts', () => {
    expect(parseRupees('49')).toBe(4900);
    expect(parseRupees('49.5')).toBe(4950);
    expect(parseRupees(' ₹ 49.50 ')).toBe(4950);
  });

  it('rejects anything else', () => {
    expect(parseRupees('')).toBeNull();
    expect(parseRupees('-5')).toBeNull();
    expect(parseRupees('4.999')).toBeNull();
    expect(parseRupees('abc')).toBeNull();
  });
});

describe('percentOff', () => {
  it('rounds to a whole percentage', () => {
    expect(percentOff(10000, 8500)).toBe(15);
    expect(percentOff(9900, 9000)).toBe(9);
  });

  it('is zero when there is no saving', () => {
    expect(percentOff(5000, 5000)).toBe(0);
    expect(percentOff(5000, 6000)).toBe(0);
    expect(percentOff(0, 0)).toBe(0);
  });
});
