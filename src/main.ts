import './style.css';
import { Game } from './core/Game';
import { loadShipSprites } from './ui/SpriteLoader';
import { loadUiFonts } from './ui/theme';

Promise.all([loadShipSprites(), loadUiFonts()]).then(() => {
  new Game('game-canvas');
});
