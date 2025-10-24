const config = require('../config');

/**
 * Logger utility with different log levels
 */
class Logger {
  static levels = { debug: 0, info: 1, warn: 2, error: 3 };
  static currentLevel = Logger.levels[config.LOG_LEVEL] || Logger.levels.info;
  
  static log(level, ...args) {
    if (Logger.levels[level] >= Logger.currentLevel) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${level.toUpperCase()}]`, ...args);
    }
  }
  
  static debug(...args) { this.log('debug', ...args); }
  static info(...args) { this.log('info', ...args); }
  static warn(...args) { this.log('warn', ...args); }
  static error(...args) { this.log('error', ...args); }
}

/**
 * Generate unique ID
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate spawn position
 */
function validateSpawnPosition(x, y, playerSide, arenaWidth, arenaHeight) {
  // Check if position is within arena bounds
  if (x < 0 || x > arenaWidth || y < 0 || y > arenaHeight) {
    Logger.debug(`Spawn rejected: out of bounds (x=${x}, y=${y})`);
    return false;
  }
  
  // Both players send coordinates from their perspective (bottom = their side)
  // Player always spawns in bottom half from their view (y > midY)
  // This is same for both players
  const midY = arenaHeight / 2;
  
  // Always check y > midY (bottom half from sender's perspective)
  if (y <= midY) {
    Logger.debug(`Player ${playerSide} spawn rejected: not in bottom half (y=${y.toFixed(1)}, midY=${midY})`);
    return false;
  }
  
  Logger.debug(`✅ Spawn accepted: player=${playerSide}, x=${x.toFixed(1)}, y=${y.toFixed(1)}`);
  return true;
}

/**
 * Calculate delta state (only changed properties)
 */
function calculateDelta(oldState, newState) {
  const delta = {};
  
  for (const key in newState) {
    if (JSON.stringify(oldState[key]) !== JSON.stringify(newState[key])) {
      delta[key] = newState[key];
    }
  }
  
  return delta;
}

/**
 * Deep clone object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

module.exports = {
  Logger,
  generateId,
  validateSpawnPosition,
  calculateDelta,
  deepClone
};
