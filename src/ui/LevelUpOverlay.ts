import type { UpgradeDef } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, LEVEL_UP_SELECT_DWELL } from '../config/balance';

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
  private hoveredIndex = -1;
  private dwellTimer = 0;

  show(options: UpgradeDef[]): void {
    this.options = options;
    this.hoveredIndex = -1;
    this.dwellTimer = 0;
    this.buildCards();
  }

  hide(): void {
    this.options = [];
    this.cards = [];
    this.hoveredIndex = -1;
    this.dwellTimer = 0;
  }

  get isVisible(): boolean {
    return this.options.length > 0;
  }

  /** 检测点击了哪张卡片，返回对应奖励（备用方式） */
  hitTest(x: number, y: number): UpgradeDef | null {
    for (const card of this.cards) {
      if (x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h) {
        return card.upgrade;
      }
    }
    return null;
  }

  /** 检测玩家飞入选项框，停留足够时间后返回奖励 */
  updateSelection(playerX: number, playerY: number, dt: number): UpgradeDef | null {
    if (!this.isVisible) return null;

    let insideIndex = -1;
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      if (
        playerX >= card.x &&
        playerX <= card.x + card.w &&
        playerY >= card.y &&
        playerY <= card.y + card.h
      ) {
        insideIndex = i;
        break;
      }
    }

    if (insideIndex === this.hoveredIndex && insideIndex >= 0) {
      this.dwellTimer += dt;
      if (this.dwellTimer >= LEVEL_UP_SELECT_DWELL) {
        return this.cards[insideIndex].upgrade;
      }
    } else {
      this.hoveredIndex = insideIndex;
      this.dwellTimer = 0;
    }

    return null;
  }

  /** 当前停留进度 0~1，用于绘制进度条 */
  getDwellProgress(): number {
    if (this.hoveredIndex < 0) return 0;
    return Math.min(1, this.dwellTimer / LEVEL_UP_SELECT_DWELL);
  }

  get hoveredCardIndex(): number {
    return this.hoveredIndex;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isVisible) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('升级！飞入选项框选择奖励', GAME_WIDTH / 2, 80);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '13px sans-serif';
    ctx.fillText('在框内停留 0.5 秒确认 · 也可点击选择', GAME_WIDTH / 2, 108);

    const dwellProgress = this.getDwellProgress();

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const isHovered = i === this.hoveredIndex;

      // 卡片背景
      const grad = ctx.createLinearGradient(card.x, card.y, card.x, card.y + card.h);
      grad.addColorStop(0, isHovered ? '#312e81' : '#1e293b');
      grad.addColorStop(1, isHovered ? '#1e1b4b' : '#0f172a');
      ctx.fillStyle = grad;
      ctx.strokeStyle = isHovered ? '#fbbf24' : '#a855f7';
      ctx.lineWidth = isHovered ? 3 : 2;
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

      // 停留进度条
      if (isHovered && dwellProgress > 0) {
        const barW = card.w - 16;
        const barH = 6;
        const barX = card.x + 8;
        const barY = card.y + card.h - 16;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(barX, barY, barW * dwellProgress, barH);
      }
    }
  }

  private buildCards(): void {
    const cardW = 110;
    const cardH = 100;
    const gap = 12;
    const totalW = this.options.length * cardW + (this.options.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2;
    const y = 140;

    this.cards = this.options.map((upgrade, i) => ({
      x: startX + i * (cardW + gap),
      y,
      w: cardW,
      h: cardH,
      upgrade,
    }));
  }
}
