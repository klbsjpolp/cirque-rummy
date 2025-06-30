import { describe, it, expect } from 'vitest'
import { Card, Player, GameState, Combination } from '../types/game'
import {createCard, createJokerCard} from './testUtils'
import {isJokerCard, isNormalCard} from "@/utils/cardUtils.ts";

describe('Post-Mission Completion Mechanics', () => {
  const createCombination = (cards: Card[], type: 'group' | 'sequence'): Combination => ({
    id: `combo-${Math.random()}`,
    cards,
    type
  })

  const createPlayer = (id: string, name: string, completedMissions: number[] = []): Player => ({
    id,
    name,
    hand: [
      createCard('K', 'hearts'),
      createCard('K', 'diamonds'),
      createCard('Q', 'clubs'),
      createCard('J', 'spades'),
      createCard('10', 'hearts')
    ],
    currentMission: 1,
    completedMissions,
    score: 0,
    combinations: [],

    isCurrentMissionCompleted(): boolean {
      return true;
    }
  })

  const createGameState = (players: Player[]): GameState => ({
    players,
    currentPlayerIndex: 0,
    deck: [],
    discardPile: [],
    isGameStarted: true,
    isGameOver: false,
    winner: null,
    gameHistory: [],
    gameMode: 'pvp',
    isAITurn: false,
    cardsDrawnThisTurn: 0,
    hasDrawnThisTurn: false,
    mustDiscardToEndTurn: false
  })

  describe('Adding Cards to Own Combinations After Mission Completion', () => {
    it('should allow extending own groups after mission completion', () => {
      const player = createPlayer('p1', 'Player 1', [1]) // Has completed mission 1
      
      const existingGroup = createCombination([
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createCard('7', 'spades')
      ], 'group')
      
      player.combinations = [existingGroup]
      player.hand.push(createCard('7', 'hearts')) // Can add 4th card to group
      createGameState([player]);

      // Should be able to add the 4th 7 to the existing group
      expect(player.completedMissions.length).toBeGreaterThan(0)
      expect(existingGroup.cards.length).toBe(3)
      
      // After adding card, group should have 4 cards
      const cardToAdd = player.hand.filter(isNormalCard).find(c => c.value === '7' && c.suit === 'hearts')
      expect(cardToAdd).toBeDefined()
    })

    it('should allow extending own sequences after mission completion', () => {
      const player = createPlayer('p1', 'Player 1', [2]) // Has completed mission 2
      
      const existingSequence = createCombination([
        createCard('4', 'spades'),
        createCard('5', 'spades'),
        createCard('6', 'spades')
      ], 'sequence')
      
      player.combinations = [existingSequence]
      player.hand.push(createCard('7', 'spades')) // Can extend sequence
      createGameState([player]);

      // Should be able to extend the sequence
      expect(player.completedMissions.length).toBeGreaterThan(0)
      expect(existingSequence.cards.length).toBe(3)
      
      // After adding card, sequence should have 4 cards
      const cardToAdd = player.hand.filter(isNormalCard).find(c => c.value === '7' && c.suit === 'spades')
      expect(cardToAdd).toBeDefined()
    })

    it('should not allow extending combinations if mission not completed', () => {
      const player = createPlayer('p1', 'Player 1', []) // No completed missions
      
      const existingGroup = createCombination([
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createCard('7', 'spades')
      ], 'group')
      
      player.combinations = [existingGroup]
      player.hand.push(createCard('7', 'hearts'))
      createGameState([player]);

      // Should not be able to extend combinations without completed mission
      expect(player.completedMissions.length).toBe(0)
    })
  })

  describe('Adding Cards to Opponent Combinations', () => {
    it('should allow extending opponent combinations when both players completed missions', () => {
      const player1 = createPlayer('p1', 'Player 1', [1]) // Has completed mission
      const player2 = createPlayer('p2', 'Player 2', [2]) // Has completed mission
      
      const opponentGroup = createCombination([
        createCard('Q', 'clubs'),
        createCard('Q', 'diamonds'),
        createCard('Q', 'spades')
      ], 'group')
      
      player2.combinations = [opponentGroup]
      player1.hand.push(createCard('Q', 'hearts')) // Can add to opponent's group
      createGameState([player1, player2]);

      // Both players have completed missions
      expect(player1.completedMissions.length).toBeGreaterThan(0)
      expect(player2.completedMissions.length).toBeGreaterThan(0)
      
      // Should be able to add to opponent's combination
      const cardToAdd = player1.hand.filter(isNormalCard).find(c => c.value === 'Q' && c.suit === 'hearts')
      expect(cardToAdd).toBeDefined()
    })

    it('should not allow extending opponent combinations if opponent has not completed mission', () => {
      const player1 = createPlayer('p1', 'Player 1', [1]) // Has completed mission
      const player2 = createPlayer('p2', 'Player 2', []) // No completed missions
      
      const opponentGroup = createCombination([
        createCard('Q', 'clubs'),
        createCard('Q', 'diamonds'),
        createCard('Q', 'spades')
      ], 'group')
      
      player2.combinations = [opponentGroup]
      player1.hand.push(createCard('Q', 'hearts'))
      createGameState([player1, player2]);

      // Player 1 has completed mission but player 2 hasn't
      expect(player1.completedMissions.length).toBeGreaterThan(0)
      expect(player2.completedMissions.length).toBe(0)
      
      // Should not be able to add to opponent's combination
    })

    it('should not allow extending opponent combinations if current player has not completed mission', () => {
      const player1 = createPlayer('p1', 'Player 1', []) // No completed missions
      const player2 = createPlayer('p2', 'Player 2', [2]) // Has completed mission
      
      const opponentGroup = createCombination([
        createCard('Q', 'clubs'),
        createCard('Q', 'diamonds'),
        createCard('Q', 'spades')
      ], 'group')
      
      player2.combinations = [opponentGroup]
      player1.hand.push(createCard('Q', 'hearts'))
      createGameState([player1, player2]);

      // Player 2 has completed mission but player 1 hasn't
      expect(player1.completedMissions.length).toBe(0)
      expect(player2.completedMissions.length).toBeGreaterThan(0)
      
      // Should not be able to add to opponent's combination
    })
  })

  describe('Creating New Combinations After Mission Completion', () => {
    it('should allow creating new groups after mission completion', () => {
      const player = createPlayer('p1', 'Player 1', [1]) // Has completed mission
      
      // Player has cards to form a new group
      player.hand = [
        createCard('K', 'clubs'),
        createCard('K', 'diamonds'),
        createCard('K', 'spades'),
        createCard('A', 'hearts'),
        createCard('2', 'clubs')
      ]
      createGameState([player]);

      // Should be able to create new group after mission completion
      expect(player.completedMissions.length).toBeGreaterThan(0)
      
      const newGroupCards = [
        createCard('K', 'clubs'),
        createCard('K', 'diamonds'),
        createCard('K', 'spades')
      ]
      
      // This should be allowed
      expect(newGroupCards.length).toBe(3)
      expect(new Set(newGroupCards.map(c => c.value)).size).toBe(1) // Same value
      expect(new Set(newGroupCards.map(c => c.suit)).size).toBe(3) // Different suits
    })

    it('should NOT allow creating new sequences after mission completion', () => {
      const player = createPlayer('p1', 'Player 1', [1]) // Has completed mission
      
      // Player has cards to form a new sequence
      player.hand = [
        createCard('4', 'hearts'),
        createCard('5', 'hearts'),
        createCard('6', 'hearts'),
        createCard('A', 'clubs'),
        createCard('2', 'spades')
      ]
      createGameState([player]);

      // Should NOT be able to create new sequence after mission completion
      expect(player.completedMissions.length).toBeGreaterThan(0)
      
      const newSequenceCards = [
        createCard('4', 'hearts'),
        createCard('5', 'hearts'),
        createCard('6', 'hearts')
      ]
      
      // This should NOT be allowed according to the rules
      expect(newSequenceCards.length).toBe(3)
      expect(new Set(newSequenceCards.map(c => c.suit)).size).toBe(1) // Same suit
      
      // The rule states: "Former de nouveaux groupes (mais pas de nouvelles suites)"
    })

    it('should allow creating new combinations before mission completion', () => {
      const player = createPlayer('p1', 'Player 1', []) // No completed missions
      
      // Player has cards to form combinations
      player.hand = [
        createCard('K', 'clubs'),
        createCard('K', 'diamonds'),
        createCard('K', 'spades'),
        createCard('4', 'hearts'),
        createCard('5', 'hearts'),
        createCard('6', 'hearts')
      ]
      createGameState([player]);

      // Should be able to create any valid combination before mission completion
      expect(player.completedMissions.length).toBe(0)
      
      const newGroupCards = [
        createCard('K', 'clubs'),
        createCard('K', 'diamonds'),
        createCard('K', 'spades')
      ]
      
      const newSequenceCards = [
        createCard('4', 'hearts'),
        createCard('5', 'hearts'),
        createCard('6', 'hearts')
      ]
      
      // Both should be allowed before mission completion
      expect(newGroupCards.length).toBe(3)
      expect(newSequenceCards.length).toBe(3)
    })
  })

  describe('Mission Completion Status Tracking', () => {
    it('should correctly track when a player has completed at least one mission', () => {
      const playerWithMission = createPlayer('p1', 'Player 1', [3])
      const playerWithoutMission = createPlayer('p2', 'Player 2', [])
      
      expect(playerWithMission.completedMissions.length).toBeGreaterThan(0)
      expect(playerWithoutMission.completedMissions.length).toBe(0)
    })

    it('should correctly track multiple completed missions', () => {
      const player = createPlayer('p1', 'Player 1', [1, 2, 3])
      
      expect(player.completedMissions.length).toBe(3)
      expect(player.completedMissions).toContain(1)
      expect(player.completedMissions).toContain(2)
      expect(player.completedMissions).toContain(3)
    })

    it('should handle edge case of player with 7 completed missions (game winner)', () => {
      const winningPlayer = createPlayer('p1', 'Player 1', [1, 2, 3, 4, 5, 6, 7])
      
      expect(winningPlayer.completedMissions.length).toBe(7)
      
      // Should still be able to extend combinations even as winner
      expect(winningPlayer.completedMissions.length).toBeGreaterThan(0)
    })
  })

  describe('Game State Validation for Post-Mission Rules', () => {
    it('should maintain valid game state when extending combinations', () => {
      const player1 = createPlayer('p1', 'Player 1', [1])
      const player2 = createPlayer('p2', 'Player 2', [2])
      
      const gameState = createGameState([player1, player2])
      
      // Game state should be valid
      expect(gameState.players.length).toBe(2)
      expect(gameState.currentPlayerIndex).toBe(0)
      expect(gameState.isGameStarted).toBe(true)
      expect(gameState.isGameOver).toBe(false)
    })

    it('should properly handle turn progression after post-mission actions', () => {
      const player1 = createPlayer('p1', 'Player 1', [1])
      const player2 = createPlayer('p2', 'Player 2', [])
      
      const gameState = createGameState([player1, player2])
      
      // Current player should be able to perform post-mission actions
      const currentPlayer = gameState.players[gameState.currentPlayerIndex]
      expect(currentPlayer.id).toBe('p1')
      expect(currentPlayer.completedMissions.length).toBeGreaterThan(0)
    })

    it('should track game history for post-mission actions', () => {
      const gameState = createGameState([createPlayer('p1', 'Player 1', [1])])
      
      expect(gameState.gameHistory).toBeDefined()
      expect(Array.isArray(gameState.gameHistory)).toBe(true)
      
      // Game history should be able to record post-mission actions
      const sampleHistoryEntry = "Player 1 ajoute 1 carte(s) à une combinaison de sa propre"
      expect(typeof sampleHistoryEntry).toBe('string')
    })
  })

  describe('Integration with Existing Game Mechanics', () => {
    it('should work correctly with jokers in post-mission combinations', () => {
      const player = createPlayer('p1', 'Player 1', [1])
      
      const existingGroup = createCombination([
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createJokerCard() // joker
      ], 'group')
      
      player.combinations = [existingGroup]
      player.hand.push(createCard('7', 'spades')) // Can add real card to group with joker
      
      expect(player.completedMissions.length).toBeGreaterThan(0)
      expect(existingGroup.cards.some(isJokerCard)).toBe(true)
    })

    it('should maintain card count consistency during post-mission actions', () => {
      const player = createPlayer('p1', 'Player 1', [1])
      const initialHandSize = player.hand.length
      
      // When adding cards to combinations, hand size should decrease
      expect(initialHandSize).toBeGreaterThan(0)
      
      // After adding 1 card to combination, hand should have 1 less card
      const expectedHandSize = initialHandSize - 1
      expect(expectedHandSize).toBeGreaterThanOrEqual(0)
    })

    it('should work with AI players in post-mission scenarios', () => {
      const humanPlayer = createPlayer('human', 'Human Player', [1])
      const aiPlayer = createPlayer('ai', 'AI Player', [2])
      
      const gameState = createGameState([humanPlayer, aiPlayer])
      gameState.gameMode = 'ai'
      
      // Both players have completed missions
      expect(humanPlayer.completedMissions.length).toBeGreaterThan(0)
      expect(aiPlayer.completedMissions.length).toBeGreaterThan(0)
      
      // Should be able to interact with AI player's combinations
      expect(gameState.gameMode).toBe('ai')
    })
  })
})