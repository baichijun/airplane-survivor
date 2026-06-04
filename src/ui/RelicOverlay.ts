import type { RelicRewardOption } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, LEVEL_UP_SELECT_DWELL } from '../config/balance';
import { wrapCanvasText, drawWrappedCenterText } from '../config/upgradeDisplay';

/** 宝物选项卡片宽度（像素） */
const CARD_W = 112;
/** 宝物选项卡片高度（像素） */
const CARD_H = 136;
/** 宝物选项卡片之间的间距（像素） */
const CARD_GAP = 8;

interface RelicCardRect {
  x: number;
  y: number;
  w: number;
  h: number;
  option: RelicRewardOption;
}

/** Boss 击杀后的宝物选择界面 */
export class RelicOverlay {
  private options: RelicRewardOption[] = [];
  private cards: RelicCardRect[] = [];
  private hoveredIndex = -1;
  private dwellTimer = 0;

  show(options: RelicRewardOption[]): void {
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

  hitTest(x: number, y: number): RelicRewardOption | null {
    for (const card of this.cards) {
      if (x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h) {
        return card.option;
      }
    }
    return null;
  }

  updateSelection(playerX: number, playerY: number, dt: number): RelicRewardOption | null {
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
        return this.cards[insideIndex].option;
      }
    } else {
      this.hoveredIndex = insideIndex;
      this.dwellTimer = 0;
    }
    return null;
  }

  getDwellProgress(): number {
    if (this.hoveredIndex < 0) return 0;
    return Math.min(1, this.dwellTimer / LEVEL_UP_SELECT_DWELL);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isVisible) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('Boss 击破！选择宝物', GAME_WIDTH / 2, 72);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '12px sans-serif';
    ctx.fillText('操控幻影飞入或点击 · 本体保持原位', GAME_WIDTH / 2, 96);

    const dwellProgress = this.getDwellProgress();
    const innerPad = 8;
    const textW = CARD_W - innerPad * 2;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const isHovered = i === this.hoveredIndex;
      const isSkip = card.option.kind === 'skip';

      const grad = ctx.createLinearGradient(card.x, card.y, card.x, card.y + card.h);
      grad.addColorStop(0, isHovered ? (isSkip ? '#713f12' : '#312e81') : '#1e293b');
      grad.addColorStop(1, isHovered ? (isSkip ? '#451a03' : '#1e1b4b') : '#0f172a');
      ctx.fillStyle = grad;
      ctx.strokeStyle = isHovered ? '#fbbf24' : isSkip ? '#f97316' : '#a855f7';
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.beginPath();
      ctx.roundRect(card.x, card.y, card.w, card.h, 8);
      ctx.fill();
      ctx.stroke();

      const cx = card.x + card.w / 2;
      let ty = card.y + 16;

      if (card.option.kind === 'relic') {
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(card.option.relic.icon, cx, ty);
        ty += 28;

        ctx.font = 'bold 13px sans-serif';
        const nameLines = wrapCanvasText(ctx, card.option.relic.name, textW);
        ty += drawWrappedCenterText(ctx, nameLines, cx, ty, 15) + 4;

        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px sans-serif';
        const descLines = wrapCanvasText(ctx, card.option.relic.description, textW);
        drawWrappedCenterText(ctx, descLines.slice(0, 4), cx, ty, 12);
      } else {
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#f97316';
        ctx.fillText('✚', cx, ty);
        ty += 28;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px sans-serif';
        const nameLines = wrapCanvasText(ctx, card.option.name, textW);
        ty += drawWrappedCenterText(ctx, nameLines, cx, ty, 15) + 4;

        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px sans-serif';
        const descLines = wrapCanvasText(ctx, card.option.description, textW);
        drawWrappedCenterText(ctx, descLines.slice(0, 4), cx, ty, 12);
      }

      if (isHovered && dwellProgress > 0) {
        const barW = card.w - 16;
        const barH = 5;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(card.x + 8, card.y + card.h - 12, barW, barH);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(card.x + 8, card.y + card.h - 12, barW * dwellProgress, barH);
      }
    }
  }

  private buildCards(): void {
    const totalW = this.options.length * CARD_W + (this.options.length - 1) * CARD_GAP;
    const startX = (GAME_WIDTH - totalW) / 2;
    const y = 118;

    this.cards = this.options.map((option, i) => ({
      x: startX + i * (CARD_W + CARD_GAP),
      y,
      w: CARD_W,
      h: CARD_H,
      option,
    }));
  }
}
