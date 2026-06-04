import { Bullet } from '../entities/Bullet';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';

const BULLET_SPREAD = 15 * (Math.PI / 180);
const ENEMY_BULLET_SPEED = 250;
const AIM_SPREAD_DEG = 10 * (Math.PI / 180);

/** 战斗系统：自动射击 */
export class CombatSystem {
  /** 玩家射击，返回新子弹 */
  firePlayer(player: Player): Bullet[] {
    if (!player.canFire()) return [];
    player.resetFireTimer();

    const bullets: Bullet[] = [];
    const count = player.bulletCount;
    const baseAngle = -Math.PI / 2; // 向上

    if (count === 1) {
      bullets.push(
        new Bullet(
          player.x,
          player.y - player.hitRadius,
          0,
          -player.bulletSpeed,
          player.bulletDamage,
          'player',
        ),
      );
    } else {
      const totalSpread = BULLET_SPREAD * (count - 1);
      const startAngle = baseAngle - totalSpread / 2;
      for (let i = 0; i < count; i++) {
        const angle = startAngle + (totalSpread / (count - 1)) * i;
        bullets.push(
          new Bullet(
            player.x,
            player.y - player.hitRadius,
            Math.cos(angle) * player.bulletSpeed,
            Math.sin(angle) * player.bulletSpeed,
            player.bulletDamage,
            'player',
          ),
        );
      }
    }
    return bullets;
  }

  /** 敌机射击 */
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

    return new Bullet(
      startX,
      startY,
      vx,
      vy,
      enemy.bulletDamage,
      'enemy',
      enemy.bulletShape,
    );
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
      angle += (Math.random() * 2 - 1) * AIM_SPREAD_DEG;
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
