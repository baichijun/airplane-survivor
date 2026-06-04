import type { EnemyType } from '../types';

/** 与 HUD / UI 一致的渐变色板 */
const COLORS = {
  /** 自机机身渐变顶色 */
  playerTop: '#60a5fa',
  /** 自机机身渐变底色 */
  playerBottom: '#3b82f6',
  /** 自机座舱高光色 */
  playerAccent: '#93c5fd',
  /** 自机引擎光晕色 */
  playerEngine: '#a855f7',
  /** 侦察机渐变顶色 */
  scoutTop: '#ff6b6b',
  /** 侦察机渐变底色 */
  scoutBottom: '#e11d48',
  /** 战斗机渐变顶色 */
  fighterTop: '#ff4757',
  /** 战斗机渐变底色 */
  fighterBottom: '#b91c1c',
  /** 重甲机渐变顶色 */
  tankTop: '#c0392b',
  /** 重甲机渐变底色 */
  tankBottom: '#7f1d1d',
  /** 重甲机装甲块颜色 */
  tankArmor: '#991b1b',
  /** 舰体描边色 */
  outline: 'rgba(15, 23, 42, 0.55)',
};

/** 绘制玩家自机（向上） */
export function drawPlayerShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
): void {
  const noseY = y - r;
  const tailY = y + r * 0.85;
  const wingX = r * 0.95;

  // 引擎光晕
  ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x, tailY + 3, r * 0.35, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // 主机身
  ctx.beginPath();
  ctx.moveTo(x, noseY);
  ctx.lineTo(x + wingX, tailY - r * 0.15);
  ctx.lineTo(x + r * 0.35, tailY);
  ctx.lineTo(x, tailY - r * 0.05);
  ctx.lineTo(x - r * 0.35, tailY);
  ctx.lineTo(x - wingX, tailY - r * 0.15);
  ctx.closePath();
  const bodyGrad = ctx.createLinearGradient(x, noseY, x, tailY);
  bodyGrad.addColorStop(0, COLORS.playerTop);
  bodyGrad.addColorStop(1, COLORS.playerBottom);
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = COLORS.outline;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 座舱
  ctx.beginPath();
  ctx.ellipse(x, y - r * 0.35, r * 0.22, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.playerAccent;
  ctx.fill();

  // 翼尖高光
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - wingX + 2, tailY - r * 0.2);
  ctx.lineTo(x - r * 0.4, tailY - 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + wingX - 2, tailY - r * 0.2);
  ctx.lineTo(x + r * 0.4, tailY - 2);
  ctx.stroke();
}

/** 绘制小型无人机（与自机同色系） */
export function drawDroneShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  side: 'left' | 'right',
): void {
  const s = 6;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s * 0.9, y + s * 0.6);
  ctx.lineTo(x, y + s * 0.35);
  ctx.lineTo(x - s * 0.9, y + s * 0.6);
  ctx.closePath();
  const grad = ctx.createLinearGradient(x, y - s, x, y + s);
  grad.addColorStop(0, '#7dd3fc');
  grad.addColorStop(1, '#0ea5e9');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = COLORS.outline;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#bae6fd';
  ctx.beginPath();
  ctx.arc(x + (side === 'left' ? -2 : 2), y - 1, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

/** 绘制敌机（按类型） */
export function drawEnemyShip(
  ctx: CanvasRenderingContext2D,
  type: EnemyType,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  switch (type) {
    case 'scout':
      drawScoutShip(ctx, x, y, width, height);
      break;
    case 'fighter':
      drawFighterShip(ctx, x, y, width, height);
      break;
    case 'tank':
      drawTankShip(ctx, x, y, width, height);
      break;
  }
}

/** 侦察机：小型菱形，灵活感 */
function drawScoutShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const hw = w / 2;
  const hh = h / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + hh);
  ctx.lineTo(x + hw, y);
  ctx.lineTo(x, y - hh);
  ctx.lineTo(x - hw, y);
  ctx.closePath();
  const grad = ctx.createLinearGradient(x, y - hh, x, y + hh);
  grad.addColorStop(0, COLORS.scoutTop);
  grad.addColorStop(1, COLORS.scoutBottom);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = COLORS.outline;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(x, y - hh * 0.2, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

/** 战斗机：双翼箭头，向下 */
function drawFighterShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const hw = w / 2;
  const hh = h / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + hh);
  ctx.lineTo(x + hw, y + hh * 0.1);
  ctx.lineTo(x + hw * 0.75, y - hh);
  ctx.lineTo(x, y - hh * 0.55);
  ctx.lineTo(x - hw * 0.75, y - hh);
  ctx.lineTo(x - hw, y + hh * 0.1);
  ctx.closePath();
  const grad = ctx.createLinearGradient(x, y - hh, x, y + hh);
  grad.addColorStop(0, COLORS.fighterTop);
  grad.addColorStop(1, COLORS.fighterBottom);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = COLORS.outline;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = 'rgba(251, 191, 36, 0.75)';
  ctx.fillRect(x - 3, y - hh * 0.15, 6, 5);
}

/** 重甲机：厚重装甲块 */
function drawTankShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const hw = w / 2;
  const hh = h / 2;
  const r = 5;

  ctx.beginPath();
  ctx.roundRect(x - hw, y - hh, w, h, r);
  const grad = ctx.createLinearGradient(x, y - hh, x, y + hh);
  grad.addColorStop(0, COLORS.tankTop);
  grad.addColorStop(1, COLORS.tankBottom);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = COLORS.outline;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 装甲条
  ctx.fillStyle = COLORS.tankArmor;
  ctx.fillRect(x - hw + 4, y - hh + 6, w - 8, 5);
  ctx.fillRect(x - hw + 4, y + 2, w - 8, 5);

  ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
  ctx.beginPath();
  ctx.arc(x, y + hh - 8, 5, 0, Math.PI * 2);
  ctx.fill();
}

/** 绘制 Boss（强化版敌舰） */
export function drawBossShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  bossIndex: number,
): void {
  const hw = width / 2;
  const hh = height / 2;

  // 外翼
  for (const sign of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + sign * (hw + 10), y + 6);
    ctx.lineTo(x + sign * (hw - 8), y - hh);
    ctx.lineTo(x + sign * (hw - 26), y + hh);
    ctx.closePath();
    const wingGrad = ctx.createLinearGradient(x, y - hh, x, y + hh);
    wingGrad.addColorStop(0, '#6d28d9');
    wingGrad.addColorStop(1, '#4c1d95');
    ctx.fillStyle = wingGrad;
    ctx.fill();
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // 主体
  ctx.beginPath();
  ctx.moveTo(x, y - hh);
  ctx.lineTo(x + hw, y - hh * 0.25);
  ctx.lineTo(x + hw - 8, y + hh);
  ctx.lineTo(x - hw + 8, y + hh);
  ctx.lineTo(x - hw, y - hh * 0.25);
  ctx.closePath();
  const bodyGrad = ctx.createLinearGradient(x, y - hh, x, y + hh);
  bodyGrad.addColorStop(0, '#a855f7');
  bodyGrad.addColorStop(0.5, '#7c3aed');
  bodyGrad.addColorStop(1, '#5b21b6');
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 核心
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  const coreGrad = ctx.createRadialGradient(x, y, 2, x, y, 11);
  coreGrad.addColorStop(0, '#fef3c7');
  coreGrad.addColorStop(0.5, '#fbbf24');
  coreGrad.addColorStop(1, '#d97706');
  ctx.fillStyle = coreGrad;
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${bossIndex}`, x, y);
}
