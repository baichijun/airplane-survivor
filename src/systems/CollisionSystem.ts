import type { Bullet } from '../entities/Bullet';
import type { Boss } from '../entities/Boss';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';
import {
  BOSS_CONTACT_DAMAGE,
  CONTACT_DAMAGE,
  GAME_HEIGHT,
  LASER_BEAM_WIDTH,
  RELIC_RICOCHET_CHANCE,
} from '../config/balance';

function circleOverlap(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number,
): boolean {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const dist = r1 + r2;
  return dx * dx + dy * dy <= dist * dist;
}

function rectCircleOverlap(
  rx: number, ry: number, rw: number, rh: number,
  cx: number, cy: number, cr: number,
): boolean {
  const hw = rw / 2;
  const hh = rh / 2;
  const nearestX = Math.max(rx - hw, Math.min(cx, rx + hw));
  const nearestY = Math.max(ry - hh, Math.min(cy, ry + hh));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy <= cr * cr;
}

function segmentCircleOverlap(
  x1: number, y1: number, x2: number, y2: number,
  cx: number, cy: number, cr: number,
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
  bossKilled: boolean;
}

/** 碰撞系统 */
export class CollisionSystem {
  resolve(
    bullets: Bullet[],
    enemies: Enemy[],
    player: Player,
    boss: Boss | null,
  ): CollisionResult {
    const killedEnemies: Enemy[] = [];
    let playerHit = false;
    let bossKilled = false;
    /** 本帧已从激光受到的伤害次数（多道激光只扣一次血） */
    let laserDamageApplied = false;

    for (const bullet of bullets) {
      if (!bullet.active) continue;

      if (bullet.owner === 'player') {
        if (boss?.isCollidable && bullet.active && this.playerBulletHitsBoss(bullet, boss)) {
          const justKilled = boss.takeDamage(bullet.damage);
          bullet.active = false;
          if (justKilled) bossKilled = true;
        }

        for (const enemy of enemies) {
          if (!bullet.active) break;
          if (!enemy.isCollidable) continue;
          if (bullet.hitEnemies.has(enemy)) continue;
          if (this.playerBulletHitsEnemy(bullet, enemy)) {
            // 先结算击中伤害，再判定弹射
            const justKilled = enemy.takeDamage(bullet.damage);
            bullet.hitEnemies.add(enemy);
            player.onEnemyHit();
            this.handlePlayerBulletHitEnemy(bullet, player, enemy, enemies);
            if (justKilled) killedEnemies.push(enemy);
          }
        }
      } else if (this.enemyBulletHitsPlayer(bullet, player)) {
        if (bullet.shape === 'laser' && bullet.isLaserActive()) {
          // 激光接触即标记已命中，避免无敌/闪避期间重复判定
          bullet.laserHitApplied = true;
          if (player.isShieldActive) {
            player.onShieldBlockBullet();
          } else if (!laserDamageApplied && player.takeDamage(bullet.damage)) {
            laserDamageApplied = true;
            playerHit = true;
          }
        } else if (bullet.shape === 'zone' && bullet.isZoneActive()) {
          if (this.playerInZone(bullet, player)) {
            bullet.zoneHitApplied = true;
            if (player.isShieldActive) {
              player.onShieldBlockBullet();
            } else if (player.takeDamage(bullet.damage)) {
              playerHit = true;
            }
          }
        } else if (player.isShieldActive) {
          player.onShieldBlockBullet();
          bullet.active = false;
        } else if (player.takeDamage(bullet.damage)) {
          playerHit = true;
          bullet.active = false;
        }
      }
    }

    for (const enemy of enemies) {
      if (!enemy.isCollidable) continue;
      if (rectCircleOverlap(enemy.x, enemy.y, enemy.width, enemy.height, player.x, player.y, player.hitRadius)) {
        if (player.takeDamage(CONTACT_DAMAGE)) playerHit = true;
        enemy.beginDefeat();
        killedEnemies.push(enemy);
      }
    }

    if (boss?.isCollidable) {
      if (rectCircleOverlap(boss.x, boss.y, boss.width, boss.height, player.x, player.y, player.hitRadius)) {
        if (player.takeDamage(BOSS_CONTACT_DAMAGE)) playerHit = true;
      }
    }

    return { killedEnemies, playerHit, bossKilled };
  }

  /**
   * 击中敌机后：先已由调用方扣血；30% 几率弹射向另一敌机并保留子弹，否则销毁。
   * 弹射后的子弹可继续命中其他敌机并再次造成伤害。
   */
  private handlePlayerBulletHitEnemy(
    bullet: Bullet,
    player: Player,
    hitEnemy: Enemy,
    enemies: Enemy[],
  ): void {
    if (
      player.hasRelic('ricochetShots') &&
      Math.random() < RELIC_RICOCHET_CHANCE
    ) {
      const others = enemies.filter(
        (e) => e.isCollidable && e !== hitEnemy && !bullet.hitEnemies.has(e),
      );
      if (others.length > 0) {
        const target = others[Math.floor(Math.random() * others.length)];
        const dx = target.x - bullet.x;
        const dy = target.y - bullet.y;
        const len = Math.hypot(dx, dy) || 1;
        const speed = Math.hypot(bullet.vx, bullet.vy) || player.bulletSpeed;
        bullet.vx = (dx / len) * speed;
        bullet.vy = (dy / len) * speed;
        // 略微移出当前命中体，避免下一帧立刻再次碰撞
        bullet.x += (dx / len) * (bullet.radius + 2);
        bullet.y += (dy / len) * (bullet.radius + 2);
        return;
      }
    }
    bullet.active = false;
  }

  private playerBulletHitsBoss(bullet: Bullet, boss: Boss): boolean {
    if (bullet.shape === 'long') {
      const seg = bullet.getLongSegment();
      return segmentCircleOverlap(
        seg.x1, seg.y1, seg.x2, seg.y2,
        boss.x, boss.y,
        Math.max(boss.width, boss.height) / 2,
        bullet.radius * 2,
      );
    }
    return rectCircleOverlap(
      boss.x, boss.y, boss.width, boss.height,
      bullet.x, bullet.y, bullet.radius,
    );
  }

  private playerBulletHitsEnemy(bullet: Bullet, enemy: Enemy): boolean {
    if (bullet.shape === 'long') {
      const seg = bullet.getLongSegment();
      return segmentCircleOverlap(
        seg.x1, seg.y1, seg.x2, seg.y2,
        enemy.x, enemy.y,
        Math.max(enemy.width, enemy.height) / 2,
        bullet.radius * 2,
      );
    }
    return rectCircleOverlap(
      enemy.x, enemy.y, enemy.width, enemy.height,
      bullet.x, bullet.y, bullet.radius,
    );
  }

  private enemyBulletHitsPlayer(bullet: Bullet, player: Player): boolean {
    if (bullet.shape === 'zone') {
      if (!bullet.isZoneActive() || bullet.zoneHitApplied) return false;
      return this.playerInZone(bullet, player);
    }
    if (bullet.shape === 'laser') {
      if (!bullet.isLaserActive() || bullet.laserHitApplied) return false;
      return segmentCircleOverlap(
        bullet.lineX1, bullet.lineY1, bullet.lineX2, bullet.lineY2,
        player.x, player.y, player.hitRadius, LASER_BEAM_WIDTH,
      );
    }
    if (bullet.shape === 'long') {
      const seg = bullet.getLongSegment();
      return segmentCircleOverlap(
        seg.x1, seg.y1, seg.x2, seg.y2,
        player.x, player.y, player.hitRadius, bullet.radius * 2,
      );
    }
    return circleOverlap(bullet.x, bullet.y, bullet.radius, player.x, player.y, player.hitRadius);
  }

  private playerInZone(bullet: Bullet, player: Player): boolean {
    const w = bullet.zoneRight - bullet.zoneLeft;
    const h = GAME_HEIGHT - bullet.zoneTop;
    return rectCircleOverlap(
      (bullet.zoneLeft + bullet.zoneRight) / 2,
      bullet.zoneTop + h / 2,
      w,
      h,
      player.x,
      player.y,
      player.hitRadius,
    );
  }
}

