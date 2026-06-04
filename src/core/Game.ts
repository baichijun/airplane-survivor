import { GameState } from '../types';
import { Engine } from './Engine';
import { Input } from './Input';
import { Player } from '../entities/Player';
import { SelectionPhantom } from '../entities/SelectionPhantom';
import { Bullet } from '../entities/Bullet';
import type { Enemy } from '../entities/Enemy';
import { CollisionSystem } from '../systems/CollisionSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { ExpSystem } from '../systems/ExpSystem';
import { BossSystem } from '../systems/BossSystem';
import { HUD } from '../ui/HUD';
import { LevelUpOverlay } from '../ui/LevelUpOverlay';
import { RelicOverlay } from '../ui/RelicOverlay';
import { GameOverOverlay, MenuOverlay } from '../ui/GameOverOverlay';
import { MobileControls } from '../ui/MobileControls';
import { applyUpgrade, pickRandomUpgrades } from '../config/upgrades';
import {
  applyRelic,
  applyRelicSkip,
  createEmptyPickCounts,
  getXpMultiplier,
  pickRelicRewardOptions,
} from '../config/relics';
import {
  ENEMY_SPEED_MULT_DURING_BOSS,
  GAME_HEIGHT,
  INVINCIBLE_DURATION,
  LEVEL_UP_HEAL_BONUS,
  LEVEL_UP_MAX_HP_BONUS,
  getEnemyCap,
} from '../config/balance';
import type { GameMode, PauseKind, RelicRewardOption, UpgradeDef, UpgradePickCounts } from '../types';

/** 背景星空粒子数量 */
const STAR_COUNT = 30;
/** 星空向下滚动速度（像素/秒） */
const STAR_SCROLL_SPEED = 20;

/** 游戏主控制器：状态机 + 主循环 */
export class Game {
  private engine: Engine;
  private input: Input;
  private state: GameState = GameState.MENU;

  private player = new Player();
  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private collision = new CollisionSystem();
  private combat = new CombatSystem();
  private spawn = new SpawnSystem();
  private bossSystem = new BossSystem();
  private exp = new ExpSystem();
  private hud = new HUD();
  private levelUpOverlay = new LevelUpOverlay();
  private relicOverlay = new RelicOverlay();
  private gameOverOverlay = new GameOverOverlay();
  private menuOverlay = new MenuOverlay();
  private mobileControls = new MobileControls();

  private kills = 0;
  private lastTime = 0;
  private wasPointerDown = false;
  /** 暂停界面：区分点击选卡与持续按住（摇杆/拖拽） */
  private wasPointerDownPaused = false;
  private pauseKind: PauseKind = 'level_up';
  private upgradePickCounts: UpgradePickCounts = createEmptyPickCounts();
  /** 暂停选奖励时操控的幻影（真实自机保持进入暂停时的位置） */
  private selectionPhantom: SelectionPhantom | null = null;

  constructor(canvasId: string) {
    this.engine = new Engine(canvasId);
    this.input = new Input(this.engine);
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(now: number): void {
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = this.engine.clampDelta(rawDt);

    this.handlePointer();
    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  private handlePointer(): void {
    if (this.state === GameState.PLAYING) return;

    if (this.state === GameState.PAUSED) {
      const justPressed = this.input.pointerDown && !this.wasPointerDownPaused;
      this.wasPointerDownPaused = this.input.pointerDown;
      if (justPressed && this.input.pointer) {
        const { x, y } = this.input.pointer;
        if (this.pauseKind === 'level_up') {
          const chosen = this.levelUpOverlay.hitTest(x, y);
          if (chosen) this.confirmUpgrade(chosen);
        } else {
          const chosen = this.relicOverlay.hitTest(x, y);
          if (chosen) this.confirmRelic(chosen);
        }
      }
      return;
    }

    const ptr = this.input.consumePointer();
    if (!ptr) return;

    if (this.state === GameState.MENU) {
      const mode = this.menuOverlay.hitTest(ptr.x, ptr.y);
      if (mode) this.startGame(mode);
      return;
    }

    if (this.state === GameState.GAME_OVER && this.gameOverOverlay.hitTest(ptr.x, ptr.y)) {
      this.state = GameState.MENU;
      return;
    }
  }

  private confirmUpgrade(chosen: UpgradeDef): void {
    applyUpgrade(this.player, chosen.id);
    this.upgradePickCounts[chosen.id] += 1;
    this.levelUpOverlay.hide();
    this.finishPauseSelection(() => {
      if (this.exp.shouldLevelUp()) {
        this.triggerLevelUp();
      } else {
        this.state = GameState.PLAYING;
      }
    });
  }

  private confirmRelic(chosen: RelicRewardOption): void {
    if (chosen.kind === 'relic') {
      applyRelic(this.player, chosen.relic.id);
    } else {
      applyRelicSkip(this.player);
    }
    this.relicOverlay.hide();
    this.finishPauseSelection(() => {
      if (this.exp.shouldLevelUp()) {
        this.triggerLevelUp();
      } else {
        this.state = GameState.PLAYING;
      }
    });
  }

  /** 场景切换时清理摇杆，避免残留拖拽导致自机瞬移 */
  private clearMobileInput(): void {
    this.input.clearJoystick();
    this.input.setJoystickCaptured(false);
    this.mobileControls.resetJoystick();
  }

  private spawnSelectionPhantom(): void {
    this.selectionPhantom = SelectionPhantom.spawnAt(this.player);
  }

  private destroySelectionPhantom(): void {
    this.selectionPhantom = null;
  }

  /** 结束暂停选择；若回到战斗则给予短暂无敌 */
  private finishPauseSelection(onContinue: () => void): void {
    this.destroySelectionPhantom();
    this.clearMobileInput();
    onContinue();
    if (this.state === GameState.PLAYING) {
      this.player.invincibleTimer = Math.max(this.player.invincibleTimer, INVINCIBLE_DURATION);
    }
  }

  private startGame(mode: GameMode): void {
    this.state = GameState.PLAYING;
    this.player.reset(mode);
    this.bullets = [];
    this.enemies = [];
    this.spawn.reset();
    this.bossSystem.reset();
    this.exp.reset();
    this.kills = 0;
    this.wasPointerDown = false;
    this.upgradePickCounts = createEmptyPickCounts();
  }

  private triggerLevelUp(): void {
    this.pauseKind = 'level_up';
    this.wasPointerDownPaused = this.input.pointerDown;
    this.clearMobileInput();
    this.performLevelUp();
    this.levelUpOverlay.show(
      pickRandomUpgrades(3),
      this.upgradePickCounts,
      this.player,
    );
    this.spawnSelectionPhantom();
    this.state = GameState.PAUSED;
  }

  private triggerRelicReward(): void {
    this.pauseKind = 'relic_reward';
    this.wasPointerDownPaused = this.input.pointerDown;
    this.clearMobileInput();
    this.relicOverlay.show(pickRelicRewardOptions(this.player.relics));
    this.spawnSelectionPhantom();
    this.state = GameState.PAUSED;
  }

  private onBossKilled(): void {
    this.bossSystem.onBossKilled(this.spawn.elapsedSec);
    const need = this.exp.xpRequired - this.exp.currentXp;
    if (need > 0) this.exp.addXp(need);
    this.performLevelUp();
    this.triggerRelicReward();
  }

  /** 角色升级：等级 +1，并自动增加生命上限与恢复生命 */
  private performLevelUp(): void {
    this.exp.levelUp();
    this.player.maxHp += this.player.scaleHpGain(LEVEL_UP_MAX_HP_BONUS);
    this.player.hp = Math.min(
      this.player.maxHp,
      this.player.hp + this.player.scaleHealAmount(LEVEL_UP_HEAL_BONUS),
    );
  }

  private update(dt: number): void {
    if (this.state === GameState.PLAYING) {
      this.updatePlaying(dt);
    } else if (this.state === GameState.PAUSED) {
      this.updatePaused(dt);
    }
  }

  private updatePaused(dt: number): void {
    const phantom = this.selectionPhantom;
    if (!phantom) return;

    this.mobileControls.updateFromPointer(this.input);
    phantom.update(dt, this.input);

    if (this.pauseKind === 'level_up') {
      const chosen = this.levelUpOverlay.updateSelection(phantom.x, phantom.y, dt);
      if (chosen) this.confirmUpgrade(chosen);
    } else {
      const chosen = this.relicOverlay.updateSelection(phantom.x, phantom.y, dt);
      if (chosen) this.confirmRelic(chosen);
    }
  }

  private updatePlayingControls(): void {
    const justPressed = this.input.pointerDown && !this.wasPointerDown;
    this.wasPointerDown = this.input.pointerDown;

    const action = this.mobileControls.updateFromPointer(this.input);
    if (justPressed && action === 'shield') {
      this.player.tryActivateShield();
    }
    if (this.input.consumeShieldRequest()) {
      this.player.tryActivateShield();
    }
  }

  private getHomingTargets(): { x: number; y: number }[] {
    const targets = this.enemies.filter((e) => e.active).map((e) => ({ x: e.x, y: e.y }));
    if (this.bossSystem.boss?.active) {
      targets.push({ x: this.bossSystem.boss.x, y: this.bossSystem.boss.y });
    }
    return targets;
  }

  private updatePlaying(dt: number): void {
    this.updatePlayingControls();
    this.player.update(dt, this.input);

    this.exp.tickPassive(dt, getXpMultiplier(this.player));

    const newBullets = this.combat.firePlayer(this.player);
    this.bullets.push(...newBullets);
    this.bullets.push(...this.combat.fireDrones(this.player));

    const enemyCap = getEnemyCap(
      this.spawn.elapsedSec,
      this.bossSystem.bossesDefeated,
    );
    const spawned = this.spawn.update(dt, this.enemies, enemyCap);
    if (spawned) this.enemies.push(spawned);

    const newBoss = this.bossSystem.trySpawn(this.spawn.elapsedSec);
    if (newBoss) this.bossSystem.boss = newBoss;

    this.bossSystem.update(dt, this.player.x, this.player.y);

    const enemySpeedMult = this.bossSystem.isBossActive ? ENEMY_SPEED_MULT_DURING_BOSS : 1;
    for (const enemy of this.enemies) {
      if (enemy.active) {
        enemy.update(dt, this.player.x, this.player.y, enemySpeedMult);
        const eb = this.combat.fireEnemy(enemy);
        if (eb) this.bullets.push(eb);
      }
    }

    if (this.bossSystem.boss?.active) {
      this.bullets.push(...this.combat.fireBoss(this.bossSystem.boss));
    }

    const homingTargets = this.getHomingTargets();
    for (const b of this.bullets) {
      b.update(dt, this.engine.width, this.engine.height, homingTargets);
    }

    const result = this.collision.resolve(
      this.bullets,
      this.enemies,
      this.player,
      this.bossSystem.boss,
    );

    for (const enemy of result.killedEnemies) {
      const xpGain = Math.max(1, Math.floor(enemy.xpReward * getXpMultiplier(this.player)));
      this.exp.addXp(xpGain);
      this.kills += 1;
      this.player.onEnemyKilled();
    }

    if (result.bossKilled) {
      this.onBossKilled();
      this.bullets = this.bullets.filter((b) => b.active);
      this.enemies = this.enemies.filter((e) => e.active && e.y < GAME_HEIGHT + 60);
      return;
    }

    this.bullets = this.bullets.filter((b) => b.active);
    this.enemies = this.enemies.filter((e) => e.active && e.y < GAME_HEIGHT + 60);

    if (this.exp.shouldLevelUp()) {
      this.triggerLevelUp();
      return;
    }

    if (this.player.hp <= 0) {
      this.state = GameState.GAME_OVER;
    }
  }

  private render(): void {
    const { ctx } = this.engine;
    this.engine.clear();
    this.drawStars(ctx);

    if (this.state === GameState.MENU) {
      this.menuOverlay.draw(ctx);
      return;
    }

    for (const enemy of this.enemies) enemy.draw(ctx);
    if (this.bossSystem.boss?.active) this.bossSystem.boss.draw(ctx);
    for (const b of this.bullets) b.draw(ctx);
    if (this.state !== GameState.PAUSED) {
      this.player.draw(ctx);
    }

    this.hud.draw(ctx, this.player, this.exp, this.spawn.elapsedSec, this.kills);

    if (this.state === GameState.PLAYING) {
      this.mobileControls.draw(ctx, this.player);
    }

    if (this.state === GameState.PAUSED) {
      this.player.draw(ctx);
      this.mobileControls.draw(ctx, this.player);
      if (this.pauseKind === 'level_up') {
        this.levelUpOverlay.draw(ctx);
      } else {
        this.relicOverlay.draw(ctx);
      }
      this.selectionPhantom?.draw(ctx);
    }

    if (this.state === GameState.GAME_OVER) {
      this.gameOverOverlay.draw(ctx, this.spawn.elapsedSec, this.kills, this.exp.level);
    }
  }

  private drawStars(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < STAR_COUNT; i++) {
      const sx = ((i * 73 + 11) % this.engine.width);
      const sy = ((i * 41 + 7 + this.spawn.elapsedSec * STAR_SCROLL_SPEED) % this.engine.height);
      ctx.fillStyle = `rgba(255,255,255,${0.15 + (i % 4) * 0.08})`;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
  }
}
