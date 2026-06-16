import type { EnemyType } from '../types';
import { getShipSprite } from './SpriteLoader';

/** 敌机类型默认贴图编号：1/2 为小型敌机，4/5 为重甲变体 */
const ENEMY_SPRITE_BY_TYPE: Record<EnemyType, number> = {
  scout: 1,
  fighter: 2,
  tank: 4,
};

/** 在中心点绘制指定编号贴图 */
function drawSpriteById(
  ctx: CanvasRenderingContext2D,
  spriteId: number,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const img = getShipSprite(spriteId);
  if (!img) return;
  ctx.drawImage(img, x - width / 2, y - height / 2, width, height);
}

/** 绘制玩家自机（编号 3，朝上） */
export function drawPlayerShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
): void {
  const size = r * 2.4;
  drawSpriteById(ctx, 3, x, y, size, size);
}

/** 绘制小型无人机（复用自机贴图缩小） */
export function drawDroneShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  _side: 'left' | 'right',
): void {
  drawSpriteById(ctx, 3, x, y, 14, 14);
}

/** 绘制敌机；spriteId 可覆盖默认映射（重甲在 4/5 间随机） */
export function drawEnemyShip(
  ctx: CanvasRenderingContext2D,
  type: EnemyType,
  x: number,
  y: number,
  width: number,
  height: number,
  spriteId?: number,
): void {
  const id = spriteId ?? ENEMY_SPRITE_BY_TYPE[type];
  drawSpriteById(ctx, id, x, y, width, height);
}

/** 绘制 Boss（编号 6，朝下） */
export function drawBossShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  _bossIndex: number,
): void {
  drawSpriteById(ctx, 6, x, y, width, height);
}
