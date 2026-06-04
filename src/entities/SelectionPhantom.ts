import { GAME_WIDTH, GAME_HEIGHT, PLAYER_MARGIN } from '../config/balance';
import type { Input } from '../core/Input';
import type { Player } from './Player';
import { drawPlayerShip } from '../ui/ShipSprites';

/** 升级/宝物选择专用幻影：仅用于飞入选项，不影响真实自机位置 */
export class SelectionPhantom {
  x: number;
  y: number;
  private readonly speed: number;
  private readonly hitRadius: number;

  private constructor(x: number, y: number, speed: number, hitRadius: number) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.hitRadius = hitRadius;
  }

  /** 在自机当前位置生成幻影 */
  static spawnAt(player: Player): SelectionPhantom {
    return new SelectionPhantom(player.x, player.y, player.speed, player.hitRadius);
  }

  update(dt: number, input: Input): void {
    const dir = input.getMoveDirection();
    if (dir.x !== 0 || dir.y !== 0) {
      this.x += dir.x * this.speed * dt;
      this.y += dir.y * this.speed * dt;
    }

    this.x = Math.max(PLAYER_MARGIN, Math.min(GAME_WIDTH - PLAYER_MARGIN, this.x));
    this.y = Math.max(PLAYER_MARGIN, Math.min(GAME_HEIGHT - PLAYER_MARGIN, this.y));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    ctx.globalAlpha = 0.55;
    drawPlayerShip(ctx, this.x, this.y, this.hitRadius);

    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.hitRadius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.stroke();

    ctx.restore();
  }
}
