/** 游戏状态枚举值 */
export const GameState = {
  /** 主菜单 */
  MENU: 'menu',
  /** 战斗中 */
  PLAYING: 'playing',
  /** 暂停（升级/宝物选择） */
  PAUSED: 'paused',
  /** 游戏结束 */
  GAME_OVER: 'game_over',
} as const;

export type GameState = (typeof GameState)[keyof typeof GameState];

/** 游戏难度模式 */
export type GameMode = 'normal' | 'easy';

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
  | 'droneDamage'
  | 'droneAttackSpeed';

/** 升级奖励定义 */
export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
}

/** 宝物 ID */
export type RelicId =
  | 'passiveShield'
  | 'droneTracking'
  | 'expAmplifier'
  | 'vampiricRounds'
  | 'ricochetShots'
  | 'salvageBoost'
  | 'fortifiedHull'
  | 'kineticConversion'
  | 'kineticAbsorption';

/** 宝物定义 */
export interface RelicDef {
  id: RelicId;
  name: string;
  description: string;
  /** HUD 图标字符 */
  icon: string;
}

/** 宝物奖励选项（含跳过） */
export type RelicRewardOption =
  | { kind: 'relic'; relic: RelicDef }
  | { kind: 'skip'; name: string; description: string };

/** 暂停界面类型 */
export type PauseKind = 'level_up' | 'relic_reward';

/** 升级各选项累计选择次数 */
export type UpgradePickCounts = Record<UpgradeId, number>;

/** 子弹阵营 */
export type BulletOwner = 'player' | 'enemy';
