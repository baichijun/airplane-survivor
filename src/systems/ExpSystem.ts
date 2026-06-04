import { PASSIVE_XP_PER_SEC, xpToNextLevel } from '../config/balance';

/** 经验与升级系统 */
export class ExpSystem {
  level = 1;
  currentXp = 0;
  private passiveAccumulator = 0;

  reset(): void {
    this.level = 1;
    this.currentXp = 0;
    this.passiveAccumulator = 0;
  }

  get xpRequired(): number {
    return xpToNextLevel(this.level);
  }

  get xpProgress(): number {
    return this.currentXp / this.xpRequired;
  }

  /** 被动经验每帧结算 */
  tickPassive(dt: number, multiplier = 1): void {
    this.passiveAccumulator += PASSIVE_XP_PER_SEC * multiplier * dt;
    const whole = Math.floor(this.passiveAccumulator);
    if (whole > 0) {
      this.currentXp += whole;
      this.passiveAccumulator -= whole;
    }
  }

  addXp(amount: number): void {
    this.currentXp += amount;
  }

  /** 是否达到升级条件 */
  shouldLevelUp(): boolean {
    return this.currentXp >= this.xpRequired;
  }

  /** 升级：扣除所需经验，等级 +1，保留溢出经验 */
  levelUp(): void {
    this.currentXp -= this.xpRequired;
    this.level += 1;
  }
}
