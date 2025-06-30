import {Card, CardSuit, CardValue, JokerCard, NormalCard, MissionRequirements, Combination} from '../types/game';

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

export const getCardValueNumber = (value: CardValue): number => {
  if (value === 'A') return 1;
  if (value === 'J') return 11;
  if (value === 'Q') return 12;
  if (value === 'K') return 13;
  return parseInt(value);
};

// IsJoker type guard
export const isJokerCard = (card: Card): card is JokerCard => {
  return 'isJoker' in card && card.isJoker;
}
export const isNormalCard = (card: Card): card is NormalCard => {
  return !('isJoker' in card);
}

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
        // Check specific requirements
        if (checkSpecificRequirements(groups, sequences, requirements)) {
          const combinations = [
            ...groups.map(cards => ({ cards, type: 'group' as const })),
            ...sequences.map(cards => ({ cards, type: 'sequence' as const }))
          ];
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

// Check specific mission requirements
const checkSpecificRequirements = (groups: Card[][], sequences: Card[][], requirements: MissionRequirements): boolean => {
  const { specificRequirements } = requirements;

  if (!specificRequirements) return true;

  // Add specific requirement checks as needed
  switch (specificRequirements) {
    case 'same_suit':
      // All cards should be of the same suit
      return sequences.every(seq => {
        const normalCards = seq.filter(isNormalCard);
        return normalCards.length > 0 && normalCards.every(card => card.suit === normalCards[0].suit);
      });

    case 'groups_of_4':
      // All groups should have exactly 4 cards
      return groups.every(group => group.length === 4);

    case 'group_4_sequence_4':
      // One group of 4 and one sequence of 4
      return groups.some(group => group.length === 4) && sequences.some(seq => seq.length === 4);

    case 'seven_odd_cards':
      // Seven odd cards (A, 3, 5, 7, 9, J, K) - handled in validateMissionFromSelection
      return true;

    default:
      return true;
  }
};

// Check advanced mission requirements for exact validation
const checkAdvancedRequirements = (groups: Card[][], sequences: Card[][], requirements: MissionRequirements): boolean => {
  const { specificRequirements } = requirements;

  if (!specificRequirements) return true;

  switch (specificRequirements) {
    case 'same_suit':
      // All sequences should be of the same suit
      return sequences.every(seq => {
        const normalCards = seq.filter(isNormalCard);
        return normalCards.length > 0 && normalCards.every(card => card.suit === normalCards[0].suit);
      });

    case 'groups_of_4':
      // All groups should have exactly 4 cards
      return groups.every(group => group.length === 4);

    case 'group_4_sequence_4':
      // One group of 4 and one sequence of 4
      return groups.some(group => group.length === 4) && sequences.some(seq => seq.length === 4);

    case 'seven_odd_cards':
      // Seven odd cards (A, 3, 5, 7, 9, J, K) - handled séparément
      return true;

    case 'different_suits': {
      // For missions requiring different suits between sequences
      if (sequences.length >= 2) {
        const suits = sequences.map(seq => {
          const normalCards = seq.filter(isNormalCard);
          return normalCards.length > 0 ? normalCards[0].suit : null;
        }).filter(suit => suit !== null);

        return new Set(suits).size === suits.length; // All different suits
      }
      return true;
    }

    case 'spades_and_clubs_sequences': {
      // For missions with specific suit requirements (like spades and clubs)
      if (sequences.length >= 2) {
        const suits = sequences.map(seq => {
          const normalCards = seq.filter(isNormalCard);
          return normalCards.length > 0 ? normalCards[0].suit : null;
        });

        // Check if we have the required suits
        return suits.includes('spades') && suits.includes('clubs');
      }
      return false;
    }

    case 'hearts_7_8_9_10': {
      // All cards should be hearts with specific values
      const allCards = [...groups.flat(), ...sequences.flat()];
      return allCards.every(card =>
        isJokerCard(card) || card.suit === 'hearts'
      );
    }

    case 'red_sequence_5': {
      // All cards should be red (hearts or diamonds)
      const allCards = [...groups.flat(), ...sequences.flat()];
      return allCards.every(card =>
        isJokerCard(card) || card.suit === 'hearts' || card.suit === 'diamonds'
      );
    }

    case 'one_red_group_one_black_group': {
      // One group should be all red, one group should be all black
      if (groups.length >= 2) {
        const hasRedGroup = groups.some(group => {
          const normalCards = group.filter(isNormalCard);
          return normalCards.every(card => card.suit === 'hearts' || card.suit === 'diamonds');
        });

        const hasBlackGroup = groups.some(group => {
          const normalCards = group.filter(isNormalCard);
          return normalCards.every(card => card.suit === 'clubs' || card.suit === 'spades');
        });

        return hasRedGroup && hasBlackGroup;
      }
      return false;
    }

    case 'red_even_sequence_6': {
      // All cards should have even values (2, 4, 6, 8, 10, Q) and be red
      const evenValues = ['2', '4', '6', '8', '10', 'Q'];
      const allCards = [...groups.flat(), ...sequences.flat()];
      return allCards.every(card =>
        isJokerCard(card) ||
        (evenValues.includes(card.value) && (card.suit === 'hearts' || card.suit === 'diamonds'))
      );
    }

    default:
      return true;
  }
};

// New function to find all valid combinations in a set of selected cards
export const findAllValidCombinations = (cards: Card[]): {
  groups: Card[][],
  sequences: Card[][]
} => {
  const groups: Card[][] = [];
  const sequences: Card[][] = [];

  // Find all possible sequences
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

  // Find all possible groups
  const cardsByValue = new Map<string, Card[]>();

  // Group normal cards by value
  cards.filter(isNormalCard).forEach(card => {
    const value = card.value;
    if (!cardsByValue.has(value)) {
      cardsByValue.set(value, []);
    }
    cardsByValue.get(value)!.push(card);
  });

  // Generate groups (3 or 4 cards of same value)
  // For each value, create groups with different joker combinations
  cardsByValue.forEach((cardsOfValue) => {
    // Create groups with just the normal cards (if enough)
    if (cardsOfValue.length >= 3) {
      groups.push([...cardsOfValue]); // Group with all cards of this value
      if (cardsOfValue.length === 4) {
        // Also add group of 3 (any 3 of the 4 cards)
        for (let i = 0; i < cardsOfValue.length; i++) {
          const group3 = cardsOfValue.filter((_, idx) => idx !== i);
          groups.push(group3);
        }
      }
    }

    // Create groups with jokers
    for (let jokersUsed = 1; jokersUsed <= jokers.length; jokersUsed++) {
      const totalCards = cardsOfValue.length + jokersUsed;
      if (totalCards >= 3 && totalCards <= 4) {
        // Generate all combinations of jokers for this group
        const jokerCombinations = getCombinations(jokers, jokersUsed);
        for (const jokerCombo of jokerCombinations) {
          const group = [...cardsOfValue, ...jokerCombo];
          if (group.length >= 3 && group.length <= 4 && isValidGroup(group)) {
            groups.push(group);
          }
        }
      }
    }
  });

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
  console.log('🔍 validateMissionFromSelection called with:', {
    cardCount: selectedCards.length,
    requirements,
    missionCompleted,
    existingCombinationsCount: existingCombinations.length
  });

  if (selectedCards.length === 0) {
    console.log('❌ Early return: no cards');
    return { isValid: false, usedCombinations: [] };
  }

  // If mission is already completed, use post-mission validation rules
  if (missionCompleted) {
    return validatePostMissionCards(selectedCards);
  }

  // Handle special requirements that don't need traditional combinations
  if (requirements.specificRequirements) {
    console.log('🎯 Handling special requirements:', requirements.specificRequirements);
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
          // Try to find the best combination that includes at least 7 odd cards
          const { groups, sequences } = findAllValidCombinations(selectedCards);
          const allCombinations = [...groups, ...sequences];

          // Find a combination that uses all cards and includes at least 7 odd cards
          if (canFormValidCombinationsUsingAllCards(selectedCards, allCombinations)) {
            console.log('✅ Special requirement satisfied with additional combinations');
            return {
              isValid: true,
              usedCombinations: getBestCombinationLayout(selectedCards, allCombinations)
            };
          }
        }
        console.log('❌ Special requirement not satisfied');
        return { isValid: false, usedCombinations: [] };
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
            const allCombinations = [...groups, ...sequences];
            if (canFormValidCombinationsUsingAllCards(selectedCards, allCombinations)) {
              return {
                isValid: true,
                usedCombinations: getBestCombinationLayout(selectedCards, allCombinations)
              };
            }
          }
        }

        return { isValid: false, usedCombinations: [] };
      }

      // Add other special cases here as needed
    }
  }

  console.log('🔄 Finding all valid combinations...');
  // Find all possible combinations in the selected cards
  const { groups, sequences } = findAllValidCombinations(selectedCards);
  console.log('📊 Found combinations:', { groupCount: groups.length, sequenceCount: sequences.length });

  const { groups: requiredGroups = 0, sequences: requiredSequences = 0, minSequenceLength = 3 } = requirements;

  // For missions with exact requirements, we need to find combinations that satisfy
  // the MINIMUM mission requirements and allow additional valid combinations

  if (requiredGroups === 0 && requiredSequences === 0) {
    return { isValid: false, usedCombinations: [] };
  }

  // Filter sequences by minimum length requirement
  const validSequences = sequences.filter(seq => seq.length >= minSequenceLength);

  console.log('🎯 Trying to find valid combination that meets minimum requirements:', {
    requiredGroups,
    requiredSequences,
    availableGroups: groups.length,
    availableSequences: validSequences.length
  });

  // Try to find combinations that meet minimum requirements AND use all cards
  const allPossibleCombinations = [...groups, ...validSequences];

  // Check if we can satisfy mission requirements with additional combinations allowed
  if (canSatisfyMissionWithAdditionalCombinations(
    selectedCards,
    allPossibleCombinations,
    requiredGroups,
    requiredSequences,
    requirements
  )) {
    const bestLayout = getBestCombinationLayout(selectedCards, allPossibleCombinations);
    console.log('✅ Valid combination found that meets mission requirements!');
    return { isValid: true, usedCombinations: bestLayout };
  }

  console.log('❌ No valid combination found that meets mission requirements');
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
  console.log('🔒 Post-mission validation: No new sequences allowed');

  if (selectedCards.length === 0) {
    return { isValid: false, usedCombinations: [] };
  }

  // Find all possible groups (new groups are allowed)
  const { groups } = findAllValidCombinations(selectedCards);

  // Check if all cards can be used in valid groups only
  // (Extensions of existing combinations would be handled separately in the game logic)
  const result = canFormValidGroupsOnly(selectedCards, groups);

  if (result.isValid) {
    console.log('✅ Post-mission validation passed: All cards form valid groups');
    return {
      isValid: true,
      usedCombinations: result.combinations
    };
  }

  console.log('❌ Post-mission validation failed: Cards cannot form valid groups');
  return { isValid: false, usedCombinations: [] };
};

// Helper function to check if cards can form valid groups only (no new sequences)
const canFormValidGroupsOnly = (
  cards: Card[],
  possibleGroups: Card[][]
): {
  isValid: boolean,
  combinations: UsedCombinations
} => {
  // Try to find a combination of groups that uses all cards
  const bestSets = findBestCombinationSet(cards, possibleGroups);

  if (bestSets.length > 0) {
    // Choose the set with the least number of combinations (most efficient)
    const bestSet = bestSets.reduce((best, current) =>
      current.length < best.length ? current : best
    );

    const combinations = bestSet.map(combination => ({
      cards: combination,
      type: 'group' as const
    }));

    return { isValid: true, combinations };
  }

  return { isValid: false, combinations: [] };
};

// Helper function to check if we can form valid combinations using all cards
const canFormValidCombinationsUsingAllCards = (cards: Card[], allCombinations: Card[][]): boolean => {
  // Try to find a set of non-overlapping combinations that use all cards
  return findBestCombinationSet(cards, allCombinations).length > 0;
};

// Helper function to check if mission requirements can be satisfied with additional combinations
const canSatisfyMissionWithAdditionalCombinations = (
  cards: Card[],
  allCombinations: Card[][],
  requiredGroups: number,
  requiredSequences: number,
  requirements: MissionRequirements
): boolean => {
  const groups = allCombinations.filter(combo => isValidGroup(combo));
  const sequences = allCombinations.filter(combo => isValidSequence(combo));

  // Filter sequences by minimum length if specified
  const { minSequenceLength = 3 } = requirements;
  const validSequences = sequences.filter(seq => seq.length >= minSequenceLength);

  // Try to find a combination that satisfies mission requirements
  const groupCombinations = getCombinations(groups, requiredGroups);
  const sequenceCombinations = getCombinations(validSequences, requiredSequences);

  for (const selectedGroups of groupCombinations) {
    for (const selectedSequences of sequenceCombinations) {
      const missionCards = new Set<string>();
      let validMissionCombination = true;

      // Check mission combinations don't overlap
      for (const group of selectedGroups) {
        for (const card of group) {
          if (missionCards.has(card.id)) {
            validMissionCombination = false;
            break;
          }
          missionCards.add(card.id);
        }
        if (!validMissionCombination) break;
      }

      if (validMissionCombination) {
        for (const sequence of selectedSequences) {
          for (const card of sequence) {
            if (missionCards.has(card.id)) {
              validMissionCombination = false;
              break;
            }
            missionCards.add(card.id);
          }
          if (!validMissionCombination) break;
        }
      }

      if (validMissionCombination) {
        // Check if mission requirements are satisfied
        if (checkAdvancedRequirements(selectedGroups, selectedSequences, requirements)) {
          // Now check if remaining cards can form valid combinations
          const remainingCards = cards.filter(card => !missionCards.has(card.id));

          if (remainingCards.length === 0) {
            // All cards used in mission - valid!
            return true;
          }

          // Check if remaining cards can form valid additional combinations
          const remainingCombinations = allCombinations.filter(combo =>
            combo.every(card => !missionCards.has(card.id))
          );

          if (canFormValidCombinationsUsingAllCards(remainingCards, remainingCombinations)) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

// Find the best combination set that uses all cards
const findBestCombinationSet = (cards: Card[], allCombinations: Card[][]): Card[][][] => {
  const validSets: Card[][][] = [];

  // Sort combinations by size (prefer larger combinations)
  const sortedCombinations = allCombinations.sort((a, b) => b.length - a.length);

  function findSets(remainingCards: Card[], currentSet: Card[][], startIndex: number): void {
    if (remainingCards.length === 0) {
      validSets.push([...currentSet]);
      return;
    }

    for (let i = startIndex; i < sortedCombinations.length; i++) {
      const combination = sortedCombinations[i];

      // Check if this combination uses only remaining cards
      if (combination.every(card => remainingCards.some(rc => rc.id === card.id))) {
        const newRemainingCards = remainingCards.filter(card =>
          !combination.some(cc => cc.id === card.id)
        );

        currentSet.push(combination);
        findSets(newRemainingCards, currentSet, i + 1);
        currentSet.pop();
      }
    }
  }

  findSets(cards, [], 0);
  return validSets;
};

// Get the best combination layout for display
const getBestCombinationLayout = (cards: Card[], allCombinations: Card[][]): UsedCombinations => {
  const bestSets = findBestCombinationSet(cards, allCombinations);

  if (bestSets.length === 0) {
    // Fallback: return individual cards as single-card "groups"
    return cards.map(card => ({ cards: [card], type: 'group' as const }));
  }

  // Choose the set with the least number of combinations (most efficient)
  const bestSet = bestSets.reduce((best, current) =>
    current.length < best.length ? current : best
  );

  // Convert to UsedCombinations format
  return bestSet.map(combination => ({
    cards: combination,
    type: isValidSequence(combination) ? 'sequence' as const : 'group' as const
  }));
};
