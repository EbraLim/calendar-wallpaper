import './style.css';
import { renderLockscreen } from './render';

const app = document.querySelector<HTMLDivElement>('#app')!;

const canvas = document.createElement('canvas');
const btn = document.createElement('button');
btn.textContent = 'PNG 다운로드';
btn.addEventListener('click', () => {
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

app.appendChild(canvas);
app.appendChild(btn);

const img = new Image();
img.onload = () => renderLockscreen(canvas, img);
img.src = '/sample.svg';
