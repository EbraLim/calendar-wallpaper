import { type DevicePreset } from './safezones';
import { getMonthData, getCalendarGrid, type MonthData } from './calendar';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const FONT = '-apple-system, "Apple SD Gothic Neo", sans-serif';
const BASE_WIDTH = 1290;

export interface Offset {
  x: number;
  y: number;
}

export function renderLockscreen(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  preset: DevicePreset,
  offset: Offset = { x: 0, y: 0 },
): void {
  canvas.width = preset.width;
  canvas.height = preset.height;
  const ctx = canvas.getContext('2d')!;

  drawCover(ctx, img);

  const zone = {
    x: preset.calendarArea.x + offset.x,
    y: preset.calendarArea.y + offset.y,
    width: preset.calendarArea.width,
    height: preset.calendarArea.height,
  };

  const now = new Date();
  const data = getMonthData(now.getFullYear(), now.getMonth() + 1);
  const grid = getCalendarGrid(data);
  const brightness = sampleBrightness(ctx, zone);

  drawCalendar(ctx, data, grid, now.getDate(), brightness < 128, preset, zone);
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
): void {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const imgR = img.naturalWidth / img.naturalHeight;
  const canvasR = cw / ch;

  let sx = 0,
    sy = 0,
    sw = img.naturalWidth,
    sh = img.naturalHeight;

  if (imgR > canvasR) {
    sw = img.naturalHeight * canvasR;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / canvasR;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
}

type Rect = { x: number; y: number; width: number; height: number };

function sampleBrightness(
  ctx: CanvasRenderingContext2D,
  zone: Rect,
): number {
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

function drawCalendar(
  ctx: CanvasRenderingContext2D,
  data: MonthData,
  grid: (number | null)[][],
  today: number,
  isDark: boolean,
  preset: DevicePreset,
  zone: Rect,
): void {
  const s = preset.width / BASE_WIDTH;

  const panel = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.55)';
  const text = isDark ? '#ffffff' : '#1a1a1a';
  const dim = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const sun = isDark ? '#ff6b6b' : '#e74c3c';
  const sat = isDark ? '#74b9ff' : '#2980b9';

  ctx.fillStyle = panel;
  ctx.beginPath();
  ctx.roundRect(zone.x, zone.y, zone.width, zone.height, 32 * s);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const title = `${data.year}년 ${data.month}월`;
  ctx.fillStyle = text;
  ctx.font = `bold ${Math.round(54 * s)}px ${FONT}`;
  ctx.fillText(title, zone.x + zone.width / 2, zone.y + 60 * s);

  const pad = 40 * s;
  const innerW = zone.width - pad * 2;
  const cellW = innerW / 7;
  const headerY = zone.y + 130 * s;

  ctx.font = `${Math.round(34 * s)}px ${FONT}`;
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i === 0 ? sun : i === 6 ? sat : dim;
    ctx.fillText(DAY_LABELS[i], zone.x + pad + cellW * i + cellW / 2, headerY);
  }

  const gridTop = headerY + 50 * s;
  const gridBottom = zone.y + zone.height - 30 * s;
  const rowH = (gridBottom - gridTop) / grid.length;

  ctx.font = `${Math.round(42 * s)}px ${FONT}`;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < 7; c++) {
      const day = grid[r][c];
      if (day === null) continue;

      const cx = zone.x + pad + cellW * c + cellW / 2;
      const cy = gridTop + rowH * r + rowH / 2;

      if (day === today) {
        ctx.fillStyle = '#e94560';
        ctx.beginPath();
        ctx.arc(cx, cy, 32 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = c === 0 ? sun : c === 6 ? sat : text;
      }

      ctx.fillText(String(day), cx, cy);
    }
  }
}
