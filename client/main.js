import { Game } from './game/Game.js';

/**
 * Main entry point for the client application
 */

// Create and initialize game
const game = new Game();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    game.init();
  });
} else {
  game.init();
}

// Make game accessible globally for debugging
window.game = game;

console.log('Clash Royale Clone - Client initialized');
