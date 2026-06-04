import type { UpgradeDef, UpgradeId } from '../types';
import type { Player } from '../entities/Player';
import {
  UPGRADE_ATTACK_SPEED_MULT,
  UPGRADE_DRONE_ATTACK_SPEED_MULT,
  UPGRADE_DRONE_DAMAGE_MULT,
} from './balance';

/** 升级奖励池（升级界面随机抽取） */
export const UPGRADE_POOL: UpgradeDef[] = [
  {
    id: 'attackSpeed',
    name: '急速射击',
    description: '攻速 +15%',
  },
  {
    id: 'bulletDamage',
    name: '火力强化',
    description: '子弹威力 +1',
  },
  {
    id: 'bulletCount',
    name: '多重弹道',
    description: '弹道数 +1',
  },
  {
    id: 'moveSpeed',
    name: '引擎升级',
    description: '移速 +10%',
  },
  {
    id: 'maxHp',
    name: '装甲强化',
    description: '最大生命提升至 1.2 倍；恢复 30% 最大生命',
  },
  {
    id: 'droneDamage',
    name: '无人机火力',
    description: '无人机伤害 +50%',
  },
  {
    id: 'droneAttackSpeed',
    name: '无人机速射',
    description: '无人机攻速 +30%',
  },
];

/** 随机抽取 n 个不重复奖励 */
export function pickRandomUpgrades(count: number): UpgradeDef[] {
  const pool = [...UPGRADE_POOL];
  const result: UpgradeDef[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

/** 应用升级效果到玩家 */
export function applyUpgrade(player: Player, id: UpgradeId): void {
  switch (id) {
    case 'attackSpeed':
      player.attackSpeed /= UPGRADE_ATTACK_SPEED_MULT;
      break;
    case 'bulletDamage':
      player.bulletDamage += 1;
      break;
    case 'bulletCount':
      player.bulletCount += 1;
      break;
    case 'moveSpeed':
      player.speed *= 1.1;
      break;
    case 'maxHp': {
      player.maxHp = Math.round(player.maxHp * 1.2);
      const heal = Math.round(player.maxHp * 0.3);
      player.hp = Math.min(player.maxHp, player.hp + heal);
      break;
    }
    case 'droneDamage':
      player.droneDamageMult *= UPGRADE_DRONE_DAMAGE_MULT;
      break;
    case 'droneAttackSpeed':
      player.droneAttackSpeedMult *= UPGRADE_DRONE_ATTACK_SPEED_MULT;
      break;
  }
}
