import './style.css';
import { Game } from './core/Game';
import { loadDefeatBoomSprites } from './effects/DefeatBoomSprites';
import { loadShipSprites } from './ui/SpriteLoader';
import { loadUiFonts } from './ui/theme';

Promise.all([loadShipSprites(), loadDefeatBoomSprites(), loadUiFonts()]).then(() => {
  new Game('game-canvas');
});
