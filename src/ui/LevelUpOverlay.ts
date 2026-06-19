import type { UpgradeDef, UpgradePickCounts } from '../types';
import type { Player } from '../entities/Player';
import { GAME_WIDTH, GAME_HEIGHT, LEVEL_UP_SELECT_DWELL } from '../config/balance';
import { getUpgradeStatDisplay, formatUpgradeEffectSummary, wrapCanvasText, drawWrappedCenterText } from '../config/upgradeDisplay';
import { UI, drawSelectionCard, fontBody, fontDisplay } from './theme';

/** 升级选项卡片宽度（像素） */
const CARD_W = 112;
/** 升级选项卡片高度（像素） */
const CARD_H = 136;
/** 升级选项卡片之间的间距（像素） */
const CARD_GAP = 8;

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
  private pickCounts: UpgradePickCounts = {
    attackSpeed: 0,
    bulletDamage: 0,
    bulletCount: 0,
    moveSpeed: 0,
    maxHp: 0,
    droneDamage: 0,
    droneAttackSpeed: 0,
  };
  private player: Player | null = null;

  show(options: UpgradeDef[], pickCounts: UpgradePickCounts, player: Player): void {
    this.options = options;
    this.pickCounts = pickCounts;
    this.player = player;
    this.hoveredIndex = -1;
    this.dwellTimer = 0;
    this.buildCards();
  }

  hide(): void {
    this.options = [];
    this.cards = [];
    this.hoveredIndex = -1;
    this.dwellTimer = 0;
    this.player = null;
  }

  get isVisible(): boolean {
    return this.options.length > 0;
  }

  hitTest(x: number, y: number): UpgradeDef | null {
    for (const card of this.cards) {
      if (x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h) {
        return card.upgrade;
      }
    }
    return null;
  }

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

  getDwellProgress(): number {
    if (this.hoveredIndex < 0) return 0;
    return Math.min(1, this.dwellTimer / LEVEL_UP_SELECT_DWELL);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isVisible || !this.player) return;

    ctx.fillStyle = 'rgba(4, 8, 18, 0.82)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = UI.accent;
    ctx.font = fontDisplay(20, 900);
    ctx.fillText('LEVEL UP', GAME_WIDTH / 2, 68);
    ctx.fillStyle = UI.textMuted;
    ctx.font = fontBody(12);
    ctx.fillText('操控幻影飞入选项 · 停留 0.5 秒确认 · 也可点击', GAME_WIDTH / 2, 94);

    const dwellProgress = this.getDwellProgress();
    const innerPad = 8;
    const textW = CARD_W - innerPad * 2;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const isHovered = i === this.hoveredIndex;

      drawSelectionCard(ctx, card.x, card.y, card.w, card.h, isHovered, UI.magentaBright);

      const cx = card.x + card.w / 2;
      let ty = card.y + 14;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      ctx.fillStyle = UI.text;
      ctx.font = fontBody(13, true);
      const nameLines = wrapCanvasText(ctx, card.upgrade.name, textW);
      ty += drawWrappedCenterText(ctx, nameLines.slice(0, 1), cx, ty, 15) + 4;

      ctx.fillStyle = UI.magentaBright;
      ctx.font = fontDisplay(12, 700);
      const upgradeLv = this.pickCounts[card.upgrade.id];
      ctx.fillText(`LV${upgradeLv} → LV${upgradeLv + 1}`, cx, ty);
      ty += 18;

      const stat = getUpgradeStatDisplay(card.upgrade.id, this.player);
      const effectSummary = formatUpgradeEffectSummary(stat.label, card.upgrade.description);

      ctx.fillStyle = UI.warn;
      ctx.font = fontBody(11, true);
      const effectLines = wrapCanvasText(ctx, effectSummary, textW);
      ty += drawWrappedCenterText(ctx, effectLines.slice(0, 2), cx, ty, 13) + 4;

      ctx.fillStyle = UI.textDim;
      ctx.font = fontBody(10);
      const valueChange = stat.detail
        ? `${stat.before} → ${stat.after} · ${stat.detail}`
        : `${stat.before} → ${stat.after}`;
      const valueLines = wrapCanvasText(ctx, valueChange, textW);
      drawWrappedCenterText(ctx, valueLines.slice(0, 2), cx, ty, 12);

      if (isHovered && dwellProgress > 0) {
        const barW = card.w - 16;
        const barH = 5;
        const barX = card.x + 8;
        const barY = card.y + card.h - 12;
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 2);
        ctx.fill();
        ctx.fillStyle = UI.warn;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * dwellProgress, barH, 2);
        ctx.fill();
      }
    }
  }

  private buildCards(): void {
    const totalW = this.options.length * CARD_W + (this.options.length - 1) * CARD_GAP;
    const startX = (GAME_WIDTH - totalW) / 2;
    const y = 118;

    this.cards = this.options.map((upgrade, i) => ({
      x: startX + i * (CARD_W + CARD_GAP),
      y,
      w: CARD_W,
      h: CARD_H,
      upgrade,
    }));
  }
}
