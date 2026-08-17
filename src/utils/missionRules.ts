import { CardValue, Combination, MissionRequirements, NormalCard } from '../types/game';
import { CARD_SUITS, CARD_VALUES, countJokers, getCardValueNumber, getValueFromNumber, normalCards, valuesMissingFrom } from './cards';

/**
 * L'unique moteur de règles des missions.
 *
 * Une combinaison posée est décrite par ses cartes et son type ; un joker y
 * remplace n'importe quelle carte. Toutes les règles comptent donc les jokers
 * comme des cartes valides — les compter comme absents faisait qu'une mission
 * réussie avec un joker n'était jamais validée.
 *
 * Un joker ne remplace qu'*une* carte, et seulement dans la combinaison où il est
 * posé : chaque règle compte donc les jokers de la combinaison qu'elle examine,
 * jamais ceux de toute la table.
 *
 * `validateMissionFromSelection` (pose) et `isMissionCompleted` (validation)
 * passent tous deux par ici : il ne peut plus y avoir de désaccord entre les
 * cartes qu'on accepte de poser et les missions qu'on crédite.
 */

const isRedCard = (card: NormalCard) => card.suit === 'hearts' || card.suit === 'diamonds';
const isBlackCard = (card: NormalCard) => card.suit === 'spades' || card.suit === 'clubs';

const ODD_VALUES: CardValue[] = ['A', '3', '5', '7', '9', 'J', 'K'];
const EVEN_VALUES: CardValue[] = ['2', '4', '6', '8', '10', 'Q'];
const A_TO_9: CardValue[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9'];
const HEARTS_RUN: CardValue[] = ['7', '8', '9', '10'];

/** Une combinaison dont toutes les cartes réelles partagent la même couleur. */
const isSingleSuit = (combination: Combination): boolean => {
  const normals = normalCards(combination.cards);
  return normals.length > 0 && normals.every(c => c.suit === normals[0].suit);
};

const suitsOf = (combination: Combination): Set<string> =>
  new Set(normalCards(combination.cards).map(c => c.suit));

/**
 * Les valeurs réellement représentées par une combinaison, jokers résolus.
 *
 * Dans un groupe, un joker ne peut valoir que la valeur du groupe. Dans une suite,
 * il bouche un trou interne, dont la valeur est déterminée ; ceux qui prolongent la
 * suite à une extrémité restent ambigus et ne comptent donc pour aucune valeur.
 */
const resolvedValues = (combination: Combination): CardValue[] => {
  const normals = normalCards(combination.cards);
  const values = normals.map(c => c.value);
  const jokers = countJokers(combination.cards);

  if (jokers === 0 || normals.length === 0) return values;

  if (combination.type === 'group') {
    return [...values, ...Array<CardValue>(jokers).fill(values[0])];
  }

  const numbers = normals.map(c => getCardValueNumber(c.value));
  const lowest = Math.min(...numbers);
  const highest = Math.max(...numbers);
  const gaps: CardValue[] = [];
  for (let n = lowest + 1; n < highest; n++) {
    if (!numbers.includes(n)) gaps.push(getValueFromNumber(n));
  }
  return [...values, ...gaps];
};

/** Deux combinaisons distinctes satisfaisant chacune un prédicat. */
const hasDistinctPair = (
  combinations: Combination[],
  first: (c: Combination) => boolean,
  second: (c: Combination) => boolean
): boolean =>
  combinations.some((a, i) => first(a) && combinations.some((b, k) => k !== i && second(b)));

export const combinationsSatisfyRequirements = (
  combinations: Combination[],
  requirements: MissionRequirements,
  completedMissions: number[] = []
): boolean => {
  const groups = combinations.filter(c => c.type === 'group');
  const sequences = combinations.filter(c => c.type === 'sequence');

  /** Les compteurs génériques : nombre de groupes, de suites, longueur minimale. */
  const meetsCounts = (): boolean => {
    const enoughGroups = !requirements.groups || groups.length >= requirements.groups;
    const enoughSequences = !requirements.sequences || sequences.length >= requirements.sequences;
    // Les missions « deux suites de 4 », « trois suites de 4 », « deux suites de 6 »
    // demandent que *toutes* les suites exigées atteignent la longueur, pas une seule.
    const minLength = requirements.minSequenceLength;
    const longEnough = !minLength ||
      sequences.filter(s => s.cards.length >= minLength).length >= (requirements.sequences ?? 1);
    return enoughGroups && enoughSequences && longEnough;
  };

  switch (requirements.specificRequirements) {
    case 'free_choice':
      // Mission 12 : la sélection de la mission à rejouer n'existe pas encore,
      // donc rien ne peut être présenté pour elle (voir validateMissionFromSelection).
      return completedMissions.length > 0;

    case '7_same_suit':
      // Les cartes réelles d'une couleur comptent où qu'elles soient posées, mais un
      // joker ne peut valoir cette couleur que si la combinaison où il est posé ne
      // montre aucune autre couleur — sinon un joker qui tient le rôle du 9♠ serait
      // compté comme un cœur en même temps.
      return CARD_SUITS.some(suit => {
        const total = combinations.reduce((count, combination) => {
          const normals = normalCards(combination.cards);
          const ofSuit = normals.filter(card => card.suit === suit).length;
          const usableJokers = normals.length > 0 && normals.every(card => card.suit === suit)
            ? countJokers(combination.cards)
            : 0;
          return count + ofSuit + usableJokers;
        }, 0);
        return total >= 7;
      });

    case 'group_4_sequence_4':
      return groups.some(g => g.cards.length === 4) &&
             sequences.some(s => s.cards.length >= 4);

    case 'groups_of_4':
      return groups.filter(g => g.cards.length === 4).length >= 2;

    case 'sequence_8_max_2_suits':
      return sequences.some(seq => seq.cards.length >= 8 && suitsOf(seq).size <= 2);

    case 'two_groups_3_one_group_4': {
      const of3 = groups.filter(g => g.cards.length === 3).length;
      const of4 = groups.filter(g => g.cards.length === 4).length;
      return of3 >= 2 && of4 >= 1;
    }

    case 'three_groups_of_4':
      return groups.filter(g => g.cards.length === 4).length >= 3;

    case 'sequence_A_to_9':
      return combinations.some(c =>
        c.cards.length >= 9 &&
        valuesMissingFrom(normalCards(c.cards), A_TO_9) <= countJokers(c.cards)
      );

    case 'seven_odd_cards':
      // Un joker compte comme impair seulement s'il remplace une carte impaire.
      return combinations
        .flatMap(resolvedValues)
        .filter(value => ODD_VALUES.includes(value))
        .length >= 7;

    case 'red_even_sequence_6':
      return combinations.some(c => {
        const normals = normalCards(c.cards);
        return c.cards.length >= 6 &&
               normals.every(isRedCard) &&
               valuesMissingFrom(normals, EVEN_VALUES) <= countJokers(c.cards);
      });

    case 'different_suits': {
      // Deux suites d'au moins 5 cartes sans aucune couleur commune. On cherche
      // n'importe quelle paire : se limiter aux deux premières suites posées
      // faisait échouer la mission dès qu'une suite d'une manche précédente
      // traînait sur la table.
      const longSequences = sequences.filter(s => s.cards.length >= 5 && normalCards(s.cards).length > 0);
      return longSequences.some((a, i) =>
        longSequences.some((b, k) => {
          if (k === i) return false;
          const suitsA = suitsOf(a);
          return [...suitsOf(b)].every(suit => !suitsA.has(suit));
        })
      );
    }

    case 'full_suit_A_to_K':
      // Une couleur compte treize valeurs : ni plus, ni moins.
      return sequences.some(seq => seq.cards.length === CARD_VALUES.length && isSingleSuit(seq));

    case 'hearts_7_8_9_10':
      return sequences.some(seq => {
        const normals = normalCards(seq.cards);
        if (!normals.every(c => c.suit === 'hearts')) return false;
        return seq.cards.length >= 4 &&
               valuesMissingFrom(normals, HEARTS_RUN) <= countJokers(seq.cards);
      });

    case 'spades_and_clubs_sequences': {
      const runOf = (suit: 'spades' | 'clubs') => (seq: Combination) => {
        const normals = normalCards(seq.cards);
        return seq.cards.length >= 4 &&
               normals.length > 0 &&
               normals.every(c => c.suit === suit);
      };
      return hasDistinctPair(sequences, runOf('spades'), runOf('clubs'));
    }

    case 'red_sequence_5':
      return sequences.some(seq => {
        const normals = normalCards(seq.cards);
        return seq.cards.length >= 5 && normals.length > 0 && normals.every(isRedCard);
      });

    case 'one_red_group_one_black_group': {
      const monochrome = (test: (c: NormalCard) => boolean) => (group: Combination) => {
        const normals = normalCards(group.cards);
        return group.cards.length >= 3 && normals.length > 0 && normals.every(test);
      };
      return hasDistinctPair(groups, monochrome(isRedCard), monochrome(isBlackCard));
    }

    case 'three_suits_no_diamonds':
      // ♠ ♣ ♥ — le ♦ est interdit. Seules trois couleurs restent possibles, donc
      // « trois couleurs distinctes, jokers compris » suffit à l'exprimer.
      return groups.some(group => {
        const normals = normalCards(group.cards);
        if (normals.some(c => c.suit === 'diamonds')) return false;
        // Au moins deux couleurs doivent être visibles : sinon un seul ♠ entouré de
        // jokers suffirait, alors que rien ne dit que ces jokers ne sont pas des ♦.
        return group.cards.length >= 3 &&
               suitsOf(group).size >= 2 &&
               suitsOf(group).size + countJokers(group.cards) >= 3;
      });

    case 'same_suit': {
      const minLength = requirements.minSequenceLength || 3;
      return meetsCounts() &&
             sequences.some(seq => seq.cards.length >= minLength && isSingleSuit(seq));
    }

    default:
      return meetsCounts();
  }
};
