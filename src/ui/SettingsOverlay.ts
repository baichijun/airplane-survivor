import { GAME_WIDTH, GAME_HEIGHT, OVERLAY_TITLE_Y } from '../config/balance';
import {
  BULLET_OPACITY_MAX,
  BULLET_OPACITY_MIN,
  gameSettings,
} from '../config/settings';
import { UI, fontBody, fontDisplay } from './theme';

const PAD = 14;
const BTN_SIZE = 40;
const PANEL_W = 300;
const PANEL_H = 280;
const CLOSE_BTN_SIZE = 32;

type Rect = { x: number; y: number; w: number; h: number };
type SettingsButtonPlacement = 'menu' | 'inGame';

interface SliderLayout {
  label: string;
  track: Rect;
  getValue: () => number;
  setValue: (t: number) => void;
}

/** 设置按钮 + 设置面板（主菜单 / 升级 / 宝物界面） */
export class SettingsOverlay {
  private panelOpen = false;
  private settingsBtn: Rect = { x: 0, y: 0, w: BTN_SIZE, h: BTN_SIZE };
  private closeBtn: Rect = { x: 0, y: 0, w: CLOSE_BTN_SIZE, h: CLOSE_BTN_SIZE };
  private autoCheckRect: Rect = { x: 0, y: 0, w: 22, h: 22 };
  private enemySlider!: SliderLayout;
  private playerSlider!: SliderLayout;
  private draggingSlider: 'enemy' | 'player' | null = null;
  /** 主菜单右上角；游戏内对齐「LEVEL UP / 击败 BOSS」标题行右侧 */
  private buttonPlacement: SettingsButtonPlacement = 'menu';

  get isOpen(): boolean {
    return this.panelOpen;
  }

  open(): void {
    this.panelOpen = true;
    this.draggingSlider = null;
  }

  close(): void {
    this.panelOpen = false;
    this.draggingSlider = null;
  }

  setButtonPlacement(placement: SettingsButtonPlacement): void {
    this.buttonPlacement = placement;
  }

  hitSettingsButton(x: number, y: number): boolean {
    if (this.panelOpen) return false;
    this.layoutSettingsButton();
    return this.hitRect(x, y, this.settingsBtn);
  }

  /** 指针按下：打开/关闭、滑条、勾选框 */
  handlePointerDown(x: number, y: number): boolean {
    if (!this.panelOpen) return false;

    if (this.hitRect(x, y, this.closeBtn)) {
      this.close();
      return true;
    }

    if (this.hitRect(x, y, this.autoCheckRect)) {
      gameSettings.autoBulletOpacity = !gameSettings.autoBulletOpacity;
      return true;
    }

    if (!gameSettings.autoBulletOpacity) {
      if (this.hitRect(x, y, this.enemySlider.track)) {
        this.draggingSlider = 'enemy';
        this.applySlider(this.enemySlider, x);
        return true;
      }
      if (this.hitRect(x, y, this.playerSlider.track)) {
        this.draggingSlider = 'player';
        this.applySlider(this.playerSlider, x);
        return true;
      }
    }

    return true;
  }

  handlePointerMove(x: number, _y: number): void {
    if (!this.panelOpen || !this.draggingSlider || gameSettings.autoBulletOpacity) return;
    const slider = this.draggingSlider === 'enemy' ? this.enemySlider : this.playerSlider;
    this.applySlider(slider, x);
  }

  handlePointerUp(): void {
    this.draggingSlider = null;
  }

  draw(ctx: CanvasRenderingContext2D, activeBulletCount: number, showButton: boolean): void {
    if (showButton) {
      this.layoutSettingsButton();
      this.drawSettingsButton(ctx);
    }

    if (!this.panelOpen) return;

    this.layoutPanel();
    this.drawPanel(ctx, activeBulletCount);
  }

  private layoutSettingsButton(): void {
    const x = GAME_WIDTH - PAD - BTN_SIZE;
    if (this.buttonPlacement === 'inGame') {
      // 与居中标题同一行，靠右放置，不挤占标题居中布局
      const y = OVERLAY_TITLE_Y - BTN_SIZE + 6;
      this.settingsBtn = { x, y, w: BTN_SIZE, h: BTN_SIZE };
      return;
    }

    this.settingsBtn = { x, y: PAD, w: BTN_SIZE, h: BTN_SIZE };
  }

  private layoutPanel(): void {
    const px = (GAME_WIDTH - PANEL_W) / 2;
    const py = (GAME_HEIGHT - PANEL_H) / 2;
    const trackX = px + 24;
    const trackW = PANEL_W - 48;
    const trackH = 12;

    this.closeBtn = {
      x: px + PANEL_W - CLOSE_BTN_SIZE - 14,
      y: py + 14,
      w: CLOSE_BTN_SIZE,
      h: CLOSE_BTN_SIZE,
    };
    this.autoCheckRect = { x: px + 24, y: py + 196, w: 22, h: 22 };

    this.enemySlider = {
      label: '敌机子弹透明度',
      track: { x: trackX, y: py + 88, w: trackW, h: trackH },
      getValue: () => gameSettings.enemyBulletOpacity,
      setValue: (t) => gameSettings.setEnemyOpacity(gameSettings.opacityFromSliderT(t)),
    };
    this.playerSlider = {
      label: '自机子弹透明度',
      track: { x: trackX, y: py + 148, w: trackW, h: trackH },
      getValue: () => gameSettings.playerBulletOpacity,
      setValue: (t) => gameSettings.setPlayerOpacity(gameSettings.opacityFromSliderT(t)),
    };
  }

  private drawSettingsButton(ctx: CanvasRenderingContext2D): void {
    const b = this.settingsBtn;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;

    ctx.fillStyle = UI.panel;
    ctx.strokeStyle = UI.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, 10);
    ctx.fill();
    ctx.stroke();

    this.drawGearIcon(ctx, cx, cy, 11, UI.accentBright);
  }

  /** 齿轮图标 */
  private drawGearIcon(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    outerR: number,
    color: string,
  ): void {
    const teeth = 8;
    const innerR = outerR * 0.68;
    const holeR = outerR * 0.34;

    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a0 = (Math.PI * 2 * i) / teeth;
      const a1 = (Math.PI * 2 * (i + 0.38)) / teeth;
      const a2 = (Math.PI * 2 * (i + 0.62)) / teeth;
      const a3 = (Math.PI * 2 * (i + 1)) / teeth;

      const x0 = cx + Math.cos(a0) * innerR;
      const y0 = cy + Math.sin(a0) * innerR;
      const x1 = cx + Math.cos(a1) * outerR;
      const y1 = cy + Math.sin(a1) * outerR;
      const x2 = cx + Math.cos(a2) * outerR;
      const y2 = cy + Math.sin(a2) * outerR;
      const x3 = cx + Math.cos(a3) * innerR;
      const y3 = cy + Math.sin(a3) * innerR;

      if (i === 0) ctx.moveTo(x0, y0);
      else ctx.lineTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
    }
    ctx.closePath();
    ctx.arc(cx, cy, holeR, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
  }

  private drawCloseIcon(ctx: CanvasRenderingContext2D): void {
    const r = this.closeBtn;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const half = 7;

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - half, cy - half);
    ctx.lineTo(cx + half, cy + half);
    ctx.moveTo(cx + half, cy - half);
    ctx.lineTo(cx - half, cy + half);
    ctx.stroke();
  }

  private drawPanel(ctx: CanvasRenderingContext2D, activeBulletCount: number): void {
    ctx.fillStyle = 'rgba(4, 8, 18, 0.72)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const px = (GAME_WIDTH - PANEL_W) / 2;
    const py = (GAME_HEIGHT - PANEL_H) / 2;

    ctx.fillStyle = UI.panelLight;
    ctx.strokeStyle = UI.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(px, py, PANEL_W, PANEL_H, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = UI.text;
    ctx.font = fontDisplay(16, 700);
    ctx.fillText('设置', px + 24, py + 38);

    this.drawCloseIcon(ctx);

    const autoOpacity = gameSettings.getAutoOpacity(activeBulletCount);
    this.drawSliderRow(
      ctx,
      this.enemySlider,
      gameSettings.autoBulletOpacity ? autoOpacity : gameSettings.enemyBulletOpacity,
      gameSettings.autoBulletOpacity,
    );
    this.drawSliderRow(
      ctx,
      this.playerSlider,
      gameSettings.autoBulletOpacity ? autoOpacity : gameSettings.playerBulletOpacity,
      gameSettings.autoBulletOpacity,
    );

    this.drawAutoCheckbox(ctx);
  }

  private drawSliderRow(
    ctx: CanvasRenderingContext2D,
    slider: SliderLayout,
    displayOpacity: number,
    disabled: boolean,
  ): void {
    const track = slider.track;
    const pct = Math.round(displayOpacity * 100);

    ctx.textAlign = 'left';
    ctx.fillStyle = disabled ? UI.textDim : UI.textMuted;
    ctx.font = fontBody(12, true);
    ctx.fillText(slider.label, track.x, track.y - 10);

    ctx.textAlign = 'right';
    ctx.fillStyle = disabled ? UI.textDim : UI.accentBright;
    ctx.font = fontDisplay(12, 700);
    ctx.fillText(`${pct}%`, track.x + track.w, track.y - 10);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(track.x, track.y, track.w, track.h, 6);
    ctx.fill();

    const t = (displayOpacity - BULLET_OPACITY_MIN) / (BULLET_OPACITY_MAX - BULLET_OPACITY_MIN);
    const fillW = track.w * t;
    if (fillW > 0) {
      const grad = ctx.createLinearGradient(track.x, track.y, track.x + track.w, track.y);
      grad.addColorStop(0, disabled ? UI.textDim : UI.accent);
      grad.addColorStop(1, disabled ? UI.textDim : UI.accentBright);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(track.x, track.y, fillW, track.h, 6);
      ctx.fill();
    }

    const knobX = track.x + fillW;
    const knobY = track.y + track.h / 2;
    ctx.fillStyle = disabled ? UI.textDim : '#fff';
    ctx.beginPath();
    ctx.arc(knobX, knobY, disabled ? 7 : 8, 0, Math.PI * 2);
    ctx.fill();
    if (!disabled) {
      ctx.strokeStyle = UI.accent;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  private drawAutoCheckbox(ctx: CanvasRenderingContext2D): void {
    const r = this.autoCheckRect;
    ctx.strokeStyle = gameSettings.autoBulletOpacity ? UI.accent : UI.borderMuted;
    ctx.lineWidth = 2;
    ctx.fillStyle = gameSettings.autoBulletOpacity ? 'rgba(34, 211, 238, 0.25)' : 'rgba(15, 23, 42, 0.6)';
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, 5);
    ctx.fill();
    ctx.stroke();

    if (gameSettings.autoBulletOpacity) {
      ctx.strokeStyle = UI.accentBright;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(r.x + 5, r.y + 11);
      ctx.lineTo(r.x + 9, r.y + 15);
      ctx.lineTo(r.x + 17, r.y + 7);
      ctx.stroke();
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = UI.text;
    ctx.font = fontBody(13, true);
    ctx.fillText('自动透明度', r.x + 30, r.y + 16);
    ctx.fillStyle = UI.textDim;
    ctx.font = fontBody(10);
    ctx.fillText('屏上子弹每 +20，透明度 -10%（最低 30%）', r.x + 30, r.y + 32);
  }

  private applySlider(slider: SliderLayout, x: number): void {
    const track = slider.track;
    const t = Math.max(0, Math.min(1, (x - track.x) / track.w));
    slider.setValue(t);
  }

  private hitRect(x: number, y: number, rect: Rect): boolean {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }
}
