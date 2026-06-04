import { Bullet } from '../entities/Bullet';
import type { Boss } from '../entities/Boss';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';
import { isDroneHomingEnabled } from '../config/relics';
import {
  BOSS_BULLET_SPEED,
  BOSS_DOWN_LONG_ANGLE_OFFSETS,
  BOSS_LASER_ORIGIN_SPAN_RATIO,
  BOSS_RADIAL_BULLET_COUNT,
  BOSS_RADIAL_SPEED_MULT,
  BOSS_SCATTER_ANGLE,
  BOSS_SIDE_BULLET_OFFSET_X,
  DRONE_HOMING_STRENGTH,
  ENEMY_AIM_SPREAD_RAD,
  ENEMY_BULLET_SPEED,
  PLAYER_BULLET_SPREAD_RAD,
  bossLaserCount,
  bossScatterBulletCount,
} from '../config/balance';

/** 战斗系统：自动射击 */
export class CombatSystem {
  firePlayer(player: Player): Bullet[] {
    if (!player.canFire()) return [];
    player.resetFireTimer();

    const bullets: Bullet[] = [];
    const count = player.bulletCount;
    const baseAngle = -Math.PI / 2;
    const addBullet = (x: number, y: number, vx: number, vy: number) => {
      bullets.push(new Bullet(x, y, vx, vy, player.bulletDamage, 'player'));
    };

    if (count === 1) {
      addBullet(player.x, player.y - player.hitRadius, 0, -player.bulletSpeed);
    } else {
      const totalSpread = PLAYER_BULLET_SPREAD_RAD * (count - 1);
      const startAngle = baseAngle - totalSpread / 2;
      for (let i = 0; i < count; i++) {
        const angle = startAngle + (totalSpread / (count - 1)) * i;
        addBullet(
          player.x,
          player.y - player.hitRadius,
          Math.cos(angle) * player.bulletSpeed,
          Math.sin(angle) * player.bulletSpeed,
        );
      }
    }
    return bullets;
  }

  fireDrones(player: Player): Bullet[] {
    const bullets: Bullet[] = [];
    const homing = isDroneHomingEnabled(player);

    for (const drone of player.drones) {
      if (!drone.canFire(player)) continue;
      drone.resetFireTimer();
      const pos = drone.getPosition(player);
      const b = new Bullet(
        pos.x,
        pos.y - 6,
        0,
        -player.bulletSpeed,
        drone.getBulletDamage(player),
        'player',
      );
      b.isDroneBullet = true;
      if (homing) {
        b.homing = true;
        b.homingStrength = DRONE_HOMING_STRENGTH;
      }
      bullets.push(b);
    }
    return bullets;
  }

  /** Boss 多模式攻击 */
  fireBoss(boss: Boss): Bullet[] {
    if (!boss.canFire()) return [];
    boss.resetFireTimer();

    const bullets: Bullet[] = [];
    const dmg = boss.bulletDamage;
    const pattern = boss.currentPattern;

    if (pattern === 0) {
      const dx = boss.targetX - boss.x;
      const dy = boss.targetY - boss.y;
      const baseAngle = Math.atan2(dy, dx);
      const count = bossScatterBulletCount(boss.bossIndex);
      const startOffset = -(count - 1) / 2;
      for (let i = 0; i < count; i++) {
        const angle = baseAngle + (startOffset + i) * BOSS_SCATTER_ANGLE;
        bullets.push(
          new Bullet(
            boss.x,
            boss.y + boss.height / 2,
            Math.cos(angle) * BOSS_BULLET_SPEED,
            Math.sin(angle) * BOSS_BULLET_SPEED,
            dmg,
            'enemy',
            'long',
          ),
        );
      }
    } else if (pattern === 1) {
      const laserCount = bossLaserCount(boss.bossIndex);
      const sy = boss.y + boss.height / 2;
      const span = boss.width * BOSS_LASER_ORIGIN_SPAN_RATIO;
      for (let i = 0; i < laserCount; i++) {
        const t = laserCount === 1 ? 0.5 : i / (laserCount - 1);
        const sx = boss.x - span / 2 + span * t;
        const laser = new Bullet(sx, sy, 0, 0, dmg, 'enemy', 'laser');
        laser.initLaserLine(sx, sy, boss.targetX - sx, boss.targetY - sy);
        bullets.push(laser);
      }
    } else if (pattern === 2) {
      for (let i = 0; i < BOSS_RADIAL_BULLET_COUNT; i++) {
        const angle = (Math.PI * 2 * i) / BOSS_RADIAL_BULLET_COUNT + Math.PI / 2;
        bullets.push(
          new Bullet(
            boss.x,
            boss.y,
            Math.cos(angle) * BOSS_BULLET_SPEED * BOSS_RADIAL_SPEED_MULT,
            Math.sin(angle) * BOSS_BULLET_SPEED * BOSS_RADIAL_SPEED_MULT,
            dmg,
            'enemy',
          ),
        );
      }
    } else {
      for (const offset of BOSS_DOWN_LONG_ANGLE_OFFSETS) {
        const angle = Math.PI / 2 + offset;
        bullets.push(
          new Bullet(
            boss.x,
            boss.y + boss.height / 2,
            Math.cos(angle) * BOSS_BULLET_SPEED,
            Math.sin(angle) * BOSS_BULLET_SPEED,
            dmg,
            'enemy',
            'long',
          ),
        );
      }
      bullets.push(
        new Bullet(boss.x - BOSS_SIDE_BULLET_OFFSET_X, boss.y, 0, BOSS_BULLET_SPEED, dmg, 'enemy'),
        new Bullet(boss.x + BOSS_SIDE_BULLET_OFFSET_X, boss.y, 0, BOSS_BULLET_SPEED, dmg, 'enemy'),
      );
    }

    return bullets;
  }

  fireEnemy(enemy: Enemy): Bullet | null {
    if (!enemy.canFire()) return null;
    enemy.resetFireTimer();

    const startX = enemy.x;
    const startY = enemy.y + enemy.height / 2;
    const { vx, vy, dirX, dirY } = this.computeEnemyVelocity(enemy);

    if (enemy.bulletShape === 'laser') {
      const laser = new Bullet(startX, startY, 0, 0, enemy.bulletDamage, 'enemy', 'laser');
      laser.initLaserLine(startX, startY, dirX, dirY);
      return laser;
    }

    return new Bullet(startX, startY, vx, vy, enemy.bulletDamage, 'enemy', enemy.bulletShape);
  }

  private computeEnemyVelocity(enemy: Enemy): {
    vx: number;
    vy: number;
    dirX: number;
    dirY: number;
  } {
    if (enemy.aimType === 'vertical') {
      return { vx: 0, vy: ENEMY_BULLET_SPEED, dirX: 0, dirY: 1 };
    }

    const dx = enemy.targetX - enemy.x;
    const dy = enemy.targetY - enemy.y;
    let angle = Math.atan2(dy, dx);

    if (enemy.aimType === 'spread') {
      angle += (Math.random() * 2 - 1) * ENEMY_AIM_SPREAD_RAD;
    }

    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    return {
      vx: dirX * ENEMY_BULLET_SPEED,
      vy: dirY * ENEMY_BULLET_SPEED,
      dirX,
      dirY,
    };
  }
}
