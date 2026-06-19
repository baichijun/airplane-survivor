/** 子弹透明度下限（30%） */
export const BULLET_OPACITY_MIN = 0.3;
/** 子弹透明度上限（100%） */
export const BULLET_OPACITY_MAX = 1;
/** 手动滑条步进（10%） */
export const BULLET_OPACITY_STEP = 0.1;
/** 自动模式：每增加该数量的屏上子弹，透明度降一档 */
export const AUTO_OPACITY_BULLET_STEP = 20;
/** 自动模式：每档透明度变化量（10%） */
export const AUTO_OPACITY_DELTA = 0.1;

function snapOpacity(value: number): number {
  const stepped = Math.round(value / BULLET_OPACITY_STEP) * BULLET_OPACITY_STEP;
  return Math.min(BULLET_OPACITY_MAX, Math.max(BULLET_OPACITY_MIN, stepped));
}

/** 运行时游戏设置（内存态） */
export class GameSettings {
  /** 自动根据屏上子弹总数调节透明度 */
  autoBulletOpacity = true;
  enemyBulletOpacity = BULLET_OPACITY_MAX;
  playerBulletOpacity = BULLET_OPACITY_MAX;

  setEnemyOpacity(value: number): void {
    this.enemyBulletOpacity = snapOpacity(value);
  }

  setPlayerOpacity(value: number): void {
    this.playerBulletOpacity = snapOpacity(value);
  }

  opacityFromSliderT(t: number): number {
    return snapOpacity(BULLET_OPACITY_MIN + t * (BULLET_OPACITY_MAX - BULLET_OPACITY_MIN));
  }

  sliderTFromOpacity(opacity: number): number {
    return (snapOpacity(opacity) - BULLET_OPACITY_MIN) / (BULLET_OPACITY_MAX - BULLET_OPACITY_MIN);
  }

  getAutoOpacity(activeBulletCount: number): number {
    const steps = Math.floor(activeBulletCount / AUTO_OPACITY_BULLET_STEP);
    return Math.max(
      BULLET_OPACITY_MIN,
      BULLET_OPACITY_MAX - steps * AUTO_OPACITY_DELTA,
    );
  }

  getEnemyDrawOpacity(activeBulletCount: number): number {
    if (this.autoBulletOpacity) return this.getAutoOpacity(activeBulletCount);
    return this.enemyBulletOpacity;
  }

  getPlayerDrawOpacity(activeBulletCount: number): number {
    if (this.autoBulletOpacity) return this.getAutoOpacity(activeBulletCount);
    return this.playerBulletOpacity;
  }
}

export const gameSettings = new GameSettings();
