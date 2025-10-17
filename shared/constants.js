// Shared constants between client and server
// This file must be identical on both sides

const GAME_CONSTANTS = {
  // Arena dimensions
  ARENA_WIDTH: 800,
  ARENA_HEIGHT: 1200,
  
  // Game mechanics
  STARTING_ELIXIR: 5,
  MAX_ELIXIR: 10,
  ELIXIR_REGEN_RATE: 1, // per second
  ELIXIR_REGEN_INTERVAL: 1000, // milliseconds
  
  // Tower positions (relative to arena)
  TOWER_POSITIONS: {
    PLAYER1: {
      MAIN: { x: 400, y: 1050 },
      LEFT: { x: 200, y: 950 },
      RIGHT: { x: 600, y: 950 }
    },
    PLAYER2: {
      MAIN: { x: 400, y: 150 },
      LEFT: { x: 200, y: 250 },
      RIGHT: { x: 600, y: 250 }
    }
  },
  
  // Tower stats
  TOWER_STATS: {
    MAIN: {
      HP: 3000,
      DAMAGE: 100,
      ATTACK_SPEED: 0.8, // attacks per second
      RANGE: 200
    },
    SIDE: {
      HP: 1500,
      DAMAGE: 80,
      ATTACK_SPEED: 0.8,
      RANGE: 200
    }
  },
  
  // Unit types
  UNIT_TYPES: {
    KNIGHT: 'knight',
    ARCHER: 'archer',
    GIANT: 'giant',
    GOBLIN: 'goblin'
  },
  
  // Game states
  GAME_STATES: {
    WAITING: 'waiting',
    PLAYING: 'playing',
    FINISHED: 'finished'
  },
  
  // Network events
  EVENTS: {
    // Client to Server
    FIND_MATCH: 'findMatch',
    SPAWN_UNIT: 'spawnUnit',
    CANCEL_MATCH: 'cancelMatch',
    
    // Server to Client
    MATCH_FOUND: 'matchFound',
    GAME_STATE: 'gameState',
    GAME_START: 'gameStart',
    GAME_OVER: 'gameOver',
    ERROR: 'error'
  },
  
  // Tick rate
  TICK_RATE: 60, // Server updates per second
  TICK_INTERVAL: 1000 / 60, // ~16.67ms
  
  // Win conditions
  WIN_CONDITIONS: {
    MAIN_TOWER_DESTROYED: 'main_tower',
    TIMEOUT: 'timeout',
    DISCONNECT: 'disconnect'
  },
  
  // Match duration
  MATCH_DURATION: 180000, // 3 minutes in milliseconds
  
  // Spawn restrictions
  MIN_SPAWN_DISTANCE_FROM_ENEMY: 300,
  SPAWN_RADIUS: 50
};

// Export for both Node.js (server) and ES6 modules (client)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GAME_CONSTANTS;
}
