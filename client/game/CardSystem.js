import { CONFIG } from '../utils/config.js';

/**
 * CardSystem class managing player's hand and card selection
 */
export class CardSystem {
  constructor() {
    this.hand = [];
    this.selectedCard = null;
    this.selectedCardIndex = -1;
    this.elixir = 0;
    this.onCardSelected = null;
    
    this.setupCardElements();
  }
  
  /**
   * Setup card DOM elements and event listeners
   */
  setupCardElements() {
    this.cardElements = document.querySelectorAll('.card');
    
    this.cardElements.forEach((cardEl, index) => {
      cardEl.addEventListener('click', () => {
        this.selectCard(index);
      });
    });
  }
  
  /**
   * Update hand with new cards
   */
  updateHand(hand, elixir) {
    this.hand = hand;
    this.elixir = elixir;
    this.renderHand();
  }
  
  /**
   * Render hand to DOM
   */
  renderHand() {
    this.cardElements.forEach((cardEl, index) => {
      if (index < this.hand.length) {
        const card = this.hand[index];
        
        // Update card display
        const cardImage = cardEl.querySelector('.card-image');
        const cardName = cardEl.querySelector('.card-name');
        const cardCost = cardEl.querySelector('.card-cost');
        
        cardImage.textContent = CONFIG.CARD_ICONS[card.id] || '⚔️';
        cardName.textContent = this.capitalize(card.id);
        cardCost.textContent = card.cost;
        
        // Check if player can afford card
        if (this.elixir >= card.cost) {
          cardEl.classList.remove('disabled');
        } else {
          cardEl.classList.add('disabled');
        }
        
        // Update selection state
        if (index === this.selectedCardIndex) {
          cardEl.classList.add('selected');
        } else {
          cardEl.classList.remove('selected');
        }
        
        cardEl.style.display = 'flex';
      } else {
        cardEl.style.display = 'none';
      }
    });
  }
  
  /**
   * Select a card
   */
  selectCard(index) {
    if (index < 0 || index >= this.hand.length) return;
    
    const card = this.hand[index];
    
    // Check if player can afford card
    if (this.elixir < card.cost) {
      console.log('Not enough elixir!');
      return;
    }
    
    // Toggle selection
    if (this.selectedCardIndex === index) {
      this.deselectCard();
    } else {
      this.selectedCardIndex = index;
      this.selectedCard = card;
      this.renderHand();
      
      if (this.onCardSelected) {
        this.onCardSelected(card, index);
      }
      
      console.log(`Selected card: ${card.id} (cost: ${card.cost})`);
    }
  }
  
  /**
   * Deselect current card
   */
  deselectCard() {
    this.selectedCardIndex = -1;
    this.selectedCard = null;
    this.renderHand();
    
    if (this.onCardSelected) {
      this.onCardSelected(null, -1);
    }
  }
  
  /**
   * Get selected card
   */
  getSelectedCard() {
    return {
      card: this.selectedCard,
      index: this.selectedCardIndex
    };
  }
  
  /**
   * Check if a card is selected
   */
  hasSelection() {
    return this.selectedCard !== null;
  }
  
  /**
   * Capitalize first letter
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  /**
   * Show card hand
   */
  show() {
    document.getElementById('cardHand').style.display = 'flex';
  }
  
  /**
   * Hide card hand
   */
  hide() {
    document.getElementById('cardHand').style.display = 'none';
  }
  
  /**
   * Reset card system
   */
  reset() {
    this.hand = [];
    this.selectedCard = null;
    this.selectedCardIndex = -1;
    this.elixir = 0;
    this.renderHand();
  }
}
