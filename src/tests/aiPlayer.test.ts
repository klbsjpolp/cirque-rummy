import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { chooseAIDiscard, chooseAIDraw } from '../utils/aiPlayer';
import { gameReducer } from '../game/gameReducer';
import { Card, GameState, Player } from '../types/game';
import { createCard, createJokerCard } from './testUtils';

const createPlayer = (id: string, name: string, hand: Card[] = []): Player => ({
  id,
  name,
  hand,
  currentMission: 1,
  completedMissions: [],
  score: 0,
  combinations: [],
  missionCompletedThisRound: false,
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
  notice: null,
});

const aiMove = (state: GameState): GameState => gameReducer(state, { type: 'AI_MOVE' });

describe('AI decisions', () => {
  it('draws from the deck when the discard pile card is of no use', () => {
    const state = createGameState(
      [createPlayer('p1', 'Human'), createPlayer('ai', 'AI')],
      [createCard('K', 'diamonds')],
      [createCard('2', 'hearts')],
    );

    expect(chooseAIDraw(state)).toBe(false);
  });

  it('picks a card from the current player\'s hand', () => {
    const hand = [createCard('5', 'spades'), createCard('7', 'clubs')];
    const state = createGameState([createPlayer('p1', 'Human'), createPlayer('ai', 'AI', hand)], []);

    expect(chooseAIDiscard(state, () => 0)).toBe(hand[0].id);
    expect(chooseAIDiscard(state, () => 0.99)).toBe(hand[1].id);
  });

  it('has nothing to discard from an empty hand', () => {
    const state = createGameState([createPlayer('p1', 'Human'), createPlayer('ai', 'AI', [])], []);

    expect(chooseAIDiscard(state)).toBeUndefined();
  });
});

describe('AI turn', () => {
  beforeEach(() => {
    // Rend Math.random déterministe : toujours le premier indice.
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('normal turn', () => {
    it('draws one card from the deck and discards one card', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      const ai = createPlayer('ai', 'AI', [createCard('5', 'spades'), createCard('7', 'clubs')]);
      const state = createGameState([human, ai], [createCard('K', 'diamonds'), createCard('Q', 'hearts')]);

      const next = aiMove(state);

      expect(next.players[1].hand).toHaveLength(ai.hand.length);
      expect(next.deck).toHaveLength(state.deck.length - 1);
      expect(next.discardPile).toHaveLength(state.discardPile.length + 1);
    });

    it('records draw and discard in game history', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      const ai = createPlayer('ai', 'AI', [createCard('5', 'spades')]);
      const state = createGameState([human, ai], [createCard('K', 'diamonds'), createCard('Q', 'hearts')]);

      const next = aiMove(state);

      expect(next.gameHistory.some(h => h.includes('AI') && h.includes('pioche'))).toBe(true);
      expect(next.gameHistory.some(h => h.includes('AI') && h.includes('défausse'))).toBe(true);
    });

    it('advances currentPlayerIndex to next player when round did not end', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      const ai = createPlayer('ai', 'AI', [createCard('5', 'spades'), createCard('7', 'clubs')]);
      const state = createGameState([human, ai], [createCard('K', 'diamonds')]);

      const next = aiMove(state);

      expect(next.currentPlayerIndex).toBe(0);
      expect(next.isAITurn).toBe(false);
    });

    it('draws the top card of the deck (last element)', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      const ai = createPlayer('ai', 'AI', [createCard('5', 'spades')]);
      const topCard = createCard('K', 'diamonds');
      const state = createGameState([human, ai], [createCard('2', 'clubs'), topCard]);

      const next = aiMove(state);

      const inHand = next.players[1].hand.some(c => c.id === topCard.id);
      const inDiscard = next.discardPile.some(c => c.id === topCard.id);
      expect(inHand || inDiscard).toBe(true);
    });

    it('formats discard message with card value for normal cards', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      const ai = createPlayer('ai', 'AI', [createCard('7', 'clubs')]);
      const state = createGameState([human, ai], [createCard('K', 'diamonds'), createCard('Q', 'hearts')]);

      const next = aiMove(state);

      const discardMsg = next.gameHistory.find(h => h.includes('défausse'));
      expect(discardMsg).toBeDefined();
      expect(discardMsg).toContain('7');
    });

    it('formats discard message as "Joker" when discarding a joker', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      // L'IA ne se sépare d'un joker qu'à défaut de carte normale : il faut donc
      // qu'elle n'ait que des jokers en main après avoir pioché.
      const ai = createPlayer('ai', 'AI', [createJokerCard()]);
      const state = createGameState([human, ai], [createCard('K', 'diamonds'), createJokerCard()]);

      const next = aiMove(state);

      expect(next.gameHistory.find(h => h.includes('défausse'))).toContain('Joker');
    });
  });

  describe('exhausted table', () => {
    it('reforms the deck from the discard pile instead of skipping the draw', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      const ai = createPlayer('ai', 'AI', [createCard('5', 'spades'), createCard('7', 'clubs')]);
      const state = createGameState([human, ai], [], [
        createCard('2', 'hearts'),
        createCard('3', 'hearts'),
        createCard('4', 'hearts'),
      ]);

      const next = aiMove(state);

      // L'IA passe par les mêmes règles que le joueur : la défausse reforme la pioche.
      expect(next.gameHistory.some(h => h.includes('remélangée'))).toBe(true);
      expect(next.players[1].hand).toHaveLength(ai.hand.length);
    });

    it('redeals the round when nothing can be drawn at all', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      const ai = createPlayer('ai', 'AI', [createCard('5', 'spades')]);
      const state = createGameState([human, ai], [], []);

      const next = aiMove(state);

      expect(next.gameHistory.some(h => h.includes('Plus rien à piocher'))).toBe(true);
      expect(next.players.map(p => p.hand.length)).toEqual([13, 13]);
    });
  });

  describe('round end', () => {
    it('triggers round end and redistributes 13 cards when AI goes out', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      const ai = createPlayer('ai', 'AI', []);
      const state = createGameState([human, ai], [createCard('5', 'spades')], [createCard('2', 'hearts')]);

      const next = aiMove(state);

      expect(next.players[0].hand).toHaveLength(13);
      expect(next.players[1].hand).toHaveLength(13);
      expect(next.players[0].combinations).toEqual([]);
      expect(next.players[1].combinations).toEqual([]);
      expect(next.discardPile).toHaveLength(1);
      expect(next.currentPlayerIndex).toBe(0);
      expect(next.isAITurn).toBe(false);
      expect(next.gameHistory.some(h => h.includes('termine la manche'))).toBe(true);
      expect(next.gameHistory.some(h => h.includes('Nouvelle manche'))).toBe(true);
    });

    it('does not trigger round end when AI still has cards after discard', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      const ai = createPlayer('ai', 'AI', [
        createCard('5', 'spades'),
        createCard('7', 'clubs'),
        createCard('9', 'diamonds'),
      ]);
      const state = createGameState([human, ai], [createCard('K', 'diamonds')]);

      const next = aiMove(state);

      expect(next.players[1].hand).toHaveLength(3);
      expect(next.gameHistory.some(h => h.includes('Nouvelle manche'))).toBe(false);
    });

    it('clears existing combinations from all players on round end', () => {
      const human = createPlayer('p1', 'Human', [createCard('A', 'hearts')]);
      human.combinations = [{
        id: 'c1',
        type: 'group',
        cards: [createCard('3', 'hearts'), createCard('3', 'clubs'), createCard('3', 'spades')],
      }];
      const ai = createPlayer('ai', 'AI', []);
      const state = createGameState([human, ai], [createCard('5', 'spades')], [createCard('2', 'hearts')]);

      const next = aiMove(state);

      expect(next.players[0].combinations).toEqual([]);
    });
  });
});
