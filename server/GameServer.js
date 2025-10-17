const CONSTANTS = require('../shared/constants');
const Player = require('./Player');
const Match = require('./Match');
const config = require('./config');
const { Logger, validateSpawnPosition } = require('./utils/helpers');

/**
 * GameServer handles all game logic and matchmaking
 */
class GameServer {
  constructor(io) {
    this.io = io;
    this.players = new Map(); // socketId -> Player
    this.matches = new Map(); // matchId -> Match
    this.matchmakingQueue = [];
    this.tickInterval = null;
    
    this.setupSocketHandlers();
    this.startGameLoop();
    
    Logger.info('GameServer initialized');
  }
  
  /**
   * Setup socket.io event handlers
   */
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      if (config.LOG_CONNECTIONS) {
        Logger.info(`Client connected: ${socket.id}`);
      }
      
      // Create player
      const player = new Player(socket.id, socket);
      this.players.set(socket.id, player);
      
      // Find match
      socket.on(CONSTANTS.EVENTS.FIND_MATCH, () => {
        this.handleFindMatch(player);
      });
      
      // Spawn unit
      socket.on(CONSTANTS.EVENTS.SPAWN_UNIT, (data) => {
        this.handleSpawnUnit(player, data);
      });
      
      // Cancel matchmaking
      socket.on(CONSTANTS.EVENTS.CANCEL_MATCH, () => {
        this.handleCancelMatch(player);
      });
      
      // Disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(player);
      });
    });
  }
  
  /**
   * Handle player requesting to find a match
   */
  handleFindMatch(player) {
    // Check if already in queue or match
    if (this.matchmakingQueue.includes(player)) {
      Logger.debug(`Player ${player.id} already in matchmaking queue`);
      return;
    }
    
    if (player.matchId) {
      Logger.debug(`Player ${player.id} already in a match`);
      return;
    }
    
    // Add to queue
    this.matchmakingQueue.push(player);
    Logger.info(`Player ${player.id} joined matchmaking queue (${this.matchmakingQueue.length} waiting)`);
    
    // Try to create match
    this.tryCreateMatch();
  }
  
  /**
   * Try to create a match from queue
   */
  tryCreateMatch() {
    if (this.matchmakingQueue.length < 2) return;
    
    // Take first two players
    const player1 = this.matchmakingQueue.shift();
    const player2 = this.matchmakingQueue.shift();
    
    // Assign player numbers
    player1.playerNumber = 1;
    player2.playerNumber = 2;
    
    // Create match
    const match = new Match(player1, player2);
    this.matches.set(match.id, match);
    
    // Link players to match
    player1.matchId = match.id;
    player2.matchId = match.id;
    
    // Notify players
    player1.emit(CONSTANTS.EVENTS.MATCH_FOUND, {
      matchId: match.id,
      playerNumber: 1,
      opponent: { id: player2.id }
    });
    
    player2.emit(CONSTANTS.EVENTS.MATCH_FOUND, {
      matchId: match.id,
      playerNumber: 2,
      opponent: { id: player1.id }
    });
    
    // Start match after brief delay
    setTimeout(() => {
      match.start();
      this.broadcastToMatch(match, CONSTANTS.EVENTS.GAME_START, {
        startTime: match.startTime
      });
    }, 1000);
  }
  
  /**
   * Handle unit spawn request
   */
  handleSpawnUnit(player, data) {
    const { unitType, x, y, cardIndex } = data;
    
    // Validate player is in a match
    if (!player.matchId) {
      player.emit(CONSTANTS.EVENTS.ERROR, { message: 'Not in a match' });
      return;
    }
    
    const match = this.matches.get(player.matchId);
    if (!match || match.state !== CONSTANTS.GAME_STATES.PLAYING) {
      player.emit(CONSTANTS.EVENTS.ERROR, { message: 'Match not active' });
      return;
    }
    
    // Validate spawn position
    if (!validateSpawnPosition(x, y, player.playerNumber, CONSTANTS.ARENA_WIDTH, CONSTANTS.ARENA_HEIGHT)) {
      player.emit(CONSTANTS.EVENTS.ERROR, { message: 'Invalid spawn position' });
      return;
    }
    
    // Spawn unit
    const success = match.spawnUnit(player, unitType, x, y, cardIndex);
    if (!success) {
      player.emit(CONSTANTS.EVENTS.ERROR, { message: 'Cannot spawn unit (not enough elixir?)' });
    }
  }
  
  /**
   * Handle cancel matchmaking
   */
  handleCancelMatch(player) {
    const index = this.matchmakingQueue.indexOf(player);
    if (index !== -1) {
      this.matchmakingQueue.splice(index, 1);
      Logger.info(`Player ${player.id} left matchmaking queue`);
    }
  }
  
  /**
   * Handle player disconnect
   */
  handleDisconnect(player) {
    if (config.LOG_CONNECTIONS) {
      Logger.info(`Client disconnected: ${player.id}`);
    }
    
    // Remove from matchmaking queue
    this.handleCancelMatch(player);
    
    // Handle match disconnect
    if (player.matchId) {
      const match = this.matches.get(player.matchId);
      if (match) {
        match.handleDisconnect(player.id);
        
        // Notify other player
        const otherPlayer = match.players.find(p => p.id !== player.id);
        if (otherPlayer) {
          otherPlayer.emit(CONSTANTS.EVENTS.GAME_OVER, {
            winner: otherPlayer.playerNumber,
            reason: 'Opponent disconnected'
          });
        }
        
        // Clean up match
        this.matches.delete(player.matchId);
      }
    }
    
    // Remove player
    this.players.delete(player.id);
  }
  
  /**
   * Main game loop
   */
  startGameLoop() {
    this.tickInterval = setInterval(() => {
      this.tick();
    }, CONSTANTS.TICK_INTERVAL);
    
    Logger.info(`Game loop started at ${CONSTANTS.TICK_RATE} ticks per second`);
  }
  
  /**
   * Game tick - update all active matches
   */
  tick() {
    this.matches.forEach((match, matchId) => {
      if (match.state === CONSTANTS.GAME_STATES.PLAYING) {
        match.tick();
        
        // Broadcast state to players
        const state = match.getState();
        this.broadcastToMatch(match, CONSTANTS.EVENTS.GAME_STATE, state);
        
        // Check if match ended
        if (match.state === CONSTANTS.GAME_STATES.FINISHED) {
          this.handleMatchEnd(match);
        }
      }
    });
  }
  
  /**
   * Handle match end
   */
  handleMatchEnd(match) {
    this.broadcastToMatch(match, CONSTANTS.EVENTS.GAME_OVER, {
      winner: match.winner,
      finalState: match.getState()
    });
    
    // Clean up match after delay
    setTimeout(() => {
      // Clear player match references
      match.players.forEach(player => {
        player.matchId = null;
        player.isReady = false;
      });
      
      // Remove match
      this.matches.delete(match.id);
      Logger.info(`Match ${match.id} cleaned up`);
    }, 5000);
  }
  
  /**
   * Broadcast message to all players in a match
   */
  broadcastToMatch(match, event, data) {
    match.players.forEach(player => {
      player.emit(event, data);
    });
  }
  
  /**
   * Get server stats
   */
  getStats() {
    return {
      connectedPlayers: this.players.size,
      activeMatches: this.matches.size,
      queuedPlayers: this.matchmakingQueue.length
    };
  }
  
  /**
   * Shutdown server gracefully
   */
  shutdown() {
    Logger.info('Shutting down game server...');
    
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }
    
    // Notify all players
    this.players.forEach(player => {
      player.emit(CONSTANTS.EVENTS.ERROR, { message: 'Server shutting down' });
    });
    
    Logger.info('Game server shut down complete');
  }
}

module.exports = GameServer;
