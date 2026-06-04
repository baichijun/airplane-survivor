import type { Bullet } from '../entities/Bullet';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';
import { CONTACT_DAMAGE, LASER_BEAM_WIDTH } from '../config/balance';

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

/** 线段与圆碰撞 */
function segmentCircleOverlap(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cx: number,
  cy: number,
  cr: number,
  lineWidth = 0,
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return circleOverlap(x1, y1, lineWidth / 2, cx, cy, cr);
  }

  let t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const nearestX = x1 + t * dx;
  const nearestY = y1 + t * dy;
  const effectiveR = cr + lineWidth / 2;
  const distX = cx - nearestX;
  const distY = cy - nearestY;
  return distX * distX + distY * distY <= effectiveR * effectiveR;
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
          if (this.playerBulletHitsEnemy(bullet, enemy)) {
            enemy.takeDamage(bullet.damage);
            bullet.active = false;
            if (!enemy.active) killedEnemies.push(enemy);
            break;
          }
        }
      } else if (this.enemyBulletHitsPlayer(bullet, player)) {
        if (player.takeDamage(bullet.damage)) playerHit = true;
        if (bullet.shape !== 'laser') {
          bullet.active = false;
        } else if (bullet.isLaserActive()) {
          bullet.laserHitApplied = true;
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

  private playerBulletHitsEnemy(bullet: Bullet, enemy: Enemy): boolean {
    if (bullet.shape === 'long') {
      const seg = bullet.getLongSegment();
      return segmentCircleOverlap(
        seg.x1,
        seg.y1,
        seg.x2,
        seg.y2,
        enemy.x,
        enemy.y,
        Math.max(enemy.width, enemy.height) / 2,
        bullet.radius * 2,
      );
    }

    return rectCircleOverlap(
      enemy.x,
      enemy.y,
      enemy.width,
      enemy.height,
      bullet.x,
      bullet.y,
      bullet.radius,
    );
  }

  private enemyBulletHitsPlayer(bullet: Bullet, player: Player): boolean {
    if (bullet.shape === 'laser') {
      if (!bullet.isLaserActive() || bullet.laserHitApplied) return false;
      return segmentCircleOverlap(
        bullet.lineX1,
        bullet.lineY1,
        bullet.lineX2,
        bullet.lineY2,
        player.x,
        player.y,
        player.hitRadius,
        LASER_BEAM_WIDTH,
      );
    }

    if (bullet.shape === 'long') {
      const seg = bullet.getLongSegment();
      return segmentCircleOverlap(
        seg.x1,
        seg.y1,
        seg.x2,
        seg.y2,
        player.x,
        player.y,
        player.hitRadius,
        bullet.radius * 2,
      );
    }

    return circleOverlap(
      bullet.x,
      bullet.y,
      bullet.radius,
      player.x,
      player.y,
      player.hitRadius,
    );
  }
}
