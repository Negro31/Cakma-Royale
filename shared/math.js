// Shared math utilities for both client and server

const MathUtils = {
  /**
   * Calculate distance between two points
   */
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },
  
  /**
   * Calculate distance squared (faster for comparisons)
   */
  distanceSquared(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  },
  
  /**
   * Normalize a vector
   */
  normalize(x, y) {
    const len = Math.sqrt(x * x + y * y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: x / len, y: y / len };
  },
  
  /**
   * Linear interpolation
   */
  lerp(start, end, t) {
    return start + (end - start) * t;
  },
  
  /**
   * Clamp a value between min and max
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },
  
  /**
   * Check if point is within circle
   */
  pointInCircle(px, py, cx, cy, radius) {
    return this.distanceSquared(px, py, cx, cy) <= radius * radius;
  },
  
  /**
   * Get angle between two points in radians
   */
  angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  },
  
  /**
   * Move point towards target by distance
   */
  moveTowards(x1, y1, x2, y2, distance) {
    const dir = this.normalize(x2 - x1, y2 - y1);
    return {
      x: x1 + dir.x * distance,
      y: y1 + dir.y * distance
    };
  },
  
  /**
   * Random number between min and max
   */
  random(min, max) {
    return Math.random() * (max - min) + min;
  },
  
  /**
   * Random integer between min and max (inclusive)
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};

// Export for both Node.js and ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MathUtils;
}
