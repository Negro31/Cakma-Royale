// Client configuration
export const CONFIG = {
  // Server URL - UPDATE THIS for production
  SERVER_URL: 'http://localhost:3000', // Change to your Render URL: 'https://your-app.onrender.com'
  
  // Canvas settings
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 1200,
  CANVAS_BACKGROUND: 0x2d5016,
  
  // Visual settings
  TOWER_COLOR: {
    PLAYER: 0x4287f5,
    ENEMY: 0xf54242
  },
  
  UNIT_COLOR: {
    PLAYER: 0x4287f5,
    ENEMY: 0xf54242
  },
  
  // Animation settings
  INTERPOLATION_SPEED: 0.2,
  
  // UI settings
  CARD_ICONS: {
    knight: '🗡️',
    archer: '🏹',
    giant: '👹',
    goblin: '👺'
  },
  
  // Debug
  DEBUG_MODE: false,
  SHOW_FPS: false
};
