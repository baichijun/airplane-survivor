import { Bullet } from '../entities/Bullet';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';

const BULLET_SPREAD = 15 * (Math.PI / 180);
const ENEMY_BULLET_SPEED = 250;

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

    const dx = enemy.targetX - enemy.x;
    const dy = enemy.targetY - enemy.y;
    const len = Math.hypot(dx, dy) || 1;
    const vx = (dx / len) * ENEMY_BULLET_SPEED;
    const vy = (dy / len) * ENEMY_BULLET_SPEED;

    return new Bullet(
      enemy.x,
      enemy.y + enemy.height / 2,
      vx,
      vy,
      enemy.bulletDamage,
      'enemy',
    );
  }
}
