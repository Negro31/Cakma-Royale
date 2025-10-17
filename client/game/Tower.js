import { CONFIG } from '../utils/config.js';

/**
 * Tower class for visual representation
 */
export class Tower {
  constructor(data, container, isPlayer) {
    this.id = data.id;
    this.type = data.type;
    this.owner = data.owner;
    this.isPlayer = isPlayer;
    this.alive = data.alive;
    
    // Create graphics
    this.graphics = new PIXI.Graphics();
    container.addChild(this.graphics);
    
    // Position
    this.x = data.x;
    this.y = data.y;
    
    // Stats
    this.hp = data.hp;
    this.maxHp = data.maxHp;
    
    // HP bar
    this.hpBar = new PIXI.Graphics();
    container.addChild(this.hpBar);
    
    this.draw();
  }
  
  /**
   * Draw tower graphics
   */
  draw() {
    const color = this.isPlayer ? CONFIG.TOWER_COLOR.PLAYER : CONFIG.TOWER_COLOR.ENEMY;
    const size = this.type === 'main' ? 60 : 40;
    
    this.graphics.clear();
    this.graphics.beginFill(color);
    this.graphics.drawRect(-size / 2, -size / 2, size, size);
    this.graphics.endFill();
    
    // Draw border
    this.graphics.lineStyle(3, 0xffffff);
    this.graphics.drawRect(-size / 2, -size / 2, size, size);
    
    this.graphics.x = this.x;
    this.graphics.y = this.y;
    
    // Draw HP bar
    this.drawHPBar();
  }
  
  /**
   * Draw HP bar
   */
  drawHPBar() {
    const barWidth = 60;
    const barHeight = 6;
    const hpPercent = this.hp / this.maxHp;
    
    this.hpBar.clear();
    
    // Background
    this.hpBar.beginFill(0x000000, 0.5);
    this.hpBar.drawRect(0, 0, barWidth, barHeight);
    this.hpBar.endFill();
    
    // HP fill
    const color = hpPercent > 0.5 ? 0x00ff00 : (hpPercent > 0.25 ? 0xffff00 : 0xff0000);
    this.hpBar.beginFill(color);
    this.hpBar.drawRect(0, 0, barWidth * hpPercent, barHeight);
    this.hpBar.endFill();
    
    this.hpBar.x = this.x - barWidth / 2;
    this.hpBar.y = this.y - 40;
  }
  
  /**
   * Update tower state
   */
  update(data) {
    this.hp = data.hp;
    this.alive = data.alive;
    
    if (!this.alive) {
      this.graphics.alpha = 0.3;
      this.hpBar.alpha = 0.3;
    }
    
    this.drawHPBar();
  }
  
  /**
   * Destroy tower graphics
   */
  destroy() {
    this.graphics.destroy();
    this.hpBar.destroy();
  }
}
