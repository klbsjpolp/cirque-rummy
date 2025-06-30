import { Card, GameState } from '../types/game';
import {findAllValidCombinations, createDeck, isJokerCard} from './cardUtils';

export class AIPlayer {
  static makeMove(gameState: GameState): void {
    const aiPlayer = gameState.players[gameState.currentPlayerIndex];

    // Simple AI strategy:
    // 1. Try to lay a combination if possible
    // 2. Draw a card (prefer from discard if it helps)
    // 3. Discard a random card

    const possibleCombinations = this.findPossibleCombinations(aiPlayer.hand);

    if (possibleCombinations.length > 0) {
      // AI would lay a combination here
      // For now, we'll just draw and discard
      this.drawAndDiscard(gameState);
    } else {
      this.drawAndDiscard(gameState);
    }
  }

  private static drawAndDiscard(gameState: GameState): void {
    const aiPlayer = gameState.players[gameState.currentPlayerIndex];

    // Simple draw strategy: draw from deck
    if (gameState.deck.length > 0) {
      const card = gameState.deck.pop()!;
      aiPlayer.hand.push(card);
      gameState.gameHistory.push(`${aiPlayer.name} pioche du paquet`);
    }

    // Simple discard strategy: discard a random card
    if (aiPlayer.hand.length > 0) {
      const randomIndex = Math.floor(Math.random() * aiPlayer.hand.length);
      const card = aiPlayer.hand.splice(randomIndex, 1)[0];
      gameState.discardPile.push(card);
      gameState.gameHistory.push(`${aiPlayer.name} défausse ${isJokerCard(card) ? 'Joker' : card.value}`);

      // Check if round ends (AI went out)
      const roundEnded = aiPlayer.hand.length === 0;

      if (roundEnded) {
        // Round ended, the round management will be handled by the main game logic
        gameState.gameHistory.push(`🎪 ${aiPlayer.name} termine la manche!`);
        this.handleRoundEnd(gameState);
      } else {
        // Continue normal turn progression
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      }
    }
  }

  private static handleRoundEnd(gameState: GameState): void {
    // Clear all combinations from all players
    gameState.players.forEach(player => {
      player.combinations = [];
    });

    // Create new deck and redistribute cards
    const newDeck = createDeck();
    gameState.players.forEach(player => {
      player.hand = newDeck.splice(0, 13);
    });

    // Set new discard pile
    gameState.discardPile = [newDeck.pop()!];
    gameState.deck = newDeck;

    // Reset to first player
    gameState.currentPlayerIndex = 0;
    gameState.isAITurn = false;

    gameState.gameHistory.push('🎪 Nouvelle manche commencée!');
  }

  private static findPossibleCombinations(hand: Card[]): Array<{cards: Card[], type: 'group' | 'sequence'}> {
    // Use the new unified function to find all valid combinations
    const { groups, sequences } = findAllValidCombinations(hand);

    const combinations: Array<{cards: Card[], type: 'group' | 'sequence'}> = [];

    // Add all found groups
    groups.forEach(cards => {
      combinations.push({ cards, type: 'group' });
    });

    // Add all found sequences
    sequences.forEach(cards => {
      combinations.push({ cards, type: 'sequence' });
    });

    return combinations;
  }
}
