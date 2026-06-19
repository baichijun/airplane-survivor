import { GAME_WIDTH, GAME_HEIGHT } from '../config/balance';
import { fontDisplay } from './theme';

/** Boss 狂暴屏幕提示（绘制在敌机/子弹下层） */
export class BossBerserkFlash {
  draw(ctx: CanvasRenderingContext2D, visible: boolean): void {
    if (!visible) return;

    ctx.save();
    ctx.fillStyle = 'rgba(220, 38, 38, 0.12)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const pulse = 0.82 + Math.sin(performance.now() * 0.014) * 0.18;
    ctx.globalAlpha = pulse;

    ctx.font = fontDisplay(20, 900);
    ctx.fillStyle = '#fca5a5';
    ctx.strokeStyle = 'rgba(127, 29, 29, 0.85)';
    ctx.lineWidth = 3;
    const textY = GAME_HEIGHT * 0.44;
    const message = 'boss狂暴，敌人伤害提升';
    ctx.strokeText(message, GAME_WIDTH / 2, textY);
    ctx.fillText(message, GAME_WIDTH / 2, textY);

    ctx.restore();
  }
}
