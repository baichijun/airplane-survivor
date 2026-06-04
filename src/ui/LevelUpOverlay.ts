import type { UpgradeDef } from '../types';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/balance';

interface CardRect {
  x: number;
  y: number;
  w: number;
  h: number;
  upgrade: UpgradeDef;
}

/** 升级三选一界面 */
export class LevelUpOverlay {
  private options: UpgradeDef[] = [];
  private cards: CardRect[] = [];

  show(options: UpgradeDef[]): void {
    this.options = options;
    this.buildCards();
  }

  hide(): void {
    this.options = [];
    this.cards = [];
  }

  get isVisible(): boolean {
    return this.options.length > 0;
  }

  /** 检测点击了哪张卡片，返回对应奖励 */
  hitTest(x: number, y: number): UpgradeDef | null {
    for (const card of this.cards) {
      if (x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h) {
        return card.upgrade;
      }
    }
    return null;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isVisible) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('升级！选择奖励', GAME_WIDTH / 2, 100);

    for (const card of this.cards) {
      // 卡片背景
      const grad = ctx.createLinearGradient(card.x, card.y, card.x, card.y + card.h);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(card.x, card.y, card.w, card.h, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(card.upgrade.name, card.x + card.w / 2, card.y + 36);

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '13px sans-serif';
      ctx.fillText(card.upgrade.description, card.x + card.w / 2, card.y + 62);
    }
  }

  private buildCards(): void {
    const cardW = 100;
    const cardH = 80;
    const gap = 12;
    const totalW = this.options.length * cardW + (this.options.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2;
    const y = GAME_HEIGHT / 2 - cardH / 2;

    this.cards = this.options.map((upgrade, i) => ({
      x: startX + i * (cardW + gap),
      y,
      w: cardW,
      h: cardH,
      upgrade,
    }));
  }
}
