import {Card, CardSuit, CardValue, NormalCard, MissionRequirements, Combination} from '../types/game';
import {countJokers, getCardValueNumber, isJokerCard, isNormalCard} from './cards';
import {combinationsSatisfyRequirements} from './missionRules';

// Réexportés ici : de nombreux modules et tests importent ces primitives via cardUtils.
export {getCardValueNumber, isJokerCard, isNormalCard};

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
          suit
        });
      });
    });
  }

  // 4 jokers
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `joker-${i}`,
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

export const isValidGroup = (cards: Card[]): boolean => {
  if (cards.length < 3) return false;

  // Tous de même valeur mais couleurs différentes
  const nonJokerCards = cards.filter(isNormalCard);
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

  const nonJokerCards = cards.filter(isNormalCard);
  if (nonJokerCards.length === 0) return false;

  // Toutes de même couleur
  const firstSuit = nonJokerCards[0].suit;
  if (!nonJokerCards.every(c => c.suit === firstSuit)) return false;

  // Valeurs consécutives
  const sortedValues = nonJokerCards
    .map(c => getCardValueNumber(c.value))
    .sort((a, b) => a - b);

  const jokerCount = cards.length - nonJokerCards.length;

  // Check that we don't have duplicate values in non-joker cards
  const uniqueValues = new Set(sortedValues);
  if (uniqueValues.size !== sortedValues.length) return false;

  // Calculate gaps that need to be filled by jokers between existing cards
  let gapsNeeded = 0;
  for (let i = 1; i < sortedValues.length; i++) {
    gapsNeeded += sortedValues[i] - sortedValues[i-1] - 1;
  }

  // For a valid sequence, we need exactly enough jokers to fill gaps
  // The remaining jokers can extend the sequence at the beginning or end
  if (gapsNeeded > jokerCount) return false;

  // Check if the total sequence length makes sense
  // We have sortedValues.length non-joker cards + jokerCount jokers = cards.length total
  // This should form a consecutive sequence
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

// New unified validation function for missions
export const validateMissionCards = (cards: Card[], missionRequirements: MissionRequirements): { isValid: boolean; combinations: { cards: Card[]; type: 'group' | 'sequence' }[] } => {
  if (cards.length === 0) {
    return { isValid: false, combinations: [] };
  }

  // Try to find the best combination of groups and sequences that satisfy the mission
  return findBestCombination(cards, missionRequirements);
};

// Helper function to find the best combination of groups and sequences
const findBestCombination = (cards: Card[], requirements: MissionRequirements): { isValid: boolean; combinations: { cards: Card[]; type: 'group' | 'sequence' }[] } => {
  const { groups: requiredGroups = 0, sequences: requiredSequences = 0} = requirements;

  // Generate all possible combinations of groups and sequences
  const allPossibleGroups = findAllPossibleGroups(cards);
  const allPossibleSequences = findAllPossibleSequences(cards);

  // Try to find a combination that satisfies the requirements
  return findValidCombination(
    cards,
    allPossibleGroups,
    allPossibleSequences,
    requiredGroups,
    requiredSequences,
    requirements
  );
};

// Find all possible groups from the given cards
const findAllPossibleGroups = (cards: Card[]): Card[][] => {
  const groups: Card[][] = [];
  const cardsByValue = new Map<string, Card[]>();

  // Group cards by value
  cards.forEach(card => {
    if (isNormalCard(card)) {
      const value = card.value;
      if (!cardsByValue.has(value)) {
        cardsByValue.set(value, []);
      }
      cardsByValue.get(value)!.push(card);
    }
  });

  // Add jokers to each value group
  const jokers = cards.filter(isJokerCard);

  // Generate all possible groups (3 or more cards of same value)
  cardsByValue.forEach((cardsOfValue) => {
    // Try different combinations with jokers
    for (let jokersUsed = 0; jokersUsed <= jokers.length; jokersUsed++) {
      const totalCards = cardsOfValue.length + jokersUsed;
      if (totalCards >= 3) {
        // Create groups of different sizes
        for (let groupSize = 3; groupSize <= totalCards && groupSize <= 4; groupSize++) {
          if (groupSize <= cardsOfValue.length + jokersUsed) {
            const group = [
              ...cardsOfValue.slice(0, Math.min(groupSize - jokersUsed, cardsOfValue.length)),
              ...jokers.slice(0, Math.min(jokersUsed, groupSize - cardsOfValue.length))
            ];
            if (group.length === groupSize && isValidGroup(group)) {
              groups.push(group);
            }
          }
        }
      }
    }
  });

  return groups;
};

// Find all possible sequences from the given cards
const findAllPossibleSequences = (cards: Card[]): Card[][] => {
  const sequences: Card[][] = [];
  const cardsBySuit = new Map<CardSuit, NormalCard[]>();

  // Group normal cards by suit
  cards.filter(isNormalCard).forEach(card => {
    const suit = card.suit;
    if (!cardsBySuit.has(suit)) {
      cardsBySuit.set(suit, []);
    }
    cardsBySuit.get(suit)!.push(card);
  });

  const jokers = cards.filter(isJokerCard);

  // For each suit, try to build sequences
  cardsBySuit.forEach((cardsOfSuit) => {
    // Sort cards by value
    const sortedCards = cardsOfSuit.sort((a, b) => getCardValueNumber(a.value) - getCardValueNumber(b.value));

    // Try different sequence combinations with jokers
    for (let startIdx = 0; startIdx < sortedCards.length; startIdx++) {
      for (let endIdx = startIdx; endIdx < sortedCards.length; endIdx++) {
        const baseCards = sortedCards.slice(startIdx, endIdx + 1);

        // First try without jokers
        if (baseCards.length >= 3 && isValidSequence(baseCards)) {
          sequences.push([...baseCards]);
        }

        // Try adding jokers to make valid sequences
        for (let jokersUsed = 1; jokersUsed <= jokers.length; jokersUsed++) {
          const jokerCombinations = getCombinations(jokers, jokersUsed);
          for (const jokerCombo of jokerCombinations) {
            const sequenceCards = [...baseCards, ...jokerCombo];
            if (sequenceCards.length >= 3 && isValidSequence(sequenceCards)) {
              sequences.push(sequenceCards);
            }
          }
        }
      }
    }
  });

  return sequences;
};

// Find a valid combination that satisfies the mission requirements
const findValidCombination = (
  allCards: Card[],
  possibleGroups: Card[][],
  possibleSequences: Card[][],
  requiredGroups: number,
  requiredSequences: number,
  requirements: MissionRequirements
): { isValid: boolean; combinations: { cards: Card[]; type: 'group' | 'sequence' }[] } => {

  // Try all combinations of groups and sequences
  const groupCombinations = getCombinations(possibleGroups, requiredGroups);
  const sequenceCombinations = getCombinations(possibleSequences, requiredSequences);

  for (const groups of groupCombinations) {
    for (const sequences of sequenceCombinations) {
      const usedCards = new Set<string>();
      let isValidCombination = true;

      // Check if cards are not reused
      for (const group of groups) {
        for (const card of group) {
          if (usedCards.has(card.id)) {
            isValidCombination = false;
            break;
          }
          usedCards.add(card.id);
        }
        if (!isValidCombination) break;
      }

      if (isValidCombination) {
        for (const sequence of sequences) {
          for (const card of sequence) {
            if (usedCards.has(card.id)) {
              isValidCombination = false;
              break;
            }
            usedCards.add(card.id);
          }
          if (!isValidCombination) break;
        }
      }

      // Check if all selected cards are used
      const allSelectedCards = allCards.every(card => usedCards.has(card.id));

      if (isValidCombination && allSelectedCards) {
        const combinations = [
          ...groups.map(cards => ({ cards, type: 'group' as const })),
          ...sequences.map(cards => ({ cards, type: 'sequence' as const }))
        ];
        // Une seule autorité pour les règles de mission (voir missionRules.ts)
        if (satisfiesMission(combinations, requirements)) {
          return { isValid: true, combinations };
        }
      }
    }
  }

  return { isValid: false, combinations: [] };
};

// Get all combinations of a given size from an array
const getCombinations = <T>(arr: T[], size: number): T[][] => {
  if (size === 0) return [[]];
  if (size > arr.length) return [];

  const result: T[][] = [];

  function backtrack(start: number, current: T[]) {
    if (current.length === size) {
      result.push([...current]);
      return;
    }

    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }

  backtrack(0, []);
  return result;
};

/**
 * Passerelle vers l'unique moteur de règles. Les deux commutateurs de règles qui
 * vivaient ici (`checkSpecificRequirements` et `checkAdvancedRequirements`) ont été
 * supprimés : ils dupliquaient — en plus faible — les règles de missionRules.ts, et
 * c'est ce doublon qui faisait accepter des poses jamais créditées.
 */
const satisfiesMission = (
  layout: UsedCombinations,
  requirements: MissionRequirements
): boolean =>
  combinationsSatisfyRequirements(
    layout.map((combo, index) => ({ id: `candidate-${index}`, cards: combo.cards, type: combo.type })),
    requirements
  );

/**
 * Les missions « ensemble de cartes » (7 cartes d'une couleur, suite A→9, suite paire
 * rouge…) posent la sélection telle quelle. On la fait quand même valider par le
 * moteur de règles : rien n'est posé sans être crédité.
 */
const asMissionLayout = (
  layout: UsedCombinations,
  requirements: MissionRequirements
): { isValid: boolean, usedCombinations: UsedCombinations } =>
  satisfiesMission(layout, requirements)
    ? { isValid: true, usedCombinations: layout }
    : { isValid: false, usedCombinations: [] };

/**
 * Une combinaison candidate : ses cartes réelles et le nombre de jokers qui la
 * complètent. Les jokers sont interchangeables, donc on ne les identifie pas
 * pendant la recherche — les énumérer un par un multipliait le nombre de
 * candidats sans jamais changer la validité d'une disposition.
 */
type Candidate = {
  normals: Card[];
  jokers: number;
  type: 'group' | 'sequence';
};

const candidateSize = (candidate: Candidate): number => candidate.normals.length + candidate.jokers;

/** Des jokers anonymes, juste pour valider une forme candidate. */
const probeJokers = (count: number): Card[] =>
  Array.from({ length: count }, (_, i) => ({ id: `probe-joker-${i}`, isJoker: true as const }));

const isValidCandidate = (normals: Card[], jokers: number, type: 'group' | 'sequence'): boolean => {
  const cards = [...normals, ...probeJokers(jokers)];
  return type === 'group' ? isValidGroup(cards) : isValidSequence(cards);
};

/** Toutes les formes de combinaison possibles dans une sélection. */
const buildCandidates = (cards: Card[]): Candidate[] => {
  const candidates: Candidate[] = [];
  const jokerBudget = countJokers(cards);
  const normals = cards.filter(isNormalCard);

  const add = (cardsOfCandidate: Card[], type: 'group' | 'sequence') => {
    for (let jokers = 0; jokers <= jokerBudget; jokers++) {
      if (isValidCandidate(cardsOfCandidate, jokers, type)) {
        candidates.push({ normals: cardsOfCandidate, jokers, type });
      }
    }
  };

  // Groupes : n'importe quel sous-ensemble d'une même valeur, complété par des jokers.
  const byValue = new Map<CardValue, NormalCard[]>();
  normals.forEach(card => {
    if (!byValue.has(card.value)) byValue.set(card.value, []);
    byValue.get(card.value)!.push(card);
  });
  byValue.forEach(cardsOfValue => {
    for (let size = 1; size <= Math.min(4, cardsOfValue.length); size++) {
      for (const subset of getCombinations(cardsOfValue, size)) {
        add(subset, 'group');
      }
    }
  });

  // Suites : toute sous-plage consécutive d'une couleur, complétée par des jokers.
  const bySuit = new Map<CardSuit, NormalCard[]>();
  normals.forEach(card => {
    if (!bySuit.has(card.suit)) bySuit.set(card.suit, []);
    bySuit.get(card.suit)!.push(card);
  });
  bySuit.forEach(cardsOfSuit => {
    const sorted = [...cardsOfSuit].sort((a, b) => getCardValueNumber(a.value) - getCardValueNumber(b.value));
    for (let start = 0; start < sorted.length; start++) {
      for (let end = start; end < sorted.length; end++) {
        add(sorted.slice(start, end + 1), 'sequence');
      }
    }
  });

  return candidates;
};

/**
 * Énumère paresseusement les façons de couvrir exactement les cartes restantes,
 * les plus grandes combinaisons d'abord.
 */
function* enumerateCovers(
  normals: Card[],
  jokers: number,
  candidates: Candidate[],
  startIndex = 0,
  deadEnds: Set<string> = new Set()
): Generator<Candidate[]> {
  if (normals.length === 0 && jokers === 0) {
    yield [];
    return;
  }

  // Les mêmes cartes restantes reviennent par des chemins différents ; mémoriser les
  // impasses évite de re-explorer une situation déjà connue comme sans issue.
  const key = `${startIndex}#${jokers}#${normals.map(c => c.id).sort().join('|')}`;
  if (deadEnds.has(key)) return;

  let found = false;
  for (let i = startIndex; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate.jokers > jokers) continue;
    if (!candidate.normals.every(card => normals.some(rc => rc.id === card.id))) continue;

    const rest = normals.filter(card => !candidate.normals.some(cc => cc.id === card.id));
    for (const tail of enumerateCovers(rest, jokers - candidate.jokers, candidates, i + 1, deadEnds)) {
      found = true;
      yield [candidate, ...tail];
    }
  }

  if (!found) deadEnds.add(key);
}

/**
 * Choisit `count` combinaisons disjointes parmi `candidates`. Le conflit est détecté
 * dès qu'une combinaison est ajoutée, au lieu d'énumérer toutes les sélections
 * possibles avant de les filtrer.
 */
function* chooseDisjoint(
  candidates: Candidate[],
  count: number,
  usedNormalIds: ReadonlySet<string>,
  jokerBudget: number,
  startIndex = 0
): Generator<Candidate[]> {
  if (count === 0) {
    yield [];
    return;
  }

  for (let i = startIndex; i <= candidates.length - count; i++) {
    const candidate = candidates[i];
    if (candidate.jokers > jokerBudget) continue;
    if (candidate.normals.some(card => usedNormalIds.has(card.id))) continue;

    const used = new Set(usedNormalIds);
    candidate.normals.forEach(card => used.add(card.id));

    for (const rest of chooseDisjoint(candidates, count - 1, used, jokerBudget - candidate.jokers, i + 1)) {
      yield [candidate, ...rest];
    }
  }
}

const byDescendingSize = (candidates: Candidate[]): Candidate[] =>
  [...candidates].sort((a, b) => candidateSize(b) - candidateSize(a));

/** Distribue les vrais jokers de la main dans une disposition candidate. */
const materialize = (cover: Candidate[], jokerPool: Card[]): UsedCombinations => {
  let next = 0;
  return cover.map(candidate => ({
    cards: [...candidate.normals, ...jokerPool.slice(next, next += candidate.jokers)],
    type: candidate.type
  }));
};

/**
 * La première disposition qui couvre toutes les cartes *et* que le moteur de règles
 * crédite. Renvoyer la disposition validée — et non une disposition « au mieux »
 * recalculée après coup — garantit que ce qu'on pose est bien ce qui accomplit la
 * mission.
 */
const findCreditedLayout = (
  cards: Card[],
  candidates: Candidate[],
  requirements: MissionRequirements
): UsedCombinations | null => {
  const jokerPool = cards.filter(isJokerCard);
  const normals = cards.filter(isNormalCard);

  for (const cover of enumerateCovers(normals, jokerPool.length, byDescendingSize(candidates))) {
    const layout = materialize(cover, jokerPool);
    if (satisfiesMission(layout, requirements)) return layout;
  }
  return null;
};


/**
 * Vue « cartes réelles » des combinaisons possibles, pour les appelants qui veulent
 * simplement lister des groupes et des suites (IA, fin de manche).
 */
export const findAllValidCombinations = (cards: Card[]): {
  groups: Card[][],
  sequences: Card[][]
} => {
  const jokerPool = cards.filter(isJokerCard);
  const groups: Card[][] = [];
  const sequences: Card[][] = [];

  for (const candidate of buildCandidates(cards)) {
    const materialized = [...candidate.normals, ...jokerPool.slice(0, candidate.jokers)];
    (candidate.type === 'group' ? groups : sequences).push(materialized);
  }

  return { groups, sequences };
};

export type UsedCombinations = {cards: Card[], type: 'group' | 'sequence'}[]

// New function to validate mission from free selection of cards
export const validateMissionFromSelection = (
  selectedCards: Card[], 
  requirements: MissionRequirements,
  missionCompleted: boolean = false,
  existingCombinations: Combination[] = []
): {
  isValid: boolean,
  usedCombinations: UsedCombinations
} => {
  if (selectedCards.length === 0) {
    return { isValid: false, usedCombinations: [] };
  }

  // If mission is already completed, use post-mission validation rules
  if (missionCompleted) {
    return validatePostMissionCards(selectedCards);
  }

  // Handle special requirements that don't need traditional combinations
  if (requirements.specificRequirements) {
    switch (requirements.specificRequirements) {
      case 'seven_odd_cards': {
        // Mission 20: Seven odd cards (A, 3, 5, 7, 9, J, K)
        const oddValues = ['A', '3', '5', '7', '9', 'J', 'K'];
        const normalCards = selectedCards.filter(isNormalCard);
        const jokerCards = selectedCards.filter(isJokerCard);

        // Count how many odd cards we have (including jokers as substitutes)
        const oddCardCount = normalCards.filter(card => oddValues.includes(card.value)).length;
        const totalValidCards = oddCardCount + jokerCards.length;

        // Need at least 7 odd cards, but can have additional valid combinations
        if (totalValidCards >= 7) {
          const layout = findCreditedLayout(selectedCards, buildCandidates(selectedCards), requirements);
          if (layout) {
            return { isValid: true, usedCombinations: layout };
          }
        }
        return { isValid: false, usedCombinations: [] };
      }

      case '7_same_suit': {
        // Mission 7: 7 cards of the same suit (free arrangement, jokers as wildcards)
        if (selectedCards.length !== 7) return { isValid: false, usedCombinations: [] };
        const normalCards = selectedCards.filter(isNormalCard);
        if (normalCards.length === 0) return { isValid: false, usedCombinations: [] };
        const targetSuit = normalCards[0].suit;
        if (!normalCards.every(c => c.suit === targetSuit)) {
          return { isValid: false, usedCombinations: [] };
        }
        return asMissionLayout([{ cards: selectedCards, type: 'group' }], requirements);
      }

      case 'sequence_A_to_9': {
        // Mission 19: Sequence A-2-3-4-5-6-7-8-9, suits free
        if (selectedCards.length !== 9) return { isValid: false, usedCombinations: [] };
        const targetValues: CardValue[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9'];
        const normalCards = selectedCards.filter(isNormalCard);
        const jokers = selectedCards.filter(isJokerCard);
        const valueCount = new Map<CardValue, number>();
        for (const card of normalCards) {
          if (!targetValues.includes(card.value)) {
            return { isValid: false, usedCombinations: [] };
          }
          valueCount.set(card.value, (valueCount.get(card.value) ?? 0) + 1);
        }
        let missing = 0;
        for (const v of targetValues) {
          const cnt = valueCount.get(v) ?? 0;
          if (cnt > 1) return { isValid: false, usedCombinations: [] };
          if (cnt === 0) missing++;
        }
        if (missing !== jokers.length) return { isValid: false, usedCombinations: [] };
        return asMissionLayout([{ cards: selectedCards, type: 'sequence' }], requirements);
      }

      case 'red_even_sequence_6': {
        // Mission 30: 6 red cards with values 2, 4, 6, 8, 10, Q
        if (selectedCards.length !== 6) return { isValid: false, usedCombinations: [] };
        const targetValues: CardValue[] = ['2', '4', '6', '8', '10', 'Q'];
        const normalCards = selectedCards.filter(isNormalCard);
        const jokers = selectedCards.filter(isJokerCard);
        const valueCount = new Map<CardValue, number>();
        for (const card of normalCards) {
          if (!targetValues.includes(card.value)) {
            return { isValid: false, usedCombinations: [] };
          }
          if (card.suit !== 'hearts' && card.suit !== 'diamonds') {
            return { isValid: false, usedCombinations: [] };
          }
          valueCount.set(card.value, (valueCount.get(card.value) ?? 0) + 1);
        }
        let missing = 0;
        for (const v of targetValues) {
          const cnt = valueCount.get(v) ?? 0;
          if (cnt > 1) return { isValid: false, usedCombinations: [] };
          if (cnt === 0) missing++;
        }
        if (missing !== jokers.length) return { isValid: false, usedCombinations: [] };
        return asMissionLayout([{ cards: selectedCards, type: 'sequence' }], requirements);
      }

      case 'sequence_8_max_2_suits': {
        // Mission 16: A sequence of 8 consecutive values using at most 2 suits.
        // The 8 values must be consecutive; each value appears at most once;
        // jokers fill missing values within the run.
        if (selectedCards.length !== 8) return { isValid: false, usedCombinations: [] };
        const normalCards = selectedCards.filter(isNormalCard);
        const jokers = selectedCards.filter(isJokerCard);
        const suits = new Set(normalCards.map(c => c.suit));
        if (suits.size > 2) return { isValid: false, usedCombinations: [] };
        const valueNumbers = normalCards.map(c => getCardValueNumber(c.value));
        if (new Set(valueNumbers).size !== valueNumbers.length) {
          return { isValid: false, usedCombinations: [] };
        }
        if (valueNumbers.length === 0) {
          // 8 jokers — trivially valid
          return asMissionLayout([{ cards: selectedCards, type: 'sequence' }], requirements);
        }
        const minVal = Math.min(...valueNumbers);
        const maxVal = Math.max(...valueNumbers);
        // The run must fit within 8 consecutive slots and start no earlier than 1 (A) and end no later than 13 (K)
        const span = maxVal - minVal + 1;
        if (span > 8) return { isValid: false, usedCombinations: [] };
        // Internal gaps must be fillable by jokers; remaining jokers extend at either end
        const gapsInside = span - valueNumbers.length;
        const extension = 8 - span;
        const jokersNeeded = gapsInside;
        if (jokers.length < jokersNeeded) return { isValid: false, usedCombinations: [] };
        const jokersForExtension = jokers.length - jokersNeeded;
        if (jokersForExtension !== extension) {
          return { isValid: false, usedCombinations: [] };
        }
        // Ensure the extension fits within A..K bounds for at least one placement
        const earliestStart = Math.max(1, minVal - jokersForExtension);
        const latestStart = Math.min(minVal, 13 - 8 + 1);
        if (earliestStart > latestStart) {
          return { isValid: false, usedCombinations: [] };
        }
        return asMissionLayout([{ cards: selectedCards, type: 'sequence' }], requirements);
      }

      case 'same_suit': {
        // For missions requiring all cards to be same suit - but allow additional combinations
        const { sequences: requiredSequences = 0, minSequenceLength = 3 } = requirements;

        if (requiredSequences === 1) {
          // Find all possible combinations
          const { groups, sequences } = findAllValidCombinations(selectedCards);

          // Check if we can find at least one sequence of required length with same suit
          // plus additional valid combinations for remaining cards
          const validSameSuitSequences = sequences.filter(seq => {
            const normalCards = seq.filter(isNormalCard);
            return normalCards.length > 0 &&
                   normalCards.every(card => card.suit === normalCards[0].suit) &&
                   seq.length >= minSequenceLength;
          });

          if (validSameSuitSequences.length > 0) {
            const layout = findCreditedLayout(selectedCards, buildCandidates(selectedCards), requirements);
            if (layout) {
              return { isValid: true, usedCombinations: layout };
            }
          }
        }

        return { isValid: false, usedCombinations: [] };
      }

      // Add other special cases here as needed
    }
  }

  const { groups: requiredGroups = 0, sequences: requiredSequences = 0, minSequenceLength = 3 } = requirements;

  if (requiredGroups === 0 && requiredSequences === 0) {
    return { isValid: false, usedCombinations: [] };
  }

  const candidates = buildCandidates(selectedCards);

  // La mission peut être accompagnée de combinaisons supplémentaires : on parcourt
  // les dispositions possibles et on retient la première que le moteur de règles
  // crédite, de façon à poser exactement ce qui accomplit la mission.
  for (const layout of missionLayouts(selectedCards, candidates, requiredGroups, requiredSequences, minSequenceLength)) {
    if (satisfiesMission(layout, requirements)) {
      return { isValid: true, usedCombinations: layout };
    }
  }

  return { isValid: false, usedCombinations: [] };
};

// Post-mission validation: Only allows new groups and extensions of existing combinations
// No new sequences can be created after mission completion
const validatePostMissionCards = (
  selectedCards: Card[]
): {
  isValid: boolean,
  usedCombinations: UsedCombinations
} => {
  if (selectedCards.length === 0) {
    return { isValid: false, usedCombinations: [] };
  }

  // Only new groups are allowed here; extensions of existing combinations are
  // handled separately in the game logic.
  const result = canFormValidGroupsOnly(selectedCards);

  if (result.isValid) {
    return {
      isValid: true,
      usedCombinations: result.combinations
    };
  }

  return { isValid: false, usedCombinations: [] };
};

// Helper function to check if cards can form valid groups only (no new sequences)
const canFormValidGroupsOnly = (
  cards: Card[]
): {
  isValid: boolean,
  combinations: UsedCombinations
} => {
  const jokerPool = cards.filter(isJokerCard);
  const normals = cards.filter(isNormalCard);
  const groupCandidates = buildCandidates(cards).filter(c => c.type === 'group');

  // Les plus grands groupes d'abord : la première couverture trouvée est celle qui
  // utilise le moins de combinaisons.
  for (const cover of enumerateCovers(normals, jokerPool.length, byDescendingSize(groupCandidates))) {
    return { isValid: true, combinations: materialize(cover, jokerPool) };
  }

  return { isValid: false, combinations: [] };
};

/**
 * Les dispositions candidates d'une sélection : les combinaisons exigées par la
 * mission, plus une couverture des cartes restantes par des combinaisons valides.
 *
 * Générateur paresseux : l'appelant s'arrête à la première disposition créditée,
 * au lieu d'énumérer toutes les dispositions avant d'en choisir une.
 */
function* missionLayouts(
  cards: Card[],
  candidates: Candidate[],
  requiredGroups: number,
  requiredSequences: number,
  minSequenceLength: number
): Generator<UsedCombinations> {
  const jokerPool = cards.filter(isJokerCard);
  const normals = cards.filter(isNormalCard);
  const groups = candidates.filter(c => c.type === 'group');
  // Une suite trop courte ne peut pas remplir la mission, mais peut accompagner
  // la pose comme combinaison supplémentaire.
  const sequences = candidates.filter(
    c => c.type === 'sequence' && candidateSize(c) >= minSequenceLength
  );
  const deadEnds = new Set<string>();

  for (const chosenGroups of chooseDisjoint(groups, requiredGroups, new Set(), jokerPool.length)) {
    const usedByGroups = new Set(chosenGroups.flatMap(combo => combo.normals.map(card => card.id)));
    const jokersAfterGroups = jokerPool.length - chosenGroups.reduce((n, combo) => n + combo.jokers, 0);

    for (const chosenSequences of chooseDisjoint(sequences, requiredSequences, usedByGroups, jokersAfterGroups)) {
      const missionCombos = [...chosenGroups, ...chosenSequences];
      const usedNormals = new Set(missionCombos.flatMap(combo => combo.normals.map(card => card.id)));
      const jokersLeft = jokerPool.length - missionCombos.reduce((n, combo) => n + combo.jokers, 0);
      const remaining = normals.filter(card => !usedNormals.has(card.id));

      if (remaining.length === 0 && jokersLeft === 0) {
        yield materialize(missionCombos, jokerPool);
        continue;
      }

      // Les cartes restantes doivent elles aussi former des combinaisons valides.
      const extras = candidates.filter(combo =>
        combo.normals.every(card => !usedNormals.has(card.id))
      );
      for (const cover of enumerateCovers(remaining, jokersLeft, byDescendingSize(extras), 0, deadEnds)) {
        yield materialize([...missionCombos, ...cover], jokerPool);
      }
    }
  }
}