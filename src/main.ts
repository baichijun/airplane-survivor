import './style.css';
import { Game } from './core/Game';
import { loadShipSprites } from './ui/SpriteLoader';

loadShipSprites().then(() => {
  new Game('game-canvas');
});
