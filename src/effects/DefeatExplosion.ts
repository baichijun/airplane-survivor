import { drawGlowCircle, UI } from '../ui/theme';
import { getDefeatBoomFrame, pickRandomDefeatBoomFrames } from './DefeatBoomSprites';

/** 击破爆破种类：决定闪烁次数与配色 */
export type DefeatExplosionKind = 'enemy' | 'boss' | 'player';

/** 击破爆破视觉模式：1=程序化光效，2=精灵图随机三帧 */
export type DefeatExplosionMode = 1 | 2;

/** 当前使用的击破爆破模式 */
export const DEFEAT_EXPLOSION_MODE: DefeatExplosionMode = 2;

export const FLASH_COUNT: Record<DefeatExplosionKind, number> = {
  enemy: 4,
  boss: 15,
  player: 3,
};

const FLASH_DURATION = 0.1;

export interface DefeatAnchor {
  cx: number;
  cy: number;
  halfW: number;
  halfH: number;
}

interface FlashPoint {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface DefeatExplosionImpl {
  finished: boolean;
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

function buildFlashPoints(anchor: DefeatAnchor, kind: DefeatExplosionKind): FlashPoint[] {
  const count = FLASH_COUNT[kind];
  const spreadX = anchor.halfW * (kind === 'boss' ? 2.1 : 1.75);
  const spreadY = anchor.halfH * (kind === 'boss' ? 2.1 : 1.75);
  const baseScale = kind === 'boss' ? 1.15 : kind === 'player' ? 0.95 : 0.8;

  return Array.from({ length: count }, () => ({
    x: anchor.cx + (Math.random() - 0.5) * spreadX,
    y: anchor.cy + (Math.random() - 0.5) * spreadY,
    scale: baseScale * (0.75 + Math.random() * 0.55),
    rotation: Math.random() * Math.PI * 2,
  }));
}

function kindRadius(kind: DefeatExplosionKind): number {
  if (kind === 'boss') return 18;
  if (kind === 'player') return 14;
  return 10;
}

/** 击破特效 mode1：程序化光晕与火花 */
class DefeatExplosionMode1 implements DefeatExplosionImpl {
  finished = false;
  private elapsed = 0;
  private readonly flashes: FlashPoint[];
  private readonly totalDuration: number;

  constructor(
    anchor: DefeatAnchor,
    private readonly kind: DefeatExplosionKind,
    private readonly onComplete?: () => void,
  ) {
    this.flashes = buildFlashPoints(anchor, kind);
    this.totalDuration = this.flashes.length * FLASH_DURATION;
  }

  update(dt: number): void {
    if (this.finished) return;
    this.elapsed += dt;
    if (this.elapsed >= this.totalDuration) {
      this.finished = true;
      this.onComplete?.();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.finished) return;

    const flashIndex = Math.min(
      this.flashes.length - 1,
      Math.floor(this.elapsed / FLASH_DURATION),
    );
    const localT = this.elapsed - flashIndex * FLASH_DURATION;
    const fade = 1 - localT / FLASH_DURATION;
    const pulse = 0.55 + Math.sin((localT / FLASH_DURATION) * Math.PI) * 0.45;
    const alpha = fade * pulse;

    if (alpha <= 0.02) return;

    const flash = this.flashes[flashIndex];
    this.drawBurst(ctx, flash.x, flash.y, flash.scale, flash.rotation, alpha);
  }

  private drawBurst(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    rotation: number,
    alpha: number,
  ): void {
    const palette = this.getPalette();
    const coreR = kindRadius(this.kind) * scale;
    const ringR = coreR * 2.2;
    const sparkLen = coreR * (this.kind === 'boss' ? 3.2 : 2.6);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rotation);

    drawGlowCircle(ctx, 0, 0, ringR, palette.glow, this.kind === 'boss' ? 22 : 14);

    const ringGrad = ctx.createRadialGradient(0, 0, coreR * 0.4, 0, 0, ringR);
    ringGrad.addColorStop(0, palette.mid);
    ringGrad.addColorStop(0.55, palette.outer);
    ringGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.fill();

    drawGlowCircle(ctx, 0, 0, coreR * 0.55, '#ffffff', 8);
    ctx.fillStyle = palette.core;
    ctx.beginPath();
    ctx.arc(0, 0, coreR * 0.45, 0, Math.PI * 2);
    ctx.fill();

    const sparkCount = this.kind === 'boss' ? 8 : 6;
    ctx.strokeStyle = palette.spark;
    ctx.lineWidth = this.kind === 'boss' ? 2.2 : 1.6;
    ctx.lineCap = 'round';
    for (let i = 0; i < sparkCount; i++) {
      const angle = (Math.PI * 2 * i) / sparkCount + rotation * 0.15;
      const inner = coreR * 0.5;
      const outer = inner + sparkLen * (0.65 + (i % 3) * 0.12);
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.stroke();
    }

    ctx.restore();
  }

  private getPalette(): { core: string; mid: string; outer: string; glow: string; spark: string } {
    switch (this.kind) {
      case 'boss':
        return {
          core: UI.danger,
          mid: 'rgba(244, 63, 94, 0.75)',
          outer: 'rgba(192, 38, 211, 0.45)',
          glow: UI.magentaBright,
          spark: UI.warn,
        };
      case 'player':
        return {
          core: UI.accentBright,
          mid: 'rgba(34, 211, 238, 0.7)',
          outer: 'rgba(103, 232, 249, 0.35)',
          glow: UI.accentGlow,
          spark: '#ffffff',
        };
      default:
        return {
          core: UI.warn,
          mid: 'rgba(240, 215, 28, 0.72)',
          outer: 'rgba(241, 170, 6, 0.42)',
          glow: 'rgba(251, 36, 36, 0.65)',
          spark: '#fef3c7',
        };
    }
  }
}

/** 击破特效 mode2：精灵图随机三帧，在机体图层内随机位置播放 */
class DefeatExplosionMode2 implements DefeatExplosionImpl {
  finished = false;
  private elapsed = 0;
  private readonly flashes: FlashPoint[];
  private readonly frameIndices: [number, number, number];
  private readonly totalDuration: number;

  constructor(
    anchor: DefeatAnchor,
    private readonly kind: DefeatExplosionKind,
    private readonly onComplete?: () => void,
  ) {
    this.flashes = buildFlashPoints(anchor, kind);
    this.frameIndices = pickRandomDefeatBoomFrames();
    this.totalDuration = this.flashes.length * FLASH_DURATION;
  }

  update(dt: number): void {
    if (this.finished) return;
    this.elapsed += dt;
    if (this.elapsed >= this.totalDuration) {
      this.finished = true;
      this.onComplete?.();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.finished) return;

    const flashIndex = Math.min(
      this.flashes.length - 1,
      Math.floor(this.elapsed / FLASH_DURATION),
    );
    const localT = this.elapsed - flashIndex * FLASH_DURATION;
    const fade = 1 - localT / FLASH_DURATION;
    const pulse = 0.55 + Math.sin((localT / FLASH_DURATION) * Math.PI) * 0.45;
    const alpha = fade * pulse;

    if (alpha <= 0.02) return;

    const spriteIndex = this.frameIndices[flashIndex % 3];
    const frame = getDefeatBoomFrame(spriteIndex);
    if (!frame) return;

    const flash = this.flashes[flashIndex];
    const size = kindRadius(this.kind) * 4.2 * flash.scale;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(flash.x, flash.y);
    ctx.rotate(flash.rotation);
    ctx.drawImage(frame, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
}

/** 机体图层上的击破爆破：在锚定区域内随机位置闪烁 */
export class DefeatExplosion implements DefeatExplosionImpl {
  private readonly impl: DefeatExplosionImpl;

  constructor(
    anchor: DefeatAnchor,
    kind: DefeatExplosionKind,
    onComplete?: () => void,
    mode: DefeatExplosionMode = DEFEAT_EXPLOSION_MODE,
  ) {
    this.impl =
      mode === 1
        ? new DefeatExplosionMode1(anchor, kind, onComplete)
        : new DefeatExplosionMode2(anchor, kind, onComplete);
  }

  get finished(): boolean {
    return this.impl.finished;
  }

  update(dt: number): void {
    this.impl.update(dt);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.impl.draw(ctx);
  }
}
