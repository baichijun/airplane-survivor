import type { Enemy } from '../entities/Enemy';
import {
  BOSS_BERSERK_DAMAGE_STEP,
  BOSS_BERSERK_DELAY,
  BOSS_BERSERK_FLASH_COUNT,
  BOSS_BERSERK_FLASH_OFF,
  BOSS_BERSERK_FLASH_ON,
  BOSS_BERSERK_STACK_INTERVAL,
} from '../config/balance';

/** Boss 狂暴：计时、敌机伤害叠加、闪烁提示调度 */
export class BossBerserkSystem {
  private bossAliveTimer = 0;
  private nextStackAt = BOSS_BERSERK_DELAY;
  private damageBonus = 0;

  private flashActive = false;
  private flashIndex = 0;
  private flashPhaseOn = true;
  private flashTimer = 0;
  private pendingStack = false;

  get isFlashVisible(): boolean {
    return this.flashActive && this.flashPhaseOn;
  }

  get damageBonusStacks(): number {
    return this.damageBonus;
  }

  reset(): void {
    this.bossAliveTimer = 0;
    this.nextStackAt = BOSS_BERSERK_DELAY;
    this.damageBonus = 0;
    this.stopFlash();
  }

  onBossSpawn(): void {
    this.reset();
  }

  onBossKilled(enemies: Enemy[]): void {
    for (const enemy of enemies) {
      if (enemy.active) enemy.applyBerserkBonus(0);
    }
    this.reset();
  }

  /** 新生成敌机同步当前狂暴伤害层数 */
  applyToEnemy(enemy: Enemy): void {
    if (this.damageBonus > 0) {
      enemy.applyBerserkBonus(this.damageBonus);
    }
  }

  update(dt: number, bossActive: boolean, enemies: Enemy[]): void {
    if (!bossActive) return;

    this.bossAliveTimer += dt;
    this.updateFlash(dt, enemies);

    if (this.flashActive || this.pendingStack) return;

    if (this.bossAliveTimer >= this.nextStackAt) {
      this.startFlash();
    }
  }

  private startFlash(): void {
    this.flashActive = true;
    this.flashIndex = 0;
    this.flashPhaseOn = true;
    this.flashTimer = 0;
    this.pendingStack = true;
  }

  private stopFlash(): void {
    this.flashActive = false;
    this.flashIndex = 0;
    this.flashPhaseOn = true;
    this.flashTimer = 0;
    this.pendingStack = false;
  }

  private updateFlash(dt: number, enemies: Enemy[]): void {
    if (!this.flashActive) return;

    this.flashTimer += dt;
    const phaseDuration = this.flashPhaseOn ? BOSS_BERSERK_FLASH_ON : BOSS_BERSERK_FLASH_OFF;

    if (this.flashTimer < phaseDuration) return;

    this.flashTimer = 0;

    if (this.flashPhaseOn) {
      this.flashPhaseOn = false;
      this.flashIndex += 1;
      if (this.flashIndex >= BOSS_BERSERK_FLASH_COUNT) {
        this.applyDamageStack(enemies);
        this.stopFlash();
      }
      return;
    }

    this.flashPhaseOn = true;
  }

  private applyDamageStack(enemies: Enemy[]): void {
    this.damageBonus += BOSS_BERSERK_DAMAGE_STEP;
    for (const enemy of enemies) {
      if (enemy.active) enemy.applyBerserkBonus(this.damageBonus);
    }
    this.nextStackAt += BOSS_BERSERK_STACK_INTERVAL;
    this.pendingStack = false;
  }
}
