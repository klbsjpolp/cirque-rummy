import { describe, it, expect } from 'vitest'
import { validateMissionCards } from '../utils/cardUtils'
import { MISSIONS } from '../data/missions'
import { createCard } from './testUtils'

describe('Unified Mission Validation', () => {
  it('should validate Mission 1 (two groups of 3) with unified function', () => {
    const cards = [
      createCard('7', 'clubs'),
      createCard('7', 'diamonds'),
      createCard('7', 'spades'),
      createCard('J', 'clubs'),
      createCard('J', 'diamonds'),
      createCard('J', 'hearts')
    ]

    const mission = MISSIONS.find(m => m.id === 1)!
    const result = validateMissionCards(cards, mission.requirements)

    expect(result.isValid).toBe(true)
    expect(result.combinations).toHaveLength(2)
    expect(result.combinations.every(c => c.type === 'group')).toBe(true)
  })

  it('should validate Mission 2 (sequence + group) with unified function', () => {
    const cards = [
      createCard('4', 'spades'),
      createCard('5', 'spades'),
      createCard('6', 'spades'),
      createCard('7', 'spades'),
      createCard('9', 'hearts'),
      createCard('9', 'diamonds'),
      createCard('9', 'clubs')
    ]

    const mission = MISSIONS.find(m => m.id === 2)!
    const result = validateMissionCards(cards, mission.requirements)

    expect(result.isValid).toBe(true)
    expect(result.combinations).toHaveLength(2)

    const groups = result.combinations.filter(c => c.type === 'group')
    const sequences = result.combinations.filter(c => c.type === 'sequence')

    expect(groups).toHaveLength(1)
    expect(sequences).toHaveLength(1)
    expect(sequences[0].cards.length).toBeGreaterThanOrEqual(4)
  })

  it('should reject invalid combinations', () => {
    const cards = [
      createCard('7', 'clubs'),
      createCard('8', 'diamonds'),
      createCard('9', 'spades')
    ]

    const mission = MISSIONS.find(m => m.id === 1)! // Requires 2 groups of 3
    const result = validateMissionCards(cards, mission.requirements)

    expect(result.isValid).toBe(false)
    expect(result.combinations).toHaveLength(0)
  })

  it('should handle missions with specific requirements', () => {
    const cards = [
      createCard('A', 'hearts'),
      createCard('A', 'diamonds'),
      createCard('A', 'clubs'),
      createCard('A', 'spades'),
      createCard('2', 'hearts'),
      createCard('3', 'hearts'),
      createCard('4', 'hearts'),
      createCard('5', 'hearts')
    ]

    const mission = MISSIONS.find(m => m.id === 13)! // Group of 4 + sequence of 4
    const result = validateMissionCards(cards, mission.requirements)

    expect(result.isValid).toBe(true)
    expect(result.combinations).toHaveLength(2)

    const groups = result.combinations.filter(c => c.type === 'group')
    const sequences = result.combinations.filter(c => c.type === 'sequence')

    expect(groups).toHaveLength(1)
    expect(sequences).toHaveLength(1)
    expect(groups[0].cards.length).toBe(4)
    expect(sequences[0].cards.length).toBe(4)
  })
})
