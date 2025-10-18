module.exports = {
  // Server configuration
  PORT: process.env.PORT || 3000,
  
  // CORS settings - update these with your actual domains
  ALLOWED_ORIGINS: [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://negro31.github.io', // Your GitHub Pages URL
    'https://cakma-royale-4jdu.onrender.com', // Your Render domain
    'http://localhost:5500', // Live Server default port
    'http://127.0.0.1:5500'
  ],
  
  // Game server settings
  TICK_RATE: 60, // Updates per second
  MAX_PLAYERS_PER_MATCH: 2,
  MATCHMAKING_TIMEOUT: 30000, // 30 seconds
  
  // Performance settings
  ENABLE_DELTA_COMPRESSION: true,
  MAX_STATE_HISTORY: 60, // Keep 1 second of history at 60fps
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info', // 'debug', 'info', 'warn', 'error'
  LOG_CONNECTIONS: true,
  LOG_GAME_EVENTS: true
};
