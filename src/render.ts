import { type DevicePreset } from './safezones';
import { getMonthData, getCalendarGrid, type MonthData } from './calendar';
import { getHolidays } from './holidays';
import { getLunarDays, formatLunarDay, type LunarDay } from './lunar';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const FONT = '-apple-system, "Apple SD Gothic Neo", system-ui, sans-serif';
const BASE_WIDTH = 1290;

export interface Offset {
  x: number;
  y: number;
}

export type CalendarTheme = 'auto' | 'dark' | 'light' | 'transparent';
export type CalendarSize = 'small' | 'medium' | 'large';

export interface CalendarStyle {
  theme: CalendarTheme;
  opacity: number;
  size: CalendarSize;
  showLunar: boolean;
}

export const DEFAULT_STYLE: CalendarStyle = {
  theme: 'auto',
  opacity: 0.4,
  size: 'medium',
  showLunar: true,
};

export const SIZE_MULT: Record<CalendarSize, number> = {
  small: 0.85,
  medium: 1.0,
  large: 1.1,
};

interface ThemeColors {
  panel: string;
  text: string;
  dim: string;
  sun: string;
  sat: string;
  shadow: string;
}

type Rect = { x: number; y: number; width: number; height: number };

export function renderLockscreen(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  preset: DevicePreset,
  offset: Offset = { x: 0, y: 0 },
  style: CalendarStyle = DEFAULT_STYLE,
): void {
  canvas.width = preset.width;
  canvas.height = preset.height;
  const ctx = canvas.getContext('2d')!;

  drawCover(ctx, img);

  const sm = SIZE_MULT[style.size];
  const a = preset.calendarArea;
  const cx = a.x + offset.x + a.width / 2;
  const cy = a.y + offset.y + a.height / 2;
  const w = a.width * sm;
  const h = a.height * sm;

  const zone: Rect = {
    x: Math.max(0, Math.min(preset.width - w, cx - w / 2)),
    y: Math.max(0, Math.min(preset.height - h, cy - h / 2)),
    width: w,
    height: h,
  };

  const now = new Date();
  const data = getMonthData(now.getFullYear(), now.getMonth() + 1);
  const grid = getCalendarGrid(data);

  const brightness = sampleBrightness(ctx, zone);
  const isDark = brightness < 128;
  const colors = resolveColors(style.theme, isDark, style.opacity);
  const s = (preset.width / BASE_WIDTH) * sm;

  const holidays = getHolidays(data.year, data.month);
  const lunarDays = style.showLunar
    ? getLunarDays(data.year, data.month, data.daysInMonth)
    : null;

  drawCalendar(ctx, data, grid, now.getDate(), colors, s, zone, holidays, lunarDays);
}

// ---- internal ----

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement): void {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const imgR = img.naturalWidth / img.naturalHeight;
  const canvasR = cw / ch;

  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

  if (imgR > canvasR) {
    sw = img.naturalHeight * canvasR;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / canvasR;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
}

function sampleBrightness(ctx: CanvasRenderingContext2D, zone: Rect): number {
  const x = Math.max(0, Math.round(zone.x));
  const y = Math.max(0, Math.round(zone.y));
  const w = Math.min(ctx.canvas.width - x, Math.round(zone.width));
  const h = Math.min(ctx.canvas.height - y, Math.round(zone.height));
  if (w <= 0 || h <= 0) return 128;

  const { data } = ctx.getImageData(x, y, w, h);
  let sum = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 40) {
    sum += (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    count++;
  }
  return sum / count;
}

function resolveColors(
  theme: CalendarTheme,
  isDark: boolean,
  opacity: number,
): ThemeColors {
  const dark = {
    text: '#ffffff',
    dim: 'rgba(255,255,255,0.6)',
    sun: '#ff6b6b',
    sat: '#74b9ff',
  };
  const light = {
    text: '#1a1a1a',
    dim: 'rgba(0,0,0,0.5)',
    sun: '#e74c3c',
    sat: '#2980b9',
  };

  switch (theme) {
    case 'dark':
      return { ...dark, panel: `rgba(0,0,0,${opacity})`, shadow: '' };
    case 'light':
      return { ...light, panel: `rgba(255,255,255,${opacity})`, shadow: '' };
    case 'transparent': {
      const c = isDark ? dark : light;
      return {
        ...c,
        panel: 'transparent',
        shadow: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
      };
    }
    default:
      return isDark
        ? { ...dark, panel: `rgba(0,0,0,${opacity})`, shadow: '' }
        : { ...light, panel: `rgba(255,255,255,${opacity})`, shadow: '' };
  }
}

function drawCalendar(
  ctx: CanvasRenderingContext2D,
  data: MonthData,
  grid: (number | null)[][],
  today: number,
  colors: ThemeColors,
  s: number,
  zone: Rect,
  holidays: Set<number>,
  lunarDays: Map<number, LunarDay> | null,
): void {
  if (colors.panel !== 'transparent') {
    ctx.fillStyle = colors.panel;
    ctx.beginPath();
    ctx.roundRect(zone.x, zone.y, zone.width, zone.height, 32 * s);
    ctx.fill();
  }

  if (colors.shadow) {
    ctx.shadowColor = colors.shadow;
    ctx.shadowBlur = 6 * s;
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = colors.text;
  ctx.font = `bold ${Math.round(54 * s)}px ${FONT}`;
  ctx.fillText(`${data.year}년 ${data.month}월`, zone.x + zone.width / 2, zone.y + 60 * s);

  const pad = 40 * s;
  const innerW = zone.width - pad * 2;
  const cellW = innerW / 7;
  const headerY = zone.y + 130 * s;

  ctx.font = `${Math.round(34 * s)}px ${FONT}`;
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i === 0 ? colors.sun : i === 6 ? colors.sat : colors.dim;
    ctx.fillText(DAY_LABELS[i], zone.x + pad + cellW * i + cellW / 2, headerY);
  }

  const gridTop = headerY + 50 * s;
  const gridBottom = zone.y + zone.height - 30 * s;
  const rowH = (gridBottom - gridTop) / grid.length;
  const lunarShift = lunarDays ? 8 * s : 0;
  const dateFontSize = Math.round(42 * s);
  const lunarFontSize = Math.round(22 * s);

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < 7; c++) {
      const day = grid[r][c];
      if (day === null) continue;

      const cellX = zone.x + pad + cellW * c + cellW / 2;
      const cellY = gridTop + rowH * r + rowH / 2;
      const dateY = cellY - lunarShift;
      const isHoliday = holidays.has(day);

      if (day === today) {
        const prevShadow = ctx.shadowColor;
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#e94560';
        ctx.beginPath();
        ctx.arc(cellX, dateY, 32 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `${dateFontSize}px ${FONT}`;
        ctx.fillText(String(day), cellX, dateY);
        ctx.shadowColor = prevShadow;
      } else {
        const dayColor = isHoliday || c === 0
          ? colors.sun
          : c === 6 ? colors.sat : colors.text;
        ctx.fillStyle = dayColor;
        ctx.font = `${dateFontSize}px ${FONT}`;
        ctx.fillText(String(day), cellX, dateY);
      }

      if (lunarDays) {
        const ld = lunarDays.get(day);
        if (ld) {
          const isBold = ld.lunarDay === 1 || ld.lunarDay === 15;
          ctx.font = `${isBold ? 'bold ' : ''}${lunarFontSize}px ${FONT}`;
          ctx.fillStyle = colors.dim;
          ctx.fillText(formatLunarDay(ld.lunarDay), cellX, dateY + 28 * s);
        }
      }
    }
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}
