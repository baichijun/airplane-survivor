import type { UpgradeDef, UpgradePickCounts } from '../types';
import type { Player } from '../entities/Player';
import { GAME_WIDTH, GAME_HEIGHT, LEVEL_UP_SELECT_DWELL } from '../config/balance';
import { getUpgradeStatDisplay, formatUpgradeEffectSummary, wrapCanvasText, drawWrappedCenterText } from '../config/upgradeDisplay';

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

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('升级！操控幻影飞入选项', GAME_WIDTH / 2, 72);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '12px sans-serif';
    ctx.fillText('停留 0.5 秒确认 · 也可点击 · 本体保持原位', GAME_WIDTH / 2, 96);

    const dwellProgress = this.getDwellProgress();
    const innerPad = 8;
    const textW = CARD_W - innerPad * 2;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const isHovered = i === this.hoveredIndex;

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

      const cx = card.x + card.w / 2;
      let ty = card.y + 14;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // 第一行：强化名称
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px sans-serif';
      const nameLines = wrapCanvasText(ctx, card.upgrade.name, textW);
      ty += drawWrappedCenterText(ctx, nameLines.slice(0, 1), cx, ty, 15) + 4;

      // 第二行：等级
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 12px sans-serif';
      const upgradeLv = this.pickCounts[card.upgrade.id];
      ctx.fillText(`LV${upgradeLv} → LV${upgradeLv + 1}`, cx, ty);
      ty += 18;

      const stat = getUpgradeStatDisplay(card.upgrade.id, this.player);
      const effectSummary = formatUpgradeEffectSummary(stat.label, card.upgrade.description);

      // 第三行：属性 + 效果描述（原灰色两行合并，黄色粗体）
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px sans-serif';
      const effectLines = wrapCanvasText(ctx, effectSummary, textW);
      ty += drawWrappedCenterText(ctx, effectLines.slice(0, 2), cx, ty, 13) + 4;

      // 第四行：实际数值变化（原黄色，改为灰色）
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '10px sans-serif';
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
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(barX, barY, barW * dwellProgress, barH);
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
