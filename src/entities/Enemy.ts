import type { EnemyConfig, EnemyType, BulletAimType, BulletShape } from '../types';
import { ENEMY_CONFIGS, scaledEnemyBulletDamage, scaledEnemyMaxHp } from '../config/balance';
import { drawEnemyShip } from '../ui/ShipSprites';

/** 敌机实体 */
export class Enemy {
  active = true;
  /** 击破动画播放中：不参与碰撞，但仍保留在场景内 */
  isDying = false;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  attackSpeed: number;
  bulletDamage: number;
  /** 生成时的基础子弹伤害（不含 Boss 狂暴加成） */
  baseBulletDamage: number;
  aimType: BulletAimType;
  bulletShape: BulletShape;
  hitRadius: number;
  xpReward: number;
  width: number;
  height: number;
  color: string;
  attackTimer: number;
  /** 贴图编号（1/2/4/5）；重甲在 4 与 5 间随机 */
  spriteId: number;
  /** 目标玩家位置，用于瞄准射击 */
  targetX = 0;
  targetY = 0;

  constructor(type: EnemyType, x: number, y: number, elapsedSec = 0) {
    const cfg: EnemyConfig = ENEMY_CONFIGS[type];
    const maxHp = scaledEnemyMaxHp(type, elapsedSec);
    this.type = type;
    this.x = x;
    this.y = y;
    this.hp = maxHp;
    this.maxHp = maxHp;
    this.speed = cfg.speed;
    this.attackSpeed = cfg.attackSpeed;
    this.baseBulletDamage = scaledEnemyBulletDamage(type, elapsedSec);
    this.bulletDamage = this.baseBulletDamage;
    this.aimType = cfg.aimType;
    this.bulletShape = cfg.bulletShape;
    this.hitRadius = cfg.hitRadius;
    this.xpReward = cfg.xpReward;
    this.width = cfg.width;
    this.height = cfg.height;
    this.color = cfg.color;
    this.attackTimer = Math.random() * cfg.attackSpeed;
    this.spriteId = Enemy.pickSpriteId(type);
  }

  private static pickSpriteId(type: EnemyType): number {
    if (type === 'scout') return 1;
    if (type === 'fighter') return 2;
    return Math.random() < 0.5 ? 4 : 5;
  }

  get isCollidable(): boolean {
    return this.active && !this.isDying;
  }

  update(dt: number, playerX: number, playerY: number, speedMult = 1): void {
    if (!this.isCollidable) return;
    this.targetX = playerX;
    this.targetY = playerY;
    this.y += this.speed * speedMult * dt;
    this.attackTimer += dt;
  }

  canFire(): boolean {
    return this.attackTimer >= this.attackSpeed;
  }

  resetFireTimer(): void {
    this.attackTimer = 0;
  }

  /** 应用 Boss 狂暴伤害加成（基于生成时基础伤害重算） */
  applyBerserkBonus(bonus: number): void {
    this.bulletDamage = this.baseBulletDamage + bonus;
  }

  /** 受到伤害；返回是否本次击破 */
  takeDamage(amount: number): boolean {
    if (this.isDying) return false;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.beginDefeat();
      return true;
    }
    return false;
  }

  beginDefeat(): void {
    if (this.isDying) return;
    this.isDying = true;
    this.hp = 0;
  }

  finishDefeat(): void {
    this.isDying = false;
    this.active = false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active && !this.isDying) return;
    if (this.isDying) {
      ctx.save();
      ctx.globalAlpha = 0.22;
    }
    const hw = this.width / 2;
    const hh = this.height / 2;

    drawEnemyShip(ctx, this.type, this.x, this.y, this.width, this.height, this.spriteId);

    const barW = this.width;
    const barH = 3;
    const ratio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(this.x - hw, this.y - hh - 6, barW, barH);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x - hw, this.y - hh - 6, barW * ratio, barH);

    if (this.isDying) ctx.restore();
  }
}
