import { GAME_WIDTH, GAME_HEIGHT } from '../config/balance';

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
  private btnRect = { x: 0, y: 0, w: 180, h: 48 };

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
    ctx.fillText('飞机大战', GAME_WIDTH / 2, 140);
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('幸存者', GAME_WIDTH / 2, 175);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '13px sans-serif';
    ctx.fillText('WASD / 方向键移动 · 触摸拖拽', GAME_WIDTH / 2, 220);
    ctx.fillText('自动射击 · 升级选奖励', GAME_WIDTH / 2, 240);

    const bx = GAME_WIDTH / 2 - 90;
    const by = 320;
    this.btnRect = { x: bx, y: by, w: 180, h: 48 };

    const grad = ctx.createLinearGradient(bx, by, bx, by + 48);
    grad.addColorStop(0, '#3b82f6');
    grad.addColorStop(1, '#a855f7');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(bx, by, 180, 48, 10);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('开始游戏', GAME_WIDTH / 2, by + 31);
  }

  hitTest(x: number, y: number): boolean {
    const b = this.btnRect;
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }
}
