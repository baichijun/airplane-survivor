import { GAME_WIDTH, GAME_HEIGHT } from '../config/balance';
import type { GameMode } from '../types';
import {
  UI,
  drawGradientButton,
  drawTitleGradient,
  fontBody,
  fontDisplay,
} from './theme';

/** 游戏结束界面 */
export class GameOverOverlay {
  private btnRect = { x: 0, y: 0, w: 160, h: 44 };

  draw(
    ctx: CanvasRenderingContext2D,
    elapsedSec: number,
    kills: number,
    level: number,
  ): void {
    ctx.fillStyle = 'rgba(4, 8, 18, 0.92)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 扫描线氛围
    for (let i = 0; i < GAME_HEIGHT; i += 4) {
      ctx.fillStyle = 'rgba(34, 211, 238, 0.02)';
      ctx.fillRect(0, i, GAME_WIDTH, 1);
    }

    ctx.textAlign = 'center';
    drawTitleGradient(ctx, 'MISSION FAILED', GAME_WIDTH / 2, 168, 22, UI.danger, '#fb7185');
    ctx.fillStyle = UI.textMuted;
    ctx.font = fontBody(13);
    ctx.fillText('游戏结束', GAME_WIDTH / 2, 196);

    ctx.fillStyle = UI.text;
    ctx.font = fontDisplay(15, 700);
    const mins = Math.floor(elapsedSec / 60);
    const secs = Math.floor(elapsedSec % 60);
    ctx.fillText(`存活 ${mins}:${secs.toString().padStart(2, '0')}`, GAME_WIDTH / 2, 248);
    ctx.font = fontBody(14);
    ctx.fillStyle = UI.textMuted;
    ctx.fillText(`击杀 ${kills}  ·  等级 ${level}`, GAME_WIDTH / 2, 278);

    const bx = GAME_WIDTH / 2 - 88;
    const by = 340;
    const bw = 176;
    const bh = 46;
    this.btnRect = { x: bx, y: by, w: bw, h: bh };
    drawGradientButton(ctx, bx, by, bw, bh, '重新开始', UI.magenta, '#ec4899', 10);
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
    ctx.fillStyle = UI.bgDeep;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 星空 + 青色星点
    for (let i = 0; i < 55; i++) {
      const sx = (i * 97) % GAME_WIDTH;
      const sy = (i * 53) % GAME_HEIGHT;
      const isAccent = i % 7 === 0;
      ctx.fillStyle = isAccent
        ? `rgba(34, 211, 238, ${0.25 + (i % 4) * 0.1})`
        : `rgba(255,255,255,${0.15 + (i % 5) * 0.08})`;
      ctx.fillRect(sx, sy, isAccent ? 2 : 1, isAccent ? 2 : 1);
    }

    ctx.textAlign = 'center';
    drawTitleGradient(ctx, 'AIR STRIKE', GAME_WIDTH / 2, 118, 28, UI.accent, UI.magentaBright);
    drawTitleGradient(ctx, 'SURVIVOR', GAME_WIDTH / 2, 154, 24, UI.magentaBright, UI.magenta);

    ctx.fillStyle = UI.textDim;
    ctx.font = fontBody(12);
    ctx.fillText('飞机大战 · 幸存者', GAME_WIDTH / 2, 182);

    ctx.fillStyle = UI.textMuted;
    ctx.font = fontBody(12);
    ctx.fillText('WASD / 方向键 / 虚拟摇杆移动', GAME_WIDTH / 2, 218);
    ctx.fillText('空格 / 护盾按钮 · 自动射击', GAME_WIDTH / 2, 238);

    this.drawModeButton(ctx, GAME_WIDTH / 2 - 92, 278, '标准模式', '#0891b2', UI.accent, this.normalBtn);
    this.drawModeButton(ctx, GAME_WIDTH / 2 - 92, 338, '简单模式', '#059669', '#34d399', this.easyBtn);

    ctx.fillStyle = UI.textDim;
    ctx.font = fontBody(10);
    ctx.fillText('简单模式：初始生命 ×3，每 5 秒恢复 1 点生命', GAME_WIDTH / 2, 404);
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
    rect.w = 184;
    rect.h = 46;
    drawGradientButton(ctx, x, y, 184, 46, label, colorStart, colorEnd, 10);
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
