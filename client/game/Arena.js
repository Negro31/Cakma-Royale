import { CONFIG } from '../utils/config.js';
import { Tower } from './Tower.js';
import { Unit } from './Unit.js';

/**
 * Arena class managing the game board
 */
export class Arena {
  constructor(app, playerNumber) {
    this.app = app;
    this.playerNumber = playerNumber;
    
    // Create containers
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    
    // Entity storage
    this.towers = new Map();
    this.units = new Map();
    
    // Spawn indicator
    this.spawnIndicator = null;
    
    this.setupArena();
  }
  
  /**
   * Setup arena graphics
   */
  setupArena() {
    // Background
    const bg = new PIXI.Graphics();
    bg.beginFill(CONFIG.CANVAS_BACKGROUND);
    bg.drawRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    bg.endFill();
    this.container.addChild(bg);
    
    // Draw center line
    const centerLine = new PIXI.Graphics();
    centerLine.lineStyle(3, 0xffffff, 0.3);
    centerLine.moveTo(0, CONFIG.CANVAS_HEIGHT / 2);
    centerLine.lineTo(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT / 2);
    this.container.addChild(centerLine);
    
    // Draw lanes (visual guides)
    const leftLane = new PIXI.Graphics();
    leftLane.lineStyle(2, 0xffffff, 0.1);
    leftLane.moveTo(CONFIG.CANVAS_WIDTH * 0.25, 0);
    leftLane.lineTo(CONFIG.CANVAS_WIDTH * 0.25, CONFIG.CANVAS_HEIGHT);
    this.container.addChild(leftLane);
    
    const rightLane = new PIXI.Graphics();
    rightLane.lineStyle(2, 0xffffff, 0.1);
    rightLane.moveTo(CONFIG.CANVAS_WIDTH * 0.75, 0);
    rightLane.lineTo(CONFIG.CANVAS_WIDTH * 0.75, CONFIG.CANVAS_HEIGHT);
    this.container.addChild(rightLane);
    
    // Create spawn indicator
    this.spawnIndicator = new PIXI.Graphics();
    this.spawnIndicator.visible = false;
    this.container.addChild(this.spawnIndicator);
  }
  
  /**
   * Update towers
   */
  updateTowers(towerData) {
    towerData.forEach(data => {
      if (this.towers.has(data.id)) {
        this.towers.get(data.id).update(data);
      } else {
        // Player is always at bottom (blue), enemy at top (red)
        const isPlayer = data.owner === this.playerNumber;
        const tower = new Tower(data, this.container, isPlayer);
        this.towers.set(data.id, tower);
      }
    });
  }
  
  /**
   * Update units
   */
  updateUnits(unitData) {
    // Remove dead units
    const currentIds = new Set(unitData.map(u => u.id));
    this.units.forEach((unit, id) => {
      if (!currentIds.has(id) || !unit.alive) {
        unit.destroy();
        this.units.delete(id);
      }
    });
    
    // Update or create units
    unitData.forEach(data => {
      if (this.units.has(data.id)) {
        this.units.get(data.id).update(data);
      } else if (data.alive) {
        // Player is always blue, enemy is always red
        const isPlayer = data.owner === this.playerNumber;
        const unit = new Unit(data, this.container, isPlayer);
        this.units.set(data.id, unit);
      }
    });
  }
  
  /**
   * Animate all units (called every frame)
   */
  animate() {
    this.units.forEach(unit => unit.animate());
  }
  
  /**
   * Show spawn indicator at position
   */
  showSpawnIndicator(x, y, valid) {
    this.spawnIndicator.clear();
    this.spawnIndicator.visible = true;
    
    const color = valid ? 0x00ff00 : 0xff0000;
    const alpha = valid ? 0.3 : 0.5;
    
    this.spawnIndicator.beginFill(color, alpha);
    this.spawnIndicator.drawCircle(x, y, 30);
    this.spawnIndicator.endFill();
    
    this.spawnIndicator.lineStyle(2, color);
    this.spawnIndicator.drawCircle(x, y, 30);
    
    // Debug: Draw center line
    if (CONFIG.DEBUG_MODE) {
      this.spawnIndicator.lineStyle(2, 0xffff00, 0.5);
      this.spawnIndicator.moveTo(0, CONFIG.CANVAS_HEIGHT / 2);
      this.spawnIndicator.lineTo(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT / 2);
    }
  }
  
  /**
   * Hide spawn indicator
   */
  hideSpawnIndicator() {
    this.spawnIndicator.visible = false;
  }
  
  /**
   * Check if position is valid for spawning
   */
  isValidSpawnPosition(x, y) {
    // Check bounds
    if (x < 0 || x > CONFIG.CANVAS_WIDTH || y < 0 || y > CONFIG.CANVAS_HEIGHT) {
      return false;
    }
    
    // Player always spawns in bottom half (regardless of actual player number)
    // Because we rotate the view for player 2, from their perspective they're always at bottom
    const midY = CONFIG.CANVAS_HEIGHT / 2;
    
    // Can only spawn in bottom half (y > midY)
    if (y <= midY) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Clear all entities
   */
  clear() {
    this.towers.forEach(tower => tower.destroy());
    this.units.forEach(unit => unit.destroy());
    this.towers.clear();
    this.units.clear();
  }
  
  /**
   * Destroy arena
   */
  destroy() {
    this.clear();
    this.container.destroy({ children: true });
  }
}
