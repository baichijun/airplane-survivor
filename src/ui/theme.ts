/** 科幻街机风 UI 主题：字体、配色与 Canvas 绘制辅助 */

export const UI = {
  fontDisplay: '"Orbitron", sans-serif',
  fontBody: '"Noto Sans SC", sans-serif',

  bgDeep: '#060a14',
  panel: 'rgba(8, 18, 36, 0.88)',
  panelLight: 'rgba(14, 28, 52, 0.92)',

  accent: '#22d3ee',
  accentBright: '#67e8f9',
  accentDim: 'rgba(34, 211, 238, 0.28)',
  accentGlow: 'rgba(34, 211, 238, 0.55)',

  magenta: '#c026d3',
  magentaBright: '#e879f9',

  warn: '#fbbf24',
  warnDim: 'rgba(251, 191, 36, 0.35)',

  danger: '#f43f5e',
  hpEnd: '#fb7185',

  text: '#e8f0fa',
  textMuted: 'rgba(148, 163, 184, 0.9)',
  textDim: 'rgba(100, 116, 139, 0.85)',

  border: 'rgba(34, 211, 238, 0.45)',
  borderMuted: 'rgba(148, 163, 184, 0.25)',
} as const;

export function fontDisplay(size: number, weight: 500 | 700 | 900 = 700): string {
  return `${weight} ${size}px ${UI.fontDisplay}`;
}

export function fontBody(size: number, bold = false): string {
  return `${bold ? 'bold ' : ''}${size}px ${UI.fontBody}`;
}

/** 预加载 Web 字体，避免首帧 fallback 闪烁 */
export async function loadUiFonts(): Promise<void> {
  if (!document.fonts?.load) return;
  await Promise.all([
    document.fonts.load(`700 16px ${UI.fontDisplay}`),
    document.fonts.load(`400 14px ${UI.fontBody}`),
    document.fonts.load(`700 14px ${UI.fontBody}`),
  ]);
}

export function drawGlowCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  blur = 12,
): void {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  fillStart: string,
  fillEnd: string,
  radius = 3,
): void {
  const clamped = Math.min(1, Math.max(0, ratio));

  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.strokeStyle = UI.borderMuted;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  ctx.stroke();

  if (clamped <= 0) return;

  const fillW = w * clamped;
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, fillStart);
  grad.addColorStop(1, fillEnd);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, fillW, h, radius);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x + 1, y + 1, Math.max(0, fillW - 2), Math.max(0, h * 0.35));
}

export function drawGradientButton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  colorStart: string,
  colorEnd: string,
  radius = 10,
): void {
  ctx.save();
  ctx.shadowColor = colorStart;
  ctx.shadowBlur = 14;
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, colorStart);
  grad.addColorStop(1, colorEnd);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, radius);
  ctx.stroke();

  ctx.fillStyle = UI.text;
  ctx.font = fontBody(16, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
}

export function drawTitleGradient(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  colorStart: string,
  colorEnd: string,
): void {
  const grad = ctx.createLinearGradient(x - 120, y, x + 120, y);
  grad.addColorStop(0, colorStart);
  grad.addColorStop(1, colorEnd);
  ctx.fillStyle = grad;
  ctx.font = fontDisplay(size, 900);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

/** 护盾图标（矢量） */
export function drawShieldIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  fill: string,
  stroke: string,
): void {
  const w = size * 0.5;
  const h = size * 0.58;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h * 0.5);
  ctx.lineTo(cx + w * 0.9, cy - h * 0.18);
  ctx.quadraticCurveTo(cx + w * 0.85, cy + h * 0.42, cx, cy + h * 0.5);
  ctx.quadraticCurveTo(cx - w * 0.85, cy + h * 0.42, cx - w * 0.9, cy - h * 0.18);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function drawSelectionCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isHovered: boolean,
  accentColor: string,
  isSkip = false,
): void {
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  if (isHovered) {
    grad.addColorStop(0, isSkip ? 'rgba(113, 63, 18, 0.95)' : 'rgba(22, 45, 82, 0.98)');
    grad.addColorStop(1, isSkip ? 'rgba(69, 26, 3, 0.98)' : 'rgba(10, 20, 45, 0.98)');
  } else {
    grad.addColorStop(0, 'rgba(14, 28, 52, 0.95)');
    grad.addColorStop(1, 'rgba(6, 12, 28, 0.98)');
  }

  ctx.save();
  if (isHovered) {
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 16;
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = isHovered ? UI.warn : accentColor;
  ctx.lineWidth = isHovered ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, 8);
  ctx.stroke();
}
