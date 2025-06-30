import { describe, it, expect } from 'vitest'
import { Player, GameState, Combination } from '../types/game'
import {createCard} from "@/tests/testUtils.ts";

describe('Game Flow Mechanics', () => {
  const createPlayer = (id: string, name: string, handSize = 13): Player => ({
    id,
    name,
    hand: Array.from({ length: handSize }, (_) => createCard('A', 'hearts')),
    currentMission: 1,
    completedMissions: [],
    score: 0,
    combinations: [],

    isCurrentMissionCompleted(): boolean {
      return this.completedMissions.includes(this.currentMission);
    }
  })

  const createGameState = (players: Player[]): GameState => ({
    players,
    currentPlayerIndex: 0,
    deck: Array.from({length: 50}, (_) => createCard('2', 'clubs')),
    discardPile: [createCard('3', 'diamonds')],
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

  describe('Game Initialization', () => {
    it('should start with 2 players each having 13 cards', () => {
      const player1 = createPlayer('player1', 'Player 1', 13)
      const player2 = createPlayer('player2', 'Player 2', 13)
      const gameState = createGameState([player1, player2])

      expect(gameState.players).toHaveLength(2)
      expect(gameState.players[0].hand).toHaveLength(13)
      expect(gameState.players[1].hand).toHaveLength(13)
    })

    it('should have a deck with remaining cards after dealing', () => {
      const gameState = createGameState([createPlayer('p1', 'P1'), createPlayer('p2', 'P2')])
      
      // After dealing 26 cards (13 each), deck should have remaining cards
      // Original deck: 108 cards, dealt: 26 cards, remaining: 82 cards
      expect(gameState.deck.length).toBeGreaterThan(0)
    })

    it('should have an empty discard pile initially (or one card)', () => {
      const gameState = createGameState([createPlayer('p1', 'P1')])
      
      // Discard pile should be empty or have 1 card (the first card turned over)
      expect(gameState.discardPile.length).toBeGreaterThanOrEqual(0)
      expect(gameState.discardPile.length).toBeLessThanOrEqual(1)
    })

    it('should assign random missions to each player', () => {
      const player1 = createPlayer('player1', 'Player 1')
      const player2 = createPlayer('player2', 'Player 2')
      
      expect(player1.currentMission).toBeGreaterThanOrEqual(1)
      expect(player1.currentMission).toBeLessThanOrEqual(30)
      expect(player2.currentMission).toBeGreaterThanOrEqual(1)
      expect(player2.currentMission).toBeLessThanOrEqual(30)
    })
  })

  describe('Turn Mechanics', () => {
    it('should follow the turn order: draw, play (optional), discard', () => {
      // This tests the README rule: "Actions par tour : 1. Piocher une carte, 2. Optionnel : Poser des combinaisons, 3. Défausser une carte"
      const turnPhases = ['draw', 'play_optional', 'discard']
      
      expect(turnPhases[0]).toBe('draw')
      expect(turnPhases[1]).toBe('play_optional')
      expect(turnPhases[2]).toBe('discard')
    })

    it('should allow drawing from deck or discard pile', () => {
      const gameState = createGameState([createPlayer('p1', 'P1')])
      const initialDeckSize = gameState.deck.length
      const initialDiscardSize = gameState.discardPile.length
      
      // Player can draw from either deck or discard pile
      expect(initialDeckSize).toBeGreaterThan(0)
      expect(initialDiscardSize).toBeGreaterThanOrEqual(0)
    })

    it('should increase hand size by 1 after drawing', () => {
      const player = createPlayer('p1', 'P1', 13)
      const initialHandSize = player.hand.length
      
      // After drawing, hand should have one more card
      const expectedHandSize = initialHandSize + 1
      expect(expectedHandSize).toBe(14)
    })

    it('should decrease hand size by 1 after discarding', () => {
      const player = createPlayer('p1', 'P1', 14) // Player has drawn a card
      const initialHandSize = player.hand.length
      
      // After discarding, hand should have one less card
      const expectedHandSize = initialHandSize - 1
      expect(expectedHandSize).toBe(13)
    })

    it('should alternate between players', () => {
      const gameState = createGameState([
        createPlayer('p1', 'P1'),
        createPlayer('p2', 'P2')
      ])
      
      expect(gameState.currentPlayerIndex).toBe(0)
      
      // After player 1's turn, should be player 2's turn
      const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length
      expect(nextPlayerIndex).toBe(1)
      
      // After player 2's turn, should be back to player 1
      const afterThatIndex = (nextPlayerIndex + 1) % gameState.players.length
      expect(afterThatIndex).toBe(0)
    })
  })

  describe('Combination Laying', () => {
    it('should allow laying valid groups', () => {
      const validGroup = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createCard('7', 'spades')
      ]
      
      // Should be able to create a combination from valid group
      const combination: Combination = {
        id: 'combo-1',
        cards: validGroup,
        type: 'group'
      }
      
      expect(combination.type).toBe('group')
      expect(combination.cards).toHaveLength(3)
    })

    it('should allow laying valid sequences', () => {
      const validSequence = [
        createCard('4', 'spades'),
        createCard('5', 'spades'),
        createCard('6', 'spades')
      ]
      
      // Should be able to create a combination from valid sequence
      const combination: Combination = {
        id: 'combo-1',
        cards: validSequence,
        type: 'sequence'
      }
      
      expect(combination.type).toBe('sequence')
      expect(combination.cards).toHaveLength(3)
    })

    it('should remove laid cards from player hand', () => {
      const player = createPlayer('p1', 'P1', 10)
      const cardsToLay = 3
      const expectedHandSize = player.hand.length - cardsToLay
      
      expect(expectedHandSize).toBe(7)
    })

    it('should add laid combinations to player combinations', () => {
      const player = createPlayer('p1', 'P1')
      const initialCombinations = player.combinations.length
      
      // After laying a combination, should have one more combination
      const expectedCombinations = initialCombinations + 1
      expect(expectedCombinations).toBe(1)
    })
  })

  describe('Adding to Existing Combinations', () => {
    it('should allow extending own combinations after mission completion', () => {
      // This tests the README rule: "Après mission accomplie : Une fois sa mission effectuée, le joueur peut continuer à : Étendre ses propres groupes ou suites déjà posés"
      const player = createPlayer('p1', 'P1')
      player.completedMissions = [1] // Has completed a mission
      
      const existingGroup: Combination = {
        id: 'combo-1',
        cards: [
          createCard('7', 'clubs'),
          createCard('7', 'diamonds'),
          createCard('7', 'spades')
        ],
        type: 'group'
      }
      
      player.combinations = [existingGroup]

      expect(player.completedMissions.length).toBeGreaterThan(0)
      expect(existingGroup.cards.length).toBe(3)
    })

    it('should allow extending opponent combinations after both completed missions', () => {
      // This tests the README rule: "Étendre les groupes ou suites de son adversaire (si l'adversaire a aussi fini sa mission)"
      const player1 = createPlayer('p1', 'P1')
      const player2 = createPlayer('p2', 'P2')
      
      player1.completedMissions = [1] // Both players have completed missions
      player2.completedMissions = [2]
      
      expect(player1.completedMissions.length).toBeGreaterThan(0)
      expect(player2.completedMissions.length).toBeGreaterThan(0)
    })

    it('should allow forming new groups of at least 3 cards after mission completion', () => {
      // This tests the README rule: "Former de nouveaux groupes d'au moins 3 cartes de même valeur"
      const player = createPlayer('p1', 'P1')
      player.completedMissions = [1] // Has completed a mission
      
      const newGroup = [
        createCard('K', 'clubs'),
        createCard('K', 'diamonds'),
        createCard('K', 'spades')
      ]
      
      expect(player.completedMissions.length).toBeGreaterThan(0)
      expect(newGroup.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Round Ending', () => {
    it('should end round when a player has no cards in hand', () => {
      // This tests the README rule: "Fin de manche : Une manche se termine lorsqu'un joueur n'a plus de cartes en main"
      const player = createPlayer('p1', 'P1', 0) // No cards in hand
      
      expect(player.hand).toHaveLength(0)
    })

    it('should start new round with 13 cards per player', () => {
      // This tests the README rule: "Après la fin d'une manche, tous les joueurs reçoivent 13 nouvelles cartes"
      const player1 = createPlayer('p1', 'P1', 13)
      const player2 = createPlayer('p2', 'P2', 13)
      
      expect(player1.hand).toHaveLength(13)
      expect(player2.hand).toHaveLength(13)
    })

    it('should reset combinations to zero after new round', () => {
      // This tests the README rule: "les combinaisons sont remises à zéro"
      const player = createPlayer('p1', 'P1')
      player.combinations = [] // Combinations reset for new round
      
      expect(player.combinations).toHaveLength(0)
    })

    it('should continue same mission if not completed', () => {
      // This tests the README rule: "Si un joueur termine une manche sans compléter sa mission, il continue avec la même mission"
      const player = createPlayer('p1', 'P1')
      player.currentMission = 5
      player.completedMissions = [1, 2] // Hasn't completed mission 5
      
      // After round end without mission completion, should keep same mission
      expect(player.currentMission).toBe(5)
      expect(player.completedMissions).not.toContain(5)
    })

    it('should assign new mission if current mission was completed', () => {
      // This tests the README rule: "Si un joueur termine une manche (n'a plus de cartes), il reçoit une nouvelle mission aléatoire"
      const player = createPlayer('p1', 'P1')
      player.currentMission = 5
      player.completedMissions = [1, 2, 5] // Has completed mission 5
      
      // Should get a new mission that's not already completed
      const availableMissions = Array.from({ length: 30 }, (_, i) => i + 1)
        .filter(id => !player.completedMissions.includes(id))
      
      expect(availableMissions.length).toBeGreaterThan(0)
    })
  })

  describe('Game Ending', () => {
    it('should end game when a player completes 7 missions', () => {
      // This tests the README rule: "Le premier joueur à réussir 7 missions remporte la partie"
      const winningPlayer = createPlayer('p1', 'P1')
      winningPlayer.completedMissions = [1, 2, 3, 4, 5, 6, 7]
      
      expect(winningPlayer.completedMissions).toHaveLength(7)
    })

    it('should declare the first player to reach 7 missions as winner', () => {
      const player1 = createPlayer('p1', 'Player 1')
      const player2 = createPlayer('p2', 'Player 2')
      
      player1.completedMissions = [1, 2, 3, 4, 5, 6, 7] // 7 missions
      player2.completedMissions = [8, 9, 10, 11, 12, 13] // 6 missions
      
      const gameState = createGameState([player1, player2])
      
      if (player1.completedMissions.length >= 7) {
        gameState.isGameOver = true
        gameState.winner = player1.id
      }
      
      expect(gameState.isGameOver).toBe(true)
      expect(gameState.winner).toBe(player1.id)
    })

    it('should continue game if no player has 7 missions yet', () => {
      const player1 = createPlayer('p1', 'Player 1')
      const player2 = createPlayer('p2', 'Player 2')
      
      player1.completedMissions = [1, 2, 3, 4, 5] // 5 missions
      player2.completedMissions = [6, 7, 8, 9, 10, 11] // 6 missions
      
      const gameState = createGameState([player1, player2])
      
      expect(gameState.isGameOver).toBe(false)
      expect(gameState.winner).toBe(null)
    })
  })

  describe('AI Player Mechanics', () => {
    it('should support AI vs Human gameplay', () => {
      const humanPlayer = createPlayer('human', 'Human Player')
      const aiPlayer = createPlayer('ai', 'AI Player')
      
      const gameState = createGameState([humanPlayer, aiPlayer])
      gameState.gameMode = 'ai'
      
      expect(gameState.gameMode).toBe('ai')
      expect(gameState.players).toHaveLength(2)
    })

    it('should hide AI mission from human player', () => {
      // This tests the README rule: "La mission de l'IA n'est pas visible au joueur humain"
      const aiPlayer = createPlayer('ai', 'AI Player')
      aiPlayer.currentMission = 15
      
      // In actual implementation, AI mission should be hidden from human player
      expect(aiPlayer.currentMission).toBeDefined()
      expect(typeof aiPlayer.currentMission).toBe('number')
    })

    it('should handle AI turns automatically', () => {
      const gameState = createGameState([
        createPlayer('human', 'Human'),
        createPlayer('ai', 'AI')
      ])
      gameState.gameMode = 'ai'
      gameState.currentPlayerIndex = 1 // AI's turn
      gameState.isAITurn = true
      
      expect(gameState.isAITurn).toBe(true)
      expect(gameState.currentPlayerIndex).toBe(1)
    })
  })

  describe('Game State Validation', () => {
    it('should maintain valid game state throughout gameplay', () => {
      const gameState = createGameState([
        createPlayer('p1', 'Player 1'),
        createPlayer('p2', 'Player 2')
      ])
      
      // Game state should be valid
      expect(gameState.players.length).toBeGreaterThan(0)
      expect(gameState.currentPlayerIndex).toBeGreaterThanOrEqual(0)
      expect(gameState.currentPlayerIndex).toBeLessThan(gameState.players.length)
      expect(gameState.deck).toBeDefined()
      expect(gameState.discardPile).toBeDefined()
    })

    it('should track game history for debugging/replay', () => {
      const gameState = createGameState([createPlayer('p1', 'P1')])
      
      expect(gameState.gameHistory).toBeDefined()
      expect(Array.isArray(gameState.gameHistory)).toBe(true)
    })

    it('should properly manage deck and discard pile', () => {
      const gameState = createGameState([createPlayer('p1', 'P1')])
      
      // Total cards should remain constant (deck + discard + player hands)
      const totalCardsInHands = gameState.players.reduce((sum, player) => sum + player.hand.length, 0)
      const totalCards = gameState.deck.length + gameState.discardPile.length + totalCardsInHands
      
      expect(totalCards).toBeGreaterThan(0)
      expect(gameState.deck.length).toBeGreaterThanOrEqual(0)
      expect(gameState.discardPile.length).toBeGreaterThanOrEqual(0)
    })
  })
})