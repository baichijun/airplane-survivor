import { Bullet } from '../entities/Bullet';
import type { Boss } from '../entities/Boss';
import {
  BOSS_BULLET_SPEED,
  BOSS_BURST_BULLET_RADIUS_MULT,
  BOSS_BURST_ROUND_COUNT,
  BOSS_BURST_ROUND_INTERVAL,
  BOSS_BURST_SHOT_INTERVAL,
  BOSS_BURST_SHOTS_PER_ROUND,
  BOSS_PATTERN_COOLDOWN,
  BOSS_ROW_SPACING_MULT,
  BOSS_ROW_WAVE_COUNT,
  BOSS_ROW_WAVE_INTERVAL,
  BOSS_ZONE_ACTIVE_DURATION,
  BOSS_ZONE_COUNT,
  BOSS_ZONE_WARNING_DURATION,
  BOSS_ZONE_WAVE_COUNT,
  BULLET_DOT_RADIUS,
  GAME_WIDTH,
  PLAYER_SHIP_WIDTH,
} from '../config/balance';

type BossAttackPattern = 0 | 1 | 2;

/** Boss 三种攻击模式的状态机 */
export class BossAttackSystem {
  patternIndex: BossAttackPattern = 0;
  state: 'idle' | 'executing' = 'idle';
  timer = 0;

  private burstRound = 0;
  private burstShotTimer = 0;
  private burstShotsInRound = 0;
  private burstRoundCooldown = 0;

  private rowWave = 0;
  private rowWaveTimer = 0;
  private rowInitialized = false;

  private zoneWave = 0;
  private zoneWaveTimer = 0;
  private zoneWaveStarted = false;

  update(dt: number, boss: Boss): Bullet[] {
    if (this.state === 'idle') {
      this.timer += dt;
      if (this.timer >= BOSS_PATTERN_COOLDOWN) {
        this.startPattern(boss);
      }
      return [];
    }

    switch (this.patternIndex) {
      case 0:
        return this.updateBurst(dt, boss);
      case 1:
        return this.updateRow(dt, boss);
      case 2:
        return this.updateZone(dt, boss);
      default:
        return [];
    }
  }

  private startPattern(_boss: Boss): void {
    this.state = 'executing';
    this.timer = 0;
    this.burstRound = 0;
    this.burstShotTimer = 0;
    this.burstShotsInRound = 0;
    this.burstRoundCooldown = 0;
    this.rowWave = 0;
    this.rowWaveTimer = 0;
    this.rowInitialized = false;
    this.zoneWave = 0;
    this.zoneWaveTimer = 0;
    this.zoneWaveStarted = false;
  }

  /** 动作 A：瞄准连射大弹，3 轮 × 3 发 */
  private updateBurst(dt: number, boss: Boss): Bullet[] {
    const bullets: Bullet[] = [];

    if (this.burstRoundCooldown > 0) {
      this.burstRoundCooldown -= dt;
      if (this.burstRoundCooldown <= 0) {
        this.burstShotsInRound = 0;
        this.burstShotTimer = 0;
      }
      return bullets;
    }

    this.burstShotTimer += dt;
    while (
      this.burstShotsInRound < BOSS_BURST_SHOTS_PER_ROUND &&
      this.burstShotTimer >= BOSS_BURST_SHOT_INTERVAL * this.burstShotsInRound
    ) {
      bullets.push(this.fireAimedBigBullet(boss));
      this.burstShotsInRound += 1;
    }

    if (this.burstShotsInRound >= BOSS_BURST_SHOTS_PER_ROUND) {
      this.burstRound += 1;
      if (this.burstRound >= BOSS_BURST_ROUND_COUNT) {
        this.finishPattern();
        return bullets;
      }
      this.burstRoundCooldown = BOSS_BURST_ROUND_INTERVAL;
    }

    return bullets;
  }

  /** 动作 B：横向一排垂直弹幕，三波带横向偏移 */
  private updateRow(dt: number, boss: Boss): Bullet[] {
    if (!this.rowInitialized) {
      this.rowInitialized = true;
      return this.fireRowWave(boss, 0);
    }

    this.rowWaveTimer += dt;
    if (this.rowWaveTimer < BOSS_ROW_WAVE_INTERVAL) return [];

    this.rowWaveTimer = 0;
    this.rowWave += 1;
    if (this.rowWave >= BOSS_ROW_WAVE_COUNT) {
      this.finishPattern();
      return [];
    }

    const offset = this.rowWave === 1 ? PLAYER_SHIP_WIDTH : -PLAYER_SHIP_WIDTH;
    return this.fireRowWave(boss, offset);
  }

  /** 动作 C：五分区随机预警后区域攻击 */
  private updateZone(dt: number, boss: Boss): Bullet[] {
    const waveDuration = BOSS_ZONE_WARNING_DURATION + BOSS_ZONE_ACTIVE_DURATION;

    if (!this.zoneWaveStarted) {
      this.zoneWaveStarted = true;
      this.zoneWaveTimer = 0;
      const zoneCount = this.zoneWave + 1;
      return this.spawnZoneHazards(boss, zoneCount);
    }

    this.zoneWaveTimer += dt;
    if (this.zoneWaveTimer < waveDuration) return [];

    this.zoneWave += 1;
    this.zoneWaveStarted = false;
    this.zoneWaveTimer = 0;

    if (this.zoneWave >= BOSS_ZONE_WAVE_COUNT) {
      this.finishPattern();
      return [];
    }

    return [];
  }

  private finishPattern(): void {
    this.state = 'idle';
    this.timer = 0;
    this.patternIndex = ((this.patternIndex + 1) % 3) as BossAttackPattern;
  }

  private fireAimedBigBullet(boss: Boss): Bullet {
    const spawnY = boss.y + boss.height / 2;
    const dx = boss.targetX - boss.x;
    const dy = boss.targetY - spawnY;
    const angle = Math.atan2(dy, dx);
    const bullet = new Bullet(
      boss.x,
      spawnY,
      Math.cos(angle) * BOSS_BULLET_SPEED,
      Math.sin(angle) * BOSS_BULLET_SPEED,
      boss.bulletDamage,
      'enemy',
    );
    bullet.radius = BULLET_DOT_RADIUS * BOSS_BURST_BULLET_RADIUS_MULT;
    return bullet;
  }

  private fireRowWave(boss: Boss, xOffset: number): Bullet[] {
    const spacing = PLAYER_SHIP_WIDTH * BOSS_ROW_SPACING_MULT;
    const spawnY = boss.y + boss.height / 2;
    const bullets: Bullet[] = [];

    for (let x = 0; x <= GAME_WIDTH; x += spacing) {
      bullets.push(
        new Bullet(x + xOffset, spawnY, 0, BOSS_BULLET_SPEED, boss.bulletDamage, 'enemy'),
      );
    }

    return bullets;
  }

  private spawnZoneHazards(boss: Boss, count: number): Bullet[] {
    const zoneWidth = GAME_WIDTH / BOSS_ZONE_COUNT;
    const zoneTop = boss.y + boss.height / 2;
    const indices = pickRandomIndices(BOSS_ZONE_COUNT, count);
    return indices.map((index) => {
      const left = index * zoneWidth;
      const right = left + zoneWidth;
      const hazard = new Bullet(
        (left + right) / 2,
        zoneTop,
        0,
        0,
        boss.bulletDamage,
        'enemy',
        'zone',
      );
      hazard.initZone(left, right, index, zoneTop);
      return hazard;
    });
  }
}

function pickRandomIndices(poolSize: number, count: number): number[] {
  const pool = Array.from({ length: poolSize }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
