import { describe, it, expect } from 'vitest'
import { MISSIONS } from '../data/missions'
import {
  isJokerCard,
  isValidGroup,
  isValidSequence,
  UsedCombinations,
  validateMissionFromSelection
} from '../utils/cardUtils'
import { createCard, createJokerCard } from './testUtils'
import {Card, CardSuit, CardValue, MissionRequirements} from "@/types/game.ts";

// Shuffle function to randomize card order
function shuffleArray<T>(array: T[]): T[] {
  return array /*
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled*/
}

type NormalCardToCreate = [CardValue, CardSuit]
function validateMissionCards(describe: string, missionId: number, cardsToCreate: NormalCardToCreate[], postChecks?: (usedCombinaisons: UsedCombinations) => void) {
  const mission = MISSIONS.find(m => m.id === missionId);
  const cards = shuffleArray(cardsToCreate).map(c => createCard(c[0], c[1]));

  // Validate original mission
  validateOneScenario(describe, mission.requirements, cards, postChecks);

  // Validate with joker cards
  const cardsWithJokers = shuffleArray([...cards.slice(2), createJokerCard(), createJokerCard()]);
  validateOneScenario(`${describe} with jokers`, mission.requirements, cardsWithJokers, postChecks);

  // Validate with joker cards and extra cards
  const extraCards = shuffleArray(cards.slice(0, 2));
  const cardsWithExtraJokers = shuffleArray([...cardsWithJokers, ...extraCards, createJokerCard()]);
  validateOneScenario(`${describe} with jokers and extra cards`, mission.requirements, cardsWithExtraJokers, postChecks);
}

function validateMissionCardsFail(describe: string, missionId: number, cardsToCreate: NormalCardToCreate[]) {
  const mission = MISSIONS.find(m => m.id === missionId);
  const cards = shuffleArray(cardsToCreate).map(c => createCard(c[0], c[1]));

  // Only validate that mission fails without jokers to avoid exponential complexity
  validateOneScenarioFail(describe, mission.requirements, cards);
}

function validateOneScenario(describe: string, requirements: MissionRequirements, cards: Card[], postChecks?: (usedCombinaisons: UsedCombinations) => void) {
  it(describe, () => {
    console.log(`🧪 Starting test: ${describe}`);
    console.log(`📋 Requirements:`, requirements);
    console.log(`🃏 Cards count: ${cards.length}`);
    console.log(`🃏 Cards:`, cards.map(c => isJokerCard(c) ? 'JOKER' : `${c.value}-${c.suit}`));

    const result = validateMissionFromSelection(cards, requirements);
    console.log(`✅ Test completed: ${describe} - Result: ${result.isValid}`);

    expect(result.isValid).toBe(true);
    if (postChecks) {
      postChecks(result.usedCombinations);
    }
  })
}

function validateOneScenarioFail(describe: string, requirements: MissionRequirements, cards: Card[]) {
  it(describe, () => {
    console.log(`🧪 Starting FAIL test: ${describe}`);
    console.log(`📋 Requirements:`, requirements);
    console.log(`🃏 Cards count: ${cards.length}`);
    console.log(`🃏 Cards:`, cards.map(c => isJokerCard(c) ? 'JOKER' : `${c.value}-${c.suit}`));

    const result = validateMissionFromSelection(cards, requirements);
    console.log(`❌ FAIL test completed: ${describe} - Result: ${result.isValid}`);

    expect(result.isValid).toBe(false);
  })
}

describe('Mission Validation Tests', () => {
  describe('Mission 1: Deux groupes de 3', () => {
    validateMissionCards('should validate two groups of 3 cards each using unified validation',
      1,
      [
      ['7', 'clubs'],
      ['7', 'diamonds'],
      ['7', 'spades'],
      ['J', 'clubs'],
      ['J', 'diamonds'],
      ['J', 'hearts']
    ], (combinations) => {
      expect(combinations).toHaveLength(2)
      expect(combinations.every(c => c.type === 'group')).toBe(true)
      expect(combinations.every(c => c.cards.length === 3)).toBe(true)
    })

    validateMissionCardsFail('should fail with only one group of 3 cards',
      1,
      [
        ['7', 'clubs'],
        ['7', 'diamonds'],
        ['7', 'spades']
      ])

    validateMissionCardsFail('should fail with three groups of 3 cards',
      1,
      [
        ['7', 'clubs'],
        ['7', 'diamonds'],
        ['7', 'spades'],
        ['J', 'clubs'],
        ['J', 'diamonds'],
        ['J', 'hearts'],
        ['Q', 'hearts']
      ])
  })

  describe('Mission 2: Suite de 4 + groupe de 3', () => {
    validateMissionCards('should validate one sequence of 4 and one group of 3 using unified validation',
      2,
      [
        ['4', 'spades'],
        ['5', 'spades'],
        ['6', 'spades'],
        ['7', 'spades'],
        ['9', 'hearts'],
        ['9', 'diamonds'],
        ['9', 'clubs']
      ])

    validateMissionCardsFail('should fail with only one sequence of 4 cards',
      2,
      [
        ['4', 'spades'],
        ['5', 'spades'],
        ['6', 'spades'],
        ['7', 'spades']
      ])

    validateMissionCardsFail('should fail with sequence of 4 cards and group of 2 cards',
      2,
      [
        ['4', 'spades'],
        ['5', 'spades'],
        ['6', 'spades'],
        ['7', 'spades'],
        ['9', 'hearts'],
        ['9', 'diamonds']
      ])
  })

  describe('Mission 3: Deux suites de 4', () => {
    validateMissionCards('should validate two sequences of 4 cards each',
      3,
        [
      ['3',  'clubs'],
      ['4',  'clubs'],
      ['5',  'clubs'],
      ['6',  'clubs'],
      ['9',  'hearts'],
      ['10',  'hearts'],
      ['J',  'hearts'],
      ['Q',  'hearts']
    ]);

    validateMissionCardsFail('should fail with only one sequence of 4 cards',
      3,
      [
        ['3',  'clubs'],
        ['4',  'clubs'],
        ['5',  'clubs'],
        ['6',  'clubs']
      ])

    validateMissionCardsFail('should fail with two sequences of 3 cards',
      3,
      [
        ['3',  'clubs'],
        ['4',  'clubs'],
        ['5',  'clubs'],
        ['9',  'hearts'],
        ['10',  'hearts'],
        ['J',  'hearts']
      ])
  })

  describe('Mission 4: Trois groupes de 3', () => {
    validateMissionCards('should validate three groups of 3 cards each',
      4,
      [
      ['5',  'diamonds'],
      ['5',  'clubs'],
      ['5',  'spades'],
      ['8',  'spades'],
      ['8',  'hearts'],
      ['8',  'clubs'],
      ['Q',  'diamonds'],
      ['Q',  'spades'],
      ['Q',  'hearts']
    ]);

    validateMissionCardsFail('should fail with only two groups of 3 cards',
      4,
      [
        ['5',  'diamonds'],
        ['5',  'clubs'],
        ['5',  'spades'],
        ['8',  'spades'],
        ['8',  'hearts']
      ])

    validateMissionCardsFail('should fail with three groups of 2 cards',
      4,
      [
        ['5',  'diamonds'],
        ['5',  'clubs'],
        ['8',  'spades'],
        ['8',  'hearts'],
        ['Q',  'diamonds'],
        ['Q',  'spades']
      ])
  })

  describe('Mission 5: Suite de 5', () => {
    validateMissionCards('should validate one sequence of 5 cards',
      5,
      [
        ['6',  'diamonds'],
        ['7',  'diamonds'],
        ['8',  'diamonds'],
        ['9',  'diamonds'],
        ['10',  'diamonds']
      ])

    validateMissionCardsFail('should fail with only 4 cards',
      5,
      [
        ['6',  'diamonds'],
        ['7',  'diamonds'],
        ['8',  'diamonds'],
        ['9',  'diamonds']
      ])

    validateMissionCardsFail('should fail with sequence of 5 cards and one extra card',
      5,
      [
        ['6',  'diamonds'],
        ['7',  'diamonds'],
        ['8',  'diamonds'],
        ['9',  'diamonds'],
        ['10',  'diamonds'],
        ['J',  'diamonds']
      ])
  })

  describe('Mission 6: Suite de 7 même couleur', () => {
    validateMissionCards('should validate one sequence of 7 cards of same suit',
      6,
      [
        ['3',  'hearts'],
        ['4',  'hearts'],
        ['5',  'hearts'],
        ['6',  'hearts'],
        ['7',  'hearts'],
        ['8',  'hearts'],
        ['9',  'hearts']
      ])

    validateMissionCardsFail('should fail with only 6 cards',
      6,
      [
        ['3',  'hearts'],
        ['4',  'hearts'],
        ['5',  'hearts'],
        ['6',  'hearts'],
        ['7',  'hearts'],
        ['8',  'hearts']
      ])

    validateMissionCardsFail('should fail with sequence of 7 cards and one extra card',
      6,
      [
        ['3',  'hearts'],
        ['4',  'hearts'],
        ['5',  'hearts'],
        ['6',  'hearts'],
        ['7',  'hearts'],
        ['8',  'hearts'],
        ['9',  'hearts'],
        ['J',  'hearts']
      ])
  })

  describe('Mission 7: 7 cartes même couleur', () => {
    validateMissionCards('should validate 7 cards of same suit (can be groups or sequences)',
      7,
      [
        ['A',  'diamonds'],
        ['2',  'diamonds'],
        ['3',  'diamonds'],
        ['4',  'diamonds'],
        ['5',  'diamonds'],
        ['6',  'diamonds'],
        ['7',  'diamonds']
      ])

    validateMissionCardsFail('should fail with only 6 cards',
      7,
      [
        ['A',  'diamonds'],
        ['2',  'diamonds'],
        ['3',  'diamonds'],
        ['4',  'diamonds'],
        ['5',  'diamonds'],
        ['6',  'diamonds']
      ])

    validateMissionCardsFail('should fail with 7 cards of different suits',
      7,
      [
        ['A',  'diamonds'],
        ['2',  'hearts'],
        ['3',  'clubs'],
        ['4',  'spades'],
        ['5',  'diamonds'],
        ['6',  'hearts'],
        ['7',  'clubs']
      ])
  })

  describe('Mission 8: Groupe de 4 + suite de 4', () => {
    validateMissionCards('should validate one group of 4 and one sequence of 4',
      8,
      [
        ['K',  'hearts'],
        ['K',  'diamonds'],
        ['K',  'clubs'],
        ['K',  'spades'],
        ['2',  'clubs'],
        ['3',  'clubs'],
        ['4',  'clubs'],
        ['5',  'clubs']
      ])

    validateMissionCardsFail('should fail with only one group of 4 cards',
      8,
      [
        ['K',  'hearts'],
        ['K',  'diamonds'],
        ['K',  'clubs'],
        ['K',  'spades']
      ])

    validateMissionCardsFail('should fail with group of 4 cards and sequence of 3 cards',
      8,
      [
        ['K',  'hearts'],
        ['K',  'diamonds'],
        ['K',  'clubs'],
        ['K',  'spades'],
        ['2',  'clubs'],
        ['3',  'clubs'],
        ['4',  'clubs']
      ])
  })

  describe('Mission 9: Deux groupes de 4', () => {
    validateMissionCards('should validate two groups of 4 cards each',
      9,
      [
        ['3',  'hearts'],
        ['3',  'diamonds'],
        ['3',  'clubs'],
        ['3',  'spades'],
        ['10',  'hearts'],
        ['10',  'diamonds'],
        ['10',  'clubs'],
        ['10',  'spades']
      ])

    validateMissionCardsFail('should fail with only one group of 4 cards',
      9,
      [
        ['3',  'hearts'],
        ['3',  'diamonds'],
        ['3',  'clubs'],
        ['3',  'spades']
      ])

    validateMissionCardsFail('should fail with two groups of 3 cards',
      9,
      [
        ['3',  'hearts'],
        ['3',  'diamonds'],
        ['3',  'clubs'],
        ['10',  'hearts'],
        ['10',  'diamonds'],
        ['10',  'clubs']
      ])
  })

  describe('Mission 10: Trois suites de 4', () => {
    validateMissionCards('should validate three sequences of 4 cards each',
      10,
      [
        ['A',  'spades'],
        ['2',  'spades'],
        ['3',  'spades'],
        ['4',  'spades'],
        ['6',  'hearts'],
        ['7',  'hearts'],
        ['8',  'hearts'],
        ['9',  'hearts'],
        ['9',  'clubs'],
        ['10',  'clubs'],
        ['J',  'clubs'],
        ['Q',  'clubs']
      ])

    validateMissionCardsFail('should fail with only two sequences of 4 cards',
      10,
      [
        ['A',  'spades'],
        ['2',  'spades'],
        ['3',  'spades'],
        ['4',  'spades'],
        ['6',  'hearts'],
        ['7',  'hearts'],
        ['8',  'hearts'],
        ['9',  'hearts']
      ])

    validateMissionCardsFail('should fail with three sequences of 3 cards',
      10,
      [
        ['A',  'spades'],
        ['2',  'spades'],
        ['3',  'spades'],
        ['6',  'hearts'],
        ['7',  'hearts'],
        ['8',  'hearts']
      ])
  })

  describe('Mission 11: Suite de 6', () => {
    validateMissionCards('should validate one sequence of 6 cards',
      11,
      [
        ['7',  'diamonds'],
        ['8',  'diamonds'],
        ['9',  'diamonds'],
        ['10',  'diamonds'],
        ['J',  'diamonds'],
        ['Q',  'diamonds']
      ])

    validateMissionCardsFail('should fail with only 5 cards',
      11,
      [
        ['7',  'diamonds'],
        ['8',  'diamonds'],
        ['9',  'diamonds'],
        ['10',  'diamonds'],
        ['J',  'diamonds']
      ])

    validateMissionCardsFail('should fail with sequence of 6 cards and one extra card',
      11,
      [
        ['7',  'diamonds'],
        ['8',  'diamonds'],
        ['9',  'diamonds'],
        ['10',  'diamonds'],
        ['J',  'diamonds'],
        ['Q',  'diamonds'],
        ['K',  'diamonds']
      ])
  })

  describe('Mission 12: Deux suites de 5', () => {
    validateMissionCards('should validate two sequences of 5 cards each',
      12,
      [
        ['2',  'spades'],
        ['3',  'spades'],
        ['4',  'spades'],
        ['5',  'spades'],
        ['6',  'spades'],
        ['8',  'hearts'],
        ['9',  'hearts'],
        ['10',  'hearts'],
        ['J',  'hearts'],
        ['Q',  'hearts']
      ])

    validateMissionCardsFail('should fail with only one sequence of 5 cards',
      12,
      [
        ['2',  'spades'],
        ['3',  'spades'],
        ['4',  'spades'],
        ['5',  'spades'],
        ['6',  'spades']
      ])

    validateMissionCardsFail('should fail with two sequences of 4 cards',
      12,
      [
        ['2',  'spades'],
        ['3',  'spades'],
        ['4',  'spades'],
        ['5',  'spades'],
        ['8',  'hearts'],
        ['9',  'hearts'],
        ['10',  'hearts'],
        ['J',  'hearts']
      ])
  })

  describe('Mission 13: Groupe de 5', () => {
    validateMissionCards('should validate one group of 5 cards',
      13,
      [
        ['6',  'hearts'],
        ['6',  'diamonds'],
        ['6',  'clubs'],
        ['6',  'spades'],
        ['6',  'diamonds']
      ])

    validateMissionCardsFail('should fail with only 4 cards',
      13,
      [
        ['6',  'hearts'],
        ['6',  'diamonds'],
        ['6',  'clubs'],
        ['6',  'spades']
      ])

    validateMissionCardsFail('should fail with group of 5 cards and one extra card',
      13,
      [
        ['6',  'hearts'],
        ['6',  'diamonds'],
        ['6',  'clubs'],
        ['6',  'spades'],
        ['6',  'diamonds'],
        ['7',  'diamonds']
      ])
  })

  describe('Mission 14: Suite de 8', () => {
    validateMissionCards('should validate one sequence of 8 cards',
      14,
      [
        ['2',  'clubs'],
        ['3',  'clubs'],
        ['4',  'clubs'],
        ['5',  'clubs'],
        ['6',  'clubs'],
        ['7',  'clubs'],
        ['8',  'clubs'],
        ['9',  'clubs']
      ])

    validateMissionCardsFail('should fail with only 7 cards',
      14,
      [
        ['2',  'clubs'],
        ['3',  'clubs'],
        ['4',  'clubs'],
        ['5',  'clubs'],
        ['6',  'clubs'],
        ['7',  'clubs'],
        ['8',  'clubs']
      ])

    validateMissionCardsFail('should fail with sequence of 8 cards and one extra card',
      14,
      [
        ['2',  'clubs'],
        ['3',  'clubs'],
        ['4',  'clubs'],
        ['5',  'clubs'],
        ['6',  'clubs'],
        ['7',  'clubs'],
        ['8',  'clubs'],
        ['9',  'clubs'],
        ['10',  'clubs']
      ])
  })

  describe('Mission 15: Quatre groupes de 3', () => {
    validateMissionCards('should validate four groups of 3 cards each',
      15,
      [
        ['2',  'hearts'],
        ['2',  'diamonds'],
        ['2',  'clubs'],
        ['7',  'hearts'],
        ['7',  'diamonds'],
        ['7',  'spades'],
        ['J',  'clubs'],
        ['J',  'diamonds'],
        ['J',  'spades'],
        ['A',  'hearts'],
        ['A',  'clubs'],
        ['A',  'spades']
      ])

    validateMissionCardsFail('should fail with only three groups of 3 cards',
      15,
      [
        ['2',  'hearts'],
        ['2',  'diamonds'],
        ['2',  'clubs'],
        ['7',  'hearts'],
        ['7',  'diamonds'],
        ['7',  'spades']
      ])

    validateMissionCardsFail('should fail with four groups of 2 cards',
      15,
      [
        ['2',  'hearts'],
        ['2',  'diamonds'],
        ['7',  'hearts'],
        ['7',  'diamonds'],
        ['J',  'clubs'],
        ['J',  'diamonds'],
        ['A',  'hearts'],
        ['A',  'clubs']
      ])
  })

  describe('Mission 16: Deux suites de 5', () => {
    validateMissionCards('should validate two sequences of 5 cards each',
      16,
      [
        ['4',  'hearts'],
        ['5',  'hearts'],
        ['6',  'hearts'],
        ['7',  'hearts'],
        ['8',  'hearts'],
        ['9',  'spades'],
        ['10',  'spades'],
        ['J',  'spades'],
        ['Q',  'spades'],
        ['K',  'spades']
      ])

    validateMissionCardsFail('should fail with only one sequence of 5 cards',
      16,
      [
        ['4',  'hearts'],
        ['5',  'hearts'],
        ['6',  'hearts'],
        ['7',  'hearts'],
        ['8',  'hearts']
      ])

    validateMissionCardsFail('should fail with two sequences of 4 cards',
      16,
      [
        ['4',  'hearts'],
        ['5',  'hearts'],
        ['6',  'hearts'],
        ['7',  'hearts'],
        ['9',  'spades'],
        ['10',  'spades'],
        ['J',  'spades'],
        ['Q',  'spades']
      ])
  })

  describe('Mission 17: Suite de 9', () => {
    validateMissionCards('should validate one sequence of 9 cards',
      17,
      [
        ['A',  'diamonds'],
        ['2',  'diamonds'],
        ['3',  'diamonds'],
        ['4',  'diamonds'],
        ['5',  'diamonds'],
        ['6',  'diamonds'],
        ['7',  'diamonds'],
        ['8',  'diamonds'],
        ['9',  'diamonds']
      ])

    validateMissionCardsFail('should fail with only 8 cards',
      17,
      [
        ['A',  'diamonds'],
        ['2',  'diamonds'],
        ['3',  'diamonds'],
        ['4',  'diamonds'],
        ['5',  'diamonds'],
        ['6',  'diamonds'],
        ['7',  'diamonds'],
        ['8',  'diamonds']
      ])

    validateMissionCardsFail('should fail with sequence of 9 cards and one extra card',
      17,
      [
        ['A',  'diamonds'],
        ['2',  'diamonds'],
        ['3',  'diamonds'],
        ['4',  'diamonds'],
        ['5',  'diamonds'],
        ['6',  'diamonds'],
        ['7',  'diamonds'],
        ['8',  'diamonds'],
        ['9',  'diamonds'],
        ['10',  'diamonds']
      ])
  })

  describe('Mission 18: Trois groupes de 4', () => {
    validateMissionCards('should validate three groups of 4 cards each',
      18,
      [
        ['4',  'hearts'],
        ['4',  'diamonds'],
        ['4',  'clubs'],
        ['4',  'spades'],
        ['9',  'hearts'],
        ['9',  'diamonds'],
        ['9',  'clubs'],
        ['9',  'spades'],
        ['Q',  'hearts'],
        ['Q',  'diamonds'],
        ['Q',  'clubs'],
        ['Q',  'spades']
      ])

    validateMissionCardsFail('should fail with only two groups of 4 cards',
      18,
      [
        ['4',  'hearts'],
        ['4',  'diamonds'],
        ['4',  'clubs'],
        ['4',  'spades'],
        ['9',  'hearts'],
        ['9',  'diamonds'],
        ['9',  'clubs'],
        ['9',  'spades']
      ])

    validateMissionCardsFail('should fail with three groups of 3 cards',
      18,
      [
        ['4',  'hearts'],
        ['4',  'diamonds'],
        ['9',  'hearts'],
        ['9',  'diamonds'],
        ['Q',  'hearts'],
        ['Q',  'diamonds']
      ])
  })

  describe('Mission 19: Suite de 10', () => {
    validateMissionCards('should validate one sequence of 10 cards',
      19,
      [
        ['2',  'hearts'],
        ['3',  'hearts'],
        ['4',  'hearts'],
        ['5',  'hearts'],
        ['6',  'hearts'],
        ['7',  'hearts'],
        ['8',  'hearts'],
        ['9',  'hearts'],
        ['10',  'hearts'],
        ['J',  'hearts']
      ])

    validateMissionCardsFail('should fail with only 9 cards',
      19,
      [
        ['2',  'hearts'],
        ['3',  'hearts'],
        ['4',  'hearts'],
        ['5',  'hearts'],
        ['6',  'hearts'],
        ['7',  'hearts'],
        ['8',  'hearts'],
        ['9',  'hearts'],
        ['10',  'hearts']
      ])

    validateMissionCardsFail('should fail with sequence of 10 cards and one extra card',
      19,
      [
        ['2',  'hearts'],
        ['3',  'hearts'],
        ['4',  'hearts'],
        ['5',  'hearts'],
        ['6',  'hearts'],
        ['7',  'hearts'],
        ['8',  'hearts'],
        ['9',  'hearts'],
        ['10',  'hearts'],
        ['J',  'hearts'],
        ['Q',  'hearts']
      ])
  })

  describe('Mission 20: Sept cartes impaires', () => {
    validateMissionCards('should validate 7 cards with odd values (A, 3, 5, 7, 9, J, K)',
      20,
      [
        ['A',  'hearts'],
        ['A',  'diamonds'],
        ['A',  'clubs'],
        ['J',  'hearts'],
        ['J',  'diamonds'],
        ['J',  'clubs'],
        ['J',  'spades']
      ])

    validateMissionCardsFail('should fail with only 6 cards',
      20,
      [
        ['A',  'hearts'],
        ['A',  'diamonds'],
        ['A',  'clubs'],
        ['J',  'hearts'],
        ['J',  'diamonds'],
        ['J',  'clubs']
      ])

    validateMissionCardsFail('should fail with 7 cards of same value',
      20,
      [
        ['A',  'hearts'],
        ['A',  'diamonds'],
        ['A',  'clubs'],
        ['A',  'spades'],
        ['A',  'hearts'],
        ['A',  'diamonds'],
        ['A',  'clubs']
      ])
  })

  describe('Mission 21: Deux suites de 5, couleurs différentes', () => {
    validateMissionCards('should validate two sequences of 5 cards with different suits',
      21,
      [
        ['5',  'hearts'],
        ['6',  'hearts'],
        ['7',  'hearts'],
        ['8',  'hearts'],
        ['9',  'hearts'],
        ['8',  'clubs'],
        ['9',  'clubs'],
        ['10',  'clubs'],
        ['J',  'clubs'],
        ['Q',  'clubs']
      ])

    validateMissionCardsFail('should fail with only one sequence of 5 cards',
      21,
      [
        ['5',  'hearts'],
        ['6',  'hearts'],
        ['7',  'hearts'],
        ['8',  'hearts'],
        ['9',  'hearts']
      ])

    validateMissionCardsFail('should fail with two sequences of 4 cards',
      21,
      [
        ['5',  'hearts'],
        ['6',  'hearts'],
        ['7',  'hearts'],
        ['8',  'hearts'],
        ['9',  'hearts'],
        ['8',  'clubs'],
        ['9',  'clubs'],
        ['10',  'clubs'],
        ['J',  'clubs']
      ])
  })

  describe('Mission 23: Trois groupes de 4 cartes', () => {
    validateMissionCards('should validate three groups of 4 cards each',
      23,
      [
        ['6',  'hearts'],
        ['6',  'diamonds'],
        ['6',  'clubs'],
        ['6',  'spades'],
        ['10',  'hearts'],
        ['10',  'diamonds'],
        ['10',  'clubs'],
        ['10',  'spades'],
        ['A',  'hearts'],
        ['A',  'diamonds'],
        ['A',  'clubs'],
        ['A',  'spades']
      ])

    validateMissionCardsFail('should fail with only two groups of 4 cards',
      23,
      [
        ['6',  'hearts'],
        ['6',  'diamonds'],
        ['6',  'clubs'],
        ['6',  'spades'],
        ['10',  'hearts'],
        ['10',  'diamonds'],
        ['10',  'clubs'],
        ['10',  'spades']
      ])

    validateMissionCardsFail('should fail with three groups of 3 cards',
      23,
      [
        ['6',  'hearts'],
        ['6',  'diamonds'],
        ['6',  'clubs'],
        ['10',  'hearts'],
        ['10',  'diamonds'],
        ['10',  'clubs']
      ])
  })

  describe('Mission 24: Suite complète (A à K) d\'une couleur', () => {
    validateMissionCards('should validate complete sequence from A to K of one suit',
      24,
      [
        ['A',  'spades'],
        ['2',  'spades'],
        ['3',  'spades'],
        ['4',  'spades'],
        ['5',  'spades'],
        ['6',  'spades'],
        ['7',  'spades'],
        ['8',  'spades'],
        ['9',  'spades'],
        ['10',  'spades'],
        ['J',  'spades'],
        ['Q',  'spades'],
        ['K',  'spades']
      ])

    validateMissionCardsFail('should fail with incomplete sequence A to J of one suit',
      24,
      [
        ['A',  'spades'],
        ['2',  'spades'],
        ['3',  'spades'],
        ['4',  'spades'],
        ['5',  'spades'],
        ['6',  'spades'],
        ['7',  'spades'],
        ['8',  'spades'],
        ['9',  'spades'],
        ['10',  'spades'],
        ['J',  'spades']
      ])

    validateMissionCardsFail('should fail with complete sequence A to K of different suits',
      24,
      [
        ['A',  'spades'],
        ['2',  'hearts'],
        ['3',  'clubs'],
        ['4',  'spades'],
        ['5',  'hearts'],
        ['6',  'clubs'],
        ['7',  'spades'],
        ['8',  'hearts'],
        ['9',  'clubs'],
        ['10',  'spades'],
        ['J',  'hearts'],
        ['Q',  'clubs'],
        ['K',  'spades']
      ])
  })

  describe('Mission 25: Suite de 7-8-9-10 de cœur', () => {
    validateMissionCards('should validate sequence 7-8-9-10 of hearts',
      25,
      [
        ['7',  'hearts'],
        ['8',  'hearts'],
        ['9',  'hearts'],
        ['10',  'hearts']
      ])

    validateMissionCardsFail('should fail with only 3 cards',
      25,
      [
        ['7',  'hearts'],
        ['8',  'hearts'],
        ['9',  'hearts']
      ])

    validateMissionCardsFail('should fail with sequence 7-8-9-10 of different suits',
      25,
      [
        ['7',  'hearts'],
        ['8',  'diamonds'],
        ['9',  'clubs'],
        ['10',  'spades']
      ])
  })

  describe('Mission 26: Deux suites de 4 : une en ♠ et une en ♣', () => {
    validateMissionCards('should validate two sequences of 4: one in spades, one in clubs',
      26,
      [
        ['5',  'spades'],
        ['6',  'spades'],
        ['7',  'spades'],
        ['8',  'spades'],
        ['9',  'clubs'],
        ['10',  'clubs'],
        ['J',  'clubs'],
        ['Q',  'clubs']
      ])

    validateMissionCardsFail('should fail with only one sequence of 4 cards',
      26,
      [
        ['5',  'spades'],
        ['6',  'spades'],
        ['7',  'spades'],
        ['8',  'spades']
      ])

    validateMissionCardsFail('should fail with two sequences of 3 cards',
      26,
      [
        ['5',  'spades'],
        ['6',  'spades'],
        ['7',  'spades'],
        ['9',  'clubs'],
        ['10',  'clubs'],
        ['J',  'clubs']
      ])
  })

  describe('Mission 27: Suite de 5 cartes rouges', () => {
    validateMissionCards('should validate sequence of 5 red cards (hearts)',
      27,
      [
        ['3',  'hearts'],
        ['4',  'hearts'],
        ['5',  'hearts'],
        ['6',  'hearts'],
        ['7',  'hearts']
      ])
    validateMissionCards('should validate sequence of 5 red cards (diamonds)',
      27,
      [
        ['9',  'diamonds'],
        ['10',  'diamonds'],
        ['J',  'diamonds'],
        ['Q',  'diamonds'],
        ['K',  'diamonds']
      ])

    validateMissionCardsFail('should fail with only 4 red cards',
      27,
      [
        ['3',  'hearts'],
        ['4',  'hearts'],
        ['5',  'hearts'],
        ['6',  'hearts']
      ])

    validateMissionCardsFail('should fail with sequence of 5 red cards and one black card',
      27,
      [
        ['3',  'hearts'],
        ['4',  'hearts'],
        ['5',  'hearts'],
        ['6',  'hearts'],
        ['7',  'diamonds']
      ])
  })

  describe('Mission 28: Deux groupes de 3 : un rouge, un noir', () => {
    validateMissionCards('should validate two groups of 3: one red, one black',
      28,
      [
        ['9',  'hearts'],
        ['9',  'diamonds'],
        ['9',  'diamonds'],
        ['K',  'clubs'],
        ['K',  'spades'],
        ['K',  'clubs']
      ])

    validateMissionCardsFail('should fail with only one group of 3 cards',
      28,
      [
        ['9',  'hearts'],
        ['9',  'diamonds'],
        ['9',  'diamonds']
      ])

    validateMissionCardsFail('should fail with two groups of 3 red cards',
      28,
      [
        ['9',  'hearts'],
        ['9',  'diamonds'],
        ['9',  'hearts'],
        ['K',  'clubs'],
        ['K',  'spades'],
        ['K',  'clubs']
      ])
  })

  describe('Mission 29: Trois cartes identiques (♠ ♣ ♥)', () => {
    validateMissionCards('should validate three identical cards of spades, clubs, hearts (no diamonds)',
      29,
      [
        ['Q',  'spades'],
        ['Q',  'clubs'],
        ['Q',  'hearts']
      ])

    validateMissionCardsFail('should fail with two identical cards and one different card',
      29,
      [
        ['Q',  'spades'],
        ['Q',  'clubs'],
        ['K',  'hearts']
      ])

    validateMissionCardsFail('should fail with three identical cards of the same suit',
      29,
      [
        ['Q',  'spades'],
        ['Q',  'spades'],
        ['Q',  'spades']
      ])
  })

  describe('Mission 30: Suite paire de 6 cartes rouges', () => {
    validateMissionCards('should validate even sequence of 6 red cards',
      30,
      [
        ['2',  'hearts'],
        ['4',  'hearts'],
        ['6',  'hearts'],
        ['8',  'hearts'],
        ['10',  'hearts'],
        ['Q',  'hearts']
      ])

    validateMissionCardsFail('should fail with only 5 red cards',
      30,
      [
        ['2',  'hearts'],
        ['4',  'hearts'],
        ['6',  'hearts'],
        ['8',  'hearts'],
        ['10',  'hearts']
      ])

    validateMissionCardsFail('should fail with sequence of 6 red cards and one black card',
      30,
      [
        ['2',  'hearts'],
        ['4',  'hearts'],
        ['6',  'hearts'],
        ['8',  'hearts'],
        ['10',  'hearts'],
        ['Q',  'hearts'],
        ['J',  'diamonds']
      ])
  })

  describe('Joker Validation Tests', () => {
    it('should validate groups with jokers', () => {
      const groupWithJoker = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createJokerCard()
      ]

      expect(isValidGroup(groupWithJoker)).toBe(true)
    })

    it('should validate sequences with jokers', () => {
      const sequenceWithJoker = [
        createCard('4', 'spades'),
        createCard('5', 'spades'),
        createJokerCard()
      ]

      expect(isValidSequence(sequenceWithJoker)).toBe(true)
    })

    it('should validate multiple jokers in combinations', () => {
      const groupWithMultipleJokers = [
        createCard('Q', 'hearts'),
        createJokerCard(),
        createJokerCard()
      ]
      const sequenceWithMultipleJokers = [
        createCard('5', 'clubs'),
        createCard('6', 'clubs'),
        createJokerCard(),
        createJokerCard()
      ]

      expect(isValidGroup(groupWithMultipleJokers)).toBe(true)
      expect(isValidSequence(sequenceWithMultipleJokers)).toBe(true)
    })
  })
})
