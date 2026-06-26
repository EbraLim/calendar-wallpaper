import './style.css';
import { renderLockscreen } from './render';
import { PRESETS, DEFAULT_PRESET, type DevicePreset } from './safezones';

const app = document.querySelector<HTMLDivElement>('#app')!;

let currentImage: HTMLImageElement | null = null;
let currentPreset: DevicePreset = DEFAULT_PRESET;
let cachedBlob: Blob | null = null;
let prevPreviewUrl = '';

const sampleImg = new Image();
sampleImg.src = '/sample.svg';

function getImage(): HTMLImageElement {
  return currentImage ?? sampleImg;
}

// 렌더링용 캔버스 (DOM에 넣지 않음)
const canvas = document.createElement('canvas');

// 미리보기 <img> — 길게 누르면 iOS "사진에 추가" 가능
const preview = document.createElement('img');
preview.className = 'preview';
preview.alt = '달력 배경화면 미리보기';

const hint = document.createElement('p');
hint.className = 'hint';
hint.textContent = '이미지를 길게 눌러 사진에 저장할 수 있어요';

function rerender() {
  const img = getImage();
  if (!img.complete || img.naturalWidth === 0) return;
  renderLockscreen(canvas, img, currentPreset);
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

// — DOM 조립 —
app.append(uploadLabel, presetBar, preview, hint, shareBtn);

sampleImg.onload = () => rerender();
if (sampleImg.complete && sampleImg.naturalWidth > 0) rerender();
