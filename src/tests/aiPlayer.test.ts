import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIPlayer } from '../utils/aiPlayer';
import { Card, GameState, Player } from '../types/game';
import { createCard, createJokerCard } from './testUtils';
import { isJokerCard, isNormalCard } from '../utils/cardUtils';

const createPlayer = (id: string, name: string, hand: Card[] = []): Player => ({
  id,
  name,
  hand,
  currentMission: 1,
  completedMissions: [],
  score: 0,
  combinations: [],
  isCurrentMissionCompleted() {
    return this.completedMissions.includes(this.currentMission);
  },
});

const createGameState = (players: Player[], deck: Card[], discardPile: Card[] = []): GameState => ({
  players,
  currentPlayerIndex: 1, // AI is player index 1 by default
  deck,
  discardPile,
  isGameStarted: true,
  isGameOver: false,
  winner: null,
  gameHistory: [],
  gameMode: 'ai',
  isAITurn: true,
  cardsDrawnThisTurn: 0,
  hasDrawnThisTurn: false,
  mustDiscardToEndTurn: false,
  lastDrawnCardId: null,
});

describe('AIPlayer', () => {
  beforeEach(() => {
    // Make Math.random deterministic: always return 0 (first index)
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('makeMove - normal turn', () => {
    it('draws one card from the deck and discards one card', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      const ai = createPlayer('ai', 'AI', [createCard('5', 'spades'), createCard('7', 'clubs')]);
      const deck = [createCard('K', 'diamonds'), createCard('Q', 'hearts')];
      const state = createGameState([human, ai], deck);

      const initialHandSize = ai.hand.length;
      const initialDeckSize = state.deck.length;
      const initialDiscardSize = state.discardPile.length;

      AIPlayer.makeMove(state);

      // AI hand size should be unchanged (drew 1, discarded 1)
      expect(ai.hand).toHaveLength(initialHandSize);
      // Deck shrinks by 1
      expect(state.deck).toHaveLength(initialDeckSize - 1);
      // Discard pile grows by 1
      expect(state.discardPile).toHaveLength(initialDiscardSize + 1);
    });

    it('records draw and discard in game history', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      const ai = createPlayer('ai', 'AI', [createCard('5', 'spades')]);
      const deck = [createCard('K', 'diamonds'), createCard('Q', 'hearts')];
      const state = createGameState([human, ai], deck);

      AIPlayer.makeMove(state);

      expect(state.gameHistory.some(h => h.includes('AI') && h.includes('pioche'))).toBe(true);
      expect(state.gameHistory.some(h => h.includes('AI') && h.includes('défausse'))).toBe(true);
    });

    it('advances currentPlayerIndex to next player when round did not end', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      const ai = createPlayer('ai', 'AI', [createCard('5', 'spades'), createCard('7', 'clubs')]);
      const deck = [createCard('K', 'diamonds')];
      const state = createGameState([human, ai], deck);
      state.currentPlayerIndex = 1;

      AIPlayer.makeMove(state);

      expect(state.currentPlayerIndex).toBe(0);
    });

    it('draws the top card of the deck (last element)', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      const ai = createPlayer('ai', 'AI', [createCard('5', 'spades')]);
      const topCard = createCard('K', 'diamonds');
      const deck = [createCard('2', 'clubs'), topCard];
      const state = createGameState([human, ai], deck);

      AIPlayer.makeMove(state);

      // Top card should now be in AI's hand or in the discard pile
      // (since Math.random=0 picks the first card in hand to discard, and the new card was pushed last,
      // the original first card is discarded and the drawn card stays in the hand)
      const drawnCardInHand = ai.hand.some(c => c.id === topCard.id);
      const drawnCardInDiscard = state.discardPile.some(c => c.id === topCard.id);
      expect(drawnCardInHand || drawnCardInDiscard).toBe(true);
    });

    it('formats discard message with card value for normal cards', () => {
      const human = createPlayer('p1', 'Human', []);
      const ai = createPlayer('ai', 'AI', [createCard('7', 'clubs')]);
      const deck = [createCard('K', 'diamonds'), createCard('Q', 'hearts')];
      const state = createGameState([human, ai], deck);

      AIPlayer.makeMove(state);

      const discardMsg = state.gameHistory.find(h => h.includes('défausse'));
      expect(discardMsg).toBeDefined();
      // With Math.random=0, the first card in hand (the 7 of clubs) is discarded
      expect(discardMsg).toContain('7');
    });

    it('formats discard message as "Joker" when discarding a joker', () => {
      const human = createPlayer('p1', 'Human', []);
      const joker = createJokerCard();
      const ai = createPlayer('ai', 'AI', [joker]);
      const deck = [createCard('K', 'diamonds'), createCard('Q', 'hearts')];
      const state = createGameState([human, ai], deck);

      AIPlayer.makeMove(state);

      const discardMsg = state.gameHistory.find(h => h.includes('défausse'));
      expect(discardMsg).toContain('Joker');
    });
  });

  describe('makeMove - empty deck', () => {
    it('does not crash when the deck is empty and still discards', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      const ai = createPlayer('ai', 'AI', [createCard('5', 'spades'), createCard('7', 'clubs')]);
      const state = createGameState([human, ai], []);

      const initialHandSize = ai.hand.length;
      const initialDiscardSize = state.discardPile.length;

      expect(() => AIPlayer.makeMove(state)).not.toThrow();
      // No draw possible, but discard still happens
      expect(ai.hand).toHaveLength(initialHandSize - 1);
      expect(state.discardPile).toHaveLength(initialDiscardSize + 1);
    });

    it('does nothing when both deck and hand are empty', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      const ai = createPlayer('ai', 'AI', []);
      const state = createGameState([human, ai], []);

      const startIdx = state.currentPlayerIndex;
      expect(() => AIPlayer.makeMove(state)).not.toThrow();
      expect(ai.hand).toHaveLength(0);
      expect(state.discardPile).toHaveLength(0);
      // currentPlayerIndex should not change since the discard branch never ran
      expect(state.currentPlayerIndex).toBe(startIdx);
    });
  });

  describe('makeMove - round end', () => {
    it('triggers round end and redistributes 13 cards when AI goes out', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      // AI has empty hand to start; deck has 1 card so it draws then discards, ending with 0
      const ai = createPlayer('ai', 'AI', []);
      const drawCard = createCard('5', 'spades');
      const state = createGameState([human, ai], [drawCard]);

      AIPlayer.makeMove(state);

      // After round end:
      // - both players should have 13 cards
      expect(human.hand).toHaveLength(13);
      expect(ai.hand).toHaveLength(13);
      // - combinations cleared
      expect(human.combinations).toEqual([]);
      expect(ai.combinations).toEqual([]);
      // - new discard pile has 1 card
      expect(state.discardPile).toHaveLength(1);
      // - currentPlayerIndex reset to 0
      expect(state.currentPlayerIndex).toBe(0);
      // - isAITurn cleared
      expect(state.isAITurn).toBe(false);
      // - history mentions round end
      expect(state.gameHistory.some(h => h.includes('termine la manche'))).toBe(true);
      expect(state.gameHistory.some(h => h.includes('Nouvelle manche'))).toBe(true);
    });

    it('does not trigger round end when AI still has cards after discard', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      const ai = createPlayer('ai', 'AI', [
        createCard('5', 'spades'),
        createCard('7', 'clubs'),
        createCard('9', 'diamonds'),
      ]);
      const deck = [createCard('K', 'diamonds')];
      const state = createGameState([human, ai], deck);

      AIPlayer.makeMove(state);

      expect(ai.hand.length).toBe(3); // drew 1, discarded 1, net 0
      expect(state.gameHistory.some(h => h.includes('Nouvelle manche'))).toBe(false);
    });

    it('clears existing combinations from all players on round end', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      human.combinations = [
        {
          id: 'c1',
          type: 'group',
          cards: [createCard('3', 'hearts'), createCard('3', 'clubs'), createCard('3', 'spades')],
        },
      ];
      const ai = createPlayer('ai', 'AI', []);
      ai.combinations = [
        {
          id: 'c2',
          type: 'group',
          cards: [createCard('K', 'hearts'), createCard('K', 'clubs'), createCard('K', 'spades')],
        },
      ];
      const state = createGameState([human, ai], [createCard('5', 'spades')]);

      AIPlayer.makeMove(state);

      expect(human.combinations).toEqual([]);
      expect(ai.combinations).toEqual([]);
    });
  });

  describe('makeMove with playable combinations in hand', () => {
    it('still draws and discards even when valid groups are present', () => {
      // Hand contains a valid group of 3 (three different-suit 7s) and a valid sequence
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      const ai = createPlayer('ai', 'AI', [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createCard('7', 'spades'),
        createCard('4', 'hearts'),
        createCard('5', 'hearts'),
        createCard('6', 'hearts'),
      ]);
      const deck = [createCard('K', 'diamonds')];
      const state = createGameState([human, ai], deck);

      const initialHandSize = ai.hand.length;
      AIPlayer.makeMove(state);

      // Current AI implementation draws and discards regardless of available combinations
      expect(ai.hand).toHaveLength(initialHandSize); // drew 1, discarded 1
      expect(state.deck).toHaveLength(0);
      expect(state.discardPile).toHaveLength(1);
    });
  });

  describe('makeMove preserves total card invariant on normal turn', () => {
    it('total card count stays constant after a draw+discard turn', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts'), createCard('2', 'hearts')]);
      const ai = createPlayer('ai', 'AI', [createCard('5', 'spades'), createCard('7', 'clubs')]);
      const deck = [createCard('K', 'diamonds'), createCard('Q', 'hearts'), createCard('J', 'clubs')];
      const initialDiscard = [createCard('3', 'diamonds')];
      const state = createGameState([human, ai], deck, initialDiscard);

      const totalBefore = human.hand.length + ai.hand.length + state.deck.length + state.discardPile.length;
      AIPlayer.makeMove(state);
      const totalAfter = human.hand.length + ai.hand.length + state.deck.length + state.discardPile.length;

      expect(totalAfter).toBe(totalBefore);
    });
  });
});
