// Client-side math utilities (mirrors server-side)
export const MathUtils = {
  /**
   * Calculate distance between two points
   */
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
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
   * Format time in MM:SS format
   */
  formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};
