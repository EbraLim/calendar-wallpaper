export const CANVAS = { width: 1290, height: 2796 } as const;

// iPhone 14 Pro 잠금화면 — 시스템 UI가 차지하는 영역 (px, @3x)
export const SYSTEM_UI = {
  statusAndClock: { top: 0, height: 700 },
  bottomControls: { top: 2500, height: 296 },
} as const;

// 달력을 배치할 안전 영역 (시스템 UI를 피한 중앙부)
export const CALENDAR_AREA = {
  x: 80,
  y: 1000,
  width: 1130,
  height: 800,
} as const;
