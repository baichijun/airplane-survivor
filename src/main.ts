import './fonts.css';
import './style.css';
import { Game } from './core/Game';
import { loadDefeatBoomSprites } from './effects/DefeatBoomSprites';
import { confirmLiveUpdateReady, prepareLiveUpdate } from './liveUpdate';
import { initNativeShell } from './native';
import { loadShipSprites } from './ui/SpriteLoader';
import { loadUiFonts } from './ui/theme';

Promise.all([
  loadShipSprites(),
  loadDefeatBoomSprites(),
  loadUiFonts(),
  initNativeShell(),
  prepareLiveUpdate(),
]).then(async () => {
  new Game('game-canvas');
  await confirmLiveUpdateReady();
});