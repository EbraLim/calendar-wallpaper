import { describe, it, expect } from 'vitest';
import { getHolidays } from './holidays';

describe('getHolidays', () => {
  it('returns 신정 for January 2026', () => {
    const h = getHolidays(2026, 1);
    expect(h.has(1)).toBe(true);
    expect(h.size).toBe(1);
  });

  it('returns 설날 연휴 for February 2026', () => {
    const h = getHolidays(2026, 2);
    expect(h.has(16)).toBe(true);
    expect(h.has(17)).toBe(true);
    expect(h.has(18)).toBe(true);
    expect(h.size).toBe(3);
  });

  it('returns 삼일절 + 대체공휴일 for March 2026', () => {
    const h = getHolidays(2026, 3);
    expect(h.has(1)).toBe(true);
    expect(h.has(2)).toBe(true);
  });

  it('returns 추석 연휴 + 대체공휴일 for September 2026', () => {
    const h = getHolidays(2026, 9);
    expect(h.has(24)).toBe(true);
    expect(h.has(25)).toBe(true);
    expect(h.has(26)).toBe(true);
    expect(h.has(28)).toBe(true);
    expect(h.size).toBe(4);
  });

  it('returns empty set for unknown year', () => {
    expect(getHolidays(2030, 1).size).toBe(0);
  });

  it('returns empty set for month with no holidays', () => {
    expect(getHolidays(2026, 4).size).toBe(0);
  });
});
