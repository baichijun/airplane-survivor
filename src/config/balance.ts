import type { EnemyConfig, EnemyType } from '../types';

/** 逻辑画布尺寸（iPhone 基准） */
export const GAME_WIDTH = 375;
export const GAME_HEIGHT = 667;

/** 被动经验 / 秒 */
export const PASSIVE_XP_PER_SEC = 2;

/** 同屏敌机上限 */
export const MAX_ENEMIES = 20;

/** 玩家初始属性 */
export const PLAYER_INITIAL = {
  maxHp: 5,
  speed: 200,
  attackSpeed: 0.4,
  bulletDamage: 1,
  hitRadius: 14,
  bulletCount: 1,
  bulletSpeed: 400,
};

/** 玩家移动边界（距屏幕边缘） */
export const PLAYER_MARGIN = 20;

/** 无敌帧时长（秒） */
export const INVINCIBLE_DURATION = 1.0;

/** 接触伤害 */
export const CONTACT_DAMAGE = 1;

/** 第 n 级升到 n+1 级所需经验 */
export function xpToNextLevel(level: number): number {
  return Math.floor(20 * Math.pow(1.25, level - 1));
}

/** 敌机类型配置 */
export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  scout: {
    type: 'scout',
    hp: 2,
    speed: 80,
    attackSpeed: 1.2,
    bulletDamage: 1,
    aimType: 'direct',
    bulletShape: 'dot',
    xpReward: 5,
    hitRadius: 12,
    width: 24,
    height: 24,
    color: '#ff6b6b',
  },
  fighter: {
    type: 'fighter',
    hp: 5,
    speed: 60,
    attackSpeed: 0.8,
    bulletDamage: 2,
    aimType: 'spread',
    bulletShape: 'long',
    xpReward: 12,
    hitRadius: 16,
    width: 32,
    height: 32,
    color: '#ff4757',
  },
  tank: {
    type: 'tank',
    hp: 12,
    speed: 40,
    attackSpeed: 1.5,
    bulletDamage: 3,
    aimType: 'vertical',
    bulletShape: 'laser',
    xpReward: 25,
    hitRadius: 22,
    width: 44,
    height: 44,
    color: '#c0392b',
  },
};

/** 初始生成间隔（秒） */
export const INITIAL_SPAWN_INTERVAL = 2;

/** 每 30 秒生成间隔缩减比例 */
export const SPAWN_INTERVAL_DECAY = 0.1;

/** 解锁战斗机（fighter）的游戏时间（秒） */
export const FIGHTER_UNLOCK_TIME = 30;

/** 解锁重甲机（tank）的游戏时间（秒） */
export const TANK_UNLOCK_TIME = 60;

/** 升级选项框内停留选中的时长（秒） */
export const LEVEL_UP_SELECT_DWELL = 0.5;

/** 圆点子弹半径 */
export const BULLET_DOT_RADIUS = 4;

/** 长弹长度（5 倍圆点直径） */
export const BULLET_LONG_LENGTH = 40;

/** 激光预瞄单次闪烁时长（秒） */
export const LASER_WARNING_FLASH = 0.2;

/** 激光预瞄闪烁次数 */
export const LASER_WARNING_COUNT = 2;

/** 激光攻击持续时间（秒） */
export const LASER_ACTIVE_DURATION = 0.5;

/** 激光光束宽度 */
export const LASER_BEAM_WIDTH = 8;

/** 激光预瞄闪烁间隔（秒） */
export const LASER_WARNING_GAP = 0.1;
