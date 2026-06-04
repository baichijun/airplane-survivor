import type { BulletOwner, BulletShape } from '../types';
import type { Enemy } from './Enemy';
import {
  BULLET_DOT_RADIUS,
  BULLET_HOMING_STRENGTH,
  BULLET_LONG_LENGTH,
  GAME_HEIGHT,
  GAME_WIDTH,
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

  update(dt: number, gameWidth: number, gameHeight: number, homingTargets?: { x: number; y: number }[]): void {
    if (!this.active) return;

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

  isLaserWarningVisible(): boolean {
    return this.shape === 'laser' && this.phase === 'warning';
  }

  isLaserGapVisible(): boolean {
    return this.shape === 'laser' && this.phase === 'gap';
  }

  isLaserActive(): boolean {
    return this.shape === 'laser' && this.phase === 'active';
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
}
