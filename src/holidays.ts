interface Holiday {
  month: number;
  day: number;
}

const HOLIDAYS: Record<number, Holiday[]> = {
  2026: [
    { month: 1, day: 1 },    // 신정
    { month: 2, day: 16 },   // 설날 연휴
    { month: 2, day: 17 },   // 설날
    { month: 2, day: 18 },   // 설날 연휴
    { month: 3, day: 1 },    // 삼일절
    { month: 3, day: 2 },    // 대체공휴일(삼일절)
    { month: 5, day: 5 },    // 어린이날
    { month: 5, day: 24 },   // 부처님오신날
    { month: 5, day: 25 },   // 대체공휴일(부처님오신날)
    { month: 6, day: 6 },    // 현충일
    { month: 6, day: 8 },    // 대체공휴일(현충일)
    { month: 8, day: 15 },   // 광복절
    { month: 8, day: 17 },   // 대체공휴일(광복절)
    { month: 9, day: 24 },   // 추석 연휴
    { month: 9, day: 25 },   // 추석
    { month: 9, day: 26 },   // 추석 연휴
    { month: 9, day: 28 },   // 대체공휴일(추석)
    { month: 10, day: 3 },   // 개천절
    { month: 10, day: 5 },   // 대체공휴일(개천절)
    { month: 10, day: 9 },   // 한글날
    { month: 12, day: 25 },  // 크리스마스
  ],
};

export function getHolidays(year: number, month: number): Set<number> {
  const list = HOLIDAYS[year];
  if (!list) return new Set();
  const days = new Set<number>();
  for (const h of list) {
    if (h.month === month) days.add(h.day);
  }
  return days;
}
