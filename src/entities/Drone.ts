import type { Player } from './Player';
import { DRONE_OFFSET_X } from '../config/balance';
import { drawDroneShip } from '../ui/ShipSprites';

/** 跟随玩家的左右无人机 */
export class Drone {
  side: 'left' | 'right';
  attackTimer = 0;

  constructor(side: 'left' | 'right') {
    this.side = side;
  }

  reset(): void {
    this.attackTimer = 0;
  }

  getPosition(player: Player): { x: number; y: number } {
    const sign = this.side === 'left' ? -1 : 1;
    return {
      x: player.x + sign * DRONE_OFFSET_X,
      y: player.y + 6,
    };
  }

  getAttackInterval(player: Player): number {
    return player.getDroneAttackInterval();
  }

  getBulletDamage(player: Player): number {
    return player.getDroneBulletDamage();
  }

  update(dt: number, _player: Player): void {
    this.attackTimer += dt;
  }

  canFire(player: Player): boolean {
    return this.attackTimer >= this.getAttackInterval(player);
  }

  resetFireTimer(): void {
    this.attackTimer = 0;
  }

  draw(ctx: CanvasRenderingContext2D, player: Player): void {
    const pos = this.getPosition(player);
    drawDroneShip(ctx, pos.x, pos.y, this.side);
  }
}
