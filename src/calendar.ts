export interface MonthData {
  year: number;
  month: number; // 1–12
  startDayOfWeek: number; // 0=일, 1=월, …, 6=토
  daysInMonth: number;
}

export function getMonthData(year: number, month: number): MonthData {
  const startDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  return { year, month, startDayOfWeek, daysInMonth };
}

export function getCalendarGrid(data: MonthData): (number | null)[][] {
  const rows: (number | null)[][] = [];
  let day = 1;
  const totalCells = data.startDayOfWeek + data.daysInMonth;
  const rowCount = Math.ceil(totalCells / 7);

  for (let r = 0; r < rowCount; r++) {
    const week: (number | null)[] = [];
    for (let c = 0; c < 7; c++) {
      const idx = r * 7 + c;
      if (idx < data.startDayOfWeek || day > data.daysInMonth) {
        week.push(null);
      } else {
        week.push(day++);
      }
    }
    rows.push(week);
  }
  return rows;
}
