import type { BulletOwner, BulletShape } from '../types';
import {
  BULLET_DOT_RADIUS,
  BULLET_LONG_LENGTH,
  GAME_HEIGHT,
  GAME_WIDTH,
  LASER_ACTIVE_DURATION,
  LASER_BEAM_WIDTH,
  LASER_WARNING_COUNT,
  LASER_WARNING_FLASH,
  LASER_WARNING_GAP,
} from '../config/balance';

export type LaserPhase = 'warning' | 'active' | 'done';

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

  /** 长弹半长（沿飞行方向） */
  halfLength = 0;

  /** 激光阶段与线段端点 */
  phase: LaserPhase = 'done';
  lineX1 = 0;
  lineY1 = 0;
  lineX2 = 0;
  lineY2 = 0;
  phaseTimer = 0;
  warningFlashIndex = 0;
  laserHitApplied = false;

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

  /** 初始化激光预瞄线（从起点沿方向延伸至画布边缘） */
  initLaserLine(startX: number, startY: number, dirX: number, dirY: number): void {
    this.shape = 'laser';
    this.phase = 'warning';
    this.phaseTimer = 0;
    this.warningFlashIndex = 0;
    this.laserHitApplied = false;
    this.x = startX;
    this.y = startY;

    const len = Math.hypot(dirX, dirY) || 1;
    const nx = dirX / len;
    const ny = dirY / len;

    this.lineX1 = startX;
    this.lineY1 = startY;

    // 延伸至画布边界
    let t = Infinity;
    if (nx > 0) t = Math.min(t, (GAME_WIDTH - startX) / nx);
    else if (nx < 0) t = Math.min(t, -startX / nx);
    if (ny > 0) t = Math.min(t, (GAME_HEIGHT - startY) / ny);
    else if (ny < 0) t = Math.min(t, -startY / ny);
    if (!Number.isFinite(t) || t <= 0) t = 500;

    this.lineX2 = startX + nx * t;
    this.lineY2 = startY + ny * t;
  }

  update(dt: number, gameWidth: number, gameHeight: number): void {
    if (!this.active) return;

    if (this.shape === 'laser') {
      this.updateLaser(dt);
      return;
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

  private updateLaser(dt: number): void {
    if (this.phase === 'warning') {
      this.phaseTimer += dt;
      const cycleDuration = LASER_WARNING_FLASH + LASER_WARNING_GAP;
      const totalWarning = LASER_WARNING_COUNT * cycleDuration - LASER_WARNING_GAP;

      if (this.phaseTimer >= totalWarning) {
        this.phase = 'active';
        this.phaseTimer = 0;
      }
      return;
    }

    if (this.phase === 'active') {
      this.phaseTimer += dt;
      if (this.phaseTimer >= LASER_ACTIVE_DURATION) {
        this.phase = 'done';
        this.active = false;
      }
    }
  }

  /** 激光预瞄线当前是否可见（闪烁中） */
  isLaserWarningVisible(): boolean {
    if (this.phase !== 'warning') return false;
    const cycleDuration = LASER_WARNING_FLASH + LASER_WARNING_GAP;
    const cycleTime = this.phaseTimer % cycleDuration;
    const flashIndex = Math.floor(this.phaseTimer / cycleDuration);
    return flashIndex < LASER_WARNING_COUNT && cycleTime < LASER_WARNING_FLASH;
  }

  /** 激光是否处于攻击阶段 */
  isLaserActive(): boolean {
    return this.shape === 'laser' && this.phase === 'active';
  }

  /** 获取长弹线段端点（沿飞行方向） */
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

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    if (this.shape === 'laser') {
      this.drawLaser(ctx);
      return;
    }

    if (this.shape === 'long') {
      this.drawLong(ctx);
      return;
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.owner === 'player' ? '#ffd93d' : '#a855f7';
    ctx.fill();
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
    if (this.phase === 'warning' && this.isLaserWarningVisible()) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(this.lineX1, this.lineY1);
      ctx.lineTo(this.lineX2, this.lineY2);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    if (this.phase === 'active') {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.lineWidth = LASER_BEAM_WIDTH;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.lineX1, this.lineY1);
      ctx.lineTo(this.lineX2, this.lineY2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.lineX1, this.lineY1);
      ctx.lineTo(this.lineX2, this.lineY2);
      ctx.stroke();
    }
  }
}
