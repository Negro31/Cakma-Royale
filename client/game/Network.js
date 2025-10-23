import { CONFIG } from '../utils/config.js';

/**
 * Network class handling Socket.io communication
 */
export class Network {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.matchId = null;
    this.playerNumber = null;
    this.callbacks = {};
  }
  
  /**
   * Connect to server
   */
  connect() {
    return new Promise((resolve, reject) => {
      this.socket = io(CONFIG.SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      this.socket.on('connect', () => {
        console.log('Connected to server:', this.socket.id);
        this.connected = true;
        this.trigger('connect');
        resolve();
      });
      
      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.connected = false;
        this.trigger('disconnect');
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this.connected = false;
        reject(error);
      });
      
      // Setup game event listeners
      this.setupEventListeners();
    });
  }
  
  /**
   * Setup Socket.io event listeners
   */
  setupEventListeners() {
    this.socket.on('matchFound', (data) => {
      console.log('Match found:', data);
      this.matchId = data.matchId;
      this.playerNumber = data.playerNumber;
      this.trigger('matchFound', data);
    });
    
    this.socket.on('gameStart', (data) => {
      console.log('Game started:', data);
      this.trigger('gameStart', data);
    });
    
    this.socket.on('gameState', (data) => {
      this.trigger('gameState', data);
    });
    
    this.socket.on('gameOver', (data) => {
      console.log('Game over:', data);
      this.trigger('gameOver', data);
    });
    
    this.socket.on('error', (data) => {
      console.error('Server error:', data);
      this.trigger('error', data);
    });
  }
  
  /**
   * Find a match
   */
  findMatch() {
    if (this.socket && this.connected) {
      this.socket.emit('findMatch');
    }
  }
  
  /**
   * Cancel matchmaking
   */
  cancelMatch() {
    if (this.socket && this.connected) {
      this.socket.emit('cancelMatch');
    }
  }
  
  /**
   * Spawn a unit
   */
  spawnUnit(unitType, x, y, cardIndex) {
    if (this.socket && this.connected) {
      // Ensure all values are valid
      const data = {
        unitType: String(unitType),
        x: Number(x),
        y: Number(y),
        cardIndex: Number(cardIndex)
      };
      
      console.log('Sending spawnUnit:', data);
      
      // Double check for NaN
      if (isNaN(data.x) || isNaN(data.y)) {
        console.error('Prevented sending NaN coordinates to server');
        return;
      }
      
      this.socket.emit('spawnUnit', data);
    } else {
      console.error('Cannot spawn unit: socket not connected');
    }
  }
  
  /**
   * Register callback for event
   */
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }
  
  /**
   * Trigger event callbacks
   */
  trigger(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }
  
  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }
}
