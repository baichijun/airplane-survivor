import type { Engine } from './Engine';
import { JOYSTICK_DIAGONAL_SPEED_MULT } from '../config/balance';

/** 键盘 + 触摸输入 */
export class Input {
  private keys = new Set<string>();
  touchTarget: { x: number; y: number } | null = null;
  /** 最近一次点击/触摸（游戏坐标） */
  pointer: { x: number; y: number } | null = null;
  pointerDown = false;
  /** 虚拟摇杆归一化偏移（-1～1），由 MobileControls 每帧写入 */
  private joystick = { x: 0, y: 0 };
  private shieldRequested = false;

  constructor(engine: Engine) {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      this.keys.add(key);
      if (key === ' ' && !e.repeat) {
        this.shieldRequested = true;
      }
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd'].includes(key)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));

    const canvas = engine.canvas;
    canvas.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        const t = e.touches[0];
        if (!t) return;
        const pos = engine.screenToGame(t.clientX, t.clientY);
        this.pointer = pos;
        this.pointerDown = true;
      },
      { passive: false },
    );
    canvas.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        const t = e.touches[0];
        if (!t) return;
        const pos = engine.screenToGame(t.clientX, t.clientY);
        this.pointer = pos;
      },
      { passive: false },
    );
    canvas.addEventListener('touchend', () => {
      this.touchTarget = null;
      this.pointerDown = false;
      this.pointer = null;
      this.clearJoystick();
    });

    canvas.addEventListener('mousedown', (e) => {
      const pos = engine.screenToGame(e.clientX, e.clientY);
      this.pointer = pos;
      this.pointerDown = true;
    });
    canvas.addEventListener('mousemove', (e) => {
      if (this.pointerDown) {
        this.pointer = engine.screenToGame(e.clientX, e.clientY);
      }
    });
    window.addEventListener('mouseup', () => {
      this.pointerDown = false;
      this.pointer = null;
      this.clearJoystick();
    });
  }

  isDown(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  /** WASD / 方向键移动方向（斜向为等速归一化） */
  getKeyboardDirection(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (this.isDown('w') || this.isDown('arrowup')) y -= 1;
    if (this.isDown('s') || this.isDown('arrowdown')) y += 1;
    if (this.isDown('a') || this.isDown('arrowleft')) x -= 1;
    if (this.isDown('d') || this.isDown('arrowright')) x += 1;
    const len = Math.hypot(x, y);
    if (len > 0) return { x: x / len, y: y / len };
    return { x: 0, y: 0 };
  }

  /**
   * 虚拟摇杆：吸附到 8 方向；斜向速度为直行的 JOYSTICK_DIAGONAL_SPEED_MULT。
   */
  getJoystickDirection(): { x: number; y: number } {
    const { x, y } = this.joystick;
    const len = Math.hypot(x, y);
    if (len < 0.12) return { x: 0, y: 0 };

    const angle = Math.atan2(y, x);
    const eighth = Math.round(angle / (Math.PI / 4)) % 8;
    const snapped = eighth * (Math.PI / 4);
    const isDiagonal = eighth % 2 === 1;
    const mag = isDiagonal ? JOYSTICK_DIAGONAL_SPEED_MULT : 1;
    return { x: Math.cos(snapped) * mag, y: Math.sin(snapped) * mag };
  }

  /** 获取移动方向向量（键盘 + 虚拟摇杆；触摸拖拽由 Player 在暂停选奖励时使用） */
  getMoveDirection(): { x: number; y: number } {
    const kb = this.getKeyboardDirection();
    if (kb.x !== 0 || kb.y !== 0) return kb;
    return this.getJoystickDirection();
  }

  setJoystick(x: number, y: number): void {
    this.joystick.x = x;
    this.joystick.y = y;
  }

  clearJoystick(): void {
    this.joystick.x = 0;
    this.joystick.y = 0;
  }

  /** 设置触摸拖拽目标（暂停选奖励等非战斗场景） */
  setTouchTarget(x: number, y: number): void {
    this.touchTarget = { x, y };
  }

  clearTouchTarget(): void {
    this.touchTarget = null;
  }

  consumeShieldRequest(): boolean {
    if (!this.shieldRequested) return false;
    this.shieldRequested = false;
    return true;
  }

  consumePointer(): { x: number; y: number } | null {
    const p = this.pointer;
    this.pointer = null;
    return p;
  }
}
