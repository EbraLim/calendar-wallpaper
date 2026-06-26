import { describe, it, expect } from 'vitest';
import { getMonthData, getCalendarGrid } from './calendar';

describe('getMonthData', () => {
  it('6월은 30일', () => {
    const d = getMonthData(2026, 6);
    expect(d.daysInMonth).toBe(30);
  });

  it('윤년 2월은 29일', () => {
    expect(getMonthData(2024, 2).daysInMonth).toBe(29);
  });

  it('평년 2월은 28일', () => {
    expect(getMonthData(2025, 2).daysInMonth).toBe(28);
  });

  it('12월은 31일', () => {
    expect(getMonthData(2026, 12).daysInMonth).toBe(31);
  });

  it('시작 요일이 0–6 범위', () => {
    for (let m = 1; m <= 12; m++) {
      const d = getMonthData(2026, m);
      expect(d.startDayOfWeek).toBeGreaterThanOrEqual(0);
      expect(d.startDayOfWeek).toBeLessThanOrEqual(6);
    }
  });
});

describe('getCalendarGrid', () => {
  it('6월 2026 — 첫 행이 시작 요일에 맞게 null 패딩', () => {
    const data = getMonthData(2026, 6);
    const grid = getCalendarGrid(data);
    const firstRow = grid[0];
    const nullCount = firstRow.filter((d) => d === null).length;
    expect(nullCount).toBe(data.startDayOfWeek);
    expect(firstRow[data.startDayOfWeek]).toBe(1);
  });

  it('총 날짜 수가 daysInMonth와 일치 (off-by-one 방지)', () => {
    for (let m = 1; m <= 12; m++) {
      const data = getMonthData(2026, m);
      const grid = getCalendarGrid(data);
      const days = grid.flat().filter((d) => d !== null);
      expect(days.length).toBe(data.daysInMonth);
    }
  });

  it('다음 달 날짜가 섞이지 않는다', () => {
    const data = getMonthData(2026, 6); // 30일
    const grid = getCalendarGrid(data);
    const allDays = grid.flat().filter((d): d is number => d !== null);
    expect(Math.max(...allDays)).toBe(30);
    expect(Math.min(...allDays)).toBe(1);
  });

  it('일요일 시작 월 — null 패딩 없음', () => {
    // 2026-03: 3월 1일 = 일요일
    const data = getMonthData(2026, 3);
    expect(data.startDayOfWeek).toBe(0);
    const grid = getCalendarGrid(data);
    expect(grid[0][0]).toBe(1);
  });

  it('토요일 시작 월 — 첫 행에 날짜 1개만', () => {
    // 2026-08: 8월 1일 = 토요일
    const data = getMonthData(2026, 8);
    expect(data.startDayOfWeek).toBe(6);
    const grid = getCalendarGrid(data);
    const firstRowDays = grid[0].filter((d) => d !== null);
    expect(firstRowDays).toEqual([1]);
  });

  it('각 행은 정확히 7칸', () => {
    const data = getMonthData(2026, 6);
    const grid = getCalendarGrid(data);
    for (const row of grid) {
      expect(row.length).toBe(7);
    }
  });

  it('날짜가 1부터 연속으로 증가', () => {
    const data = getMonthData(2026, 6);
    const grid = getCalendarGrid(data);
    const days = grid.flat().filter((d): d is number => d !== null);
    for (let i = 0; i < days.length; i++) {
      expect(days[i]).toBe(i + 1);
    }
  });
});
