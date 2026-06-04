import type { Input } from '../core/Input';
import type { Player } from '../entities/Player';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  hudBarTopY,
  mobileJoystickCenterY,
} from '../config/balance';

/** 虚拟按键区域距屏幕边缘的内边距（像素） */
const PAD = 12;
/** 护盾按钮边长（像素） */
const SHIELD_BTN_SIZE = 48;
/** 摇杆底盘半径（像素） */
const JOYSTICK_BASE_R = 52;
/** 摇杆旋钮半径（像素） */
const JOYSTICK_KNOB_R = 22;
/** 摇杆中心死区（相对底盘半径） */
const JOYSTICK_DEAD_ZONE = 0.1;

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

  /** 每帧根据指针更新虚拟摇杆 */
  updateFromPointer(input: Input): 'shield' | null {
    if (!input.pointerDown || !input.pointer) {
      this.resetJoystick();
      input.setJoystickCaptured(false);
      input.clearJoystick();
      return null;
    }

    const { x, y } = input.pointer;

    if (this.hitShield(x, y)) {
      this.resetJoystick();
      input.setJoystickCaptured(false);
      input.clearJoystick();
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

    this.resetJoystick();
    input.setJoystickCaptured(false);
    input.clearJoystick();
    return null;
  }

  hitShield(x: number, y: number): boolean {
    const b = this.shieldBtn;
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }

  draw(ctx: CanvasRenderingContext2D, player: Player): void {
    this.drawJoystick(ctx);
    this.drawShieldButton(ctx, player);
  }

  private drawJoystick(ctx: CanvasRenderingContext2D): void {
    const cx = this.anchorX;
    const cy = this.anchorY;

    ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, JOYSTICK_BASE_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * (JOYSTICK_BASE_R - 8), cy + Math.sin(a) * (JOYSTICK_BASE_R - 8));
      ctx.stroke();
    }

    const knobX = cx + this.knobOffsetX;
    const knobY = cy + this.knobOffsetY;
    ctx.fillStyle = 'rgba(96, 165, 250, 0.9)';
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(knobX, knobY, JOYSTICK_KNOB_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  private drawShieldButton(ctx: CanvasRenderingContext2D, player: Player): void {
    const barTop = hudBarTopY();
    const bw = SHIELD_BTN_SIZE;
    const bh = SHIELD_BTN_SIZE;
    const bx = GAME_WIDTH - PAD - bw;
    const by = barTop - bh - 28;
    this.shieldBtn = { x: bx, y: by, w: bw, h: bh };

    const ready = player.shieldCooldownTimer <= 0 && !player.isShieldActive;
    const active = player.isShieldActive;

    ctx.fillStyle = active
      ? 'rgba(96, 165, 250, 0.85)'
      : ready
        ? 'rgba(30, 41, 59, 0.85)'
        : 'rgba(30, 41, 59, 0.55)';
    ctx.strokeStyle = active ? '#93c5fd' : ready ? '#60a5fa' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    ctx.stroke();

    if (!ready && !active && player.shieldCooldownTimer > 0) {
      const ratio = player.shieldCooldownRatio;
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bx + bw / 2, by + bh / 2, bw / 2 - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      ctx.stroke();
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('护盾', bx + bw / 2, by + bh / 2 - 6);
    if (active) {
      ctx.font = '10px sans-serif';
      ctx.fillText('生效中', bx + bw / 2, by + bh / 2 + 8);
    } else if (!ready) {
      ctx.font = '10px sans-serif';
      ctx.fillText(`${Math.ceil(player.shieldCooldownTimer)}s`, bx + bw / 2, by + bh / 2 + 8);
    } else {
      ctx.font = '10px sans-serif';
      ctx.fillText('就绪', bx + bw / 2, by + bh / 2 + 8);
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
