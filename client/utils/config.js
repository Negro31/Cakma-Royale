// Client configuration
export const CONFIG = {
  // Server URL - UPDATE THIS for production
  SERVER_URL: 'https://cakma-royale-4jdu.onrender.com', // Your Render URL
  
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
