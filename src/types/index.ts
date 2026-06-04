/** 游戏状态 */
export const GameState = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
} as const;

export type GameState = (typeof GameState)[keyof typeof GameState];

/** 敌机类型 */
export type EnemyType = 'scout' | 'fighter' | 'tank';

/** 战斗单位基础属性 */
export interface CombatStats {
  hp: number;
  maxHp: number;
  speed: number;
  attackSpeed: number;
  bulletDamage: number;
  hitRadius: number;
}

/** 二维向量 */
export interface Vec2 {
  x: number;
  y: number;
}

/** 敌弹瞄准类型 */
export type BulletAimType = 'direct' | 'spread' | 'vertical';

/** 敌弹攻击形态 */
export type BulletShape = 'dot' | 'long' | 'laser';

/** 敌机配置 */
export interface EnemyConfig {
  type: EnemyType;
  hp: number;
  speed: number;
  attackSpeed: number;
  bulletDamage: number;
  aimType: BulletAimType;
  bulletShape: BulletShape;
  xpReward: number;
  hitRadius: number;
  width: number;
  height: number;
  color: string;
}

/** 升级奖励 ID */
export type UpgradeId =
  | 'attackSpeed'
  | 'bulletDamage'
  | 'bulletCount'
  | 'moveSpeed'
  | 'maxHp'
  | 'bulletSpeed';

/** 升级奖励定义 */
export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
}

/** 子弹阵营 */
export type BulletOwner = 'player' | 'enemy';
