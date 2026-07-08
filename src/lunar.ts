import KoreanLunarCalendar from 'korean-lunar-calendar';

export interface LunarDay {
  lunarDay: number;
  lunarMonth: number;
}

const cal = new KoreanLunarCalendar();

export function getLunarDays(year: number, month: number, daysInMonth: number): Map<number, LunarDay> {
  const result = new Map<number, LunarDay>();
  for (let d = 1; d <= daysInMonth; d++) {
    cal.setSolarDate(year, month, d);
    const l = cal.getLunarCalendar();
    result.set(d, { lunarDay: l.day, lunarMonth: l.month });
  }
  return result;
}

export function formatLunarDay(day: number): string {
  if (day <= 10) return `초${day === 10 ? '10' : day}`;
  return String(day);
}
