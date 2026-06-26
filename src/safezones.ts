export interface DevicePreset {
  label: string;
  width: number;
  height: number;
  calendarArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const PRESETS: readonly DevicePreset[] = [
  {
    label: 'iPhone Pro',
    width: 1290,
    height: 2796,
    calendarArea: { x: 80, y: 1000, width: 1130, height: 800 },
  },
  {
    label: 'iPhone 표준',
    width: 1170,
    height: 2532,
    calendarArea: { x: 70, y: 900, width: 1030, height: 730 },
  },
  {
    label: 'Android 일반',
    width: 1080,
    height: 2400,
    calendarArea: { x: 60, y: 850, width: 960, height: 700 },
  },
];

export const DEFAULT_PRESET = PRESETS[0];
