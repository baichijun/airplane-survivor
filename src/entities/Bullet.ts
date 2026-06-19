import type { BulletOwner, BulletShape } from '../types';
import type { Enemy } from './Enemy';
import {
  BULLET_DOT_RADIUS,
  BULLET_HOMING_STRENGTH,
  BULLET_LONG_LENGTH,
  GAME_HEIGHT,
  GAME_WIDTH,
  BOSS_ZONE_ACTIVE_DURATION,
  BOSS_ZONE_WARNING_DURATION,
  LASER_ACTIVE_DURATION,
  LASER_BEAM_WIDTH,
  LASER_GAP_DURATION,
  LASER_MAX_TRACE_LENGTH,
  LASER_WARNING_DURATION,
} from '../config/balance';

export type LaserPhase = 'warning' | 'gap' | 'active' | 'done';

/** 子弹实体 */
export class Bullet {
  active = true;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius = BULLET_DOT_RADIUS;
  owner: BulletOwner;
  shape: BulletShape = 'dot';

  halfLength = 0;

  phase: LaserPhase = 'done';
  lineX1 = 0;
  lineY1 = 0;
  lineX2 = 0;
  lineY2 = 0;
  phaseTimer = 0;
  laserHitApplied = false;

  /** 区域攻击：左边界（像素） */
  zoneLeft = 0;
  /** 区域攻击：右边界（像素） */
  zoneRight = 0;
  /** 区域攻击：上边界（Boss 舰体下沿） */
  zoneTop = 0;
  /** 区域索引（0–4，用于视觉变化） */
  zoneIndex = 0;
  zoneHitApplied = false;

  homing = false;
  isDroneBullet = false;
  homingStrength = BULLET_HOMING_STRENGTH;

  /** 已造成伤害的敌机（弹射时避免重复命中同一目标） */
  readonly hitEnemies = new Set<Enemy>();

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    owner: BulletOwner,
    shape: BulletShape = 'dot',
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.owner = owner;
    this.shape = shape;

    if (shape === 'long') {
      this.halfLength = BULLET_LONG_LENGTH / 2;
    }
  }

  initLaserLine(startX: number, startY: number, dirX: number, dirY: number): void {
    this.shape = 'laser';
    this.phase = 'warning';
    this.phaseTimer = 0;
    this.laserHitApplied = false;
    this.x = startX;
    this.y = startY;

    const len = Math.hypot(dirX, dirY) || 1;
    const nx = dirX / len;
    const ny = dirY / len;

    this.lineX1 = startX;
    this.lineY1 = startY;

    let t = Infinity;
    if (nx > 0) t = Math.min(t, (GAME_WIDTH - startX) / nx);
    else if (nx < 0) t = Math.min(t, -startX / nx);
    if (ny > 0) t = Math.min(t, (GAME_HEIGHT - startY) / ny);
    else if (ny < 0) t = Math.min(t, -startY / ny);
    if (!Number.isFinite(t) || t <= 0) t = LASER_MAX_TRACE_LENGTH;

    this.lineX2 = startX + nx * t;
    this.lineY2 = startY + ny * t;
  }

  initZone(left: number, right: number, index = 0, top = 0): void {
    this.shape = 'zone';
    this.phase = 'warning';
    this.phaseTimer = 0;
    this.zoneHitApplied = false;
    this.zoneLeft = left;
    this.zoneRight = right;
    this.zoneIndex = index;
    this.zoneTop = top;
    this.y = top;
  }

  update(dt: number, gameWidth: number, gameHeight: number, homingTargets?: { x: number; y: number }[]): void {
    if (!this.active) return;

    if (this.shape === 'zone') {
      this.updateZone(dt);
      return;
    }

    if (this.shape === 'laser') {
      this.updateLaser(dt);
      return;
    }

    if (this.homing && homingTargets && homingTargets.length > 0) {
      this.applyHoming(dt, homingTargets);
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (
      this.x < -20 ||
      this.x > gameWidth + 20 ||
      this.y < -20 ||
      this.y > gameHeight + 20
    ) {
      this.active = false;
    }
  }

  private applyHoming(dt: number, targets: { x: number; y: number }[]): void {
    let nearest: { x: number; y: number } | null = null;
    let minDist = Infinity;

    for (const t of targets) {
      if (t.y > this.y + 30) continue;
      const d = (t.x - this.x) ** 2 + (t.y - this.y) ** 2;
      if (d < minDist) {
        minDist = d;
        nearest = t;
      }
    }

    if (!nearest) {
      for (const t of targets) {
        const d = (t.x - this.x) ** 2 + (t.y - this.y) ** 2;
        if (d < minDist) {
          minDist = d;
          nearest = t;
        }
      }
    }

    if (!nearest) return;

    const speed = Math.hypot(this.vx, this.vy) || 1;
    const desiredAngle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
    const currentAngle = Math.atan2(this.vy, this.vx);
    let diff = desiredAngle - currentAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const turn = Math.sign(diff) * Math.min(Math.abs(diff), this.homingStrength * dt);
    const newAngle = currentAngle + turn;
    this.vx = Math.cos(newAngle) * speed;
    this.vy = Math.sin(newAngle) * speed;
  }

  /** 激光时序：预瞄 0.3s → 间隔 0.3s → 攻击 0.3s */
  private updateLaser(dt: number): void {
    this.phaseTimer += dt;

    if (this.phase === 'warning') {
      if (this.phaseTimer >= LASER_WARNING_DURATION) {
        this.phase = 'gap';
        this.phaseTimer = 0;
      }
      return;
    }

    if (this.phase === 'gap') {
      if (this.phaseTimer >= LASER_GAP_DURATION) {
        this.phase = 'active';
        this.phaseTimer = 0;
        this.laserHitApplied = false;
      }
      return;
    }

    if (this.phase === 'active') {
      if (this.phaseTimer >= LASER_ACTIVE_DURATION) {
        this.phase = 'done';
        this.active = false;
      }
    }
  }

  /** 区域攻击时序：预警 0.3s → 攻击 0.8s */
  private updateZone(dt: number): void {
    this.phaseTimer += dt;

    if (this.phase === 'warning') {
      if (this.phaseTimer >= BOSS_ZONE_WARNING_DURATION) {
        this.phase = 'active';
        this.phaseTimer = 0;
        this.zoneHitApplied = false;
      }
      return;
    }

    if (this.phase === 'active') {
      if (this.phaseTimer >= BOSS_ZONE_ACTIVE_DURATION) {
        this.phase = 'done';
        this.active = false;
      }
    }
  }

  isLaserWarningVisible(): boolean {
    return this.shape === 'laser' && this.phase === 'warning';
  }

  isLaserGapVisible(): boolean {
    return this.shape === 'laser' && this.phase === 'gap';
  }

  isLaserActive(): boolean {
    return this.shape === 'laser' && this.phase === 'active';
  }

  isZoneWarningVisible(): boolean {
    return this.shape === 'zone' && this.phase === 'warning';
  }

  isZoneActive(): boolean {
    return this.shape === 'zone' && this.phase === 'active';
  }

  getLongSegment(): { x1: number; y1: number; x2: number; y2: number } {
    const len = Math.hypot(this.vx, this.vy) || 1;
    const nx = this.vx / len;
    const ny = this.vy / len;
    return {
      x1: this.x - nx * this.halfLength,
      y1: this.y - ny * this.halfLength,
      x2: this.x + nx * this.halfLength,
      y2: this.y + ny * this.halfLength,
    };
  }

  draw(ctx: CanvasRenderingContext2D, drawOpacity = 1): void {
    if (!this.active) return;

    ctx.save();
    ctx.globalAlpha = drawOpacity;

    if (this.shape === 'laser') {
      this.drawLaser(ctx);
      ctx.restore();
      return;
    }

    if (this.shape === 'zone') {
      this.drawZone(ctx);
      ctx.restore();
      return;
    }

    if (this.shape === 'long') {
      this.drawLong(ctx);
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    if (this.owner === 'player') {
      if (this.isDroneBullet) {
        ctx.fillStyle = '#67e8f9';
      } else {
        ctx.fillStyle = '#ffd93d';
      }
    } else {
      ctx.fillStyle = '#a855f7';
    }
    ctx.fill();
    ctx.restore();
  }

  private drawLong(ctx: CanvasRenderingContext2D): void {
    const seg = this.getLongSegment();
    ctx.strokeStyle = this.owner === 'player' ? '#ffd93d' : '#a855f7';
    ctx.lineWidth = this.radius * 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(seg.x1, seg.y1);
    ctx.lineTo(seg.x2, seg.y2);
    ctx.stroke();
  }

  private drawLaser(ctx: CanvasRenderingContext2D): void {
    if (this.isLaserWarningVisible()) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(this.lineX1, this.lineY1);
      ctx.lineTo(this.lineX2, this.lineY2);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    if (this.isLaserGapVisible()) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(this.lineX1, this.lineY1);
      ctx.lineTo(this.lineX2, this.lineY2);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    if (this.isLaserActive()) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.lineWidth = LASER_BEAM_WIDTH;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.lineX1, this.lineY1);
      ctx.lineTo(this.lineX2, this.lineY2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.lineX1, this.lineY1);
      ctx.lineTo(this.lineX2, this.lineY2);
      ctx.stroke();
    }
  }

  private drawZone(ctx: CanvasRenderingContext2D): void {
    const left = this.zoneLeft;
    const width = this.zoneRight - this.zoneLeft;
    const top = this.zoneTop;
    const height = GAME_HEIGHT - top;
    const cx = left + width / 2;
    const t = this.phaseTimer;
    const seed = this.zoneIndex * 1.618;

    if (this.isZoneWarningVisible()) {
      this.drawZoneWarning(ctx, left, width, top, height, cx, t, seed);
      return;
    }

    if (this.isZoneActive()) {
      this.drawZoneActive(ctx, left, width, top, height, cx, t, seed);
    }
  }

  /** 预警：锁定框 + 扫描线 + 倒三角指示 */
  private drawZoneWarning(
    ctx: CanvasRenderingContext2D,
    left: number,
    width: number,
    top: number,
    height: number,
    cx: number,
    t: number,
    seed: number,
  ): void {
    const progress = Math.min(1, t / BOSS_ZONE_WARNING_DURATION);
    const pulse = 0.55 + Math.sin(t * 14 + seed) * 0.2;
    const scanY = top + progress * height;

    const bg = ctx.createLinearGradient(left, top, left + width, top + height);
    bg.addColorStop(0, `rgba(251, 191, 36, ${0.06 + progress * 0.06})`);
    bg.addColorStop(0.5, `rgba(244, 63, 94, ${0.1 + pulse * 0.08})`);
    bg.addColorStop(1, `rgba(6, 10, 20, ${0.15 + progress * 0.1})`);
    ctx.fillStyle = bg;
    ctx.fillRect(left, top, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, width, height);
    ctx.clip();
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.12 + pulse * 0.1})`;
    ctx.lineWidth = 1;
    const gridOff = (t * 48 + seed * 20) % 24;
    for (let y = top - 24 + gridOff; y < top + height + 24; y += 24) {
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + width, y + width * 0.35);
      ctx.stroke();
    }
    ctx.restore();

    const scanGrad = ctx.createLinearGradient(left, scanY - 28, left, scanY + 28);
    scanGrad.addColorStop(0, 'rgba(34, 211, 238, 0)');
    scanGrad.addColorStop(0.45, 'rgba(34, 211, 238, 0.55)');
    scanGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
    scanGrad.addColorStop(0.55, 'rgba(34, 211, 238, 0.55)');
    scanGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(left, scanY - 28, width, 56);

    const inset = 6;
    const bracket = Math.min(18, width * 0.22);
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.65 + pulse * 0.3})`;
    ctx.lineWidth = 2;
    ctx.lineCap = 'square';
    this.strokeZoneBrackets(ctx, left + inset, top + inset, width - inset * 2, height - inset * 2, bracket);

    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = `rgba(244, 63, 94, ${0.35 + pulse * 0.25})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, top + 8);
    ctx.lineTo(cx, top + height - 8);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = `rgba(251, 191, 36, ${0.55 + pulse * 0.25})`;
    ctx.fillRect(left, top, width, 3);

    const chevronAlpha = 0.45 + Math.sin(t * 18) * 0.35;
    ctx.fillStyle = `rgba(251, 191, 36, ${chevronAlpha})`;
    for (let i = 0; i < 3; i += 1) {
      const cy = top + 10 + i * 14 + Math.sin(t * 10 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 4);
      ctx.lineTo(cx + 7, cy - 4);
      ctx.lineTo(cx, cy + 5);
      ctx.closePath();
      ctx.fill();
    }
  }

  /** 攻击：等离子柱 + 下落能量流 */
  private drawZoneActive(
    ctx: CanvasRenderingContext2D,
    left: number,
    width: number,
    top: number,
    height: number,
    cx: number,
    t: number,
    seed: number,
  ): void {
    const progress = Math.min(1, t / BOSS_ZONE_ACTIVE_DURATION);
    const flicker = 0.85 + Math.sin(t * 32 + seed * 4) * 0.15;

    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, width, height);
    ctx.clip();

    const coreW = Math.max(8, width * 0.28);
    const coreGrad = ctx.createLinearGradient(cx - coreW, top, cx + coreW, top);
    coreGrad.addColorStop(0, 'rgba(244, 63, 94, 0)');
    coreGrad.addColorStop(0.35, `rgba(232, 121, 249, ${0.45 * flicker})`);
    coreGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.75 * flicker})`);
    coreGrad.addColorStop(0.65, `rgba(232, 121, 249, ${0.45 * flicker})`);
    coreGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = coreGrad;
    ctx.fillRect(left, top, width, height);

    const glowGrad = ctx.createLinearGradient(left, top, left + width, top);
    glowGrad.addColorStop(0, 'rgba(244, 63, 94, 0)');
    glowGrad.addColorStop(0.5, `rgba(244, 63, 94, ${0.38 * flicker})`);
    glowGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(left, top, width, height);

    const streamCount = Math.max(3, Math.floor(width / 14));
    for (let i = 0; i < streamCount; i += 1) {
      const sx = left + ((i + 0.5) / streamCount) * width;
      const phase = t * 220 + i * 37 + seed * 11;
      const headY = top + (phase % (height + 60)) - 30;
      const streamGrad = ctx.createLinearGradient(sx, headY - 40, sx, headY + 12);
      streamGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      streamGrad.addColorStop(0.6, `rgba(34, 211, 238, ${0.55 * flicker})`);
      streamGrad.addColorStop(1, `rgba(255, 255, 255, ${0.9 * flicker})`);
      ctx.strokeStyle = streamGrad;
      ctx.lineWidth = 1.5 + (i % 2) * 0.5;
      ctx.beginPath();
      ctx.moveTo(sx + Math.sin(t * 8 + i) * 2, headY - 40);
      ctx.lineTo(sx, headY + 12);
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 * flicker})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      const ay = top + ((t * 140 + i * 90 + seed * 30) % (height + 40)) - 20;
      ctx.beginPath();
      ctx.moveTo(left + 4, ay);
      ctx.lineTo(cx, ay + 8);
      ctx.lineTo(left + width - 4, ay + 3);
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(34, 211, 238, ${0.55 + progress * 0.25})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(34, 211, 238, 0.6)';
    ctx.shadowBlur = 8;
    ctx.strokeRect(left + 1, top + 1, width - 2, height - 2);
    ctx.shadowBlur = 0;

    ctx.restore();

    const shockH = 10 + progress * 6;
    const shockGrad = ctx.createLinearGradient(left, top, left, top + shockH);
    shockGrad.addColorStop(0, `rgba(255, 255, 255, ${0.65 * flicker})`);
    shockGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = shockGrad;
    ctx.fillRect(left, top, width, shockH);
  }

  private strokeZoneBrackets(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    len: number,
  ): void {
    // 左上
    ctx.beginPath();
    ctx.moveTo(x + len, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + len);
    ctx.stroke();
    // 右上
    ctx.beginPath();
    ctx.moveTo(x + w - len, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + len);
    ctx.stroke();
    // 左下
    ctx.beginPath();
    ctx.moveTo(x, y + h - len);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + len, y + h);
    ctx.stroke();
    // 右下
    ctx.beginPath();
    ctx.moveTo(x + w - len, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - len);
    ctx.stroke();
  }
}
