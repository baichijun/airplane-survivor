import type { UpgradeId } from '../types';
import type { Player } from '../entities/Player';
import {
  DRONE_ATTACK_SPEED_MULT,
  PLAYER_INITIAL,
  UPGRADE_ATTACK_SPEED_MULT,
  UPGRADE_DRONE_ATTACK_SPEED_MULT,
  UPGRADE_DRONE_DAMAGE_MULT,
} from './balance';

export interface UpgradeStatDisplay {
  label: string;
  before: string;
  after: string;
}

/** 小数展示：至少 1 位小数，整数时不带小数点 */
function formatDecimal(value: number, decimals = 1): string {
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(decimals);
}

function formatMoveSpeedBonus(speed: number): string {
  const pct = Math.round((speed / PLAYER_INITIAL.speed - 1) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

/** 相对初始射击间隔的累计攻速加成（与描述 +15% 一致） */
function formatAttackSpeedBonus(attackInterval: number): string {
  const pct = Math.round((PLAYER_INITIAL.attackSpeed / attackInterval - 1) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

/** 相对初始无人机间隔的累计攻速加成 */
function formatDroneAttackSpeedBonus(interval: number): string {
  const initial = PLAYER_INITIAL.attackSpeed * DRONE_ATTACK_SPEED_MULT;
  const pct = Math.round((initial / interval - 1) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

/**
 * 基于玩家当前实际属性计算升级前后展示（含宝物等所有加成）
 */
export function getUpgradeStatDisplay(id: UpgradeId, player: Player): UpgradeStatDisplay {
  switch (id) {
    case 'attackSpeed':
      return {
        label: '攻速',
        before: formatAttackSpeedBonus(player.attackSpeed),
        after: formatAttackSpeedBonus(player.attackSpeed / UPGRADE_ATTACK_SPEED_MULT),
      };
    case 'bulletDamage':
      return {
        label: '子弹威力',
        before: `${player.bulletDamage}`,
        after: `${player.bulletDamage + 1}`,
      };
    case 'bulletCount':
      return {
        label: '弹道数',
        before: `${player.bulletCount}`,
        after: `${player.bulletCount + 1}`,
      };
    case 'moveSpeed':
      return {
        label: '移动速度',
        before: formatMoveSpeedBonus(player.speed),
        after: formatMoveSpeedBonus(player.speed * 1.1),
      };
    case 'maxHp': {
      const newMaxHp = Math.round(player.maxHp * 1.2);
      return {
        label: '最大生命',
        before: `${player.maxHp}`,
        after: `${newMaxHp}`,
      };
    }
    case 'droneDamage': {
      const before = player.getDroneBulletDamageRaw();
      const after = before * UPGRADE_DRONE_DAMAGE_MULT;
      return {
        label: '无人机伤害',
        before: formatDecimal(before),
        after: formatDecimal(after),
      };
    }
    case 'droneAttackSpeed':
      return {
        label: '无人机攻速',
        before: formatDroneAttackSpeedBonus(player.getDroneAttackInterval()),
        after: formatDroneAttackSpeedBonus(
          player.getDroneAttackInterval() / UPGRADE_DRONE_ATTACK_SPEED_MULT,
        ),
      };
  }
}

/** 将文本按宽度拆行（Canvas 测量） */
export function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (!paragraph) {
      lines.push('');
      continue;
    }
    let line = '';
    for (const char of paragraph) {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

/** 绘制多行居中文本，返回占用总高度 */
export function drawWrappedCenterText(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  centerX: number,
  startY: number,
  lineHeight: number,
): number {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], centerX, startY + i * lineHeight);
  }
  return lines.length * lineHeight;
}
