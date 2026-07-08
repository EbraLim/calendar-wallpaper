import { describe, it, expect } from 'vitest';
import { getLunarDays, formatLunarDay } from './lunar';

describe('getLunarDays', () => {
  it('returns lunar data for every day in the month', () => {
    const m = getLunarDays(2026, 7, 31);
    expect(m.size).toBe(31);
    for (let d = 1; d <= 31; d++) {
      expect(m.has(d)).toBe(true);
    }
  });

  it('음력 1일이 존재하는 달에서 lunarDay=1을 포함', () => {
    const m = getLunarDays(2026, 2, 28);
    const lunar1 = [...m.entries()].find(([, v]) => v.lunarDay === 1);
    expect(lunar1).toBeDefined();
  });

  it('설날(2/17)이 음력 1월 1일', () => {
    const m = getLunarDays(2026, 2, 28);
    const d = m.get(17)!;
    expect(d.lunarMonth).toBe(1);
    expect(d.lunarDay).toBe(1);
  });
});

describe('formatLunarDay', () => {
  it('1~9일은 초N 형식', () => {
    expect(formatLunarDay(1)).toBe('초1');
    expect(formatLunarDay(9)).toBe('초9');
  });

  it('10일은 초10', () => {
    expect(formatLunarDay(10)).toBe('초10');
  });

  it('11일 이상은 숫자', () => {
    expect(formatLunarDay(15)).toBe('15');
    expect(formatLunarDay(30)).toBe('30');
  });
});
