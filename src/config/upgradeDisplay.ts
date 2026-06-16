import type { UpgradeId } from '../types';
import type { Player } from '../entities/Player';
import { applyUpgrade } from './upgrades';

export interface UpgradeStatDisplay {
  label: string;
  before: string;
  after: string;
  /** 次要说明（如装甲强化的恢复量），显示在 label 与黄字之间 */
  detail?: string;
}

interface CombatStatsSnapshot {
  attackSpeed: number;
  bulletDamage: number;
  bulletCount: number;
  speed: number;
  maxHp: number;
  hp: number;
  droneDamageMult: number;
  droneAttackSpeedMult: number;
}

function snapshotCombatStats(player: Player): CombatStatsSnapshot {
  return {
    attackSpeed: player.attackSpeed,
    bulletDamage: player.bulletDamage,
    bulletCount: player.bulletCount,
    speed: player.speed,
    maxHp: player.maxHp,
    hp: player.hp,
    droneDamageMult: player.droneDamageMult,
    droneAttackSpeedMult: player.droneAttackSpeedMult,
  };
}

function restoreCombatStats(player: Player, snap: CombatStatsSnapshot): void {
  player.attackSpeed = snap.attackSpeed;
  player.bulletDamage = snap.bulletDamage;
  player.bulletCount = snap.bulletCount;
  player.speed = snap.speed;
  player.maxHp = snap.maxHp;
  player.hp = snap.hp;
  player.droneDamageMult = snap.droneDamageMult;
  player.droneAttackSpeedMult = snap.droneAttackSpeedMult;
}

/** 间隔秒数：最多 2 位小数，去尾零 */
function formatInterval(seconds: number): string {
  const rounded = Math.round(seconds * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, '');
  return `${text}s`;
}

function formatInteger(value: number): string {
  return String(Math.round(value));
}

/** 固定保留 1 位小数（用于子弹威力等） */
function formatOneDecimal(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

function readDisplayValues(id: UpgradeId, player: Player): Pick<UpgradeStatDisplay, 'before' | 'after' | 'detail'> {
  switch (id) {
    case 'attackSpeed':
      return {
        before: formatInterval(player.attackSpeed),
        after: formatInterval(player.attackSpeed),
      };
    case 'bulletDamage':
      return {
        before: formatOneDecimal(player.bulletDamage),
        after: formatOneDecimal(player.bulletDamage),
      };
    case 'bulletCount':
      return {
        before: formatInteger(player.bulletCount),
        after: formatInteger(player.bulletCount),
      };
    case 'moveSpeed':
      return {
        before: formatInteger(player.speed),
        after: formatInteger(player.speed),
      };
    case 'maxHp':
      return {
        before: formatInteger(player.maxHp),
        after: formatInteger(player.maxHp),
        detail: undefined,
      };
    case 'droneDamage':
      return {
        before: formatOneDecimal(player.getDroneBulletDamage()),
        after: formatOneDecimal(player.getDroneBulletDamage()),
      };
    case 'droneAttackSpeed':
      return {
        before: formatInterval(player.getDroneAttackInterval()),
        after: formatInterval(player.getDroneAttackInterval()),
      };
  }
}

function getLabel(id: UpgradeId): string {
  switch (id) {
    case 'attackSpeed':
      return '射击间隔';
    case 'bulletDamage':
      return '子弹威力';
    case 'bulletCount':
      return '弹道数';
    case 'moveSpeed':
      return '移动速度';
    case 'maxHp':
      return '最大生命';
    case 'droneDamage':
      return '无人机伤害';
    case 'droneAttackSpeed':
      return '无人机射速';
  }
}

/** 合并属性名与描述为单行效果摘要（如「移动速度」+「移速 +10%」→「移动速度+10%」） */
export function formatUpgradeEffectSummary(label: string, description: string): string {
  const normalizedLabel = label.replace(/\s+/g, '');
  const normalizedDesc = description.replace(/\s+/g, '');
  if (normalizedDesc.startsWith(normalizedLabel)) {
    return description.replace(/\s+/g, ' ').trim();
  }
  const effectMatch = description.match(/[+×*×][\s\S]+/);
  const effect = effectMatch ? effectMatch[0].replace(/\s+/g, '') : normalizedDesc;
  return `${normalizedLabel}${effect}`;
}

/**
 * 基于玩家当前实际属性计算升级前后展示（含宝物等所有加成）
 * 通过快照 → applyUpgrade → 还原，保证与实战效果一致
 */
export function getUpgradeStatDisplay(id: UpgradeId, player: Player): UpgradeStatDisplay {
  const snap = snapshotCombatStats(player);
  const beforeValues = readDisplayValues(id, player);

  applyUpgrade(player, id);

  const afterValues = readDisplayValues(id, player);
  let detail = beforeValues.detail;

  if (id === 'maxHp') {
    const healAmount = player.hp - snap.hp;
    if (healAmount > 0) {
      detail = `恢复 ${healAmount} 生命`;
    }
  }

  restoreCombatStats(player, snap);

  return {
    label: getLabel(id),
    before: beforeValues.before,
    after: afterValues.after,
    detail,
  };
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
