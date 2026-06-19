import {
  DRONE_ATTACK_SPEED_MULT,
  DRONE_DAMAGE_MULT,
  GAME_WIDTH,
  GAME_HEIGHT,
  getModeInitialHpMult,
  getModeRegenInterval,
  INVINCIBLE_DURATION,
  MODE_REGEN_AMOUNT,
  PLAYER_INITIAL,
  PLAYER_MARGIN,
  RELIC_DODGE_CHANCE,
  RELIC_KINETIC_HITS_PER_PROC,
  RELIC_KINETIC_SHIELD_CD_REDUCTION,
  RELIC_VAMP_COOLDOWN,
} from '../config/balance';
import { getPlayerShieldCooldown, getPlayerShieldDuration } from '../config/relics';
import type { GameMode, RelicId } from '../types';
import type { Input } from '../core/Input';
import { Drone } from './Drone';
import { drawPlayerShip } from '../ui/ShipSprites';

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
  shieldActiveTimer = 0;
  shieldCooldownTimer = 0;
  vampCooldownTimer = 0;
  /** 加固舰体：生命上限与恢复效果倍率 */
  hpGainMultiplier = 1;
  /** 升级叠加：无人机伤害倍率（相对 DRONE_DAMAGE_MULT） */
  droneDamageMult = 1;
  /** 升级叠加：无人机攻速倍率（越大射得越快） */
  droneAttackSpeedMult = 1;
  /** 动能转化：累计命中敌机次数 */
  kineticHitCounter = 0;
  /** 当前难度模式 */
  mode: GameMode = 'hard';
  /** 普通/简单模式：生命恢复计时 */
  regenTimer = 0;
  /** 自机被击破动画播放中 */
  isDying = false;
  readonly drones: [Drone, Drone];
  readonly relics = new Set<RelicId>();

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
    this.drones = [new Drone('left'), new Drone('right')];
  }

  reset(mode: GameMode = 'hard'): void {
    this.mode = mode;
    this.x = GAME_WIDTH / 2;
    this.y = GAME_HEIGHT - 80;
    const baseMaxHp = PLAYER_INITIAL.maxHp;
    this.maxHp = baseMaxHp * getModeInitialHpMult(mode);
    this.hp = this.maxHp;
    this.speed = PLAYER_INITIAL.speed;
    this.attackSpeed = PLAYER_INITIAL.attackSpeed;
    this.bulletDamage = PLAYER_INITIAL.bulletDamage;
    this.hitRadius = PLAYER_INITIAL.hitRadius;
    this.bulletCount = PLAYER_INITIAL.bulletCount;
    this.bulletSpeed = PLAYER_INITIAL.bulletSpeed;
    this.attackTimer = 0;
    this.invincibleTimer = 0;
    this.shieldActiveTimer = 0;
    this.shieldCooldownTimer = 0;
    this.vampCooldownTimer = 0;
    this.hpGainMultiplier = 1;
    this.droneDamageMult = 1;
    this.droneAttackSpeedMult = 1;
    this.kineticHitCounter = 0;
    this.regenTimer = 0;
    this.isDying = false;
    this.relics.clear();
    for (const drone of this.drones) drone.reset();
  }

  hasRelic(id: RelicId): boolean {
    return this.relics.has(id);
  }

  /** 当前无人机单发伤害（含升级与自机威力，战斗用，最低 1） */
  getDroneBulletDamage(): number {
    return Math.max(1, this.getDroneBulletDamageRaw());
  }

  /** 无人机理论伤害（展示用，不做最低 1 限制） */
  getDroneBulletDamageRaw(): number {
    return this.bulletDamage * DRONE_DAMAGE_MULT * this.droneDamageMult;
  }

  /** 当前无人机射击间隔（秒，越小越快） */
  getDroneAttackInterval(): number {
    return (this.attackSpeed * DRONE_ATTACK_SPEED_MULT) / this.droneAttackSpeedMult;
  }

  get isShieldActive(): boolean {
    return this.shieldActiveTimer > 0;
  }

  get shieldCooldownRatio(): number {
    const cd = getPlayerShieldCooldown(this);
    if (this.shieldCooldownTimer <= 0) return 1;
    return 1 - this.shieldCooldownTimer / cd;
  }

  tryActivateShield(): boolean {
    const cd = getPlayerShieldCooldown(this);
    if (this.shieldCooldownTimer > 0 || this.shieldActiveTimer > 0) return false;
    this.shieldActiveTimer = getPlayerShieldDuration(this);
    this.shieldCooldownTimer = cd;
    return true;
  }

  private applyMovement(dt: number, input: Input, minY: number): void {
    const dir = input.getMoveDirection();
    if (dir.x !== 0 || dir.y !== 0) {
      this.x += dir.x * this.speed * dt;
      this.y += dir.y * this.speed * dt;
    }

    this.x = Math.max(PLAYER_MARGIN, Math.min(GAME_WIDTH - PLAYER_MARGIN, this.x));
    this.y = Math.max(minY, Math.min(GAME_HEIGHT - PLAYER_MARGIN, this.y));
  }

  update(dt: number, input: Input, minY = PLAYER_MARGIN): void {
    if (this.isDying) return;
    this.applyMovement(dt, input, minY);
    this.tickTimers(dt);
    this.attackTimer += dt;
    for (const drone of this.drones) drone.update(dt, this);
  }

  private tickTimers(dt: number): void {
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.shieldActiveTimer > 0) this.shieldActiveTimer -= dt;
    if (this.shieldCooldownTimer > 0) this.shieldCooldownTimer -= dt;
    if (this.vampCooldownTimer > 0) this.vampCooldownTimer -= dt;
    this.tickModeRegen(dt);
  }

  /** 普通/简单模式：定时恢复生命 */
  private tickModeRegen(dt: number): void {
    const interval = getModeRegenInterval(this.mode);
    if (interval === null || this.hp >= this.maxHp) return;

    this.regenTimer += dt;
    while (this.regenTimer >= interval && this.hp < this.maxHp) {
      this.regenTimer -= interval;
      this.hp = Math.min(
        this.maxHp,
        this.hp + this.scaleHealAmount(MODE_REGEN_AMOUNT),
      );
    }
  }

  /** 加固舰体：缩放生命上限增益 */
  scaleHpGain(base: number): number {
    return Math.max(1, Math.round(base * this.hpGainMultiplier));
  }

  /** 加固舰体：缩放生命恢复量 */
  scaleHealAmount(base: number): number {
    return Math.max(1, Math.round(base * this.hpGainMultiplier));
  }

  beginDefeat(): void {
    if (this.isDying) return;
    this.isDying = true;
    this.hp = 0;
  }

  takeDamage(amount: number): boolean {
    if (this.isDying || this.invincibleTimer > 0 || this.isShieldActive) return false;

    // 被动护盾：冷却完毕时受击自动开盾并格挡本次伤害
    if (this.hasRelic('passiveShield') && this.shieldCooldownTimer <= 0 && this.shieldActiveTimer <= 0) {
      this.tryActivateShield();
      return false;
    }

    // 回收引擎：概率免伤
    if (this.hasRelic('salvageBoost') && Math.random() < RELIC_DODGE_CHANCE) {
      return false;
    }

    this.hp -= amount;
    this.invincibleTimer = INVINCIBLE_DURATION;
    return true;
  }

  /** 击杀回血宝物 */
  onEnemyKilled(): void {
    if (!this.hasRelic('vampiricRounds') || this.vampCooldownTimer > 0) return;
    this.hp = Math.min(this.maxHp, this.hp + this.scaleHealAmount(1));
    this.vampCooldownTimer = RELIC_VAMP_COOLDOWN;
  }

  /** 动能吸收：护盾格挡敌弹时回复 1 点生命 */
  onShieldBlockBullet(): void {
    if (!this.hasRelic('kineticAbsorption')) return;
    this.hp = Math.min(this.maxHp, this.hp + 1);
  }

  /** 动能转化：命中敌机时累计，每 8 次减少主动护盾冷却 1 秒 */
  onEnemyHit(): void {
    if (!this.hasRelic('kineticConversion')) return;
    this.kineticHitCounter += 1;
    if (this.kineticHitCounter < RELIC_KINETIC_HITS_PER_PROC) return;

    const procs = Math.floor(this.kineticHitCounter / RELIC_KINETIC_HITS_PER_PROC);
    this.kineticHitCounter %= RELIC_KINETIC_HITS_PER_PROC;
    this.shieldCooldownTimer = Math.max(
      0,
      this.shieldCooldownTimer - procs * RELIC_KINETIC_SHIELD_CD_REDUCTION,
    );
  }

  canFire(): boolean {
    return this.attackTimer >= this.attackSpeed;
  }

  resetFireTimer(): void {
    this.attackTimer = 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.isDying) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      drawPlayerShip(ctx, this.x, this.y, this.hitRadius);
      ctx.restore();
      return;
    }

    for (const drone of this.drones) drone.draw(ctx, this);

    if (this.isShieldActive) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.hitRadius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = 'rgba(96, 165, 250, 0.15)';
      ctx.fill();
    }

    const blink = this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 10) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.4;

    drawPlayerShip(ctx, this.x, this.y, this.hitRadius);

    ctx.globalAlpha = 1;
  }
}
