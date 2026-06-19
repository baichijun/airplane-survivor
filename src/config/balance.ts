import type { EnemyConfig, EnemyType } from '../types';

/** 逻辑画布宽度（像素，iPhone 基准） */
export const GAME_WIDTH = 375;
/** 逻辑画布高度（像素，iPhone 基准） */
export const GAME_HEIGHT = 667;

/** 被动经验获取速率（经验/秒，不击杀也有） */
export const PASSIVE_XP_PER_SEC = 2;

/** 同屏敌机数量上限（初始值） */
export const ENEMY_CAP_INITIAL = 3;
/** 每经过该秒数，同屏敌机上限 +1 */
export const ENEMY_CAP_INTERVAL_SEC = 60;
/** 每击败一个 Boss，同屏敌机上限额外 +2 */
export const ENEMY_CAP_PER_BOSS_DEFEATED = 2;

/** 每次角色升级自动增加的生命上限 */
export const LEVEL_UP_MAX_HP_BONUS = 1;

/** 每次角色升级自动恢复的生命 */
export const LEVEL_UP_HEAL_BONUS = 1;

/** 根据游戏时长与已击败 Boss 数计算同屏敌机上限 */
export function getEnemyCap(elapsedSec: number, bossesDefeated: number): number {
  const timeBonus = Math.floor(elapsedSec / ENEMY_CAP_INTERVAL_SEC);
  const bossBonus = bossesDefeated * ENEMY_CAP_PER_BOSS_DEFEATED;
  return ENEMY_CAP_INITIAL + timeBonus + bossBonus;
}

/** 玩家初始属性 */
export const PLAYER_INITIAL = {
  /** 最大生命值 */
  maxHp: 8,
  /** 移动速度（像素/秒） */
  speed: 200,
  /** 射击间隔（秒，越小攻速越快） */
  attackSpeed: 0.4,
  /** 单发子弹伤害 */
  bulletDamage: 1,
  /** 碰撞判定半径（像素） */
  hitRadius: 14,
  /** 同时发射的弹道数 */
  bulletCount: 1,
  /** 子弹飞行速度（像素/秒） */
  bulletSpeed: 300,
};

/** 玩家可移动区域距屏幕边缘的最小距离（像素） */
export const PLAYER_MARGIN = 20;

/** 底部 HUD 距屏幕下边缘的内边距 */
export const HUD_BOTTOM_PAD = 12;
/** 生命/经验进度条高度 */
export const HUD_BAR_HEIGHT = 10;
/** 进度条与上方文字标签的间距 */
export const HUD_TEXT_BAR_GAP = 2;
/** 文字标签与虚拟摇杆之间的间距 */
export const HUD_TEXT_JOYSTICK_GAP = 5;
/** 底部 HUD 文字字号（需与 HUD 绘制字体一致） */
export const HUD_LABEL_FONT_SIZE = 11;

/** 生命/经验进度条顶边 Y 坐标 */
export function hudBarTopY(): number {
  return GAME_HEIGHT - HUD_BOTTOM_PAD - HUD_BAR_HEIGHT;
}

/** 底部文字标签底边 Y 坐标（textBaseline: bottom） */
export function hudLabelBottomY(): number {
  return hudBarTopY() - HUD_TEXT_BAR_GAP;
}

/** 底部文字标签顶边 Y 坐标（估算，用于与摇杆对齐） */
export function hudLabelTopY(): number {
  return hudLabelBottomY() - HUD_LABEL_FONT_SIZE;
}

/** 虚拟摇杆圆心 Y 坐标（摇杆底边与文字标签顶边相距 HUD_TEXT_JOYSTICK_GAP） */
export function mobileJoystickCenterY(joystickBaseR: number): number {
  const joystickBottom = hudLabelTopY() - HUD_TEXT_JOYSTICK_GAP;
  return joystickBottom - joystickBaseR;
}

/** 摇杆归一化偏移低于此值时自机保持静止（需推过约 30% 行程才移动） */
export const JOYSTICK_ACTIVATION_THRESHOLD = 0.3;

/** Boss 在场时，普通敌机下落速度倍率 */
export const ENEMY_SPEED_MULT_DURING_BOSS = 0.7;

/** 简单模式：初始生命相对标准模式的倍率 */
export const EASY_MODE_INITIAL_HP_MULT = 3;
/** 简单模式：生命恢复间隔（秒） */
export const EASY_MODE_REGEN_INTERVAL = 6;
/** 简单模式：每次恢复的生命值 */
export const EASY_MODE_REGEN_AMOUNT = 1;

/** 受击后无敌帧持续时间（秒） */
export const INVINCIBLE_DURATION = 1.0;

/** 与敌机/Boss 接触时受到的伤害 */
export const CONTACT_DAMAGE = 1;

/** 第 n 级升到 n+1 级所需经验 */
export function xpToNextLevel(level: number): number {
  return Math.floor(20 * Math.pow(1.25, level - 1));
}

/** 敌机类型配置（scout 侦察 / fighter 战斗 / tank 重甲） */
export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  scout: {
    type: 'scout',
    hp: 2, // 生命值
    speed: 80, // 下落速度（像素/秒）
    attackSpeed: 1.2, // 射击间隔（秒）
    bulletDamage: 1, // 子弹伤害
    aimType: 'direct', // 瞄准方式：直射玩家
    bulletShape: 'dot', // 子弹形态：圆点
    xpReward: 5, // 击杀经验
    hitRadius: 12, // 碰撞半径
    width: 24, // 显示宽度
    height: 24, // 显示高度
    color: '#ff6b6b', // 备用色（绘制以 ShipSprites 为准）
  },
  fighter: {
    type: 'fighter',
    hp: 5,
    speed: 60,
    attackSpeed: 0.8,
    bulletDamage: 1,
    aimType: 'spread', // 散射瞄准（带随机偏差）
    bulletShape: 'long', // 长条弹
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
    bulletDamage: 2,
    aimType: 'vertical', // 垂直向下
    bulletShape: 'laser', // 激光（预瞄→间隔→攻击）
    xpReward: 25,
    hitRadius: 22,
    width: 44,
    height: 44,
    color: '#c0392b',
  },
};

/** 游戏开始时敌机生成间隔（秒） */
export const INITIAL_SPAWN_INTERVAL = 2;

/** 每过 30 秒，生成间隔乘以 (1 - 该值)，即缩减 10% */
export const SPAWN_INTERVAL_DECAY = 0.1;

/** 游戏进行多少秒后开始刷新战斗机（fighter） */
export const FIGHTER_UNLOCK_TIME = 30;

/** 游戏进行多少秒后开始刷新重甲机（tank） */
export const TANK_UNLOCK_TIME = 60;

/** 升级/宝物选框：自机飞入选项框内停留多久后自动选中（秒） */
export const LEVEL_UP_SELECT_DWELL = 0.5;

/** 圆点形子弹的碰撞半径（像素） */
export const BULLET_DOT_RADIUS = 4;

/** 长条形子弹的长度（像素，约为圆点直径的 5 倍） */
export const BULLET_LONG_LENGTH = 40;

/** 追踪弹默认转向速率（越大追踪越急） */
export const BULLET_HOMING_STRENGTH = 4;

/** 无人机追踪弹转向速率（有无人机追踪宝物时使用） */
export const DRONE_HOMING_STRENGTH = 10;

/** 激光射线延伸至画布外的最大长度（像素，兜底值） */
export const LASER_MAX_TRACE_LENGTH = 500;

/** 激光预瞄虚线显示时长（秒） */
export const LASER_WARNING_DURATION = 0.3;

/** 激光预瞄结束到实际攻击开始的间隔（秒） */
export const LASER_GAP_DURATION = 0.3;

/** 激光实际攻击（有伤害）持续时间（秒） */
export const LASER_ACTIVE_DURATION = 0.3;

/** 激光光束的碰撞宽度（像素） */
export const LASER_BEAM_WIDTH = 6;

/** 主动护盾开启后的持续时间（秒） */
export const SHIELD_DURATION = 1;

/** 主动护盾冷却时间（秒） */
export const SHIELD_COOLDOWN = 7;

/** 升级：自机攻速每选一次倍率增量（+30%，射击间隔 ÷1.3） */
export const UPGRADE_ATTACK_SPEED_MULT = 1.3;

/** 升级：移速每选一次倍率增量（+10%） */
export const UPGRADE_MOVE_SPEED_MULT = 1.1;

/** 升级：最大生命每选一次倍率（×1.2） */
export const UPGRADE_MAX_HP_MULT = 1.2;

/** 升级：装甲强化选取后恢复最大生命的比例 */
export const UPGRADE_MAX_HP_HEAL_RATIO = 0.3;

/** 升级：无人机伤害每选一次倍率增量（+50%） */
export const UPGRADE_DRONE_DAMAGE_MULT = 1.5;

/** 升级：无人机攻速每选一次倍率增量（+50%，间隔 ÷1.5） */
export const UPGRADE_DRONE_ATTACK_SPEED_MULT = 1.5;

/** 左右无人机相对玩家中心的横向偏移（像素） */
export const DRONE_OFFSET_X = 36;

/** 无人机射击间隔 = 自机间隔 × 该值（即攻速为自机的 1/3） */
export const DRONE_ATTACK_SPEED_MULT = 3;

/** 无人机子弹伤害 = 自机伤害 × 该值 */
export const DRONE_DAMAGE_MULT = 0.5;

/** 吸血弹丸宝物：击杀回血后的冷却时间（秒） */
export const RELIC_VAMP_COOLDOWN = 4;

/** 弹射攻击宝物：击中敌机后触发弹射的概率（0~1） */
export const RELIC_RICOCHET_CHANCE = 0.3;

/** 回收引擎宝物：受击时完全免伤的概率（0~1） */
export const RELIC_DODGE_CHANCE = 0.33;

/** 每经过一个单数整分钟，敌机子弹伤害倍率（1.2 = +20%） */
export const ENEMY_DAMAGE_SCALE_PER_ODD_MINUTE = 1.2;

/** 每经过一个双数整分钟，敌机生命值倍率（1.3 = +30%） */
export const ENEMY_HP_SCALE_PER_EVEN_MINUTE = 1.3;

/** 游戏内已完整经过的单数分钟数（1、3、5…） */
export function passedOddMinutes(elapsedSec: number): number {
  const fullMinutes = Math.floor(elapsedSec / 60);
  return Math.floor((fullMinutes + 1) / 2);
}

/** 游戏内已完整的双数分钟数（2、4、6…） */
export function passedEvenMinutes(elapsedSec: number): number {
  return Math.floor(Math.floor(elapsedSec / 60) / 2);
}

/** 敌机子弹伤害随游戏时间的倍率 */
export function enemyTimeDamageMultiplier(elapsedSec: number): number {
  const count = passedOddMinutes(elapsedSec);
  return count <= 0 ? 1 : Math.pow(ENEMY_DAMAGE_SCALE_PER_ODD_MINUTE, count);
}

/** 敌机生命值随游戏时间的倍率 */
export function enemyTimeHpMultiplier(elapsedSec: number): number {
  const count = passedEvenMinutes(elapsedSec);
  return count <= 0 ? 1 : Math.pow(ENEMY_HP_SCALE_PER_EVEN_MINUTE, count);
}

/** 按类型与游戏时间计算敌机最大生命 */
export function scaledEnemyMaxHp(type: EnemyType, elapsedSec: number): number {
  const baseHp = ENEMY_CONFIGS[type].hp;
  return Math.max(1, Math.round(baseHp * enemyTimeHpMultiplier(elapsedSec)));
}

/** 按类型与游戏时间计算敌机子弹伤害 */
export function scaledEnemyBulletDamage(type: EnemyType, elapsedSec: number): number {
  const baseDamage = ENEMY_CONFIGS[type].bulletDamage;
  return Math.max(1, Math.round(baseDamage * enemyTimeDamageMultiplier(elapsedSec)));
}

/** 首个 Boss 出现的游戏时间（秒） */
export const BOSS_FIRST_SPAWN_TIME = 30;

/** 击杀一只 Boss 后，下一只 Boss 出现的间隔（秒） */
export const BOSS_RESPAWN_INTERVAL = 30;

/** Boss 横向移动速度（像素/秒） */
export const BOSS_MOVE_SPEED = 90;

/** Boss 生成与驻留的固定 Y 坐标（像素） */
export const BOSS_Y = 110;

/** Boss 碰撞体显示宽度（像素） */
export const BOSS_WIDTH = 100;

/** Boss 碰撞体显示高度（像素） */
export const BOSS_HEIGHT = 56;

/** 与 Boss 接触时受到的伤害 */
export const BOSS_CONTACT_DAMAGE = 2;

/** 自机显示宽度（像素，用于 Boss 弹幕间距计算） */
export const PLAYER_SHIP_WIDTH = PLAYER_INITIAL.hitRadius * 2;

/** 动作 A：连射间隔（秒） */
export const BOSS_BURST_SHOT_INTERVAL = 0.1;
/** 动作 A：每轮连射发数 */
export const BOSS_BURST_SHOTS_PER_ROUND = 3;
/** 动作 A：轮次间隔（秒） */
export const BOSS_BURST_ROUND_INTERVAL = 0.6;
/** 动作 A：总轮次 */
export const BOSS_BURST_ROUND_COUNT = 3;
/** 动作 A：子弹半径相对基础圆弹的倍率 */
export const BOSS_BURST_BULLET_RADIUS_MULT = 2;

/** 动作 B：子弹横向间距（自机宽度倍数） */
export const BOSS_ROW_SPACING_MULT = 2;
/** 动作 B：波次间隔（秒） */
export const BOSS_ROW_WAVE_INTERVAL = 1;
/** 动作 B：波次数 */
export const BOSS_ROW_WAVE_COUNT = 5;

/** 动作 C：画布横向分区数 */
export const BOSS_ZONE_COUNT = 5;
/** 动作 C：区域预警时长（秒） */
export const BOSS_ZONE_WARNING_DURATION = 0.5;
/** 动作 C：区域攻击持续时长（秒） */
export const BOSS_ZONE_ACTIVE_DURATION = 1.5;
/** 动作 C：攻击波次数（依次 1/2/3 个区域） */
export const BOSS_ZONE_WAVE_COUNT = 3;

/** 一种攻击模式结束后，切换下一种前的冷却（秒） */
export const BOSS_PATTERN_COOLDOWN = 2;

/** 跳过宝物选项：最大生命加成（占当前最大生命的比例） */
export const RELIC_SKIP_MAX_HP_BONUS = 0.3;

/** 跳过宝物选项：立即恢复生命（占加成后最大生命的比例） */
export const RELIC_SKIP_HEAL_RATIO = 0.5;

/** 动能转化：每命中敌机多少次触发一次 */
export const RELIC_KINETIC_HITS_PER_PROC = 8;

/** 动能吸收：额外护盾持续时间（秒） */
export const RELIC_KINETIC_ABSORPTION_SHIELD_BONUS = 1;

/** 动能转化：每次触发减少的主动护盾冷却（秒） */
export const RELIC_KINETIC_SHIELD_CD_REDUCTION = 1;

/** 经验增幅宝物：经验获取倍率（1.4 = +40%） */
export const RELIC_EXP_MULTIPLIER = 1.4;

/** 敌机子弹飞行速度（像素/秒） */
export const ENEMY_BULLET_SPEED = 200;

/** Boss 子弹飞行速度（像素/秒） */
export const BOSS_BULLET_SPEED = 240;

/** 敌机散射瞄准时随机偏差角（弧度，±10°） */
export const ENEMY_AIM_SPREAD_RAD = 10 * (Math.PI / 180);

/** 自机多弹道时相邻子弹夹角（弧度，15°） */
export const PLAYER_BULLET_SPREAD_RAD = 15 * (Math.PI / 180);

/** Boss 瞄准散弹的基础发数（第一只 Boss） */
export const BOSS_SCATTER_BASE_COUNT = 5;

/** 每多一只 Boss，瞄准散弹额外增加的发数 */
export const BOSS_SCATTER_EXTRA_PER_INDEX = 2;

/** Boss 瞄准散弹相邻子弹夹角（弧度） */
export const BOSS_SCATTER_ANGLE = 0.24;

/** Boss 多道激光起点横向分布范围（占舰宽的比例） */
export const BOSS_LASER_ORIGIN_SPAN_RATIO = 1;

/** Boss 环形全向弹幕的发数 */
export const BOSS_RADIAL_BULLET_COUNT = 20;

/** Boss 环形弹幕速度相对 BOSS_BULLET_SPEED 的倍率 */
export const BOSS_RADIAL_SPEED_MULT = 0.85;

/** Boss 垂直三连长弹相对正下方的角度偏移（弧度） */
export const BOSS_DOWN_LONG_ANGLE_OFFSETS = [-0.4, 0, 0.4] as const;

/** Boss 侧翼圆弹相对中心的横向偏移（像素） */
export const BOSS_SIDE_BULLET_OFFSET_X = 30;

/**
 * Boss 最大生命值：与生成时游戏时长、Boss 序号相关
 * 基础随时间增长，序号提供指数级缩放
 */
export function bossMaxHp(spawnTimeSec: number, bossIndex: number): number {
  const timeFactor = 50 + spawnTimeSec * 2.2;
  const indexFactor = 1 + (bossIndex - 1) * 0.35;
  const exponential = Math.pow(1.15, bossIndex - 1);
  return Math.floor(timeFactor * indexFactor * exponential);
}

/** Boss 子弹伤害：随 Boss 序号提升 */
export function bossBulletDamage(bossIndex: number): number {
  return Math.min(1, 1 + Math.floor(bossIndex / 2));
}

/** Boss 射击间隔（秒）：序号越高射速越快 */
export function bossAttackInterval(bossIndex: number): number {
  return Math.max(0.8, 2 - bossIndex * 0.2);
}

/** 第 n 只 Boss 的瞄准散弹发数 */
export function bossScatterBulletCount(bossIndex: number): number {
  return BOSS_SCATTER_BASE_COUNT + BOSS_SCATTER_EXTRA_PER_INDEX * (bossIndex - 1);
}

/** 第 n 只 Boss 同时发射的激光道数 */
export function bossLaserCount(bossIndex: number): number {
  return bossIndex;
}
