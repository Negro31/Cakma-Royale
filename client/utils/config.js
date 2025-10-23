// Client configuration
export const CONFIG = {
  // Server URL - Auto-detect based on current domain
  SERVER_URL: window.location.origin, // Will use same domain as page
  
  // Canvas settings - will be dynamically adjusted for device
  getCanvasSize() {
    const isMobile = window.innerWidth < 768;
    const isPortrait = window.innerHeight > window.innerWidth;
    
    if (isMobile) {
      if (isPortrait) {
        // Mobile portrait - narrower arena
        return {
          width: Math.min(600, window.innerWidth * 0.95),
          height: Math.min(900, window.innerHeight * 0.7)
        };
      } else {
        // Mobile landscape - wider arena
        return {
          width: Math.min(800, window.innerWidth * 0.6),
          height: Math.min(600, window.innerHeight * 0.8)
        };
      }
    } else {
      // Desktop - standard size
      return {
        width: 800,
        height: 1200
      };
    }
  },
  
  CANVAS_WIDTH: 800, // Base logical size for calculations
  CANVAS_HEIGHT: 1200, // Base logical size for calculations
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
  DEBUG_MODE: false, // Set to true to see spawn zones
  SHOW_FPS: false
};
