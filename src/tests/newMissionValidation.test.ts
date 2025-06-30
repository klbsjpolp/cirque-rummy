import { describe, it, expect } from 'vitest'
import { MISSIONS } from '../data/missions'
import { validateMissionFromSelection } from '../utils/cardUtils'
import { createCard, createJokerCard } from './testUtils'

describe('New Mission Validation with Free Card Selection', () => {
  describe('Basic Mission Validation', () => {
    it('should validate Mission 1: Two groups of 3 with exact cards', () => {
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

    it('should validate Mission 1: Two groups of 3 with extra cards (4 of a kind)', () => {
      const selectedCards = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createCard('7', 'spades'),
        createCard('7', 'hearts'), // Extra card - should still work
        createCard('J', 'clubs'),
        createCard('J', 'diamonds'),
        createCard('J', 'hearts')
      ]

      const mission = MISSIONS.find(m => m.id === 1)!
      const validation = validateMissionFromSelection(selectedCards, mission.requirements)
      
      expect(validation.isValid).toBe(true)
      expect(validation.usedCombinations).toHaveLength(2)
      // Should use all selected cards
      const totalUsedCards = validation.usedCombinations.reduce((sum, combo) => sum + combo.cards.length, 0)
      expect(totalUsedCards).toBe(selectedCards.length)
    })

    it('should validate Mission 2: Sequence of 4 + group of 3', () => {
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
      expect(sequences[0].cards.length).toBeGreaterThanOrEqual(4)
    })

    it('should validate Mission 3: Two sequences of 4', () => {
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
      expect(validation.usedCombinations.every(c => c.cards.length >= 4)).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should reject insufficient cards', () => {
      const selectedCards = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds')
      ]

      const mission = MISSIONS.find(m => m.id === 1)! // Needs two groups of 3
      const validation = validateMissionFromSelection(selectedCards, mission.requirements)
      
      expect(validation.isValid).toBe(false)
    })

    it('should reject invalid combinations', () => {
      const selectedCards = [
        createCard('7', 'clubs'),
        createCard('8', 'diamonds'),
        createCard('9', 'spades'),
        createCard('J', 'clubs'),
        createCard('Q', 'diamonds'),
        createCard('K', 'hearts')
      ]

      const mission = MISSIONS.find(m => m.id === 1)! // Needs two groups of 3
      const validation = validateMissionFromSelection(selectedCards, mission.requirements)
      
      expect(validation.isValid).toBe(false)
    })

    it('should handle jokers in combinations', () => {
      const selectedCards = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createJokerCard(), // Joker as third card in group
        createCard('J', 'clubs'),
        createCard('J', 'diamonds'),
        createCard('J', 'hearts')
      ]

      const mission = MISSIONS.find(m => m.id === 1)!
      const validation = validateMissionFromSelection(selectedCards, mission.requirements)
      
      expect(validation.isValid).toBe(true)
      expect(validation.usedCombinations).toHaveLength(2)
    })
  })

  describe('Complex Missions', () => {
    it('should validate Mission 4: Three groups of 3', () => {
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
    })

    it('should validate Mission 6: Sequence of 7 same color', () => {
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
  })
})