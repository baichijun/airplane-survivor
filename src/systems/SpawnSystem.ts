import type { EnemyType } from '../types';
import { Enemy } from '../entities/Enemy';
import {
  GAME_WIDTH,
  INITIAL_SPAWN_INTERVAL,
  SPAWN_INTERVAL_DECAY,
  FIGHTER_UNLOCK_TIME,
  TANK_UNLOCK_TIME,
  ENEMY_CAP_INITIAL,
} from '../config/balance';

/** 敌机生成系统（随时间加速） */
export class SpawnSystem {
  spawnTimer = 0;
  elapsedSec = 0;

  reset(): void {
    this.spawnTimer = 0;
    this.elapsedSec = 0;
  }

  update(dt: number, enemies: Enemy[], maxCap = ENEMY_CAP_INITIAL): Enemy | null {
    this.elapsedSec += dt;
    if (enemies.filter((e) => e.isCollidable).length >= maxCap) return null;

    this.spawnTimer += dt;
    const interval = this.getSpawnInterval();
    if (this.spawnTimer < interval) return null;

    this.spawnTimer -= interval;
    const type = this.pickEnemyType();
    const x = 30 + Math.random() * (GAME_WIDTH - 60);
    return new Enemy(type, x, -30, this.elapsedSec);
  }

  private getSpawnInterval(): number {
    const decaySteps = Math.floor(this.elapsedSec / 30);
    return INITIAL_SPAWN_INTERVAL * Math.pow(1 - SPAWN_INTERVAL_DECAY, decaySteps);
  }

  private pickEnemyType(): EnemyType {
    const t = this.elapsedSec;
    const roll = Math.random();
    if (t >= TANK_UNLOCK_TIME) {
      if (roll < 0.2) return 'tank';
      if (roll < 0.55) return 'fighter';
      return 'scout';
    }
    if (t >= FIGHTER_UNLOCK_TIME) {
      if (roll < 0.35) return 'fighter';
      return 'scout';
    }
    return 'scout';
  }
}
