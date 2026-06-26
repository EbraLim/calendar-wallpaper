import './style.css';
import { renderLockscreen } from './render';
import { PRESETS, DEFAULT_PRESET, type DevicePreset } from './safezones';

const app = document.querySelector<HTMLDivElement>('#app')!;

let currentImage: HTMLImageElement | null = null;
let currentPreset: DevicePreset = DEFAULT_PRESET;

const sampleImg = new Image();
sampleImg.src = '/sample.svg';

function getImage(): HTMLImageElement {
  return currentImage ?? sampleImg;
}

function rerender() {
  const img = getImage();
  if (!img.complete || img.naturalWidth === 0) return;
  renderLockscreen(canvas, img, currentPreset);
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

// — 다운로드 —
const downloadBtn = document.createElement('button');
downloadBtn.className = 'download-btn';
downloadBtn.textContent = 'PNG 다운로드';
downloadBtn.addEventListener('click', () => {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    a.download = `lockscreen-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.png`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
});

// — DOM 조립 —
app.append(uploadLabel, presetBar, canvas, downloadBtn);

sampleImg.onload = () => rerender();
if (sampleImg.complete && sampleImg.naturalWidth > 0) rerender();
