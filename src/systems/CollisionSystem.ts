import type { Bullet } from '../entities/Bullet';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';
import { CONTACT_DAMAGE } from '../config/balance';

/** 圆形碰撞检测 */
function circleOverlap(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
): boolean {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const dist = r1 + r2;
  return dx * dx + dy * dy <= dist * dist;
}

/** 矩形与圆碰撞（敌机用矩形近似） */
function rectCircleOverlap(
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  cx: number,
  cy: number,
  cr: number,
): boolean {
  const hw = rw / 2;
  const hh = rh / 2;
  const nearestX = Math.max(rx - hw, Math.min(cx, rx + hw));
  const nearestY = Math.max(ry - hh, Math.min(cy, ry + hh));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy <= cr * cr;
}

export interface CollisionResult {
  killedEnemies: Enemy[];
  playerHit: boolean;
}

/** 碰撞系统 */
export class CollisionSystem {
  resolve(
    bullets: Bullet[],
    enemies: Enemy[],
    player: Player,
  ): CollisionResult {
    const killedEnemies: Enemy[] = [];
    let playerHit = false;

    for (const bullet of bullets) {
      if (!bullet.active) continue;

      if (bullet.owner === 'player') {
        for (const enemy of enemies) {
          if (!enemy.active) continue;
          if (
            rectCircleOverlap(
              enemy.x,
              enemy.y,
              enemy.width,
              enemy.height,
              bullet.x,
              bullet.y,
              bullet.radius,
            )
          ) {
            enemy.takeDamage(bullet.damage);
            bullet.active = false;
            if (!enemy.active) killedEnemies.push(enemy);
            break;
          }
        }
      } else {
        if (
          circleOverlap(
            bullet.x,
            bullet.y,
            bullet.radius,
            player.x,
            player.y,
            player.hitRadius,
          )
        ) {
          if (player.takeDamage(bullet.damage)) playerHit = true;
          bullet.active = false;
        }
      }
    }

    // 敌机接触伤害
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      if (
        rectCircleOverlap(
          enemy.x,
          enemy.y,
          enemy.width,
          enemy.height,
          player.x,
          player.y,
          player.hitRadius,
        )
      ) {
        if (player.takeDamage(CONTACT_DAMAGE)) playerHit = true;
        enemy.active = false;
        killedEnemies.push(enemy);
      }
    }

    return { killedEnemies, playerHit };
  }
}
