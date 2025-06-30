import { describe, it, expect } from 'vitest'
import {findAllValidCombinations, isJokerCard, validateMissionFromSelection} from '../utils/cardUtils'
import { createCard, createJokerCard } from './testUtils'

describe('End of Round Scenarios', () => {
  describe('After mission completion - laying down remaining cards', () => {
    it('should be able to form multiple groups with remaining cards', () => {
      // Scenario: Player completed Mission 20 and has remaining cards:
      // 3 sixes, 3 queens, and a joker
      const remainingCards = [
        createCard('6', 'hearts'),
        createCard('6', 'diamonds'), 
        createCard('6', 'clubs'),
        createCard('Q', 'spades'),
        createCard('Q', 'hearts'),
        createCard('Q', 'diamonds'),
        createJokerCard()
      ]

      // Find all valid combinations
      const combinations = findAllValidCombinations(remainingCards)

      // Should be able to find groups
      expect(combinations.groups.length).toBeGreaterThan(0)

      // Should be able to form at least 2 groups
      expect(combinations.groups.length).toBeGreaterThanOrEqual(2)

      // Check if we can find a combination that uses all cards
      let foundValidCombination = false

      for (let i = 0; i < combinations.groups.length; i++) {
        for (let j = i + 1; j < combinations.groups.length; j++) {
          const group1 = combinations.groups[i]
          const group2 = combinations.groups[j]

          // Check if these two groups use all cards without overlap
          const usedCardIds = new Set()
          let hasOverlap = false

          for (const card of [...group1, ...group2]) {
            if (usedCardIds.has(card.id)) {
              hasOverlap = true
              break
            }
            usedCardIds.add(card.id)
          }

          if (!hasOverlap && usedCardIds.size === remainingCards.length) {
            foundValidCombination = true
            break
          }
        }
        if (foundValidCombination) break
      }

      expect(foundValidCombination).toBe(true)
    })

    it('should validate end-of-round cards correctly', () => {
      // Same scenario but trying to validate as mission requirements
      const remainingCards = [
        createCard('6', 'hearts'),
        createCard('6', 'diamonds'), 
        createCard('6', 'clubs'),
        createCard('Q', 'spades'),
        createCard('Q', 'hearts'),
        createCard('Q', 'diamonds'),
        createJokerCard()
      ]

      // Try to validate as mission requirements (this should actually pass)
      const missionValidation = validateMissionFromSelection(remainingCards, {
        groups: 2,
        sequences: 0
      })

      // This should pass because the cards can form 2 valid groups
      expect(missionValidation.isValid).toBe(true)
      expect(missionValidation.usedCombinations).toHaveLength(2)
      expect(missionValidation.usedCombinations.every(c => c.type === 'group')).toBe(true)
    })

    it('should handle different end-of-round scenarios', () => {
      // Scenario: 2 groups of 3 cards each
      const cards = [
        createCard('7', 'hearts'),
        createCard('7', 'diamonds'), 
        createCard('7', 'clubs'),
        createCard('K', 'spades'),
        createCard('K', 'hearts'),
        createCard('K', 'diamonds')
      ]

      const combinations = findAllValidCombinations(cards)

      // Should find groups
      expect(combinations.groups.length).toBeGreaterThan(0)

      // Should be able to use all cards in 2 groups
      const groupsOf3 = combinations.groups.filter(g => g.length === 3)
      expect(groupsOf3.length).toBeGreaterThanOrEqual(2)
    })

    it('should handle end-of-round with jokers', () => {
      // Scenario: Groups with jokers
      const cards = [
        createCard('A', 'hearts'),
        createCard('A', 'diamonds'), 
        createJokerCard(),
        createCard('9', 'spades'),
        createCard('9', 'hearts'),
        createCard('9', 'diamonds'),
        createJokerCard()
      ]

      const combinations = findAllValidCombinations(cards)

      // Should find groups that include jokers
      expect(combinations.groups.length).toBeGreaterThan(0)

      // Should have groups that contain jokers
      const groupsWithJokers = combinations.groups.filter(group => 
        group.filter(isJokerCard).some(card => card.isJoker)
      )
      expect(groupsWithJokers.length).toBeGreaterThan(0)
    })
  })
})
