import type { ExpSystem } from '../systems/ExpSystem';
import type { Player } from '../entities/Player';
import { GAME_WIDTH, hudBarTopY, hudLabelBottomY } from '../config/balance';
import { RELIC_POOL } from '../config/relics';

/** 抬头显示：生命值、等级、经验条、宝物图标 */
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
    const barY = hudBarTopY();
    const labelY = hudLabelBottomY();

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

    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`等级 ${exp.level}`, GAME_WIDTH - pad, pad + 12);

    this.drawRelicIcons(ctx, player);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '11px sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`生命：${player.hp}/${player.maxHp}`, pad, labelY);
    this.drawBar(ctx, pad, barY, barW, barH, player.hp / player.maxHp, '#ef4444', '#374151');

    const xpX = GAME_WIDTH - pad - barW;
    ctx.textAlign = 'right';
    ctx.fillText(`经验：${exp.currentXp}/${exp.xpRequired}`, GAME_WIDTH - pad, labelY);
    this.drawBar(ctx, xpX, barY, barW, barH, exp.xpProgress, '#a855f7', '#374151');
    ctx.textBaseline = 'alphabetic';
  }

  private drawRelicIcons(ctx: CanvasRenderingContext2D, player: Player): void {
    if (player.relics.size === 0) return;

    const iconSize = 22;
    const gap = 4;
    const icons = RELIC_POOL.filter((r) => player.relics.has(r.id));
    const totalW = icons.length * iconSize + (icons.length - 1) * gap;
    let x = (GAME_WIDTH - totalW) / 2;
    const y = 28;

    for (const relic of icons) {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, iconSize, iconSize, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(relic.icon, x + iconSize / 2, y + iconSize / 2);
      x += iconSize + gap;
    }
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
