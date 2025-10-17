const CONSTANTS = require('../shared/constants');
const MathUtils = require('../shared/math');
const { generateId, Logger } = require('./utils/helpers');

/**
 * Match class handling game logic for a single match
 */
class Match {
  constructor(player1, player2) {
    this.id = generateId();
    this.players = [player1, player2];
    this.state = CONSTANTS.GAME_STATES.WAITING;
    this.startTime = null;
    this.endTime = null;
    this.winner = null;
    
    // Game entities
    this.units = new Map(); // unitId -> unit object
    this.towers = this.initializeTowers();
    this.nextUnitId = 0;
    
    // Performance
    this.lastTickTime = Date.now();
    
    Logger.info(`Match ${this.id} created with players ${player1.id} and ${player2.id}`);
  }
  
  /**
   * Initialize towers for both players
   */
  initializeTowers() {
    const towers = [];
    
    // Player 1 towers (bottom)
    towers.push({
      id: 'p1_main',
      type: 'main',
      owner: 1,
      x: CONSTANTS.TOWER_POSITIONS.PLAYER1.MAIN.x,
      y: CONSTANTS.TOWER_POSITIONS.PLAYER1.MAIN.y,
      hp: CONSTANTS.TOWER_STATS.MAIN.HP,
      maxHp: CONSTANTS.TOWER_STATS.MAIN.HP,
      damage: CONSTANTS.TOWER_STATS.MAIN.DAMAGE,
      attackSpeed: CONSTANTS.TOWER_STATS.MAIN.ATTACK_SPEED,
      range: CONSTANTS.TOWER_STATS.MAIN.RANGE,
      lastAttack: 0,
      target: null,
      alive: true
    });
    
    towers.push({
      id: 'p1_left',
      type: 'side',
      owner: 1,
      x: CONSTANTS.TOWER_POSITIONS.PLAYER1.LEFT.x,
      y: CONSTANTS.TOWER_POSITIONS.PLAYER1.LEFT.y,
      hp: CONSTANTS.TOWER_STATS.SIDE.HP,
      maxHp: CONSTANTS.TOWER_STATS.SIDE.HP,
      damage: CONSTANTS.TOWER_STATS.SIDE.DAMAGE,
      attackSpeed: CONSTANTS.TOWER_STATS.SIDE.ATTACK_SPEED,
      range: CONSTANTS.TOWER_STATS.SIDE.RANGE,
      lastAttack: 0,
      target: null,
      alive: true
    });
    
    towers.push({
      id: 'p1_right',
      type: 'side',
      owner: 1,
      x: CONSTANTS.TOWER_POSITIONS.PLAYER1.RIGHT.x,
      y: CONSTANTS.TOWER_POSITIONS.PLAYER1.RIGHT.y,
      hp: CONSTANTS.TOWER_STATS.SIDE.HP,
      maxHp: CONSTANTS.TOWER_STATS.SIDE.HP,
      damage: CONSTANTS.TOWER_STATS.SIDE.DAMAGE,
      attackSpeed: CONSTANTS.TOWER_STATS.SIDE.ATTACK_SPEED,
      range: CONSTANTS.TOWER_STATS.SIDE.RANGE,
      lastAttack: 0,
      target: null,
      alive: true
    });
    
    // Player 2 towers (top)
    towers.push({
      id: 'p2_main',
      type: 'main',
      owner: 2,
      x: CONSTANTS.TOWER_POSITIONS.PLAYER2.MAIN.x,
      y: CONSTANTS.TOWER_POSITIONS.PLAYER2.MAIN.y,
      hp: CONSTANTS.TOWER_STATS.MAIN.HP,
      maxHp: CONSTANTS.TOWER_STATS.MAIN.HP,
      damage: CONSTANTS.TOWER_STATS.MAIN.DAMAGE,
      attackSpeed: CONSTANTS.TOWER_STATS.MAIN.ATTACK_SPEED,
      range: CONSTANTS.TOWER_STATS.MAIN.RANGE,
      lastAttack: 0,
      target: null,
      alive: true
    });
    
    towers.push({
      id: 'p2_left',
      type: 'side',
      owner: 2,
      x: CONSTANTS.TOWER_POSITIONS.PLAYER2.LEFT.x,
      y: CONSTANTS.TOWER_POSITIONS.PLAYER2.LEFT.y,
      hp: CONSTANTS.TOWER_STATS.SIDE.HP,
      maxHp: CONSTANTS.TOWER_STATS.SIDE.HP,
      damage: CONSTANTS.TOWER_STATS.SIDE.DAMAGE,
      attackSpeed: CONSTANTS.TOWER_STATS.SIDE.ATTACK_SPEED,
      range: CONSTANTS.TOWER_STATS.SIDE.RANGE,
      lastAttack: 0,
      target: null,
      alive: true
    });
    
    towers.push({
      id: 'p2_right',
      type: 'side',
      owner: 2,
      x: CONSTANTS.TOWER_POSITIONS.PLAYER2.RIGHT.x,
      y: CONSTANTS.TOWER_POSITIONS.PLAYER2.RIGHT.y,
      hp: CONSTANTS.TOWER_STATS.SIDE.HP,
      maxHp: CONSTANTS.TOWER_STATS.SIDE.HP,
      damage: CONSTANTS.TOWER_STATS.SIDE.DAMAGE,
      attackSpeed: CONSTANTS.TOWER_STATS.SIDE.ATTACK_SPEED,
      range: CONSTANTS.TOWER_STATS.SIDE.RANGE,
      lastAttack: 0,
      target: null,
      alive: true
    });
    
    return towers;
  }
  
  /**
   * Start the match
   */
  start() {
    this.state = CONSTANTS.GAME_STATES.PLAYING;
    this.startTime = Date.now();
    
    // Initialize player hands
    this.players.forEach(player => {
      player.initializeHand();
      player.isReady = true;
    });
    
    Logger.info(`Match ${this.id} started`);
  }
  
  /**
   * Main game tick - update all game logic
   */
  tick() {
    if (this.state !== CONSTANTS.GAME_STATES.PLAYING) return;
    
    const now = Date.now();
    const deltaTime = now - this.lastTickTime;
    this.lastTickTime = now;
    
    // Update player elixir
    this.players.forEach(player => player.updateElixir(deltaTime));
    
    // Update units
    this.updateUnits(deltaTime);
    
    // Update towers
    this.updateTowers(deltaTime);
    
    // Check win conditions
    this.checkWinConditions();
    
    // Check timeout
    if (now - this.startTime >= CONSTANTS.MATCH_DURATION) {
      this.endMatch(this.determineWinnerByTowerHP());
    }
  }
  
  /**
   * Update all units
   */
  updateUnits(deltaTime) {
    const deltaSeconds = deltaTime / 1000;
    
    this.units.forEach((unit, unitId) => {
      if (!unit.alive) {
        this.units.delete(unitId);
        return;
      }
      
      // Find target
      if (!unit.target || !unit.target.alive) {
        unit.target = this.findNearestTarget(unit);
      }
      
      if (unit.target) {
        const dist = MathUtils.distance(unit.x, unit.y, unit.target.x, unit.target.y);
        
        // Move towards target or attack
        if (dist > unit.range) {
          const moved = MathUtils.moveTowards(unit.x, unit.y, unit.target.x, unit.target.y, unit.speed * deltaSeconds);
          unit.x = moved.x;
          unit.y = moved.y;
        } else {
          // Attack
          const timeSinceLastAttack = (Date.now() - unit.lastAttack) / 1000;
          if (timeSinceLastAttack >= 1 / unit.attackSpeed) {
            this.unitAttack(unit, unit.target);
            unit.lastAttack = Date.now();
          }
        }
      }
    });
  }
  
  /**
   * Update all towers
   */
  updateTowers(deltaTime) {
    this.towers.forEach(tower => {
      if (!tower.alive) return;
      
      // Find target
      if (!tower.target || !tower.target.alive) {
        tower.target = this.findNearestEnemyUnit(tower);
      }
      
      if (tower.target) {
        const dist = MathUtils.distance(tower.x, tower.y, tower.target.x, tower.target.y);
        
        if (dist <= tower.range) {
          const timeSinceLastAttack = (Date.now() - tower.lastAttack) / 1000;
          if (timeSinceLastAttack >= 1 / tower.attackSpeed) {
            this.towerAttack(tower, tower.target);
            tower.lastAttack = Date.now();
          }
        } else {
          tower.target = null;
        }
      }
    });
  }
  
  /**
   * Find nearest target for a unit (enemy units or towers)
   */
  findNearestTarget(unit) {
    let nearest = null;
    let minDist = Infinity;
    
    // Check enemy towers
    const enemyTowers = this.towers.filter(t => t.owner !== unit.owner && t.alive);
    enemyTowers.forEach(tower => {
      const dist = MathUtils.distance(unit.x, unit.y, tower.x, tower.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = tower;
      }
    });
    
    // Check enemy units
    this.units.forEach(otherUnit => {
      if (otherUnit.owner !== unit.owner && otherUnit.alive) {
        const dist = MathUtils.distance(unit.x, unit.y, otherUnit.x, otherUnit.y);
        if (dist < minDist) {
          minDist = dist;
          nearest = otherUnit;
        }
      }
    });
    
    return nearest;
  }
  
  /**
   * Find nearest enemy unit for a tower
   */
  findNearestEnemyUnit(tower) {
    let nearest = null;
    let minDist = Infinity;
    
    this.units.forEach(unit => {
      if (unit.owner !== tower.owner && unit.alive) {
        const dist = MathUtils.distance(tower.x, tower.y, unit.x, unit.y);
        if (dist < minDist && dist <= tower.range) {
          minDist = dist;
          nearest = unit;
        }
      }
    });
    
    return nearest;
  }
  
  /**
   * Unit attacks target
   */
  unitAttack(unit, target) {
    target.hp -= unit.damage;
    if (target.hp <= 0) {
      target.hp = 0;
      target.alive = false;
    }
  }
  
  /**
   * Tower attacks target
   */
  towerAttack(tower, target) {
    target.hp -= tower.damage;
    if (target.hp <= 0) {
      target.hp = 0;
      target.alive = false;
    }
  }
  
  /**
   * Spawn a unit
   */
  spawnUnit(player, unitType, x, y, cardIndex) {
    // Load unit data
    const unitData = this.getUnitData(unitType);
    if (!unitData) {
      Logger.warn(`Unknown unit type: ${unitType}`);
      return false;
    }
    
    // Check if player has enough elixir
    if (!player.spendElixir(unitData.cost)) {
      return false;
    }
    
    // Create unit
    const unitId = `unit_${this.nextUnitId++}`;
    const unit = {
      id: unitId,
      type: unitType,
      owner: player.playerNumber,
      x: x,
      y: y,
      hp: unitData.hp,
      maxHp: unitData.hp,
      damage: unitData.damage,
      speed: unitData.speed,
      attackSpeed: unitData.attackSpeed,
      range: unitData.range,
      target: null,
      lastAttack: Date.now(),
      alive: true
    };
    
    this.units.set(unitId, unit);
    
    // Draw new card for player
    player.drawCard(cardIndex);
    
    Logger.debug(`Unit ${unitId} (${unitType}) spawned by player ${player.playerNumber}`);
    return true;
  }
  
  /**
   * Get unit data by type
   */
  getUnitData(type) {
    const units = {
      knight: {
        cost: 3,
        hp: 600,
        damage: 75,
        speed: 60,
        attackSpeed: 1.2,
        range: 30
      },
      archer: {
        cost: 3,
        hp: 250,
        damage: 50,
        speed: 50,
        attackSpeed: 1.0,
        range: 150
      },
      giant: {
        cost: 5,
        hp: 1500,
        damage: 120,
        speed: 30,
        attackSpeed: 1.5,
        range: 30
      },
      goblin: {
        cost: 2,
        hp: 150,
        damage: 40,
        speed: 80,
        attackSpeed: 1.1,
        range: 30
      }
    };
    
    return units[type] || null;
  }
  
  /**
   * Check win conditions
   */
  checkWinConditions() {
    // Check if main tower destroyed
    const p1Main = this.towers.find(t => t.id === 'p1_main');
    const p2Main = this.towers.find(t => t.id === 'p2_main');
    
    if (!p1Main.alive) {
      this.endMatch(2, CONSTANTS.WIN_CONDITIONS.MAIN_TOWER_DESTROYED);
    } else if (!p2Main.alive) {
      this.endMatch(1, CONSTANTS.WIN_CONDITIONS.MAIN_TOWER_DESTROYED);
    }
  }
  
  /**
   * Determine winner by tower HP
   */
  determineWinnerByTowerHP() {
    let p1HP = 0;
    let p2HP = 0;
    
    this.towers.forEach(tower => {
      if (tower.owner === 1) p1HP += tower.hp;
      if (tower.owner === 2) p2HP += tower.hp;
    });
    
    if (p1HP > p2HP) return 1;
    if (p2HP > p1HP) return 2;
    return null; // Draw
  }
  
  /**
   * End the match
   */
  endMatch(winner, reason = CONSTANTS.WIN_CONDITIONS.TIMEOUT) {
    if (this.state === CONSTANTS.GAME_STATES.FINISHED) return;
    
    this.state = CONSTANTS.GAME_STATES.FINISHED;
    this.endTime = Date.now();
    this.winner = winner;
    
    Logger.info(`Match ${this.id} ended. Winner: Player ${winner || 'Draw'} (${reason})`);
  }
  
  /**
   * Handle player disconnect
   */
  handleDisconnect(playerId) {
    const disconnectedPlayer = this.players.find(p => p.id === playerId);
    if (!disconnectedPlayer) return;
    
    const winner = disconnectedPlayer.playerNumber === 1 ? 2 : 1;
    this.endMatch(winner, CONSTANTS.WIN_CONDITIONS.DISCONNECT);
  }
  
  /**
   * Get full game state
   */
  getState() {
    return {
      matchId: this.id,
      state: this.state,
      startTime: this.startTime,
      timeRemaining: this.startTime ? Math.max(0, CONSTANTS.MATCH_DURATION - (Date.now() - this.startTime)) : 0,
      players: this.players.map(p => p.getState()),
      towers: this.towers.map(t => ({
        id: t.id,
        type: t.type,
        owner: t.owner,
        x: t.x,
        y: t.y,
        hp: t.hp,
        maxHp: t.maxHp,
        alive: t.alive
      })),
      units: Array.from(this.units.values()).map(u => ({
        id: u.id,
        type: u.type,
        owner: u.owner,
        x: Math.round(u.x * 10) / 10,
        y: Math.round(u.y * 10) / 10,
        hp: u.hp,
        maxHp: u.maxHp,
        alive: u.alive
      })),
      winner: this.winner
    };
  }
}

module.exports = Match;
