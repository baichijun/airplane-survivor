import { BASE_GAME_HEIGHT, GAME_WIDTH, GAME_HEIGHT, setGameHeightFromViewport } from '../config/balance';

/** 单帧最大时间步长（秒），防止切后台后物理计算失控 */
const MAX_DELTA = 0.05;

function readViewportSize(): { width: number; height: number } {
  const visualViewport = window.visualViewport;
  if (visualViewport) {
    return { width: visualViewport.width, height: visualViewport.height };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

/** 画布引擎：尺寸、渲染上下文、帧间隔 */
export class Engine {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly width = GAME_WIDTH;
  private dpr = 1;

  get height(): number {
    return GAME_HEIGHT;
  }

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) throw new Error(`未找到画布元素 #${canvasId}`);
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取 2D 渲染上下文');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.visualViewport?.addEventListener('resize', () => this.resize());
  }

  /** 适配高清屏与全屏缩放；更高屏幕扩展逻辑高度以消除底部黑边 */
  resize(): void {
    const { width: viewportW, height: viewportH } = readViewportSize();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    const scaleW = viewportW / this.width;
    setGameHeightFromViewport(viewportW, viewportH);

    let displayW: number;
    let displayH: number;

    if (GAME_HEIGHT > BASE_GAME_HEIGHT) {
      displayW = viewportW;
      displayH = viewportH;
    } else {
      const scale = Math.min(scaleW, viewportH / BASE_GAME_HEIGHT);
      displayW = this.width * scale;
      displayH = BASE_GAME_HEIGHT * scale;
    }

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${displayW}px`;
    this.canvas.style.height = `${displayH}px`;

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /** 将屏幕坐标转换为游戏逻辑坐标 */
  screenToGame(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  /** 限制帧间隔，防止切后台后物理计算失控 */
  clampDelta(rawDelta: number): number {
    return Math.min(rawDelta, MAX_DELTA);
  }

  clear(): void {
    this.ctx.fillStyle = 'rgb(0, 0, 0)';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
}
