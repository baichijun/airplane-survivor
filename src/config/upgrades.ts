import type { UpgradeDef, UpgradeId } from '../types';
import type { Player } from '../entities/Player';

/** 奖励池 */
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
    description: '最大生命值 +1，恢复 1 点生命',
  },
  {
    id: 'bulletSpeed',
    name: '穿甲弹',
    description: '子弹速度 +20%',
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
      player.attackSpeed *= 0.85;
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
    case 'maxHp':
      player.maxHp += 1;
      player.hp = Math.min(player.hp + 1, player.maxHp);
      break;
    case 'bulletSpeed':
      player.bulletSpeed *= 1.2;
      break;
  }
}
