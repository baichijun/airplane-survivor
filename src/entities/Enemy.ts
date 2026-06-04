import type { EnemyConfig, EnemyType, BulletAimType, BulletShape } from '../types';
import { ENEMY_CONFIGS } from '../config/balance';

/** 敌机实体 */
export class Enemy {
  active = true;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  attackSpeed: number;
  bulletDamage: number;
  aimType: BulletAimType;
  bulletShape: BulletShape;
  hitRadius: number;
  xpReward: number;
  width: number;
  height: number;
  color: string;
  attackTimer: number;
  /** 目标玩家位置，用于瞄准射击 */
  targetX = 0;
  targetY = 0;

  constructor(type: EnemyType, x: number, y: number) {
    const cfg: EnemyConfig = ENEMY_CONFIGS[type];
    this.type = type;
    this.x = x;
    this.y = y;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.speed = cfg.speed;
    this.attackSpeed = cfg.attackSpeed;
    this.bulletDamage = cfg.bulletDamage;
    this.aimType = cfg.aimType;
    this.bulletShape = cfg.bulletShape;
    this.hitRadius = cfg.hitRadius;
    this.xpReward = cfg.xpReward;
    this.width = cfg.width;
    this.height = cfg.height;
    this.color = cfg.color;
    this.attackTimer = Math.random() * cfg.attackSpeed;
  }

  update(dt: number, playerX: number, playerY: number): void {
    if (!this.active) return;
    this.targetX = playerX;
    this.targetY = playerY;
    this.y += this.speed * dt;
    this.attackTimer += dt;
  }

  canFire(): boolean {
    return this.attackTimer >= this.attackSpeed;
  }

  resetFireTimer(): void {
    this.attackTimer = 0;
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    if (this.hp <= 0) this.active = false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    const hw = this.width / 2;
    const hh = this.height / 2;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - hw, this.y - hh, this.width, this.height);

    // 血条
    const barW = this.width;
    const barH = 3;
    const ratio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(this.x - hw, this.y - hh - 6, barW, barH);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x - hw, this.y - hh - 6, barW * ratio, barH);
  }
}
