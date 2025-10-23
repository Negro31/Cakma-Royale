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
    
    // Get device-specific canvas size
    const canvasSize = CONFIG.getCanvasSize();
    const displayWidth = canvasSize.width;
    const displayHeight = canvasSize.height;
    
    console.log(`Initializing Pixi: display=${displayWidth}x${displayHeight}, logical=${CONFIG.CANVAS_WIDTH}x${CONFIG.CANVAS_HEIGHT}, player=${this.playerNumber}`);
    
    // Logical size (for game calculations)
    const logicalWidth = CONFIG.CANVAS_WIDTH;
    const logicalHeight = CONFIG.CANVAS_HEIGHT;
    
    this.app = new PIXI.Application({
      width: displayWidth,
      height: displayHeight,
      backgroundColor: CONFIG.CANVAS_BACKGROUND,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
    
    document.getElementById('gameCanvas').appendChild(this.app.view);
    
    console.log(`Pixi created: renderer=${this.app.renderer.width}x${this.app.renderer.height}, view=${this.app.view.width}x${this.app.view.height}`);
    
    // Scale factor for coordinate conversion
    this.scaleX = logicalWidth / displayWidth;
    this.scaleY = logicalHeight / displayHeight;
    
    // Create arena
    this.arena = new Arena(this.app, this.playerNumber);
    
    // Scale arena to fit display
    const scaleRatio = Math.min(displayWidth / logicalWidth, displayHeight / logicalHeight);
    this.arena.container.scale.set(scaleRatio);
    
    // Center the arena
    const scaledWidth = logicalWidth * scaleRatio;
    const scaledHeight = logicalHeight * scaleRatio;
    const offsetX = (displayWidth - scaledWidth) / 2;
    const offsetY = (displayHeight - scaledHeight) / 2;
    
    console.log(`Arena: scale=${scaleRatio}, offset=(${offsetX},${offsetY}), scaled=${scaledWidth}x${scaledHeight}`);
    
    // If player 2, rotate everything 180° so player is always at bottom
    if (this.playerNumber === 2) {
      this.arena.container.rotation = Math.PI;
      this.arena.container.x = displayWidth - offsetX;
      this.arena.container.y = displayHeight - offsetY;
    } else {
      this.arena.container.x = offsetX;
      this.arena.container.y = offsetY;
    }
    
    // Setup input
    this.setupInput();
    
    // Start animation loop
    this.app.ticker.add(() => {
      if (this.arena) {
        this.arena.animate();
      }
    });
    
    // Handle window resize
    this.resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('orientationchange', this.resizeHandler);
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.app) return;
    
    // Debounce resize
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      // Get new canvas size
      const canvasSize = CONFIG.getCanvasSize();
      const displayWidth = canvasSize.width;
      const displayHeight = canvasSize.height;
      
      // Resize renderer
      this.app.renderer.resize(displayWidth, displayHeight);
      
      // Update scale factors
      const logicalWidth = CONFIG.CANVAS_WIDTH;
      const logicalHeight = CONFIG.CANVAS_HEIGHT;
      
      this.scaleX = logicalWidth / displayWidth;
      this.scaleY = logicalHeight / displayHeight;
      
      // Update arena scale and position
      if (this.arena) {
        const scaleRatio = Math.min(displayWidth / logicalWidth, displayHeight / logicalHeight);
        this.arena.container.scale.set(scaleRatio);
        
        const scaledWidth = logicalWidth * scaleRatio;
        const scaledHeight = logicalHeight * scaleRatio;
        const offsetX = (displayWidth - scaledWidth) / 2;
        const offsetY = (displayHeight - scaledHeight) / 2;
        
        // Reposition if player 2
        if (this.playerNumber === 2) {
          this.arena.container.x = displayWidth - offsetX;
          this.arena.container.y = displayHeight - offsetY;
        } else {
          this.arena.container.x = offsetX;
          this.arena.container.y = offsetY;
        }
      }
    }, 250); // Wait 250ms after resize stops
  }
  
  /**
   * Setup input handling
   */
  setupInput() {
    this.app.view.style.cursor = 'default';
    
    // Helper function to get coordinates (works for mouse and touch)
    const getCoords = (e) => {
      // Safety check
      if (!this.app || !this.app.view) {
        console.error('App not ready');
        return { x: 400, y: 900 }; // Default safe position
      }
      
      const rect = this.app.view.getBoundingClientRect();
      let clientX, clientY;
      
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX || 0;
        clientY = e.clientY || 0;
      }
      
      // Get position relative to canvas
      const canvasX = clientX - rect.left;
      const canvasY = clientY - rect.top;
      
      // Get canvas dimensions
      const canvasWidth = rect.width;
      const canvasHeight = rect.height;
      
      // Get arena dimensions
      const logicalWidth = CONFIG.CANVAS_WIDTH;
      const logicalHeight = CONFIG.CANVAS_HEIGHT;
      
      // Calculate scale and offset (same as initPixi)
      const scaleRatio = Math.min(canvasWidth / logicalWidth, canvasHeight / logicalHeight);
      const scaledWidth = logicalWidth * scaleRatio;
      const scaledHeight = logicalHeight * scaleRatio;
      const offsetX = (canvasWidth - scaledWidth) / 2;
      const offsetY = (canvasHeight - scaledHeight) / 2;
      
      // Convert to logical coordinates
      let logicalX = (canvasX - offsetX) / scaleRatio;
      let logicalY = (canvasY - offsetY) / scaleRatio;
      
      // If player 2, flip coordinates (because arena is rotated visually)
      if (this.playerNumber === 2) {
        logicalX = logicalWidth - logicalX;
        logicalY = logicalHeight - logicalY;
      }
      
      // Clamp to arena bounds
      logicalX = Math.max(0, Math.min(logicalWidth, logicalX));
      logicalY = Math.max(0, Math.min(logicalHeight, logicalY));
      
      console.log(`🖱️ Mouse: canvas(${canvasX.toFixed(0)},${canvasY.toFixed(0)}) -> logical(${logicalX.toFixed(0)},${logicalY.toFixed(0)}) [P${this.playerNumber}]`);
      
      return { x: logicalX, y: logicalY };
    };
    
    // Mouse/Touch move
    const handleMove = (e) => {
      const coords = getCoords(e);
      
      // Validate coordinates
      if (isNaN(coords.x) || isNaN(coords.y)) {
        return;
      }
      
      if (!this.cardSystem.hasSelection()) {
        this.arena.hideSpawnIndicator();
        return;
      }
      
      const valid = this.arena.isValidSpawnPosition(coords.x, coords.y);
      this.arena.showSpawnIndicator(coords.x, coords.y, valid);
      this.app.view.style.cursor = valid ? 'pointer' : 'not-allowed';
    };
    
    this.app.view.addEventListener('mousemove', handleMove);
    this.app.view.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handleMove(e);
    }, { passive: false });
    
    // Mouse/Touch click
    const handleClick = (e) => {
      const selection = this.cardSystem.getSelectedCard();
      if (!selection.card) {
        console.log('❌ No card selected');
        return;
      }
      
      const coords = getCoords(e);
      
      // Validate coordinates before proceeding
      if (isNaN(coords.x) || isNaN(coords.y)) {
        console.error('❌ Cannot spawn: invalid coordinates');
        return;
      }
      
      console.log(`🎯 Click at: client(${coords.x.toFixed(0)},${coords.y.toFixed(0)})`);
      
      if (this.arena.isValidSpawnPosition(coords.x, coords.y)) {
        console.log('✅ Valid position, spawning...');
        this.spawnUnit(selection.card.id, coords.x, coords.y, selection.index);
        this.cardSystem.deselectCard();
        this.arena.hideSpawnIndicator();
        this.app.view.style.cursor = 'default';
      } else {
        console.warn(`❌ Invalid spawn position: y=${coords.y}, midY=${CONFIG.CANVAS_HEIGHT/2}, needsY>${CONFIG.CANVAS_HEIGHT/2}`);
      }
    };
    
    this.app.view.addEventListener('click', handleClick);
    this.app.view.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleClick(e);
    }, { passive: false });
    
    // Mouse/Touch leave
    const handleLeave = () => {
      this.arena.hideSpawnIndicator();
      this.app.view.style.cursor = 'default';
    };
    
    this.app.view.addEventListener('mouseleave', handleLeave);
    this.app.view.addEventListener('touchcancel', handleLeave);
  }
  
  /**
   * Spawn a unit
   */
  spawnUnit(unitType, x, y, cardIndex) {
    // Client coordinates are already in logical space
    // But we need to send them to server in "physical" arena space
    
    let serverX = x;
    let serverY = y;
    
    // If player 2, we need to flip back to server's coordinate system
    // because server sees arena from player 1's perspective
    if (this.playerNumber === 2) {
      serverX = CONFIG.CANVAS_WIDTH - x;
      serverY = CONFIG.CANVAS_HEIGHT - y;
    }
    
    // Ensure coordinates are valid numbers
    const validX = Math.round(serverX);
    const validY = Math.round(serverY);
    
    console.log(`Spawning: client(${x.toFixed(0)},${y.toFixed(0)}) -> server(${validX},${validY}) [player ${this.playerNumber}]`);
    
    if (isNaN(validX) || isNaN(validY)) {
      console.error('Invalid coordinates, not sending to server');
      return;
    }
    
    this.network.spawnUnit(unitType, validX, validY, cardIndex);
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
    
    // Update player info (only own elixir, not enemy's)
    const player = state.players.find(p => p.playerNumber === this.playerNumber);
    
    if (player) {
      document.getElementById('playerElixir').textContent = player.elixir.toFixed(1);
      this.cardSystem.updateHand(player.hand, player.elixir);
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
    // Remove event listeners
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      window.removeEventListener('orientationchange', this.resizeHandler);
    }
    
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
