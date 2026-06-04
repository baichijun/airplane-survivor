import { GAME_WIDTH, GAME_HEIGHT } from '../config/balance';
import type { GameMode } from '../types';

/** 游戏结束界面 */
export class GameOverOverlay {
  private btnRect = { x: 0, y: 0, w: 160, h: 44 };

  draw(
    ctx: CanvasRenderingContext2D,
    elapsedSec: number,
    kills: number,
    level: number,
  ): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('游戏结束', GAME_WIDTH / 2, 180);

    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const mins = Math.floor(elapsedSec / 60);
    const secs = Math.floor(elapsedSec % 60);
    ctx.fillText(`存活 ${mins}:${secs.toString().padStart(2, '0')}`, GAME_WIDTH / 2, 240);
    ctx.fillText(`击杀 ${kills}`, GAME_WIDTH / 2, 270);
    ctx.fillText(`最终等级 ${level}`, GAME_WIDTH / 2, 300);

    // 重新开始按钮
    const bx = GAME_WIDTH / 2 - 80;
    const by = 360;
    this.btnRect = { x: bx, y: by, w: 160, h: 44 };

    const grad = ctx.createLinearGradient(bx, by, bx, by + 44);
    grad.addColorStop(0, '#a855f7');
    grad.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(bx, by, 160, 44, 8);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('重新开始', GAME_WIDTH / 2, by + 28);
  }

  hitTest(x: number, y: number): boolean {
    const b = this.btnRect;
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }
}

/** 开始菜单 */
export class MenuOverlay {
  private normalBtn = { x: 0, y: 0, w: 180, h: 44 };
  private easyBtn = { x: 0, y: 0, w: 180, h: 44 };

  draw(ctx: CanvasRenderingContext2D): void {
    // 星空背景点缀
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (let i = 0; i < 40; i++) {
      const sx = ((i * 97) % GAME_WIDTH);
      const sy = ((i * 53) % GAME_HEIGHT);
      ctx.fillStyle = `rgba(255,255,255,${0.2 + (i % 5) * 0.1})`;
      ctx.fillRect(sx, sy, 2, 2);
    }

    ctx.textAlign = 'center';
    const titleGrad = ctx.createLinearGradient(0, 120, GAME_WIDTH, 160);
    titleGrad.addColorStop(0, '#60a5fa');
    titleGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = titleGrad;
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('飞机大战', GAME_WIDTH / 2, 130);
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('幸存者', GAME_WIDTH / 2, 162);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '13px sans-serif';
    ctx.fillText('WASD / 方向键 / 虚拟摇杆移动', GAME_WIDTH / 2, 210);
    ctx.fillText('空格 / 护盾按钮 · 自动射击', GAME_WIDTH / 2, 230);

    this.drawModeButton(ctx, GAME_WIDTH / 2 - 90, 280, '标准模式', '#3b82f6', '#a855f7', this.normalBtn);
    this.drawModeButton(ctx, GAME_WIDTH / 2 - 90, 336, '简单模式', '#22c55e', '#14b8a6', this.easyBtn);

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '11px sans-serif';
    ctx.fillText('简单模式：初始生命 ×3，每 5 秒恢复 1 点生命', GAME_WIDTH / 2, 400);
  }

  private drawModeButton(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string,
    colorStart: string,
    colorEnd: string,
    rect: { x: number; y: number; w: number; h: number },
  ): void {
    rect.x = x;
    rect.y = y;
    rect.w = 180;
    rect.h = 44;

    const grad = ctx.createLinearGradient(x, y, x, y + 44);
    grad.addColorStop(0, colorStart);
    grad.addColorStop(1, colorEnd);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, 180, 44, 10);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 90, y + 22);
  }

  hitTest(x: number, y: number): GameMode | null {
    if (this.hitRect(x, y, this.normalBtn)) return 'normal';
    if (this.hitRect(x, y, this.easyBtn)) return 'easy';
    return null;
  }

  private hitRect(
    x: number,
    y: number,
    rect: { x: number; y: number; w: number; h: number },
  ): boolean {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }
}
