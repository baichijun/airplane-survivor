import {
  GAME_WIDTH,
  GAME_HEIGHT,
  INVINCIBLE_DURATION,
  PLAYER_INITIAL,
  PLAYER_MARGIN,
} from '../config/balance';
import type { Input } from '../core/Input';

/** 玩家飞机 */
export class Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  attackSpeed: number;
  bulletDamage: number;
  hitRadius: number;
  bulletCount: number;
  bulletSpeed: number;
  attackTimer = 0;
  invincibleTimer = 0;

  constructor() {
    this.x = GAME_WIDTH / 2;
    this.y = GAME_HEIGHT - 80;
    this.hp = PLAYER_INITIAL.maxHp;
    this.maxHp = PLAYER_INITIAL.maxHp;
    this.speed = PLAYER_INITIAL.speed;
    this.attackSpeed = PLAYER_INITIAL.attackSpeed;
    this.bulletDamage = PLAYER_INITIAL.bulletDamage;
    this.hitRadius = PLAYER_INITIAL.hitRadius;
    this.bulletCount = PLAYER_INITIAL.bulletCount;
    this.bulletSpeed = PLAYER_INITIAL.bulletSpeed;
  }

  reset(): void {
    this.x = GAME_WIDTH / 2;
    this.y = GAME_HEIGHT - 80;
    this.hp = PLAYER_INITIAL.maxHp;
    this.maxHp = PLAYER_INITIAL.maxHp;
    this.speed = PLAYER_INITIAL.speed;
    this.attackSpeed = PLAYER_INITIAL.attackSpeed;
    this.bulletDamage = PLAYER_INITIAL.bulletDamage;
    this.hitRadius = PLAYER_INITIAL.hitRadius;
    this.bulletCount = PLAYER_INITIAL.bulletCount;
    this.bulletSpeed = PLAYER_INITIAL.bulletSpeed;
    this.attackTimer = 0;
    this.invincibleTimer = 0;
  }

  update(dt: number, input: Input): void {
    const dir = input.getMoveDirection();
    if (dir.x !== 0 || dir.y !== 0) {
      this.x += dir.x * this.speed * dt;
      this.y += dir.y * this.speed * dt;
    }

    // 触摸拖拽：平滑跟随目标位置
    if (input.touchTarget) {
      const target = input.touchTarget;
      const lerp = 1 - Math.pow(0.001, dt);
      this.x += (target.x - this.x) * lerp;
      this.y += (target.y - this.y) * lerp;
    }

    this.x = Math.max(PLAYER_MARGIN, Math.min(GAME_WIDTH - PLAYER_MARGIN, this.x));
    this.y = Math.max(GAME_HEIGHT * 0.4, Math.min(GAME_HEIGHT - PLAYER_MARGIN, this.y));

    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }
    this.attackTimer += dt;
  }

  takeDamage(amount: number): boolean {
    if (this.invincibleTimer > 0) return false;
    this.hp -= amount;
    this.invincibleTimer = INVINCIBLE_DURATION;
    return true;
  }

  canFire(): boolean {
    return this.attackTimer >= this.attackSpeed;
  }

  resetFireTimer(): void {
    this.attackTimer = 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const blink = this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 10) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.4;

    // 蓝色向上三角形
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.hitRadius);
    ctx.lineTo(this.x - this.hitRadius, this.y + this.hitRadius * 0.8);
    ctx.lineTo(this.x + this.hitRadius, this.y + this.hitRadius * 0.8);
    ctx.closePath();

    const grad = ctx.createLinearGradient(this.x, this.y - this.hitRadius, this.x, this.y + this.hitRadius);
    grad.addColorStop(0, '#60a5fa');
    grad.addColorStop(1, '#3b82f6');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}
