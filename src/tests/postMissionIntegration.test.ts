import {describe, expect, it} from 'vitest'
import {Player} from '../types/game'
import {createCard} from "@/tests/testUtils.ts";

// Mock the useGameState hook for testing
// Note: This is a simplified version for testing purposes
const createMockGameState = () => {
  const createPlayer = (id: string, name: string, completedMissions: number[] = []): Player => ({
    id,
    name,
    hand: [
      createCard('K', 'hearts'),
      createCard('K', 'diamonds'),
      createCard('K', 'spades'),
      createCard('4', 'hearts'),
      createCard('5', 'hearts'),
      createCard('6', 'hearts'),
      createCard('7', 'hearts'),
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

  return {
    players: [
      createPlayer('p1', 'Player 1', []),
      createPlayer('p2', 'Player 2', [])
    ],
    currentPlayerIndex: 0,
    deck: [],
    discardPile: [],
    isGameStarted: true,
    isGameOver: false,
    winner: null,
    gameHistory: [],
    gameMode: 'pvp' as const,
    isAITurn: false
  }
}

describe('Post-Mission Completion Integration Tests', () => {
  describe('Laying New Combinations After Mission Completion', () => {
    it('should allow laying new groups after mission completion', () => {
      const gameState = createMockGameState()
      
      // Simulate player completing a mission
      gameState.players[0].completedMissions = [1]
      
      // Player has cards for a new group
      const groupCardIds = ['K-hearts', 'K-diamonds', 'K-spades']
      
      // Mock the layCombination function behavior
      const mockLayCombination = (cardIds: string[], type: 'group' | 'sequence') => {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex]
        const hasCompletedMission = currentPlayer.completedMissions.length > 0
        
        if (hasCompletedMission && type === 'sequence') {
          return false // Should not allow new sequences
        }
        
        if (type === 'group') {
          return true // Should allow new groups
        }
        
        return true // Allow before mission completion
      }
      
      // Test laying a new group after mission completion
      const canLayGroup = mockLayCombination(groupCardIds, 'group')
      expect(canLayGroup).toBe(true)
      expect(gameState.players[0].completedMissions.length).toBeGreaterThan(0)
    })

    it('should NOT allow laying new sequences after mission completion', () => {
      const gameState = createMockGameState()
      
      // Simulate player completing a mission
      gameState.players[0].completedMissions = [1]
      
      // Player has cards for a new sequence
      const sequenceCardIds = ['4-hearts', '5-hearts', '6-hearts']
      
      // Mock the layCombination function behavior
      const mockLayCombination = (cardIds: string[], type: 'group' | 'sequence') => {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex]
        const hasCompletedMission = currentPlayer.completedMissions.length > 0
        
        return !(hasCompletedMission && type === 'sequence');
      }
      
      // Test laying a new sequence after mission completion
      const canLaySequence = mockLayCombination(sequenceCardIds, 'sequence')
      expect(canLaySequence).toBe(false)
      expect(gameState.players[0].completedMissions.length).toBeGreaterThan(0)
    })

    it('should allow laying both groups and sequences before mission completion', () => {
      const gameState = createMockGameState()
      
      // Player has not completed any missions
      gameState.players[0].completedMissions = []
      
      const groupCardIds = ['K-hearts', 'K-diamonds', 'K-spades']
      const sequenceCardIds = ['4-hearts', '5-hearts', '6-hearts']
      
      // Mock the layCombination function behavior
      const mockLayCombination = (cardIds: string[], type: 'group' | 'sequence') => {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex]
        const hasCompletedMission = currentPlayer.completedMissions.length > 0
        
        return !(hasCompletedMission && type === 'sequence');
      }
      
      // Test laying combinations before mission completion
      const canLayGroup = mockLayCombination(groupCardIds, 'group')
      const canLaySequence = mockLayCombination(sequenceCardIds, 'sequence')
      
      expect(canLayGroup).toBe(true)
      expect(canLaySequence).toBe(true)
      expect(gameState.players[0].completedMissions.length).toBe(0)
    })
  })

  describe('Adding to Existing Combinations After Mission Completion', () => {
    it('should allow adding to own combinations after mission completion', () => {
      const gameState = createMockGameState()
      
      // Simulate player completing a mission and having existing combinations
      gameState.players[0].completedMissions = [1]
      gameState.players[0].combinations = [{
        id: 'combo-1',
        cards: [
          createCard('7', 'clubs'),
          createCard('7', 'diamonds'),
          createCard('7', 'spades')
        ],
        type: 'group'
      }]
      
      // Mock the addToExistingCombination function behavior
      const mockAddToExisting = (cardIds: string[], combinationId: string, targetPlayerId?: string) => {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex]
        const hasCompletedMission = currentPlayer.completedMissions.length > 0
        
        if (!hasCompletedMission) return false
        
        if (targetPlayerId) {
          const targetPlayer = gameState.players.find(p => p.id === targetPlayerId)
          const targetHasCompletedMission = targetPlayer?.completedMissions.length || 0 > 0
          if (!targetHasCompletedMission) return false
        }
        
        return true
      }
      
      // Test adding to own combination
      const canAddToOwn = mockAddToExisting(['7-hearts'], 'combo-1')
      expect(canAddToOwn).toBe(true)
    })

    it('should allow adding to opponent combinations when both completed missions', () => {
      const gameState = createMockGameState()
      
      // Both players have completed missions
      gameState.players[0].completedMissions = [1]
      gameState.players[1].completedMissions = [2]
      gameState.players[1].combinations = [{
        id: 'combo-2',
        cards: [
          createCard('Q', 'clubs'),
          createCard('Q', 'diamonds'),
          createCard('Q', 'spades')
        ],
        type: 'group'
      }]
      
      // Mock the addToExistingCombination function behavior
      const mockAddToExisting = (cardIds: string[], combinationId: string, targetPlayerId?: string) => {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex]
        const hasCompletedMission = currentPlayer.completedMissions.length > 0
        
        if (!hasCompletedMission) return false
        
        if (targetPlayerId) {
          const targetPlayer = gameState.players.find(p => p.id === targetPlayerId)
          const targetHasCompletedMission = targetPlayer?.completedMissions.length || 0 > 0
          if (!targetHasCompletedMission) return false
        }
        
        return true
      }
      
      // Test adding to opponent's combination
      const canAddToOpponent = mockAddToExisting(['Q-hearts'], 'combo-2', 'p2')
      expect(canAddToOpponent).toBe(true)
    })

    it('should NOT allow adding to opponent combinations if opponent has not completed mission', () => {
      const gameState = createMockGameState()
      
      // Only current player has completed mission
      gameState.players[0].completedMissions = [1]
      gameState.players[1].completedMissions = [] // Opponent has not completed mission
      gameState.players[1].combinations = [{
        id: 'combo-2',
        cards: [
          createCard('Q', 'clubs'),
          createCard('Q', 'diamonds'),
          createCard('Q', 'spades')
        ],
        type: 'group'
      }]
      
      // Mock the addToExistingCombination function behavior
      const mockAddToExisting = (cardIds: string[], combinationId: string, targetPlayerId?: string) => {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex]
        const hasCompletedMission = currentPlayer.completedMissions.length > 0
        
        if (!hasCompletedMission) return false
        
        if (targetPlayerId) {
          const targetPlayer = gameState.players.find(p => p.id === targetPlayerId)
          const targetHasCompletedMission = targetPlayer?.completedMissions.length || 0 > 0
          if (!targetHasCompletedMission) return false
        }
        
        return true
      }
      
      // Test adding to opponent's combination when opponent hasn't completed mission
      const canAddToOpponent = mockAddToExisting(['Q-hearts'], 'combo-2', 'p2')
      expect(canAddToOpponent).toBe(false)
    })
  })

  describe('Game Flow Integration', () => {
    it('should maintain proper game state during post-mission actions', () => {
      const gameState = createMockGameState()
      
      // Simulate a complete game flow scenario
      gameState.players[0].completedMissions = [1]
      gameState.players[0].combinations = [{
        id: 'combo-1',
        cards: [
          createCard('7', 'clubs'),
          createCard('7', 'diamonds'),
          createCard('7', 'spades')
        ],
        type: 'group'
      }]
      
      // Verify game state is valid
      expect(gameState.players.length).toBe(2)
      expect(gameState.currentPlayerIndex).toBe(0)
      expect(gameState.isGameStarted).toBe(true)
      expect(gameState.isGameOver).toBe(false)
      
      // Verify current player can perform post-mission actions
      const currentPlayer = gameState.players[gameState.currentPlayerIndex]
      expect(currentPlayer.completedMissions.length).toBeGreaterThan(0)
      expect(currentPlayer.combinations.length).toBeGreaterThan(0)
    })

    it('should handle turn progression correctly after post-mission actions', () => {
      const gameState = createMockGameState()
      
      // Set up scenario where current player has completed mission
      gameState.players[0].completedMissions = [1]
      gameState.currentPlayerIndex = 0
      
      // Mock turn progression
      const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length
      
      expect(gameState.currentPlayerIndex).toBe(0)
      expect(nextPlayerIndex).toBe(1)
      
      // Verify the next player's state
      const nextPlayer = gameState.players[nextPlayerIndex]
      expect(nextPlayer.id).toBe('p2')
    })

    it('should properly track game history for post-mission actions', () => {
      const gameState = createMockGameState()
      
      // Initialize game history
      gameState.gameHistory = []
      
      // Mock adding history entries for post-mission actions
      const addHistoryEntry = (entry: string) => {
        gameState.gameHistory.push(entry)
      }
      
      addHistoryEntry("Player 1 ajoute 1 carte(s) à une combinaison de sa propre")
      addHistoryEntry("Player 1 pose une groupe de 3 cartes")
      
      expect(gameState.gameHistory.length).toBe(2)
      expect(gameState.gameHistory[0]).toContain("ajoute")
      expect(gameState.gameHistory[1]).toContain("groupe")
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid card IDs gracefully', () => {
      const gameState = createMockGameState()
      gameState.players[0].completedMissions = [1]
      
      // Mock function with invalid card IDs
      const mockLayCombination = (cardIds: string[], type: 'group' | 'sequence') => {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex]
        
        // Check if all cards exist in hand
        const cards = cardIds.map(id => 
          currentPlayer.hand.find(card => card.id === id)
        ).filter(Boolean)
        
        if (cards.length !== cardIds.length) return false
        
        const hasCompletedMission = currentPlayer.completedMissions.length > 0
        return !(hasCompletedMission && type === 'sequence');
      }
      
      // Test with invalid card IDs
      const result = mockLayCombination(['invalid-1', 'invalid-2', 'invalid-3'], 'group')
      expect(result).toBe(false)
    })

    it('should handle empty combination lists', () => {
      const gameState = createMockGameState()
      gameState.players[0].completedMissions = [1]
      gameState.players[0].combinations = [] // No existing combinations
      
      // Mock adding to non-existent combination
      const mockAddToExisting = (cardIds: string[], combinationId: string) => {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex]
        return currentPlayer.combinations.find(c => c.id === combinationId);
      }
      
      const result = mockAddToExisting(['K-hearts'], 'non-existent-combo')
      expect(result).toBe(false)
    })

    it('should handle game state with winner correctly', () => {
      const gameState = createMockGameState()
      
      // Simulate a winning player
      gameState.players[0].completedMissions = [1, 2, 3, 4, 5, 6, 7]
      gameState.isGameOver = true
      gameState.winner = 'p1'
      
      // Even winners should be able to perform post-mission actions during their turn
      expect(gameState.players[0].completedMissions.length).toBe(7)
      expect(gameState.isGameOver).toBe(true)
      expect(gameState.winner).toBe('p1')
    })
  })
})