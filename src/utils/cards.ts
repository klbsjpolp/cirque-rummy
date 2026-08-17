import { Card, CardSuit, CardValue, JokerCard, NormalCard } from '../types/game';

export const CARD_VALUES: CardValue[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const CARD_SUITS: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

// Primitives partagées par les règles de mission et les utilitaires de cartes.
// Ce module ne dépend de rien d'autre, pour éviter les imports circulaires.

export const isJokerCard = (card: Card): card is JokerCard => {
  return 'isJoker' in card && card.isJoker;
};

export const isNormalCard = (card: Card): card is NormalCard => {
  return !('isJoker' in card);
};

export const getCardValueNumber = (value: CardValue): number => {
  if (value === 'A') return 1;
  if (value === 'J') return 11;
  if (value === 'Q') return 12;
  if (value === 'K') return 13;
  return parseInt(value);
};

/** L'inverse de getCardValueNumber : 1 → A, 13 → K. */
export const getValueFromNumber = (value: number): CardValue => CARD_VALUES[value - 1];

export const countJokers = (cards: Card[]): number => cards.filter(isJokerCard).length;

export const normalCards = (cards: Card[]): NormalCard[] => cards.filter(isNormalCard);

/**
 * Combien des `values` demandées ne sont couvertes par aucune carte réelle.
 * C'est le nombre de jokers nécessaires pour compléter la combinaison.
 */
export const valuesMissingFrom = (cards: NormalCard[], values: CardValue[]): number =>
  values.filter(v => !cards.some(c => c.value === v)).length;
