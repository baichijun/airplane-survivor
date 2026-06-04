import { GameState } from '../types';
import { Engine } from './Engine';
import { Input } from './Input';
import { Player } from '../entities/Player';
import { Bullet } from '../entities/Bullet';
import type { Enemy } from '../entities/Enemy';
import { CollisionSystem } from '../systems/CollisionSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { ExpSystem } from '../systems/ExpSystem';
import { HUD } from '../ui/HUD';
import { LevelUpOverlay } from '../ui/LevelUpOverlay';
import { GameOverOverlay, MenuOverlay } from '../ui/GameOverOverlay';
import { applyUpgrade, pickRandomUpgrades } from '../config/upgrades';
import { GAME_HEIGHT } from '../config/balance';

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
  private exp = new ExpSystem();
  private hud = new HUD();
  private levelUpOverlay = new LevelUpOverlay();
  private gameOverOverlay = new GameOverOverlay();
  private menuOverlay = new MenuOverlay();

  private kills = 0;
  private lastTime = 0;

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
    const ptr = this.input.consumePointer();
    if (!ptr) return;

    if (this.state === GameState.MENU && this.menuOverlay.hitTest(ptr.x, ptr.y)) {
      this.startGame();
      return;
    }

    if (this.state === GameState.GAME_OVER && this.gameOverOverlay.hitTest(ptr.x, ptr.y)) {
      this.state = GameState.MENU;
      return;
    }

    if (this.state === GameState.PAUSED) {
      const chosen = this.levelUpOverlay.hitTest(ptr.x, ptr.y);
      if (chosen) {
        applyUpgrade(this.player, chosen.id);
        this.levelUpOverlay.hide();
        this.state = GameState.PLAYING;
        // 连续升级
        if (this.exp.shouldLevelUp()) {
          this.triggerLevelUp();
        }
      }
    }
  }

  private startGame(): void {
    this.state = GameState.PLAYING;
    this.player.reset();
    this.bullets = [];
    this.enemies = [];
    this.spawn.reset();
    this.exp.reset();
    this.kills = 0;
  }

  private triggerLevelUp(): void {
    this.exp.levelUp();
    this.levelUpOverlay.show(pickRandomUpgrades(3));
    this.state = GameState.PAUSED;
  }

  private update(dt: number): void {
    if (this.state === GameState.PLAYING) {
      this.updatePlaying(dt);
    }
  }

  private updatePlaying(dt: number): void {
    this.player.update(dt, this.input);

    // 被动经验
    this.exp.tickPassive(dt);

    // 玩家射击
    const newBullets = this.combat.firePlayer(this.player);
    this.bullets.push(...newBullets);

    // 生成敌机
    const spawned = this.spawn.update(dt, this.enemies);
    if (spawned) this.enemies.push(spawned);

    // 更新敌机
    for (const enemy of this.enemies) {
      if (enemy.active) {
        enemy.update(dt, this.player.x, this.player.y);
        const eb = this.combat.fireEnemy(enemy);
        if (eb) this.bullets.push(eb);
      }
    }

    // 更新子弹
    for (const b of this.bullets) {
      b.update(dt, this.engine.width, this.engine.height);
    }

    // 碰撞
    const result = this.collision.resolve(this.bullets, this.enemies, this.player);
    for (const enemy of result.killedEnemies) {
      this.exp.addXp(enemy.xpReward);
      this.kills += 1;
    }

    // 清理
    this.bullets = this.bullets.filter((b) => b.active);
    this.enemies = this.enemies.filter((e) => e.active && e.y < GAME_HEIGHT + 60);

    // 升级判定
    if (this.exp.shouldLevelUp()) {
      this.triggerLevelUp();
      return;
    }

    // 游戏结束
    if (this.player.hp <= 0) {
      this.state = GameState.GAME_OVER;
    }
  }

  private render(): void {
    const { ctx } = this.engine;
    this.engine.clear();

    // 背景星点
    this.drawStars(ctx);

    if (this.state === GameState.MENU) {
      this.menuOverlay.draw(ctx);
      return;
    }

    // 游戏实体
    for (const enemy of this.enemies) enemy.draw(ctx);
    for (const b of this.bullets) b.draw(ctx);
    this.player.draw(ctx);

    this.hud.draw(ctx, this.player, this.exp, this.spawn.elapsedSec, this.kills);

    if (this.state === GameState.PAUSED) {
      this.levelUpOverlay.draw(ctx);
    }

    if (this.state === GameState.GAME_OVER) {
      this.gameOverOverlay.draw(ctx, this.spawn.elapsedSec, this.kills, this.exp.level);
    }
  }

  private drawStars(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < 30; i++) {
      const sx = ((i * 73 + 11) % this.engine.width);
      const sy = ((i * 41 + 7 + this.spawn.elapsedSec * 20) % this.engine.height);
      ctx.fillStyle = `rgba(255,255,255,${0.15 + (i % 4) * 0.08})`;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
  }
}
