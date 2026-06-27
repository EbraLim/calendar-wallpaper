import './style.css';
import {
  renderLockscreen,
  DEFAULT_STYLE,
  SIZE_MULT,
  type Offset,
  type CalendarStyle,
  type CalendarTheme,
  type CalendarSize,
} from './render';
import { PRESETS, DEFAULT_PRESET, type DevicePreset } from './safezones';

const app = document.querySelector<HTMLDivElement>('#app')!;

let currentImage: HTMLImageElement | null = null;
let currentPreset: DevicePreset = DEFAULT_PRESET;
let calendarOffset: Offset = { x: 0, y: 0 };
let currentStyle: CalendarStyle = { ...DEFAULT_STYLE };
let cachedBlob: Blob | null = null;
let prevPreviewUrl = '';

const sampleImg = new Image();
sampleImg.src = '/sample.svg';

function getImage(): HTMLImageElement {
  return currentImage ?? sampleImg;
}

// 렌더링용 캔버스 — 드래그 중에만 DOM에 표시
const canvas = document.createElement('canvas');
canvas.className = 'preview';
canvas.style.display = 'none';

// 미리보기 <img>
const preview = document.createElement('img');
preview.className = 'preview';
preview.alt = '달력 배경화면 미리보기';

function rerender() {
  const img = getImage();
  if (!img.complete || img.naturalWidth === 0) return;
  renderLockscreen(canvas, img, currentPreset, calendarOffset, currentStyle);
  canvas.toBlob((b) => {
    cachedBlob = b;
    if (!b) return;
    if (prevPreviewUrl) URL.revokeObjectURL(prevPreviewUrl);
    prevPreviewUrl = URL.createObjectURL(b);
    preview.src = prevPreviewUrl;
  }, 'image/png');
}

// — 사진 선택 —
const uploadLabel = document.createElement('label');
uploadLabel.className = 'upload-label';
uploadLabel.textContent = '사진 선택';

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.hidden = true;
fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    currentImage = img;
    calendarOffset = { x: 0, y: 0 };
    rerender();
  };
  img.src = url;
});
uploadLabel.appendChild(fileInput);

// — 프리셋 선택 —
const presetBar = document.createElement('div');
presetBar.className = 'preset-bar';

const presetButtons: HTMLButtonElement[] = PRESETS.map((preset, i) => {
  const btn = document.createElement('button');
  btn.className = 'preset-btn' + (i === 0 ? ' active' : '');
  btn.textContent = preset.label;
  btn.addEventListener('click', () => {
    currentPreset = preset;
    calendarOffset = { x: 0, y: 0 };
    presetButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    rerender();
  });
  presetBar.appendChild(btn);
  return btn;
});

// — 드래그 재배치 —
let isDragging = false;
let dragStartTouch = { x: 0, y: 0 };
let dragStartOffset: Offset = { x: 0, y: 0 };
let displayScale = 1;

const wrap = document.createElement('div');
wrap.className = 'preview-wrap';

function clampOffset(ox: number, oy: number): Offset {
  const a = currentPreset.calendarArea;
  const p = currentPreset;
  const extra = SIZE_MULT[currentStyle.size] - 1;
  const dw = (a.width * extra) / 2;
  const dh = (a.height * extra) / 2;
  return {
    x: Math.max(-a.x + dw, Math.min(p.width - a.x - a.width - dw, ox)),
    y: Math.max(-a.y + dh, Math.min(p.height - a.y - a.height - dh, oy)),
  };
}

function isOnCalendar(clientX: number, clientY: number): boolean {
  const rect = preview.getBoundingClientRect();
  if (rect.width === 0) return false;
  const scale = currentPreset.width / rect.width;
  const px = (clientX - rect.left) * scale;
  const py = (clientY - rect.top) * scale;
  const a = currentPreset.calendarArea;
  const sm = SIZE_MULT[currentStyle.size];
  const zx = a.x + calendarOffset.x + (a.width * (1 - sm)) / 2;
  const zy = a.y + calendarOffset.y + (a.height * (1 - sm)) / 2;
  return px >= zx && px <= zx + a.width * sm && py >= zy && py <= zy + a.height * sm;
}

function beginDrag(clientX: number, clientY: number) {
  const rect = preview.getBoundingClientRect();
  displayScale = currentPreset.width / rect.width;
  dragStartTouch = { x: clientX, y: clientY };
  dragStartOffset = { ...calendarOffset };
  isDragging = true;

  renderLockscreen(canvas, getImage(), currentPreset, calendarOffset, currentStyle);
  preview.style.display = 'none';
  canvas.style.display = '';
}

function moveDrag(clientX: number, clientY: number) {
  if (!isDragging) return;
  const dx = (clientX - dragStartTouch.x) * displayScale;
  const dy = (clientY - dragStartTouch.y) * displayScale;
  calendarOffset = clampOffset(dragStartOffset.x + dx, dragStartOffset.y + dy);
  renderLockscreen(canvas, getImage(), currentPreset, calendarOffset, currentStyle);
}

function endDrag() {
  if (!isDragging) return;
  isDragging = false;

  canvas.toBlob((b) => {
    cachedBlob = b;
    if (!b) return;
    if (prevPreviewUrl) URL.revokeObjectURL(prevPreviewUrl);
    prevPreviewUrl = URL.createObjectURL(b);
    const onLoad = () => {
      preview.removeEventListener('load', onLoad);
      canvas.style.display = 'none';
      preview.style.display = '';
    };
    preview.addEventListener('load', onLoad);
    preview.src = prevPreviewUrl;
  }, 'image/png');
}

wrap.addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1) return;
  const t = e.touches[0];
  if (isOnCalendar(t.clientX, t.clientY)) {
    e.preventDefault();
    beginDrag(t.clientX, t.clientY);
  }
}, { passive: false });
wrap.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  e.preventDefault();
  moveDrag(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });
wrap.addEventListener('touchend', () => endDrag());
wrap.addEventListener('touchcancel', () => endDrag());
wrap.addEventListener('mousedown', (e) => {
  if (isOnCalendar(e.clientX, e.clientY)) {
    e.preventDefault();
    beginDrag(e.clientX, e.clientY);
  }
});
document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  moveDrag(e.clientX, e.clientY);
});
document.addEventListener('mouseup', () => endDrag());

// — 스타일 패널 —
const stylePanel = document.createElement('div');
stylePanel.className = 'style-panel';

// 테마
const themeRow = document.createElement('div');
themeRow.className = 'style-row';
const themeLabel = document.createElement('span');
themeLabel.className = 'style-label';
themeLabel.textContent = '테마';
const themeBtnsWrap = document.createElement('div');
themeBtnsWrap.className = 'style-btns';
const themes: [CalendarTheme, string][] = [
  ['auto', '자동'], ['dark', '다크'], ['light', '라이트'], ['transparent', '투명'],
];
const themeButtons = themes.map(([value, label], i) => {
  const btn = document.createElement('button');
  btn.className = 'style-btn' + (i === 0 ? ' active' : '');
  btn.textContent = label;
  btn.addEventListener('click', () => {
    currentStyle.theme = value;
    themeButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    opacityRow.style.display = value === 'transparent' ? 'none' : '';
    rerender();
  });
  themeBtnsWrap.appendChild(btn);
  return btn;
});
themeRow.append(themeLabel, themeBtnsWrap);

// 투명도
const opacityRow = document.createElement('div');
opacityRow.className = 'style-row';
const opLabel = document.createElement('span');
opLabel.className = 'style-label';
opLabel.textContent = '투명도';
const opSlider = document.createElement('input');
opSlider.type = 'range';
opSlider.min = '0';
opSlider.max = '100';
opSlider.value = String(Math.round(currentStyle.opacity * 100));
opSlider.className = 'opacity-slider';
opSlider.addEventListener('input', () => {
  currentStyle.opacity = Number(opSlider.value) / 100;
  rerender();
});
opacityRow.append(opLabel, opSlider);

// 크기
const sizeRow = document.createElement('div');
sizeRow.className = 'style-row';
const sizeLabel = document.createElement('span');
sizeLabel.className = 'style-label';
sizeLabel.textContent = '크기';
const sizeBtnsWrap = document.createElement('div');
sizeBtnsWrap.className = 'style-btns';
const sizes: [CalendarSize, string][] = [
  ['small', '작게'], ['medium', '보통'], ['large', '크게'],
];
const sizeButtons = sizes.map(([value, label], i) => {
  const btn = document.createElement('button');
  btn.className = 'style-btn' + (i === 1 ? ' active' : '');
  btn.textContent = label;
  btn.addEventListener('click', () => {
    currentStyle.size = value;
    sizeButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    calendarOffset = clampOffset(calendarOffset.x, calendarOffset.y);
    rerender();
  });
  sizeBtnsWrap.appendChild(btn);
  return btn;
});
sizeRow.append(sizeLabel, sizeBtnsWrap);

stylePanel.append(themeRow, opacityRow, sizeRow);

// — 저장/공유 —
const shareBtn = document.createElement('button');
shareBtn.className = 'download-btn';
shareBtn.textContent = '저장 / 공유';
shareBtn.addEventListener('click', async () => {
  const blob = cachedBlob;
  if (!blob) return;

  if (navigator.share) {
    try {
      const file = new File([blob], 'calendar-wallpaper.png', {
        type: 'image/png',
      });
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.download = 'calendar-wallpaper.png';
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
});

// — 힌트 —
const hint = document.createElement('p');
hint.className = 'hint';
hint.textContent = '달력을 드래그해서 위치 조정 · 이미지를 길게 눌러 저장';

// — DOM 조립 —
wrap.append(preview, canvas);
app.append(uploadLabel, presetBar, wrap, hint, stylePanel, shareBtn);

sampleImg.onload = () => rerender();
if (sampleImg.complete && sampleImg.naturalWidth > 0) rerender();
