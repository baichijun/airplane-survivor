import type { RelicDef, RelicId, RelicRewardOption } from '../types';
import type { Player } from '../entities/Player';
import {
  RELIC_EXP_MULTIPLIER,
  RELIC_KINETIC_ABSORPTION_SHIELD_BONUS,
  RELIC_SKIP_HEAL_RATIO,
  RELIC_SKIP_MAX_HP_BONUS,
  SHIELD_COOLDOWN,
  SHIELD_DURATION,
} from './balance';

/** 全部宝物定义（Boss 击杀后三选一） */
export const RELIC_POOL: RelicDef[] = [
  {
    id: 'passiveShield',
    name: '被动护盾',
    description: '护盾冷却翻倍；未冷却时受击自动开盾',
    icon: '🛡',
  },
  {
    id: 'droneTracking',
    name: '无人机追踪',
    description: '无人机子弹自动追踪最近敌机',
    icon: '🎯',
  },
  {
    id: 'expAmplifier',
    name: '经验增幅',
    description: '所有经验获取 +40%',
    icon: '✦',
  },
  {
    id: 'vampiricRounds',
    name: '吸血弹丸',
    description: '击杀敌机回复 1 点生命（5 秒冷却）',
    icon: '♥',
  },
  {
    id: 'ricochetShots',
    name: '弹射攻击',
    description: '击中敌机造成伤害后，30% 几率弹射向另一敌机',
    icon: '↺',
  },
  {
    id: 'salvageBoost',
    name: '回收引擎',
    description: '被击中时有 33% 概率不受伤害',
    icon: '⚡',
  },
  {
    id: 'fortifiedHull',
    name: '加固舰体',
    description: '最大生命翻倍；之后生命上限与恢复效果翻倍',
    icon: '⬡',
  },
  {
    id: 'kineticConversion',
    name: '动能转化',
    description: '每击中敌机 8 次，主动护盾冷却 -1 秒',
    icon: '⟳',
  },
  {
    id: 'kineticAbsorption',
    name: '动能吸收',
    description: '护盾持续时间 +1 秒；格挡敌弹时回复 1 点生命',
    icon: '◎',
  },
];

/** Boss 击杀后供选择的选项数量 */
export const RELIC_REWARD_OPTION_COUNT = 3;

/** 「强化舰体」跳过选项（未拥有遗物不足时用于补齐） */
export const RELIC_SKIP_OPTION: RelicRewardOption = {
  kind: 'skip',
  name: '强化舰体',
  description: '不要宝物\n最大生命 +30%\n恢复 50% 最大生命',
};

/** 从未拥有的遗物库随机抽取最多 3 个；不足时用「强化舰体」补齐 */
export function pickRelicRewardOptions(owned: Set<RelicId>): RelicRewardOption[] {
  const pool = RELIC_POOL.filter((r) => !owned.has(r.id));
  const picked: RelicDef[] = [];
  const temp = [...pool];
  const relicCount = Math.min(RELIC_REWARD_OPTION_COUNT, temp.length);
  for (let i = 0; i < relicCount; i++) {
    const idx = Math.floor(Math.random() * temp.length);
    picked.push(temp.splice(idx, 1)[0]);
  }

  const options: RelicRewardOption[] = picked.map((relic) => ({ kind: 'relic', relic }));
  while (options.length < RELIC_REWARD_OPTION_COUNT) {
    options.push(RELIC_SKIP_OPTION);
  }
  return options;
}

/** 应用宝物效果 */
export function applyRelic(player: Player, id: RelicId): void {
  if (player.hasRelic(id)) return;
  player.relics.add(id);

  switch (id) {
    case 'fortifiedHull':
      player.maxHp *= 2;
      player.hp = Math.min(player.maxHp, player.hp * 2);
      player.hpGainMultiplier *= 2;
      break;
    case 'passiveShield':
    case 'droneTracking':
    case 'expAmplifier':
    case 'vampiricRounds':
    case 'ricochetShots':
    case 'salvageBoost':
    case 'kineticConversion':
    case 'kineticAbsorption':
      // 被动效果由 Player / CollisionSystem / Game 运行时读取 relics 集合
      break;
  }
}

/** 跳过宝物：提升最大生命并恢复（受加固舰体倍率影响） */
export function applyRelicSkip(player: Player): void {
  const bonus = Math.max(1, Math.floor(player.maxHp * RELIC_SKIP_MAX_HP_BONUS));
  const scaledBonus = player.scaleHpGain(bonus);
  player.maxHp += scaledBonus;
  const heal = Math.max(1, Math.floor(player.maxHp * RELIC_SKIP_HEAL_RATIO));
  player.hp = Math.min(player.maxHp, player.hp + player.scaleHealAmount(heal));
}

export function getRelicDef(id: RelicId): RelicDef {
  return RELIC_POOL.find((r) => r.id === id)!;
}

/** 玩家当前护盾冷却（含被动护盾宝物） */
export function getPlayerShieldCooldown(player: Player): number {
  return player.hasRelic('passiveShield') ? SHIELD_COOLDOWN * 2 : SHIELD_COOLDOWN;
}

/** 玩家当前护盾持续时间（含动能吸收宝物） */
export function getPlayerShieldDuration(player: Player): number {
  const bonus = player.hasRelic('kineticAbsorption') ? RELIC_KINETIC_ABSORPTION_SHIELD_BONUS : 0;
  return SHIELD_DURATION + bonus;
}

/** 经验倍率（含宝物，作用于所有经验来源） */
export function getXpMultiplier(player: Player): number {
  return player.hasRelic('expAmplifier') ? RELIC_EXP_MULTIPLIER : 1;
}

/** 无人机是否启用追踪 */
export function isDroneHomingEnabled(player: Player): boolean {
  return player.hasRelic('droneTracking');
}

/** 初始升级选择计数 */
export function createEmptyPickCounts(): import('../types').UpgradePickCounts {
  return {
    attackSpeed: 0,
    bulletDamage: 0,
    bulletCount: 0,
    moveSpeed: 0,
    maxHp: 0,
    droneDamage: 0,
    droneAttackSpeed: 0,
  };
}
