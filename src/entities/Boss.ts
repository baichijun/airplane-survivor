import {
  BOSS_MOVE_SPEED,
  BOSS_Y,
  BOSS_WIDTH,
  BOSS_HEIGHT,
  GAME_WIDTH,
  PLAYER_MARGIN,
  bossAttackInterval,
  bossMaxHp,
  bossBulletDamage,
} from '../config/balance';
import { BossAttackSystem } from '../systems/BossAttackSystem';
import { drawBossShip } from '../ui/ShipSprites';

/** Boss 实体：横向移动，多段攻击 */
export class Boss {
  active = true;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  width = BOSS_WIDTH;
  height = BOSS_HEIGHT;
  bossIndex: number;
  moveDir = 1;
  attackTimer = 0;
  targetX = 0;
  targetY = 0;
  attackSpeed: number;
  bulletDamage: number;
  readonly attackSystem = new BossAttackSystem();

  constructor(spawnTimeSec: number, bossIndex: number) {
    this.bossIndex = bossIndex;
    this.x = GAME_WIDTH / 2;
    this.y = BOSS_Y;
    this.maxHp = bossMaxHp(spawnTimeSec, bossIndex);
    this.hp = this.maxHp;
    this.attackSpeed = bossAttackInterval(bossIndex);
    this.bulletDamage = bossBulletDamage(bossIndex);
    this.moveDir = Math.random() < 0.5 ? -1 : 1;
  }

  update(dt: number, playerX: number, playerY: number): void {
    if (!this.active) return;
    this.targetX = playerX;
    this.targetY = playerY;

    this.x += this.moveDir * BOSS_MOVE_SPEED * dt;
    const halfW = this.width / 2;
    const minX = PLAYER_MARGIN + halfW;
    const maxX = GAME_WIDTH - PLAYER_MARGIN - halfW;
    if (this.x <= minX) {
      this.x = minX;
      this.moveDir = 1;
    } else if (this.x >= maxX) {
      this.x = maxX;
      this.moveDir = -1;
    }

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
    const hh = this.height / 2;

    drawBossShip(ctx, this.x, this.y, this.width, this.height, this.bossIndex);

    const barW = this.width + 20;
    const barH = 6;
    const ratio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(this.x - barW / 2, this.y - hh - 14, barW, barH);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x - barW / 2, this.y - hh - 14, barW * ratio, barH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`BOSS ${this.bossIndex}`, this.x, this.y - hh - 18);
  }
}
