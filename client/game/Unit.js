import { CONFIG } from '../utils/config.js';
import { MathUtils } from '../utils/math.js';

/**
 * Unit class for visual representation
 */
export class Unit {
  constructor(data, container, isPlayer) {
    this.id = data.id;
    this.type = data.type;
    this.owner = data.owner;
    this.isPlayer = isPlayer;
    this.alive = data.alive;
    
    // Create graphics
    this.graphics = new PIXI.Graphics();
    container.addChild(this.graphics);
    
    // Position (with interpolation)
    this.x = data.x;
    this.y = data.y;
    this.targetX = data.x;
    this.targetY = data.y;
    this.visualX = data.x;
    this.visualY = data.y;
    
    // Stats
    this.hp = data.hp;
    this.maxHp = data.maxHp;
    
    // HP bar
    this.hpBar = new PIXI.Graphics();
    container.addChild(this.hpBar);
    
    // Type indicator (emoji text)
    this.typeText = new PIXI.Text(this.getUnitEmoji(), {
      fontSize: 24,
      fill: 0xffffff
    });
    this.typeText.anchor.set(0.5);
    container.addChild(this.typeText);
    
    this.draw();
  }
  
  /**
   * Get emoji for unit type
   */
  getUnitEmoji() {
    const emojis = {
      knight: '🗡️',
      archer: '🏹',
      giant: '👹',
      goblin: '👺'
    };
    return emojis[this.type] || '⚔️';
  }
  
  /**
   * Draw unit graphics
   */
  draw() {
    const color = this.isPlayer ? CONFIG.UNIT_COLOR.PLAYER : CONFIG.UNIT_COLOR.ENEMY;
    const size = this.getUnitSize();
    
    this.graphics.clear();
    this.graphics.beginFill(color);
    this.graphics.drawCircle(0, 0, size);
    this.graphics.endFill();
    
    // Draw border
    this.graphics.lineStyle(2, 0xffffff);
    this.graphics.drawCircle(0, 0, size);
    
    this.updatePosition();
    this.drawHPBar();
  }
  
  /**
   * Get unit size based on type
   */
  getUnitSize() {
    const sizes = {
      knight: 15,
      archer: 12,
      giant: 20,
      goblin: 10
    };
    return sizes[this.type] || 15;
  }
  
  /**
   * Update position with interpolation
   */
  updatePosition() {
    // Smooth interpolation
    this.visualX = MathUtils.lerp(this.visualX, this.targetX, CONFIG.INTERPOLATION_SPEED);
    this.visualY = MathUtils.lerp(this.visualY, this.targetY, CONFIG.INTERPOLATION_SPEED);
    
    this.graphics.x = this.visualX;
    this.graphics.y = this.visualY;
    
    this.typeText.x = this.visualX;
    this.typeText.y = this.visualY - this.getUnitSize() - 15;
  }
  
  /**
   * Draw HP bar
   */
  drawHPBar() {
    const barWidth = 40;
    const barHeight = 4;
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
    
    this.hpBar.x = this.visualX - barWidth / 2;
    this.hpBar.y = this.visualY - this.getUnitSize() - 10;
  }
  
  /**
   * Update unit state from server
   */
  update(data) {
    this.targetX = data.x;
    this.targetY = data.y;
    this.hp = data.hp;
    this.alive = data.alive;
    
    if (!this.alive) {
      this.graphics.alpha = 0;
      this.hpBar.alpha = 0;
      this.typeText.alpha = 0;
    } else {
      this.updatePosition();
      this.drawHPBar();
    }
  }
  
  /**
   * Animate unit (called every frame)
   */
  animate() {
    if (this.alive) {
      this.updatePosition();
      this.drawHPBar();
    }
  }
  
  /**
   * Destroy unit graphics
   */
  destroy() {
    this.graphics.destroy();
    this.hpBar.destroy();
    this.typeText.destroy();
  }
}
