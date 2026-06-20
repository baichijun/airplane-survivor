import type { Engine } from './Engine';
import { JOYSTICK_ACTIVATION_THRESHOLD } from '../config/balance';

/** 键盘 + 触摸输入 */
export class Input {
  private keys = new Set<string>();
  /** 最近一次点击/触摸（游戏坐标） */
  pointer: { x: number; y: number } | null = null;
  pointerDown = false;
  /** 虚拟摇杆归一化偏移（-1～1），由 MobileControls 每帧写入 */
  private joystick = { x: 0, y: 0 };
  /** 当前手指在操控摇杆（含未过激活阈值），用于避免与其它触摸逻辑冲突 */
  private joystickCaptured = false;
  private shieldRequested = false;
  /** 负责移动/摇杆的主控触摸点 id */
  private moveTouchId: number | null = null;
  /** 由 MobileControls 注入，用于 touchstart 时识别护盾按钮（支持多指） */
  private shieldHitTest: ((x: number, y: number) => boolean) | null = null;

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
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (!touch) continue;
          const pos = engine.screenToGame(touch.clientX, touch.clientY);

          if (this.shieldHitTest?.(pos.x, pos.y)) {
            this.shieldRequested = true;
            continue;
          }

          if (this.moveTouchId === null) {
            this.moveTouchId = touch.identifier;
            this.pointer = pos;
            this.pointerDown = true;
          }
        }
      },
      { passive: false },
    );
    canvas.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        if (this.moveTouchId === null) return;
        const touch = this.findTouch(e.touches, this.moveTouchId);
        if (!touch) return;
        this.pointer = engine.screenToGame(touch.clientX, touch.clientY);
      },
      { passive: false },
    );
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (this.moveTouchId === null) return;
      const ended = this.findTouch(e.changedTouches, this.moveTouchId);
      if (!ended) return;
      this.moveTouchId = null;
      this.pointerDown = false;
      this.pointer = null;
      this.clearJoystick();
      this.setJoystickCaptured(false);
    };
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

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
      this.setJoystickCaptured(false);
    });
  }

  private findTouch(list: TouchList, id: number): Touch | null {
    for (let i = 0; i < list.length; i++) {
      const touch = list.item(i);
      if (touch && touch.identifier === id) return touch;
    }
    return null;
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

  setShieldHitTest(test: (x: number, y: number) => boolean): void {
    this.shieldHitTest = test;
  }

  setJoystickCaptured(captured: boolean): void {
    this.joystickCaptured = captured;
  }

  isJoystickCaptured(): boolean {
    return this.joystickCaptured;
  }

  /** 摇杆是否已推过激活阈值 */
  isJoystickActive(): boolean {
    const { x, y } = this.joystick;
    return Math.hypot(x, y) >= JOYSTICK_ACTIVATION_THRESHOLD;
  }

  /** 虚拟摇杆：模拟量方向，各向移动速度一致（与键盘相同） */
  getJoystickDirection(): { x: number; y: number } {
    const { x, y } = this.joystick;
    const len = Math.hypot(x, y);
    if (len < JOYSTICK_ACTIVATION_THRESHOLD) return { x: 0, y: 0 };
    return { x: x / len, y: y / len };
  }

  /** 获取移动方向向量（键盘 + 虚拟摇杆） */
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
