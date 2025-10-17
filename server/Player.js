const CONSTANTS = require('../shared/constants');

/**
 * Player class representing a connected player
 */
class Player {
  constructor(socketId, socket) {
    this.id = socketId;
    this.socket = socket;
    this.matchId = null;
    this.playerNumber = null; // 1 or 2
    this.isReady = false;
    this.deck = this.generateStarterDeck();
    this.hand = [];
    this.elixir = CONSTANTS.STARTING_ELIXIR;
    this.lastElixirUpdate = Date.now();
  }
  
  /**
   * Generate a starter deck of cards
   */
  generateStarterDeck() {
    return [
      { id: 'knight', cost: 3 },
      { id: 'archer', cost: 3 },
      { id: 'giant', cost: 5 },
      { id: 'goblin', cost: 2 },
      { id: 'knight', cost: 3 },
      { id: 'archer', cost: 3 },
      { id: 'goblin', cost: 2 },
      { id: 'giant', cost: 5 }
    ];
  }
  
  /**
   * Initialize hand with random cards from deck
   */
  initializeHand() {
    this.hand = [];
    const shuffled = [...this.deck].sort(() => Math.random() - 0.5);
    this.hand = shuffled.slice(0, 4);
  }
  
  /**
   * Draw a card to replace used card
   */
  drawCard(usedCardIndex) {
    if (usedCardIndex >= 0 && usedCardIndex < this.hand.length) {
      // Remove used card
      this.hand.splice(usedCardIndex, 1);
      
      // Find cards not in hand
      const availableCards = this.deck.filter(card => {
        const inHand = this.hand.filter(h => h.id === card.id).length;
        const inDeck = this.deck.filter(d => d.id === card.id).length;
        return inHand < inDeck;
      });
      
      // Draw random card
      if (availableCards.length > 0) {
        const newCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        this.hand.push(newCard);
      }
    }
  }
  
  /**
   * Update elixir over time
   */
  updateElixir(deltaTime) {
    const elixirToAdd = (CONSTANTS.ELIXIR_REGEN_RATE * deltaTime) / 1000;
    this.elixir = Math.min(this.elixir + elixirToAdd, CONSTANTS.MAX_ELIXIR);
  }
  
  /**
   * Try to spend elixir
   */
  spendElixir(amount) {
    if (this.elixir >= amount) {
      this.elixir -= amount;
      return true;
    }
    return false;
  }
  
  /**
   * Emit event to this player's socket
   */
  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }
  
  /**
   * Get serialized player state
   */
  getState() {
    return {
      id: this.id,
      playerNumber: this.playerNumber,
      elixir: Math.floor(this.elixir * 10) / 10, // Round to 1 decimal
      hand: this.hand,
      isReady: this.isReady
    };
  }
}

module.exports = Player;
