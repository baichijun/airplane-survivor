import type { BulletOwner } from '../types';

/** 子弹实体 */
export class Bullet {
  active = true;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius = 4;
  owner: BulletOwner;

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    owner: BulletOwner,
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.owner = owner;
  }

  update(dt: number, gameWidth: number, gameHeight: number): void {
    if (!this.active) return;
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

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.owner === 'player' ? '#ffd93d' : '#a855f7';
    ctx.fill();
  }
}
