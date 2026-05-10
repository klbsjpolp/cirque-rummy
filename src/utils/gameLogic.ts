import { Card, Combination, Mission, NormalCard, Player } from '../types/game';
import { isJokerCard, isNormalCard, isValidGroup, isValidSequence } from './cardUtils';

const isRedCard = (card: NormalCard) => card.suit === 'hearts' || card.suit === 'diamonds';
const isBlackCard = (card: NormalCard) => card.suit === 'spades' || card.suit === 'clubs';

export const isMissionCompleted = (
  player: Pick<Player, 'combinations' | 'completedMissions'>,
  mission: Mission
): boolean => {
  const { requirements } = mission;
  const { combinations } = player;

  const allCards = (): Card[] => combinations.flatMap(c => c.cards);
  const groups = (): Combination[] => combinations.filter(c => c.type === 'group');
  const sequences = (): Combination[] => combinations.filter(c => c.type === 'sequence');

  switch (requirements.specificRequirements) {
    case 'free_choice':
      return player.completedMissions.length > 0;

    case '7_same_suit': {
      const suitCounts = combinations.reduce((acc, combo) => {
        combo.cards.forEach(card => {
          if (isNormalCard(card)) {
            acc[card.suit] = (acc[card.suit] || 0) + 1;
          }
        });
        return acc;
      }, {} as Record<string, number>);
      return Object.values(suitCounts).some(count => count >= 7);
    }

    case 'group_4_sequence_4':
      return groups().some(g => g.cards.length === 4) &&
             sequences().some(s => s.cards.length >= 4);

    case 'groups_of_4':
      return groups().filter(g => g.cards.length === 4).length >= 2;

    case 'sequence_8_max_2_suits':
      return sequences().some(seq => {
        if (seq.cards.length < 8) return false;
        const suits = new Set(seq.cards.filter(isNormalCard).map(c => c.suit));
        return suits.size <= 2;
      });

    case 'two_groups_3_one_group_4': {
      const gs = groups();
      const of3 = gs.filter(g => g.cards.length === 3).length;
      const of4 = gs.filter(g => g.cards.length === 4).length;
      return of3 >= 2 && of4 >= 1;
    }

    case 'sequence_A_to_9': {
      const normals = allCards().filter(isNormalCard);
      const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9'];
      return values.every(v => normals.some(c => c.value === v)) && normals.length >= 9;
    }

    case 'seven_odd_cards': {
      const oddValues = ['A', '3', '5', '7', '9', 'J', 'K'];
      return allCards().filter(isNormalCard).filter(c => oddValues.includes(c.value)).length >= 7;
    }

    case 'different_suits': {
      const seqs = sequences().filter(s => s.cards.length >= 5);
      if (seqs.length < 2) return false;
      const suits1 = new Set(seqs[0].cards.filter(isNormalCard).map(c => c.suit));
      const suits2 = new Set(seqs[1].cards.filter(isNormalCard).map(c => c.suit));
      return [...suits1].every(s => !suits2.has(s));
    }

    case 'three_groups_of_4':
      return groups().filter(g => g.cards.length === 4).length >= 3;

    case 'full_suit_A_to_K':
      return sequences().some(seq => {
        if (seq.cards.length < 13) return false;
        const normals = seq.cards.filter(isNormalCard);
        return new Set(normals.map(c => c.suit)).size === 1;
      });

    case 'hearts_7_8_9_10': {
      const hearts = allCards().filter(isNormalCard).filter(c => c.suit === 'hearts');
      return ['7', '8', '9', '10'].every(v => hearts.some(c => c.value === v));
    }

    case 'spades_and_clubs_sequences': {
      const seqs = sequences().filter(s => s.cards.length >= 4);
      const hasSpades = seqs.some(s => s.cards.filter(isNormalCard).every(c => c.suit === 'spades'));
      const hasClubs = seqs.some(s => s.cards.filter(isNormalCard).every(c => c.suit === 'clubs'));
      return hasSpades && hasClubs;
    }

    case 'red_sequence_5':
      return sequences().some(seq => {
        if (seq.cards.length < 5) return false;
        const normals = seq.cards.filter(isNormalCard);
        return normals.length >= 5 && normals.every(isRedCard);
      });

    case 'one_red_group_one_black_group': {
      const gs = groups().filter(g => g.cards.length >= 3);
      const hasRed = gs.some(g => g.cards.filter(isNormalCard).every(isRedCard));
      const hasBlack = gs.some(g => g.cards.filter(isNormalCard).every(isBlackCard));
      return hasRed && hasBlack;
    }

    case 'three_suits_no_diamonds':
      return groups().some(g => {
        if (g.cards.length < 3) return false;
        const suits = new Set(g.cards.filter(isNormalCard).map(c => c.suit));
        return suits.has('spades') && suits.has('clubs') && suits.has('hearts') && !suits.has('diamonds');
      });

    case 'red_even_sequence_6': {
      const reds = allCards().filter(isNormalCard).filter(isRedCard);
      return ['2', '4', '6', '8', '10', 'Q'].every(v => reds.some(c => c.value === v));
    }

    case 'same_suit': {
      const minLen = requirements.minSequenceLength || 3;
      const hasGroups = !requirements.groups || groups().length >= requirements.groups;
      const hasSeqs = !requirements.sequences || sequences().length >= requirements.sequences;
      const hasMinLen = !requirements.minSequenceLength ||
        sequences().some(s => s.cards.length >= requirements.minSequenceLength!);
      const hasSameSuit = sequences().some(seq => {
        const normals = seq.cards.filter(isNormalCard);
        return normals.length >= minLen && normals.every(c => c.suit === normals[0].suit);
      });
      return hasGroups && hasSeqs && hasMinLen && hasSameSuit;
    }

    default: {
      const hasGroups = !requirements.groups || groups().length >= requirements.groups;
      const hasSeqs = !requirements.sequences || sequences().length >= requirements.sequences;
      const hasMinLen = !requirements.minSequenceLength ||
        sequences().some(s => s.cards.length >= requirements.minSequenceLength!);
      return hasGroups && hasSeqs && hasMinLen;
    }
  }
};

export const canAddToExistingCombination = (
  cardsToAdd: Card[],
  combination: Combination
): boolean => {
  const combined = [...combination.cards, ...cardsToAdd];
  if (combination.type === 'group') return isValidGroup(combined);
  if (combination.type === 'sequence') return isValidSequence(combined);
  return false;
};

export const pickRandomMissionId = (
  allMissions: Mission[],
  completedMissions: number[],
  rng: () => number = Math.random
): number => {
  const available = allMissions.filter(m => !completedMissions.includes(m.id));
  if (available.length === 0) return allMissions[0]?.id ?? 1;
  return available[Math.floor(rng() * available.length)].id;
};

// Re-export for callers who only need the joker check via this module
export { isJokerCard };
