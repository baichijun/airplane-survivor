import { Boss } from '../entities/Boss';
import { BOSS_FIRST_SPAWN_TIME, BOSS_RESPAWN_INTERVAL } from '../config/balance';

/** Boss 生成调度 */
export class BossSystem {
  boss: Boss | null = null;
  bossIndex = 0;
  /** 已击败 Boss 数量，用于缩放后续敌机生命 */
  bossesDefeated = 0;
  nextBossAt = BOSS_FIRST_SPAWN_TIME;

  reset(): void {
    this.boss = null;
    this.bossIndex = 0;
    this.bossesDefeated = 0;
    this.nextBossAt = BOSS_FIRST_SPAWN_TIME;
  }

  get isBossActive(): boolean {
    return this.boss !== null && this.boss.active;
  }

  /** 尝试生成 Boss，返回新生成的 Boss */
  trySpawn(elapsedSec: number): Boss | null {
    if (this.isBossActive || elapsedSec < this.nextBossAt) return null;
    this.bossIndex += 1;
    this.boss = new Boss(elapsedSec, this.bossIndex);
    return this.boss;
  }

  onBossKilled(elapsedSec: number): void {
    this.bossesDefeated += 1;
    this.boss = null;
    this.nextBossAt = elapsedSec + BOSS_RESPAWN_INTERVAL;
  }

  update(dt: number, playerX: number, playerY: number): void {
    if (this.boss?.active) {
      this.boss.update(dt, playerX, playerY);
    } else if (this.boss && !this.boss.active) {
      this.boss = null;
    }
  }
}
