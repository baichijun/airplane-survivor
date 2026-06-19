import type { Input } from '../core/Input';
import type { Player } from '../entities/Player';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  hudBarTopY,
  mobileJoystickCenterY,
} from '../config/balance';
import { UI, drawGlowCircle, drawShieldIcon, fontDisplay } from './theme';

/** 虚拟按键区域距屏幕边缘的内边距（像素） */
const PAD = 14;
/** 护盾按钮边长（像素） */
const SHIELD_BTN_SIZE = 58;
/** 摇杆底盘半径（像素） */
const JOYSTICK_BASE_R = 54;
/** 摇杆旋钮半径（像素） */
const JOYSTICK_KNOB_R = 23;
/** 摇杆中心死区（相对底盘半径） */
const JOYSTICK_DEAD_ZONE = 0.1;

/** 摇杆与自机重叠时额外判定半径（像素） */
const JOYSTICK_PLAYER_FADE_EXTRA_R = 20;

/** 移动端虚拟摇杆 + 护盾按钮（浮动摇杆：在左下区域按下时底盘跟随拇指） */
export class MobileControls {
  private readonly defaultCenterX = PAD + JOYSTICK_BASE_R;
  private readonly defaultCenterY = mobileJoystickCenterY(JOYSTICK_BASE_R);

  private anchorX = this.defaultCenterX;
  private anchorY = this.defaultCenterY;
  private joystickDragging = false;
  private shieldBtn = { x: 0, y: 0, w: SHIELD_BTN_SIZE, h: SHIELD_BTN_SIZE };
  private knobOffsetX = 0;
  private knobOffsetY = 0;

  /** 重置摇杆锚点与拖拽状态（场景切换时调用，避免残留输入） */
  resetJoystick(): void {
    this.joystickDragging = false;
    this.anchorX = this.defaultCenterX;
    this.anchorY = this.defaultCenterY;
    this.knobOffsetX = 0;
    this.knobOffsetY = 0;
  }

  /**
   * 键盘控制时同步摇杆旋钮视觉（触屏拖拽中不覆盖）。
   * 优先取自机实际位移方向；未移动时回退为键盘方向。
   */
  syncKnobVisual(
    input: Input,
    entityX: number,
    entityY: number,
    prevX: number,
    prevY: number,
    dt: number,
  ): void {
    if (this.joystickDragging) return;

    const maxR = JOYSTICK_BASE_R - JOYSTICK_KNOB_R;
    let targetX = 0;
    let targetY = 0;

    const kb = input.getKeyboardDirection();
    if (kb.x !== 0 || kb.y !== 0) {
      const dx = entityX - prevX;
      const dy = entityY - prevY;
      const moved = Math.hypot(dx, dy);
      if (moved > 0.3) {
        targetX = (dx / moved) * maxR;
        targetY = (dy / moved) * maxR;
      } else {
        targetX = kb.x * maxR;
        targetY = kb.y * maxR;
      }
    }

    const lerpT = Math.min(1, dt * 18);
    this.knobOffsetX += (targetX - this.knobOffsetX) * lerpT;
    this.knobOffsetY += (targetY - this.knobOffsetY) * lerpT;

    if (targetX === 0 && targetY === 0 && Math.hypot(this.knobOffsetX, this.knobOffsetY) < 0.5) {
      this.knobOffsetX = 0;
      this.knobOffsetY = 0;
    }
  }

  /** 每帧根据指针更新虚拟摇杆 */
  updateFromPointer(input: Input): 'shield' | null {
    this.layoutShieldButton();

    if (!input.pointerDown || !input.pointer) {
      this.releasePointerJoystick(input);
      return null;
    }

    const { x, y } = input.pointer;

    if (this.hitShield(x, y)) {
      this.releasePointerJoystick(input);
      return 'shield';
    }

    if (this.hitJoystickZone(x, y) || this.joystickDragging) {
      if (!this.joystickDragging) {
        this.anchorX = this.clampAnchorX(x);
        this.anchorY = this.clampAnchorY(y);
      }
      this.joystickDragging = true;
      input.setJoystickCaptured(true);
      input.setJoystick(...this.computeJoystickOffset(x, y));
      return null;
    }

    this.releasePointerJoystick(input);
    return null;
  }

  private releasePointerJoystick(input: Input): void {
    if (this.joystickDragging) {
      this.joystickDragging = false;
      this.anchorX = this.defaultCenterX;
      this.anchorY = this.defaultCenterY;
    }
    input.setJoystickCaptured(false);
    input.clearJoystick();
  }

  hitShield(x: number, y: number): boolean {
    const b = this.shieldBtn;
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }

  draw(ctx: CanvasRenderingContext2D, player: Player): void {
    this.layoutShieldButton();

    const fadeJoystick = this.isPlayerNearJoystick(player);
    ctx.save();
    if (fadeJoystick) ctx.globalAlpha = 0.2;
    this.drawJoystick(ctx);
    ctx.restore();

    const fadeShield = this.isPlayerNearShield(player);
    ctx.save();
    if (fadeShield) ctx.globalAlpha = 0.2;
    this.drawShieldButton(ctx, player);
    ctx.restore();
  }

  private isPlayerNearShield(player: Player): boolean {
    const b = this.shieldBtn;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const radius = b.w / 2 + JOYSTICK_PLAYER_FADE_EXTRA_R + player.hitRadius;
    return (player.x - cx) ** 2 + (player.y - cy) ** 2 <= radius * radius;
  }

  private isPlayerNearJoystick(player: Player): boolean {
    const cx = this.anchorX;
    const cy = this.anchorY;
    const radius = JOYSTICK_BASE_R + JOYSTICK_PLAYER_FADE_EXTRA_R + player.hitRadius;
    return (player.x - cx) ** 2 + (player.y - cy) ** 2 <= radius * radius;
  }

  private drawJoystick(ctx: CanvasRenderingContext2D): void {
    const cx = this.anchorX;
    const cy = this.anchorY;
    const knobActive = this.knobOffsetX !== 0 || this.knobOffsetY !== 0;
    const pulse = knobActive ? 0.85 + Math.sin(performance.now() * 0.012) * 0.15 : 1;

    // 外圈光晕
    drawGlowCircle(ctx, cx, cy, JOYSTICK_BASE_R + 4, UI.accentDim, knobActive ? 18 : 10);

    // 底盘
    const baseGrad = ctx.createRadialGradient(cx, cy, JOYSTICK_BASE_R * 0.2, cx, cy, JOYSTICK_BASE_R);
    baseGrad.addColorStop(0, 'rgba(18, 36, 68, 0.92)');
    baseGrad.addColorStop(1, 'rgba(6, 12, 28, 0.88)');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, JOYSTICK_BASE_R, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = UI.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, JOYSTICK_BASE_R, 0, Math.PI * 2);
    ctx.stroke();

    // 内圈刻度
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, JOYSTICK_BASE_R - 14, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i;
      const inner = JOYSTICK_BASE_R - 22;
      const outer = JOYSTICK_BASE_R - 10;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(34, 211, 238, 0.35)' : 'rgba(34, 211, 238, 0.15)';
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      ctx.stroke();
    }

    const knobX = cx + this.knobOffsetX;
    const knobY = cy + this.knobOffsetY;

    if (knobActive) {
      drawGlowCircle(ctx, knobX, knobY, JOYSTICK_KNOB_R + 2, UI.accentGlow, 14 * pulse);
    }

    const knobGrad = ctx.createRadialGradient(
      knobX - 4,
      knobY - 4,
      2,
      knobX,
      knobY,
      JOYSTICK_KNOB_R,
    );
    knobGrad.addColorStop(0, UI.accentBright);
    knobGrad.addColorStop(0.55, UI.accent);
    knobGrad.addColorStop(1, '#0891b2');
    ctx.fillStyle = knobGrad;
    ctx.beginPath();
    ctx.arc(knobX, knobY, JOYSTICK_KNOB_R, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(knobX, knobY, JOYSTICK_KNOB_R, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(knobX - 5, knobY - 5, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private layoutShieldButton(): void {
    const barTop = hudBarTopY();
    const bw = SHIELD_BTN_SIZE;
    const bh = SHIELD_BTN_SIZE;
    const bx = GAME_WIDTH - PAD - bw;
    const by = barTop - bh - 30;
    this.shieldBtn = { x: bx, y: by, w: bw, h: bh };
  }

  private drawShieldButton(ctx: CanvasRenderingContext2D, player: Player): void {
    const { x: bx, y: by, w: bw, h: bh } = this.shieldBtn;

    const ready = player.shieldCooldownTimer <= 0 && !player.isShieldActive;
    const active = player.isShieldActive;
    const cx = bx + bw / 2;
    const cy = by + bh / 2;

    if (ready || active) {
      const glowColor = active ? UI.accentBright : UI.accentGlow;
      drawGlowCircle(ctx, cx, cy, bw / 2 + 2, glowColor, active ? 20 : 12);
    }

    const bgGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
    if (active) {
      bgGrad.addColorStop(0, 'rgba(34, 211, 238, 0.95)');
      bgGrad.addColorStop(1, 'rgba(8, 145, 178, 0.9)');
    } else if (ready) {
      bgGrad.addColorStop(0, 'rgba(14, 32, 58, 0.95)');
      bgGrad.addColorStop(1, 'rgba(6, 16, 36, 0.95)');
    } else {
      bgGrad.addColorStop(0, 'rgba(14, 24, 42, 0.75)');
      bgGrad.addColorStop(1, 'rgba(6, 12, 24, 0.8)');
    }
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 12);
    ctx.fill();

    ctx.strokeStyle = active ? '#fff' : ready ? UI.accent : UI.borderMuted;
    ctx.lineWidth = active ? 2.5 : ready ? 2 : 1.5;
    ctx.beginPath();
    ctx.roundRect(bx + 0.5, by + 0.5, bw - 1, bh - 1, 12);
    ctx.stroke();

    // 冷却环形进度
    if (!ready && !active && player.shieldCooldownTimer > 0) {
      const ratio = player.shieldCooldownRatio;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, bw / 2 - 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = UI.accent;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, bw / 2 - 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      ctx.stroke();
      ctx.lineCap = 'butt';
    }

    const iconFill = active ? '#fff' : ready ? UI.accentBright : 'rgba(148, 163, 184, 0.7)';
    const iconStroke = active ? 'rgba(6, 78, 99, 0.8)' : ready ? UI.accent : 'rgba(100, 116, 139, 0.5)';
    drawShieldIcon(ctx, cx, cy - 2, 26, iconFill, iconStroke);

    // 状态文字在按钮下方
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    if (active) {
      ctx.fillStyle = UI.accentBright;
      ctx.font = fontDisplay(10, 700);
      ctx.fillText('ACTIVE', cx, by + bh + 4);
    } else if (!ready) {
      ctx.fillStyle = UI.textMuted;
      ctx.font = fontDisplay(11, 700);
      ctx.fillText(`${Math.ceil(player.shieldCooldownTimer)}s`, cx, by + bh + 3);
    }
  }

  /** 左下操控区：首次按下时在此区域内生成浮动摇杆 */
  private hitJoystickZone(x: number, y: number): boolean {
    const zoneTop = GAME_HEIGHT * 0.28;
    const zoneRight = GAME_WIDTH * 0.52;
    return x <= zoneRight && y >= zoneTop;
  }

  private clampAnchorX(x: number): number {
    const min = PAD + JOYSTICK_BASE_R;
    const max = GAME_WIDTH * 0.52 - JOYSTICK_BASE_R;
    return Math.max(min, Math.min(max, x));
  }

  private clampAnchorY(y: number): number {
    const min = GAME_HEIGHT * 0.28 + JOYSTICK_BASE_R;
    const max = hudBarTopY() - JOYSTICK_BASE_R - 8;
    return Math.max(min, Math.min(max, y));
  }

  private computeJoystickOffset(x: number, y: number): [number, number] {
    const cx = this.anchorX;
    const cy = this.anchorY;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.hypot(dx, dy);
    const maxR = JOYSTICK_BASE_R - JOYSTICK_KNOB_R;

    if (dist < JOYSTICK_DEAD_ZONE * JOYSTICK_BASE_R) {
      this.knobOffsetX = 0;
      this.knobOffsetY = 0;
      return [0, 0];
    }

    const clamped = Math.min(dist, maxR);
    const nx = dx / dist;
    const ny = dy / dist;
    this.knobOffsetX = nx * clamped;
    this.knobOffsetY = ny * clamped;
    return [this.knobOffsetX / maxR, this.knobOffsetY / maxR];
  }
}
