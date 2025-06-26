
import { Card, CardSuit, CardValue, Combination } from '../types/game';

export const CARD_VALUES: CardValue[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const CARD_SUITS: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  
  // Cartes normales (2 jeux)
  for (let i = 0; i < 2; i++) {
    CARD_SUITS.forEach(suit => {
      CARD_VALUES.forEach(value => {
        deck.push({
          id: `${value}-${suit}-${i}`,
          value,
          suit,
          isJoker: false
        });
      });
    });
  }
  
  // 4 jokers
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `joker-${i}`,
      value: 'A', // Valeur par défaut
      suit: 'hearts', // Couleur par défaut
      isJoker: true
    });
  }
  
  return shuffleDeck(deck);
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getCardValueNumber = (value: CardValue): number => {
  if (value === 'A') return 1;
  if (value === 'J') return 11;
  if (value === 'Q') return 12;
  if (value === 'K') return 13;
  return parseInt(value);
};

export const isValidGroup = (cards: Card[]): boolean => {
  if (cards.length < 3 || cards.length > 4) return false;
  
  // Tous de même valeur mais couleurs différentes
  const nonJokerCards = cards.filter(c => !c.isJoker);
  if (nonJokerCards.length === 0) return false;
  
  const firstValue = nonJokerCards[0].value;
  const usedSuits = new Set<CardSuit>();
  
  for (const card of nonJokerCards) {
    if (card.value !== firstValue) return false;
    if (usedSuits.has(card.suit)) return false;
    usedSuits.add(card.suit);
  }
  
  return true;
};

export const isValidSequence = (cards: Card[]): boolean => {
  if (cards.length < 3) return false;
  
  const nonJokerCards = cards.filter(c => !c.isJoker);
  if (nonJokerCards.length === 0) return false;
  
  // Toutes de même couleur
  const firstSuit = nonJokerCards[0].suit;
  if (!nonJokerCards.every(c => c.suit === firstSuit)) return false;
  
  // Valeurs consécutives
  const sortedValues = nonJokerCards
    .map(c => getCardValueNumber(c.value))
    .sort((a, b) => a - b);
  
  let expectedValue = sortedValues[0];
  let jokerCount = cards.length - nonJokerCards.length;
  
  for (let i = 0; i < cards.length; i++) {
    if (i < sortedValues.length && sortedValues[i] === expectedValue) {
      expectedValue++;
    } else if (jokerCount > 0) {
      jokerCount--;
      expectedValue++;
    } else {
      return false;
    }
  }
  
  return true;
};

export const getSuitSymbol = (suit: CardSuit): string => {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
  }
};

export const getSuitColor = (suit: CardSuit): string => {
  return suit === 'hearts' || suit === 'diamonds' ? 'text-red-600' : 'text-gray-900';
};
