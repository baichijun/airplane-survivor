/** 击破爆破精灵图路径（3×3 共 9 帧） */
const SPRITE_PATH = '/sprites/defeat-boom.png';
const GRID_SIZE = 3;
const FRAME_COUNT = GRID_SIZE * GRID_SIZE;

const frames: HTMLCanvasElement[] = [];
let ready = false;

/** 灰底抠图容差（RGB 各通道） */
const CHROMA_TOLERANCE = 28;

function chromaKeyFrame(
  source: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  const imageData = ctx.getImageData(0, 0, sw, sh);
  const { data } = imageData;
  const bgR = data[0];
  const bgG = data[1];
  const bgB = data[2];

  for (let i = 0; i < data.length; i += 4) {
    const dr = Math.abs(data[i] - bgR);
    const dg = Math.abs(data[i + 1] - bgG);
    const db = Math.abs(data[i + 2] - bgB);
    if (dr + dg + db <= CHROMA_TOLERANCE * 3) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function areDefeatBoomSpritesReady(): boolean {
  return ready;
}

export function getDefeatBoomFrame(index: number): HTMLCanvasElement | null {
  return frames[index] ?? null;
}

/** 从 9 帧中随机选取不重复的 3 帧索引 */
export function pickRandomDefeatBoomFrames(): [number, number, number] {
  const pool = Array.from({ length: FRAME_COUNT }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return [pool[0], pool[1], pool[2]];
}

/** 预加载击破爆破精灵图并切分 9 帧 */
export function loadDefeatBoomSprites(): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const frameW = Math.floor(img.naturalWidth / GRID_SIZE);
      const frameH = Math.floor(img.naturalHeight / GRID_SIZE);
      frames.length = 0;

      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const index = row * GRID_SIZE + col;
          frames[index] = chromaKeyFrame(img, col * frameW, row * frameH, frameW, frameH);
        }
      }

      ready = true;
      resolve();
    };
    img.onerror = () => reject(new Error('无法加载击破爆破精灵图'));
    img.src = SPRITE_PATH;
  });
}
