import { describe, it, expect } from 'vitest'
import {findAllValidCombinations, isNormalCard, validateMissionFromSelection} from '../utils/cardUtils'
import { createCard, createJokerCard } from './testUtils'
import {MissionRequirements} from "@/types/game.ts";

describe('New Validation System Tests', () => {
  describe('findAllValidCombinations', () => {
    it('should find all possible groups from selected cards', () => {
      const cards = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createCard('7', 'spades'),
        createCard('7', 'hearts'),
        createCard('J', 'clubs'),
        createCard('J', 'diamonds'),
        createCard('J', 'hearts')
      ]

      const result = findAllValidCombinations(cards)

      expect(result.groups.length).toBeGreaterThan(0)
      expect(result.sequences.length).toBe(0) // No sequences possible with these cards

      // Should find groups of 3 and 4 for both 7s and Js
      const sevenGroups = result.groups.filter(group => 
        group.filter(isNormalCard).some(card => card.value === '7')
      )
      const jackGroups = result.groups.filter(group => 
        group.filter(isNormalCard).some(card => card.value === 'J')
      )

      expect(sevenGroups.length).toBeGreaterThan(0)
      expect(jackGroups.length).toBeGreaterThan(0)
    })

    it('should find all possible sequences from selected cards', () => {
      const cards = [
        createCard('A', 'hearts'),
        createCard('2', 'hearts'),
        createCard('3', 'hearts'),
        createCard('4', 'hearts'),
        createCard('5', 'hearts')
      ]

      const result = findAllValidCombinations(cards)

      expect(result.sequences.length).toBeGreaterThan(0)
      expect(result.groups.length).toBe(0) // No groups possible with these cards

      // Should find sequences of different lengths
      const sequences = result.sequences
      expect(sequences.some(seq => seq.length >= 3)).toBe(true)
    })

    it('should handle mixed groups and sequences', () => {
      const cards = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createCard('7', 'spades'),
        createCard('A', 'hearts'),
        createCard('2', 'hearts'),
        createCard('3', 'hearts')
      ]

      const result = findAllValidCombinations(cards)

      expect(result.groups.length).toBeGreaterThan(0)
      expect(result.sequences.length).toBeGreaterThan(0)
    })

    it('should handle jokers in combinations', () => {
      const cards = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createJokerCard(),
        createCard('A', 'hearts'),
        createCard('2', 'hearts'),
        createJokerCard()
      ]

      const result = findAllValidCombinations(cards)

      expect(result.groups.length).toBeGreaterThan(0)
      expect(result.sequences.length).toBeGreaterThan(0)
    })
  })

  describe('validateMissionFromSelection', () => {
    it('should validate mission with exact card requirements', () => {
      const cards = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createCard('7', 'spades'),
        createCard('J', 'clubs'),
        createCard('J', 'diamonds'),
        createCard('J', 'hearts')
      ]

      const requirements = {
        groups: 2,
        sequences: 0
      }

      const result = validateMissionFromSelection(cards, requirements)

      expect(result.isValid).toBe(true)
      expect(result.usedCombinations).toHaveLength(2)
      expect(result.usedCombinations.every(c => c.type === 'group')).toBe(true)

      // All selected cards should be used
      const usedCardIds = new Set()
      result.usedCombinations.forEach(combo => {
        combo.cards.forEach(card => usedCardIds.add(card.id))
      })
      expect(usedCardIds.size).toBe(cards.length)
    })

    it('should validate mission with more cards than required (issue example)', () => {
      // Example from issue: 4 cards of same value + 3 cards of same value for "Two groups of 3"
      const cards = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createCard('7', 'spades'),
        createCard('7', 'hearts'), // 4 cards of same value
        createCard('J', 'clubs'),
        createCard('J', 'diamonds'),
        createCard('J', 'hearts') // 3 cards of same value
      ]

      const requirements = {
        groups: 2,
        sequences: 0
      }

      const result = validateMissionFromSelection(cards, requirements)

      expect(result.isValid).toBe(true)
      expect(result.usedCombinations).toHaveLength(2)
      expect(result.usedCombinations.every(c => c.type === 'group')).toBe(true)

      // All selected cards should be used
      const usedCardIds = new Set()
      result.usedCombinations.forEach(combo => {
        combo.cards.forEach(card => usedCardIds.add(card.id))
      })
      expect(usedCardIds.size).toBe(cards.length)

      // Should have one group of 4 and one group of 3
      const groupSizes = result.usedCombinations.map(c => c.cards.length).sort()
      expect(groupSizes).toEqual([3, 4])
    })

    it('should validate sequence missions', () => {
      const cards = [
        createCard('A', 'hearts'),
        createCard('2', 'hearts'),
        createCard('3', 'hearts'),
        createCard('4', 'hearts'),
        createCard('5', 'hearts')
      ]

      const requirements = {
        groups: 0,
        sequences: 1,
        minSequenceLength: 3
      }

      const result = validateMissionFromSelection(cards, requirements)

      expect(result.isValid).toBe(true)
      expect(result.usedCombinations).toHaveLength(1)
      expect(result.usedCombinations[0].type).toBe('sequence')
      expect(result.usedCombinations[0].cards.length).toBe(5)

      // All selected cards should be used
      const usedCardIds = new Set()
      result.usedCombinations.forEach(combo => {
        combo.cards.forEach(card => usedCardIds.add(card.id))
      })
      expect(usedCardIds.size).toBe(cards.length)
    })

    it('should reject insufficient cards', () => {
      const cards = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createCard('J', 'clubs')
      ]

      const requirements = {
        groups: 2,
        sequences: 0
      }

      const result = validateMissionFromSelection(cards, requirements)

      expect(result.isValid).toBe(false)
      expect(result.usedCombinations).toHaveLength(0)
    })

    it('should handle mixed group and sequence requirements', () => {
      const cards = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createCard('7', 'spades'),
        createCard('A', 'hearts'),
        createCard('2', 'hearts'),
        createCard('3', 'hearts'),
        createCard('4', 'hearts')
      ]

      const requirements = {
        groups: 1,
        sequences: 1,
        minSequenceLength: 3
      }

      const result = validateMissionFromSelection(cards, requirements)

      expect(result.isValid).toBe(true)
      expect(result.usedCombinations).toHaveLength(2)

      const groups = result.usedCombinations.filter(c => c.type === 'group')
      const sequences = result.usedCombinations.filter(c => c.type === 'sequence')

      expect(groups).toHaveLength(1)
      expect(sequences).toHaveLength(1)
      expect(groups[0].cards.length).toBe(3)
      expect(sequences[0].cards.length).toBe(4)

      // All selected cards should be used
      const usedCardIds = new Set()
      result.usedCombinations.forEach(combo => {
        combo.cards.forEach(card => usedCardIds.add(card.id))
      })
      expect(usedCardIds.size).toBe(cards.length)
    })

    it('should handle jokers in validation', () => {
      const cards = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createJokerCard(),
        createCard('J', 'clubs'),
        createCard('J', 'diamonds'),
        createJokerCard()
      ]

      const requirements = {
        groups: 2,
        sequences: 0
      }

      const result = validateMissionFromSelection(cards, requirements)

      expect(result.isValid).toBe(true)
      expect(result.usedCombinations).toHaveLength(2)
      expect(result.usedCombinations.every(c => c.type === 'group')).toBe(true)

      // All selected cards should be used
      const usedCardIds = new Set()
      result.usedCombinations.forEach(combo => {
        combo.cards.forEach(card => usedCardIds.add(card.id))
      })
      expect(usedCardIds.size).toBe(cards.length)
    })

    it('should reject when cards cannot form valid combinations', () => {
      const cards = [
        createCard('7', 'clubs'),
        createCard('8', 'diamonds'),
        createCard('9', 'spades'),
        createCard('J', 'hearts'),
        createCard('Q', 'clubs')
      ]

      const requirements = {
        groups: 1,
        sequences: 0
      }

      const result = validateMissionFromSelection(cards, requirements)

      expect(result.isValid).toBe(false)
      expect(result.usedCombinations).toHaveLength(0)
    })

    it('should handle empty card selection', () => {
      const cards = []

      const requirements = {
        groups: 1,
        sequences: 0
      }

      const result = validateMissionFromSelection(cards, requirements)

      expect(result.isValid).toBe(false)
      expect(result.usedCombinations).toHaveLength(0)
    })
  })

  describe('Integration with existing mission requirements', () => {
    it('should work with Mission 1 requirements (Deux groupes de 3)', () => {
      const cards = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createCard('7', 'spades'),
        createCard('J', 'clubs'),
        createCard('J', 'diamonds'),
        createCard('J', 'hearts')
      ]

      const requirements = {
        groups: 2,
        sequences: 0
      }

      const result = validateMissionFromSelection(cards, requirements)

      expect(result.isValid).toBe(true)
      expect(result.usedCombinations).toHaveLength(2)
      expect(result.usedCombinations.every(c => c.type === 'group')).toBe(true)
      expect(result.usedCombinations.every(c => c.cards.length === 3)).toBe(true)
    })

    it('should work with Mission 2 requirements (Suite de 4 + groupe de 3)', () => {
      const cards = [
        createCard('4', 'spades'),
        createCard('5', 'spades'),
        createCard('6', 'spades'),
        createCard('7', 'spades'),
        createCard('9', 'hearts'),
        createCard('9', 'diamonds'),
        createCard('9', 'clubs')
      ]

      const requirements = {
        groups: 1,
        sequences: 1,
        minSequenceLength: 4
      }

      const result = validateMissionFromSelection(cards, requirements)

      expect(result.isValid).toBe(true)
      expect(result.usedCombinations).toHaveLength(2)

      const groups = result.usedCombinations.filter(c => c.type === 'group')
      const sequences = result.usedCombinations.filter(c => c.type === 'sequence')

      expect(groups).toHaveLength(1)
      expect(sequences).toHaveLength(1)
      expect(groups[0].cards.length).toBe(3)
      expect(sequences[0].cards.length).toBe(4)
    })

    it('should work with Mission 20 requirements (Sept cartes impaires)', () => {
      // Test case from user bug report: 7 spades, A hearts, 3 hearts, 7 clubs, 9 spades, J clubs, K spades
      const cards = [
        createCard('7', 'spades'),
        createCard('A', 'hearts'),
        createCard('3', 'hearts'),
        createCard('7', 'clubs'),
        createCard('9', 'spades'),
        createCard('J', 'clubs'),
        createCard('K', 'spades')
      ]

      const requirements: MissionRequirements = {
        specificRequirements: "seven_odd_cards"
      }

      const result = validateMissionFromSelection(cards, requirements)

      // This should be valid - all 7 cards are odd cards (A, 3, 5, 7, 9, J, K)
      expect(result.isValid).toBe(true)
      expect(result.usedCombinations).toHaveLength(1)

      // All selected cards should be used
      const usedCardIds = new Set()
      result.usedCombinations.forEach(combo => {
        combo.cards.forEach(card => usedCardIds.add(card.id))
      })
      expect(usedCardIds.size).toBe(cards.length)
    })

    it('should reject Mission 20 with wrong number of cards', () => {
      // Only 6 cards instead of 7
      const cards = [
        createCard('7', 'spades'),
        createCard('A', 'hearts'),
        createCard('3', 'hearts'),
        createCard('9', 'spades'),
        createCard('J', 'clubs'),
        createCard('K', 'spades')
      ]

      const requirements: MissionRequirements = {
        specificRequirements: "seven_odd_cards"
      }

      const result = validateMissionFromSelection(cards, requirements)

      expect(result.isValid).toBe(false)
      expect(result.usedCombinations).toHaveLength(0)
    })

    it('should reject Mission 20 with even cards', () => {
      // 7 cards but one is even (2 instead of an odd card)
      const cards = [
        createCard('7', 'spades'),
        createCard('A', 'hearts'),
        createCard('3', 'hearts'),
        createCard('2', 'clubs'), // Even card - should fail
        createCard('9', 'spades'),
        createCard('J', 'clubs'),
        createCard('K', 'spades')
      ]

      const requirements: MissionRequirements = {
        specificRequirements: "seven_odd_cards"
      }

      const result = validateMissionFromSelection(cards, requirements)

      expect(result.isValid).toBe(false)
      expect(result.usedCombinations).toHaveLength(0)
    })
  })
})
