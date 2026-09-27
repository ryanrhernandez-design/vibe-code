import './styles.css';
import { Game } from './game/game';

const game = new Game();
game.showFront();

// Handy for debugging and automated checks in the browser console.
(window as unknown as { game: Game }).game = game;
