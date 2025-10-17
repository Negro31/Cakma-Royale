import { CONFIG } from '../utils/config.js';
import { MathUtils } from '../utils/math.js';
import { Network } from './Network.js';
import { Arena } from './Arena.js';
import { CardSystem } from './CardSystem.js';

/**
 * Main Game class coordinating all game components
 */
export class Game {
  constructor() {
    this.app = null;
    this.network = new Network();
    this.arena = null;
    this.cardSystem = new CardSystem();
    
    this.playerNumber = null;
    this.gameState = null;
    this.isPlaying = false;
    
    this.setupUI();
  }
  
  /**
   * Initialize the game
   */
  async init() {
    try {
      await this.network.connect();
      this.updateConnectionStatus(true);
      this.setupNetworkListeners();
    } catch (error) {
      console.error('Failed to connect:', error);
      this.updateConnectionStatus(false);
    }
  }
  
  /**
   * Setup UI elements and event listeners
   */
  setupUI() {
    // Menu buttons
    document.getElementById('findMatchBtn').addEventListener('click', () => {
      this.findMatch();
    });
    
    document.getElementById('cancelMatchBtn').addEventListener('click', () => {
      this.cancelMatch();
    });
    
    document.getElementById('playAgainBtn').addEventListener('click', () => {
      this.playAgain();
    });
    
    // Card selection
    this.cardSystem.onCardSelected = (card, index) => {
      if (card) {
        console.log('Card selected, click on arena to spawn');
      }
    };
  }
  
  /**
   * Setup network event listeners
   */
  setupNetworkListeners() {
    this.network.on('matchFound', (data) => {
      this.handleMatchFound(data);
    });
    
    this.network.on('gameStart', (data) => {
      this.handleGameStart(data);
    });
    
    this.network.on('gameState', (data) => {
      this.handleGameState(data);
    });
    
    this.network.on('gameOver', (data) => {
      this.handleGameOver(data);
    });
    
    this.network.on('disconnect', () => {
      this.updateConnectionStatus(false);
      if (this.isPlaying) {
        this.showError('Disconnected from server');
      }
    });
    
    this.network.on('error', (data) => {
      this.showError(data.message);
    });
  }
  
  /**
   * Find a match
   */
  findMatch() {
    this.network.findMatch();
    document.getElementById('statusText').textContent = 'Finding match...';
    document.getElementById('findMatchBtn').style.display = 'none';
    document.getElementById('cancelMatchBtn').style.display = 'inline-block';
  }
  
  /**
   * Cancel matchmaking
   */
  cancelMatch() {
    this.network.cancelMatch();
    document.getElementById('statusText').textContent = 'Ready to play';
    document.getElementById('findMatchBtn').style.display = 'inline-block';
    document.getElementById('cancelMatchBtn').style.display = 'none';
  }
  
  /**
   * Handle match found
   */
  handleMatchFound(data) {
    console.log('Match found!', data);
    this.playerNumber = data.playerNumber;
    document.getElementById('statusText').textContent = 'Match found! Starting...';
  }
  
  /**
   * Handle game start
   */
  handleGameStart(data) {
    console.log('Game starting!', data);
    this.isPlaying = true;
    
    // Hide menu, show game
    document.getElementById('mainMenu').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');
    
    // Initialize Pixi.js
    this.initPixi();
    
    // Show card hand
    this.cardSystem.show();
  }
  
  /**
   * Initialize Pixi.js application
   */
  initPixi() {
    if (this.app) {
      this.app.destroy(true);
    }
    
    this.app = new PIXI.Application({
      width: CONFIG.CANVAS_WIDTH,
      height: CONFIG.CANVAS_HEIGHT,
      backgroundColor: CONFIG.CANVAS_BACKGROUND,
      antialias: true
    });
    
    document.getElementById('gameCanvas').appendChild(this.app.view);
    
    // Create arena
    this.arena = new Arena(this.app, this.playerNumber);
    
    // Setup input
    this.setupInput();
    
    // Start animation loop
    this.app.ticker.add(() => {
      if (this.arena) {
        this.arena.animate();
      }
    });
  }
  
  /**
   * Setup input handling
   */
  setupInput() {
    this.app.view.style.cursor = 'default';
    
    // Mouse move - show spawn indicator
    this.app.view.addEventListener('mousemove', (e) => {
      if (!this.cardSystem.hasSelection()) {
        this.arena.hideSpawnIndicator();
        return;
      }
      
      const rect = this.app.view.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const valid = this.arena.isValidSpawnPosition(x, y);
      this.arena.showSpawnIndicator(x, y, valid);
      
      this.app.view.style.cursor = valid ? 'pointer' : 'not-allowed';
    });
    
    // Mouse click - spawn unit
    this.app.view.addEventListener('click', (e) => {
      const selection = this.cardSystem.getSelectedCard();
      if (!selection.card) return;
      
      const rect = this.app.view.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (this.arena.isValidSpawnPosition(x, y)) {
        this.spawnUnit(selection.card.id, x, y, selection.index);
        this.cardSystem.deselectCard();
        this.arena.hideSpawnIndicator();
        this.app.view.style.cursor = 'default';
      }
    });
    
    // Mouse leave - hide indicator
    this.app.view.addEventListener('mouseleave', () => {
      this.arena.hideSpawnIndicator();
      this.app.view.style.cursor = 'default';
    });
  }
  
  /**
   * Spawn a unit
   */
  spawnUnit(unitType, x, y, cardIndex) {
    this.network.spawnUnit(unitType, x, y, cardIndex);
  }
  
  /**
   * Handle game state update
   */
  handleGameState(state) {
    this.gameState = state;
    
    // Update arena
    if (this.arena) {
      this.arena.updateTowers(state.towers);
      this.arena.updateUnits(state.units);
    }
    
    // Update player info
    const player = state.players.find(p => p.playerNumber === this.playerNumber);
    const enemy = state.players.find(p => p.playerNumber !== this.playerNumber);
    
    if (player) {
      document.getElementById('playerElixir').textContent = player.elixir.toFixed(1);
      this.cardSystem.updateHand(player.hand, player.elixir);
    }
    
    if (enemy) {
      document.getElementById('enemyElixir').textContent = enemy.elixir.toFixed(1);
    }
    
    // Update timer
    if (state.timeRemaining !== undefined) {
      document.getElementById('matchTimer').textContent = MathUtils.formatTime(state.timeRemaining);
    }
  }
  
  /**
   * Handle game over
   */
  handleGameOver(data) {
    console.log('Game over!', data);
    this.isPlaying = false;
    
    // Show game over screen
    const gameOverTitle = document.getElementById('gameOverTitle');
    const gameOverText = document.getElementById('gameOverText');
    
    if (data.winner === this.playerNumber) {
      gameOverTitle.textContent = 'Victory!';
      gameOverText.textContent = 'You destroyed the enemy towers!';
    } else if (data.winner === null) {
      gameOverTitle.textContent = 'Draw!';
      gameOverText.textContent = 'Time ran out with equal tower HP!';
    } else {
      gameOverTitle.textContent = 'Defeat';
      gameOverText.textContent = data.reason || 'Your towers were destroyed!';
    }
    
    document.getElementById('gameOverScreen').classList.add('active');
    
    // Hide card hand
    this.cardSystem.hide();
  }
  
  /**
   * Play again
   */
  playAgain() {
    // Clean up current game
    if (this.arena) {
      this.arena.destroy();
      this.arena = null;
    }
    
    if (this.app) {
      this.app.destroy(true);
      this.app = null;
    }
    
    this.cardSystem.reset();
    this.gameState = null;
    this.playerNumber = null;
    
    // Return to main menu
    document.getElementById('gameOverScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('mainMenu').classList.add('active');
    
    document.getElementById('statusText').textContent = 'Ready to play';
    document.getElementById('findMatchBtn').style.display = 'inline-block';
    document.getElementById('cancelMatchBtn').style.display = 'none';
  }
  
  /**
   * Update connection status indicator
   */
  updateConnectionStatus(connected) {
    const indicator = document.getElementById('connectionStatus');
    const text = document.getElementById('connectionText');
    
    if (connected) {
      indicator.classList.add('connected');
      indicator.classList.remove('disconnected');
      text.textContent = 'Connected';
    } else {
      indicator.classList.remove('connected');
      indicator.classList.add('disconnected');
      text.textContent = 'Disconnected';
    }
  }
  
  /**
   * Show error message
   */
  showError(message) {
    console.error(message);
    alert(message);
  }
  }
