import type { ExpSystem } from '../systems/ExpSystem';
import type { Player } from '../entities/Player';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/balance';

/** 抬头显示：生命值、等级、经验条 */
export class HUD {
  draw(
    ctx: CanvasRenderingContext2D,
    player: Player,
    exp: ExpSystem,
    elapsedSec: number,
    kills: number,
  ): void {
    const pad = 12;
    const barW = 160;
    const barH = 10;
    const bottomY = GAME_HEIGHT - pad - barH;

    // 存活时间与击杀
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    const mins = Math.floor(elapsedSec / 60);
    const secs = Math.floor(elapsedSec % 60);
    ctx.fillText(
      `${mins}:${secs.toString().padStart(2, '0')}  击杀 ${kills}`,
      pad,
      pad + 12,
    );

    // 等级
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`等级 ${exp.level}`, GAME_WIDTH - pad, pad + 12);

    // 左下角：生命值条 + 数值
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '11px sans-serif';
    ctx.fillText(`${player.hp}/${player.maxHp}`, pad, bottomY - 4);
    this.drawBar(ctx, pad, bottomY, barW, barH, player.hp / player.maxHp, '#ef4444', '#374151');

    // 右下角：经验条 + 数值
    const xpX = GAME_WIDTH - pad - barW;
    ctx.textAlign = 'right';
    ctx.fillText(`${exp.currentXp}/${exp.xpRequired}`, GAME_WIDTH - pad, bottomY - 4);
    this.drawBar(ctx, xpX, bottomY, barW, barH, exp.xpProgress, '#a855f7', '#374151');
  }

  private drawBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    ratio: number,
    colorStart: string,
    bgColor: string,
  ): void {
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, w, h);

    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, colorStart);
    grad.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w * Math.min(1, ratio), h);
  }
}
