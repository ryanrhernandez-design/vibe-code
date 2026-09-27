import './styles.css';
import { Game } from './game/game';

const game = new Game();
game.showMenu();

// Handy for debugging in the browser console.
(window as unknown as { game: Game }).game = game;
