import type { Engine } from './Engine';

/** 键盘 + 触摸输入 */
export class Input {
  private keys = new Set<string>();
  touchTarget: { x: number; y: number } | null = null;
  /** 最近一次点击/触摸（游戏坐标） */
  pointer: { x: number; y: number } | null = null;
  pointerDown = false;

  constructor(engine: Engine) {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
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
        this.touchTarget = pos;
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
        this.touchTarget = pos;
        this.pointer = pos;
      },
      { passive: false },
    );
    canvas.addEventListener('touchend', () => {
      this.touchTarget = null;
      this.pointerDown = false;
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
    });
  }

  isDown(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  /** 获取移动方向向量（已归一化） */
  getMoveDirection(): { x: number; y: number } {
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

  consumePointer(): { x: number; y: number } | null {
    const p = this.pointer;
    this.pointer = null;
    return p;
  }
}
