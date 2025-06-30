import { describe, it, expect } from 'vitest'
import { 
  createDeck, 
  shuffleDeck, 
  isValidGroup, 
  isValidSequence, 
  getCardValueNumber,
  getSuitSymbol,
  getSuitColor,
  isJokerCard,
  isNormalCard,
  CARD_VALUES,
  CARD_SUITS
} from '../utils/cardUtils'
import {createCard, createJokerCard} from './testUtils'

describe('Card Utils', () => {
  describe('createDeck', () => {
    it('should create a deck with 108 cards (2 standard decks + 4 jokers)', () => {
      const deck = createDeck()
      expect(deck).toHaveLength(108)
    })

    it('should contain exactly 4 jokers', () => {
      const deck = createDeck()
      const jokers = deck.filter(card => isJokerCard(card))
      expect(jokers).toHaveLength(4)
    })

    it('should contain 2 of each regular card', () => {
      const deck = createDeck()
      const regularCards = deck.filter(card => isNormalCard(card))
      expect(regularCards).toHaveLength(104) // 52 * 2

      // Check that each card appears exactly twice
      const cardCounts = new Map()
      regularCards.forEach(card => {
        const key = `${card.value}-${card.suit}`
        cardCounts.set(key, (cardCounts.get(key) || 0) + 1)
      })

      cardCounts.forEach(count => {
        expect(count).toBe(2)
      })
    })

    it('should have all suits and values represented', () => {
      const deck = createDeck()
      const regularCards = deck.filter(card => isNormalCard(card))

      const suits = new Set(regularCards.map(card => card.suit))
      const values = new Set(regularCards.map(card => card.value))

      expect(suits.size).toBe(4)
      expect(values.size).toBe(13)

      CARD_SUITS.forEach(suit => expect(suits.has(suit)).toBe(true))
      CARD_VALUES.forEach(value => expect(values.has(value)).toBe(true))
    })
  })

  describe('shuffleDeck', () => {
    it('should return a deck with the same number of cards', () => {
      const originalDeck = createDeck()
      const shuffledDeck = shuffleDeck(originalDeck)
      expect(shuffledDeck).toHaveLength(originalDeck.length)
    })

    it('should not modify the original deck', () => {
      const originalDeck = createDeck()
      const originalFirst = originalDeck[0]
      shuffleDeck(originalDeck)
      expect(originalDeck[0]).toEqual(originalFirst)
    })

    it('should contain the same cards as the original deck', () => {
      const originalDeck = createDeck()
      const shuffledDeck = shuffleDeck(originalDeck)

      // Sort both decks by id to compare
      const sortedOriginal = [...originalDeck].sort((a, b) => a.id.localeCompare(b.id))
      const sortedShuffled = [...shuffledDeck].sort((a, b) => a.id.localeCompare(b.id))

      expect(sortedShuffled).toEqual(sortedOriginal)
    })
  })

  describe('getCardValueNumber', () => {
    it('should return correct numeric values for face cards', () => {
      expect(getCardValueNumber('A')).toBe(1)
      expect(getCardValueNumber('J')).toBe(11)
      expect(getCardValueNumber('Q')).toBe(12)
      expect(getCardValueNumber('K')).toBe(13)
    })

    it('should return correct numeric values for number cards', () => {
      expect(getCardValueNumber('2')).toBe(2)
      expect(getCardValueNumber('5')).toBe(5)
      expect(getCardValueNumber('10')).toBe(10)
    })
  })

  describe('getSuitSymbol', () => {
    it('should return correct symbols for all suits', () => {
      expect(getSuitSymbol('hearts')).toBe('♥')
      expect(getSuitSymbol('diamonds')).toBe('♦')
      expect(getSuitSymbol('clubs')).toBe('♣')
      expect(getSuitSymbol('spades')).toBe('♠')
    })
  })

  describe('getSuitColor', () => {
    it('should return red color class for red suits', () => {
      expect(getSuitColor('hearts')).toBe('text-red-600')
      expect(getSuitColor('diamonds')).toBe('text-red-600')
    })

    it('should return black color class for black suits', () => {
      expect(getSuitColor('clubs')).toBe('text-gray-900')
      expect(getSuitColor('spades')).toBe('text-gray-900')
    })
  })

  describe('isValidGroup', () => {
    it('should validate a basic group of 3 same value, different suits', () => {
      const cards = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createCard('7', 'spades')
      ]
      expect(isValidGroup(cards)).toBe(true)
    })

    it('should validate a group of 4 same value, different suits', () => {
      const cards = [
        createCard('K', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('K', 'clubs'),
        createCard('K', 'spades')
      ]
      expect(isValidGroup(cards)).toBe(true)
    })

    it('should reject groups with less than 3 cards', () => {
      const cards = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds')
      ]
      expect(isValidGroup(cards)).toBe(false)
    })

    it('should reject groups with different values', () => {
      const cards = [
        createCard('7', 'clubs'),
        createCard('8', 'diamonds'),
        createCard('7', 'spades')
      ]
      expect(isValidGroup(cards)).toBe(false)
    })

    it('should reject groups with same suits', () => {
      const cards = [
        createCard('7', 'clubs'),
        createCard('7', 'clubs'),
        createCard('7', 'spades')
      ]
      expect(isValidGroup(cards)).toBe(false)
    })

    it('should accept groups with jokers', () => {
      const cards = [
        createCard('7', 'clubs'),
        createCard('7', 'diamonds'),
        createJokerCard()
      ]
      expect(isValidGroup(cards)).toBe(true)
    })

    it('should reject groups with only jokers', () => {
      const cards = [
        createJokerCard(),
        createJokerCard(),
        createJokerCard()
      ]
      expect(isValidGroup(cards)).toBe(false)
    })
  })

  describe('isValidSequence', () => {
    it('should validate a basic sequence of 3 consecutive cards, same suit', () => {
      const cards = [
        createCard('4', 'spades'),
        createCard('5', 'spades'),
        createCard('6', 'spades')
      ]
      expect(isValidSequence(cards)).toBe(true)
    })

    it('should validate a longer sequence', () => {
      const cards = [
        createCard('3', 'hearts'),
        createCard('4', 'hearts'),
        createCard('5', 'hearts'),
        createCard('6', 'hearts'),
        createCard('7', 'hearts')
      ]
      expect(isValidSequence(cards)).toBe(true)
    })

    it('should validate sequences with face cards', () => {
      const cards = [
        createCard('J', 'diamonds'),
        createCard('Q', 'diamonds'),
        createCard('K', 'diamonds')
      ]
      expect(isValidSequence(cards)).toBe(true)
    })

    it('should reject sequences with less than 3 cards', () => {
      const cards = [
        createCard('4', 'spades'),
        createCard('5', 'spades')
      ]
      expect(isValidSequence(cards)).toBe(false)
    })

    it('should reject sequences with different suits', () => {
      const cards = [
        createCard('4', 'spades'),
        createCard('5', 'hearts'),
        createCard('6', 'spades')
      ]
      expect(isValidSequence(cards)).toBe(false)
    })

    it('should reject non-consecutive sequences', () => {
      const cards = [
        createCard('4', 'spades'),
        createCard('6', 'spades'),
        createCard('7', 'spades')
      ]
      expect(isValidSequence(cards)).toBe(false)
    })

    it('should accept sequences with jokers filling gaps', () => {
      const cards = [
        createCard('4', 'spades'),
        createJokerCard(), // joker for 5
        createCard('6', 'spades')
      ]
      expect(isValidSequence(cards)).toBe(true)
    })

    it('should reject sequences with only jokers', () => {
      const cards = [
        createJokerCard(),
        createJokerCard(),
        createJokerCard()
      ]
      expect(isValidSequence(cards)).toBe(false)
    })

    it('should handle Ace as low card (A-2-3)', () => {
      const cards = [
        createCard('A', 'clubs'),
        createCard('2', 'clubs'),
        createCard('3', 'clubs')
      ]
      expect(isValidSequence(cards)).toBe(true)
    })
  })
})
