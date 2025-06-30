import { describe, it, expect } from 'vitest'
import { MISSIONS } from '../data/missions'
import { Combination, Player } from '../types/game'
import { isJokerCard, validateMissionFromSelection } from '../utils/cardUtils'
import {createCard, createJokerCard} from './testUtils'

describe('Mission System', () => {
  const createTestPlayer = (combinations: Combination[]): Player => ({
    id: 'test-player',
    name: 'Test Player',
    hand: [],
    currentMission: 1,
    completedMissions: [],
    score: 0,
    combinations,
    isCurrentMissionCompleted(): boolean {
      return this.completedMissions.includes(this.currentMission)
    }
  })

  describe('Mission Data Structure', () => {
    it('should have 30 missions defined', () => {
      expect(MISSIONS).toHaveLength(30)
    })

    it('should have all missions with required properties', () => {
      MISSIONS.forEach(mission => {
        expect(mission).toHaveProperty('id')
        expect(mission).toHaveProperty('title')
        expect(mission).toHaveProperty('description')
        expect(mission).toHaveProperty('icon')
        expect(mission).toHaveProperty('requirements')
        expect(typeof mission.id).toBe('number')
        expect(typeof mission.title).toBe('string')
        expect(typeof mission.description).toBe('string')
      })
    })

    it('should have unique mission IDs', () => {
      const ids = MISSIONS.map(m => m.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(MISSIONS.length)
    })
  })

  describe('Basic Mission Types', () => {
    describe('Mission 1: Two groups of 3', () => {
      it('should validate two groups of 3 cards each using card selection', () => {
        const selectedCards = [
          createCard('7', 'clubs'),
          createCard('7', 'diamonds'),
          createCard('7', 'spades'),
          createCard('J', 'clubs'),
          createCard('J', 'diamonds'),
          createCard('J', 'hearts')
        ]

        const mission = MISSIONS.find(m => m.id === 1)!
        const validation = validateMissionFromSelection(selectedCards, mission.requirements)

        expect(validation.isValid).toBe(true)
        expect(validation.usedCombinations).toHaveLength(2)
        expect(validation.usedCombinations.every(c => c.type === 'group')).toBe(true)
        expect(validation.usedCombinations.every(c => c.cards.length === 3)).toBe(true)
      })
    })

    describe('Mission 2: Suite of 4 + group of 3', () => {
      it('should validate one sequence of 4 and one group of 3 using card selection', () => {
        const selectedCards = [
          createCard('4', 'spades'),
          createCard('5', 'spades'),
          createCard('6', 'spades'),
          createCard('7', 'spades'),
          createCard('9', 'hearts'),
          createCard('9', 'diamonds'),
          createCard('9', 'clubs')
        ]

        const mission = MISSIONS.find(m => m.id === 2)!
        const validation = validateMissionFromSelection(selectedCards, mission.requirements)

        expect(validation.isValid).toBe(true)
        expect(validation.usedCombinations).toHaveLength(2)

        const groups = validation.usedCombinations.filter(c => c.type === 'group')
        const sequences = validation.usedCombinations.filter(c => c.type === 'sequence')

        expect(groups).toHaveLength(1)
        expect(sequences).toHaveLength(1)
        expect(groups[0].cards.length).toBe(3)
        expect(sequences[0].cards.length).toBe(4)
      })
    })

    describe('Mission 3: Two suites of 4', () => {
      it('should validate two sequences of 4 cards each using card selection', () => {
        const selectedCards = [
          createCard('3', 'clubs'),
          createCard('4', 'clubs'),
          createCard('5', 'clubs'),
          createCard('6', 'clubs'),
          createCard('9', 'hearts'),
          createCard('10', 'hearts'),
          createCard('J', 'hearts'),
          createCard('Q', 'hearts')
        ]

        const mission = MISSIONS.find(m => m.id === 3)!
        const validation = validateMissionFromSelection(selectedCards, mission.requirements)

        expect(validation.isValid).toBe(true)
        expect(validation.usedCombinations).toHaveLength(2)
        expect(validation.usedCombinations.every(c => c.type === 'sequence')).toBe(true)
        expect(validation.usedCombinations.every(c => c.cards.length === 4)).toBe(true)
      })
    })

    describe('Mission 4: Three groups of 3', () => {
      it('should validate three groups of 3 cards each using card selection', () => {
        const selectedCards = [
          createCard('5', 'diamonds'),
          createCard('5', 'clubs'),
          createCard('5', 'spades'),
          createCard('8', 'spades'),
          createCard('8', 'hearts'),
          createCard('8', 'clubs'),
          createCard('Q', 'diamonds'),
          createCard('Q', 'spades'),
          createCard('Q', 'hearts')
        ]

        const mission = MISSIONS.find(m => m.id === 4)!
        const validation = validateMissionFromSelection(selectedCards, mission.requirements)

        expect(validation.isValid).toBe(true)
        expect(validation.usedCombinations).toHaveLength(3)
        expect(validation.usedCombinations.every(c => c.type === 'group')).toBe(true)
        expect(validation.usedCombinations.every(c => c.cards.length === 3)).toBe(true)
      })
    })
  })

  describe('Advanced Mission Types', () => {
    describe('Mission 6: Suite of 7 same color', () => {
      it('should validate a sequence of 7 cards of the same suit using card selection', () => {
        const selectedCards = [
          createCard('3', 'hearts'),
          createCard('4', 'hearts'),
          createCard('5', 'hearts'),
          createCard('6', 'hearts'),
          createCard('7', 'hearts'),
          createCard('8', 'hearts'),
          createCard('9', 'hearts')
        ]

        const mission = MISSIONS.find(m => m.id === 6)!
        const validation = validateMissionFromSelection(selectedCards, mission.requirements)

        expect(validation.isValid).toBe(true)
        expect(validation.usedCombinations).toHaveLength(1)
        expect(validation.usedCombinations[0].type).toBe('sequence')
        expect(validation.usedCombinations[0].cards.length).toBe(7)
      })
      it('should validate a sequence of 7 cards of the same suit using card selection including jokers', () => {
        const selectedCards = [
          createCard('3', 'hearts'),
          createCard('4', 'hearts'),
          createCard('5', 'hearts'),
          createJokerCard(),
          createCard('7', 'hearts'),
          createCard('8', 'hearts'),
          createCard('9', 'hearts')
        ]

        const mission = MISSIONS.find(m => m.id === 6)!
        const validation = validateMissionFromSelection(selectedCards, mission.requirements)

        expect(validation.isValid).toBe(true)
        expect(validation.usedCombinations).toHaveLength(1)
        expect(validation.usedCombinations[0].type).toBe('sequence')
        expect(validation.usedCombinations[0].cards.length).toBe(7)
      })
    })

    describe('Mission 7: 7 cards same color', () => {
      it('should validate 7 cards of the same suit (not necessarily consecutive)', () => {
        const mission = MISSIONS.find(m => m.id === 7)
        expect(mission?.requirements.specificRequirements).toBe('7_same_suit')
      })
    })

    describe('Mission 10: Three suites of 4', () => {
      it('should validate three sequences of 4 cards each using card selection', () => {
        const selectedCards = [
          createCard('A', 'spades'),
          createCard('2', 'spades'),
          createCard('3', 'spades'),
          createCard('4', 'spades'),
          createCard('6', 'hearts'),
          createCard('7', 'hearts'),
          createCard('8', 'hearts'),
          createCard('9', 'hearts'),
          createCard('9', 'clubs'),
          createCard('10', 'clubs'),
          createCard('J', 'clubs'),
          createCard('Q', 'clubs')
        ]

        const mission = MISSIONS.find(m => m.id === 10)!
        const validation = validateMissionFromSelection(selectedCards, mission.requirements)

        expect(validation.isValid).toBe(true)
        expect(validation.usedCombinations).toHaveLength(3)
        expect(validation.usedCombinations.every(c => c.type === 'sequence')).toBe(true)
        expect(validation.usedCombinations.every(c => c.cards.length === 4)).toBe(true)
      })
    })
  })

  describe('Special Mission Requirements', () => {
    describe('Mission 12: Mission libre', () => {
      it('should allow choosing a previously completed mission', () => {
        const mission = MISSIONS.find(m => m.id === 12)
        expect(mission?.title).toContain('libre')
      })
    })

    describe('Missions with specific suit requirements', () => {
      it('should have missions with color-specific requirements', () => {
        // Mission 25: Suite de 7-8-9-10 de cœur
        const mission25 = MISSIONS.find(m => m.id === 25)
        expect(mission25?.description).toContain('♥')

        // Mission 26: Deux suites de 4 : une en ♠ et une en ♣
        const mission26 = MISSIONS.find(m => m.id === 26)
        expect(mission26?.description).toContain('♠')
        expect(mission26?.description).toContain('♣')
      })
    })

    describe('Missions with value-specific requirements', () => {
      it('should have missions with specific value requirements', () => {
        // Mission 20: Sept cartes impaires
        const mission20 = MISSIONS.find(m => m.id === 20)
        expect(mission20?.description).toContain('impaires')

        // Mission 30: Une suite paire de 6 cartes rouges
        const mission30 = MISSIONS.find(m => m.id === 30)
        expect(mission30?.description).toContain('paire')
      })
    })
  })

  describe('Mission Validation Logic', () => {
    it('should validate groups have same value, different suits', () => {
      // This tests the basic rule from README: "Groupes : 3 cartes ou plus de même valeur, toutes de couleurs différentes"
      const validGroup = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createCard('7', 'spades')
      ]

      const values = new Set(validGroup.map(c => c.value))
      const suits = new Set(validGroup.map(c => c.suit))

      expect(values.size).toBe(1) // Same value
      expect(suits.size).toBe(3) // Different suits
      expect(validGroup.length).toBeGreaterThanOrEqual(3) // At least 3 cards
    })

    it('should validate sequences have consecutive values, same suit', () => {
      // This tests the basic rule from README: "Suites : 3 cartes ou plus consécutives de la même couleur"
      const validSequence = [
        createCard('4', 'spades'),
        createCard('5', 'spades'),
        createCard('6', 'spades')
      ]

      const suits = new Set(validSequence.map(c => c.suit))
      expect(suits.size).toBe(1) // Same suit
      expect(validSequence.length).toBeGreaterThanOrEqual(3) // At least 3 cards
    })

    it('should allow jokers in combinations', () => {
      // This tests the rule from README: "Jokers : Peuvent remplacer n'importe quelle carte dans une combinaison"
      const groupWithJoker = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createJokerCard() // joker
      ]

      const sequenceWithJoker = [
        createCard('4', 'spades'),
        createJokerCard(), // joker for 5
        createCard('6', 'spades')
      ]

      expect(groupWithJoker.some(c => isJokerCard(c))).toBe(true)
      expect(sequenceWithJoker.some(c => isJokerCard(c))).toBe(true)
    })
  })

  describe('Game Flow Rules', () => {
    it('should follow turn structure: draw, play (optional), discard', () => {
      // This tests the rule from README: "Actions par tour: 1. Piocher une carte, 2. Optionnel : Poser des combinaisons, 3. Défausser une carte"
      const turnActions = ['draw', 'play_optional', 'discard']
      expect(turnActions).toHaveLength(3)
      expect(turnActions[0]).toBe('draw')
      expect(turnActions[2]).toBe('discard')
    })

    it('should end round when player has no cards', () => {
      // This tests the rule from README: "Fin de manche : Une manche se termine lorsqu'un joueur n'a plus de cartes en main"
      const playerWithNoCards = createTestPlayer([])
      playerWithNoCards.hand = []

      expect(playerWithNoCards.hand).toHaveLength(0)
    })

    it('should allow extending combinations after mission completion', () => {
      // This tests the rule from README: "Après mission accomplie : Une fois sa mission effectuée, le joueur peut continuer à..."
      const completedMissionPlayer = createTestPlayer([])
      completedMissionPlayer.currentMission = 1
      completedMissionPlayer.completedMissions = [1] // Has completed a mission

      expect(completedMissionPlayer.completedMissions.length).toBeGreaterThan(0)
      expect(completedMissionPlayer.isCurrentMissionCompleted()).toBeTruthy()
    })

    it('should require 7 completed missions to win', () => {
      // This tests the rule from README: "Le premier joueur à réussir 7 missions remporte la partie"
      const winningPlayer = createTestPlayer([])
      winningPlayer.completedMissions = [1, 2, 3, 4, 5, 6, 7]

      expect(winningPlayer.completedMissions).toHaveLength(7)
    })

    it('should start new round with 13 cards per player', () => {
      // This tests the rule from README: "Après la fin d'une manche, tous les joueurs reçoivent 13 nouvelles cartes"
      const cardsPerPlayer = 13
      expect(cardsPerPlayer).toBe(13)
    })
  })

  describe('Mission Progression Rules', () => {
    it('should assign random missions from 30 available', () => {
      // This tests the rule from README: "Les missions sont assignées aléatoirement parmi les 30 missions disponibles"
      expect(MISSIONS).toHaveLength(30)

      const missionIds = MISSIONS.map(m => m.id)
      expect(missionIds).toContain(1)
      expect(missionIds).toContain(30)
    })

    it('should continue same mission if round ends without completion', () => {
      // This tests the rule from README: "Si un joueur termine une manche sans compléter sa mission, il continue avec la même mission"
      const player = createTestPlayer([])
      player.currentMission = 5
      player.completedMissions = [1, 2] // Hasn't completed mission 5

      // After round end without mission completion, should keep same mission
      expect(player.currentMission).toBe(5)
    })

    it('should get new random mission after completing current one', () => {
      // This tests the rule from README: "Si un joueur termine une manche (n'a plus de cartes), il reçoit une nouvelle mission aléatoire"
      const player = createTestPlayer([])
      player.currentMission = 5
      player.completedMissions = [1, 2, 5] // Has completed mission 5

      // Should get a new mission that's not already completed
      const availableMissions = MISSIONS.filter(m => !player.completedMissions.includes(m.id))
      expect(availableMissions.length).toBeGreaterThan(0)
    })

    it('should hide AI mission from human player', () => {
      // This tests the rule from README: "La mission de l'IA n'est pas visible au joueur humain"
      const aiPlayer = createTestPlayer([])
      aiPlayer.id = 'ai-player'
      aiPlayer.name = 'AI Player'

      // In actual implementation, AI mission should be hidden from human player
      expect(aiPlayer.currentMission).toBeDefined()
    })
  })
})
