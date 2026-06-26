import './style.css';
import { renderLockscreen } from './render';
import { PRESETS, DEFAULT_PRESET, type DevicePreset } from './safezones';

const app = document.querySelector<HTMLDivElement>('#app')!;

let currentImage: HTMLImageElement | null = null;
let currentPreset: DevicePreset = DEFAULT_PRESET;
let cachedBlob: Blob | null = null;

const sampleImg = new Image();
sampleImg.src = '/sample.svg';

function getImage(): HTMLImageElement {
  return currentImage ?? sampleImg;
}

function rerender() {
  const img = getImage();
  if (!img.complete || img.naturalWidth === 0) return;
  renderLockscreen(canvas, img, currentPreset);
  canvas.toBlob((b) => { cachedBlob = b; }, 'image/png');
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
    presetButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    rerender();
  });
  presetBar.appendChild(btn);
  return btn;
});

// — 캔버스 —
const canvas = document.createElement('canvas');

// — 저장/공유 —
const downloadBtn = document.createElement('button');
downloadBtn.className = 'download-btn';
downloadBtn.textContent = '저장 / 공유';
downloadBtn.addEventListener('click', async () => {
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

// — DOM 조립 —
app.append(uploadLabel, presetBar, canvas, downloadBtn);

sampleImg.onload = () => rerender();
if (sampleImg.complete && sampleImg.naturalWidth > 0) rerender();
