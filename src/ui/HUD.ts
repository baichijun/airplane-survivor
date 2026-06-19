import type { ExpSystem } from '../systems/ExpSystem';
import type { Player } from '../entities/Player';
import { GAME_WIDTH, hudBarTopY, hudLabelBottomY } from '../config/balance';
import { RELIC_POOL } from '../config/relics';
import { UI, drawProgressBar, fontBody, fontDisplay } from './theme';

/** 抬头显示：生命值、等级、经验条、宝物图标 */
export class HUD {
  draw(
    ctx: CanvasRenderingContext2D,
    player: Player,
    exp: ExpSystem,
    elapsedSec: number,
    kills: number,
  ): void {
    const pad = 14;
    const barW = 168;
    const barH = 9;
    const barY = hudBarTopY();
    const labelY = hudLabelBottomY();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const mins = Math.floor(elapsedSec / 60);
    const secs = Math.floor(elapsedSec % 60);
    ctx.fillStyle = UI.textMuted;
    ctx.font = fontDisplay(12, 500);
    ctx.fillText(
      `${mins}:${secs.toString().padStart(2, '0')}`,
      pad,
      pad + 14,
    );
    ctx.font = fontBody(11);
    ctx.fillStyle = UI.textDim;
    ctx.fillText(`击杀 ${kills}`, pad + 52, pad + 14);

    ctx.textAlign = 'right';
    ctx.fillStyle = UI.accent;
    ctx.font = fontDisplay(11, 500);
    ctx.fillText('LV', GAME_WIDTH - pad - 28, pad + 14);
    ctx.fillStyle = UI.text;
    ctx.font = fontDisplay(16, 900);
    ctx.fillText(`${exp.level}`, GAME_WIDTH - pad, pad + 14);

    this.drawRelicIcons(ctx, player);

    ctx.textAlign = 'left';
    ctx.fillStyle = UI.textMuted;
    ctx.font = fontBody(10, true);
    ctx.textBaseline = 'bottom';
    ctx.fillText(`HP ${player.hp}/${player.maxHp}`, pad, labelY);
    drawProgressBar(ctx, pad, barY, barW, barH, player.hp / player.maxHp, UI.danger, UI.hpEnd);

    const xpX = GAME_WIDTH - pad - barW;
    ctx.textAlign = 'right';
    ctx.fillText(`XP ${exp.currentXp}/${exp.xpRequired}`, GAME_WIDTH - pad, labelY);
    drawProgressBar(ctx, xpX, barY, barW, barH, exp.xpProgress, UI.magenta, UI.magentaBright);
    ctx.textBaseline = 'alphabetic';
  }

  private drawRelicIcons(ctx: CanvasRenderingContext2D, player: Player): void {
    if (player.relics.size === 0) return;

    const iconSize = 24;
    const gap = 5;
    const icons = RELIC_POOL.filter((r) => player.relics.has(r.id));
    const totalW = icons.length * iconSize + (icons.length - 1) * gap;
    let x = (GAME_WIDTH - totalW) / 2;
    const y = 26;

    for (const relic of icons) {
      ctx.fillStyle = UI.panel;
      ctx.strokeStyle = UI.magentaBright;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, iconSize, iconSize, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = UI.text;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(relic.icon, x + iconSize / 2, y + iconSize / 2);
      x += iconSize + gap;
    }
  }
}
