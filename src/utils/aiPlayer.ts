import { Card, CardSuit, CardValue, GameState, Mission, NormalCard, Player } from '../types/game';
import { MISSIONS } from '../data/missions';
import {
  findLayableGroups,
  findMissionSelection,
  getCardValueNumber,
  isJokerCard,
  isNormalCard
} from './cardUtils';
import { canAddToExistingCombination } from './gameLogic';
import { isFreeChoice, replayableMissions } from './missionRules';

/**
 * L'adversaire automatique, réduit à ses décisions : où piocher, quoi poser, quoi
 * défausser.
 *
 * Elle ne touche pas à l'état — le réducteur applique ses choix par les mêmes actions
 * que le joueur humain, donc avec les mêmes règles (mission créditée, pioche
 * remélangée, fin de manche). Ses poses passent par le validateur de la pose humaine,
 * donc elle ne peut pas proposer ce que le jeu refuserait.
 */

/** Une extension décidée par l'IA : les cartes, la combinaison, son propriétaire. */
export type AIExtension = {
  cardIds: string[];
  combinationId: string;
  targetPlayerId: string;
};

/** Les missions que le joueur peut tenter ce tour-ci : la sienne, ou celles qu'il rejoue. */
const attemptableMissions = (player: Player): Mission[] => {
  const mission = MISSIONS.find(m => m.id === player.currentMission);
  if (!mission) return [];
  return isFreeChoice(mission.requirements)
    ? replayableMissions(MISSIONS, player.completedMissions)
    : [mission];
};

const missionSelectionFor = (player: Player, hand: Card[]): Card[] | null => {
  for (const mission of attemptableMissions(player)) {
    const selection = findMissionSelection(hand, mission.requirements);
    if (selection) return selection;
  }
  return null;
};

const currentPlayer = (state: GameState): Player | undefined =>
  state.players[state.currentPlayerIndex];

/** Les combinaisons que le joueur a le droit d'étendre : les siennes, et celles d'un adversaire en règle. */
const reachableCombinations = (state: GameState, player: Player) =>
  state.players
    .filter(other => other.id === player.id || other.missionCompletedThisRound)
    .flatMap(other => other.combinations.map(combination => ({ other, combination })));

/**
 * La carte visible de la défausse n'est prise que si elle sert : elle débloque la
 * mission, ou elle complète une combinaison déjà posée. Autrement l'IA pioche au
 * paquet, dont la carte est inconnue de l'adversaire.
 */
export const chooseAIDraw = (state: GameState): boolean => {
  const top = state.discardPile[state.discardPile.length - 1];
  const player = currentPlayer(state);
  if (!top || !player) return false;

  if (player.missionCompletedThisRound) {
    return reachableCombinations(state, player)
      .some(({ combination }) => canAddToExistingCombination([top], combination));
  }

  // Inutile de la prendre si la main accomplit déjà la mission sans elle.
  const withTop = [...player.hand, top];
  if (missionSelectionFor(player, player.hand) !== null) return false;
  if (missionSelectionFor(player, withTop) !== null) return true;

  // Sinon elle la prend quand elle complète une combinaison déjà en formation —
  // attendre de pouvoir accomplir la mission d'un coup serait attendre longtemps.
  return attemptableMissions(player)
    .some(mission => utilityForMission(top, withTop, shapeOf(mission, withTop)) >= 2);
};

/** Les cartes que l'IA présenterait pour accomplir sa mission, ou `null`. */
export const chooseAIMissionCards = (state: GameState): string[] | null => {
  const player = currentPlayer(state);
  if (!player || player.missionCompletedThisRound) return null;

  const selection = missionSelectionFor(player, player.hand);
  return selection ? selection.map(card => card.id) : null;
};

/**
 * Une carte à ajouter à une combinaison posée, ou `null`. Une seule à la fois : le
 * réducteur rappelle la décision après chaque ajout, sur l'état à jour.
 */
export const chooseAIExtension = (state: GameState): AIExtension | null => {
  const player = currentPlayer(state);
  if (!player?.missionCompletedThisRound) return null;

  const targets = reachableCombinations(state, player);
  // Les cartes normales d'abord : un joker placé ne sert plus à rien d'autre.
  const hand = [...player.hand.filter(isNormalCard), ...player.hand.filter(isJokerCard)];

  for (const card of hand) {
    for (const { other, combination } of targets) {
      if (canAddToExistingCombination([card], combination)) {
        return { cardIds: [card.id], combinationId: combination.id, targetPlayerId: other.id };
      }
    }
  }
  return null;
};

/** Les cartes des nouveaux groupes que l'IA poserait pour vider sa main. */
export const chooseAIGroupsToLay = (state: GameState): string[] => {
  const player = currentPlayer(state);
  if (!player?.missionCompletedThisRound) return [];

  return findLayableGroups(player.hand).flatMap(group => group.cards.map(card => card.id));
};

/**
 * Ce que la mission attend d'une carte : des valeurs répétées (groupes), des couleurs
 * suivies (suites), ou l'un des ensembles imposés par les missions « bloc ».
 */
type MissionShape = {
  groups: boolean;
  sequences: boolean;
  /** Les cartes qui comptent pour la mission, quand elle en impose l'ensemble. */
  wanted?: (card: NormalCard) => boolean;
};

const ODD_VALUES: CardValue[] = ['A', '3', '5', '7', '9', 'J', 'K'];
const EVEN_VALUES: CardValue[] = ['2', '4', '6', '8', '10', 'Q'];
const A_TO_9: CardValue[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9'];
const isRed = (card: NormalCard) => card.suit === 'hearts' || card.suit === 'diamonds';

const shapeOf = (mission: Mission, hand: Card[]): MissionShape => {
  const { groups = 0, sequences = 0, specificRequirements } = mission.requirements;

  switch (specificRequirements) {
    case '7_same_suit': {
      // La couleur la plus présente est celle qu'il faut garder.
      const counts = new Map<CardSuit, number>();
      hand.filter(isNormalCard).forEach(card => counts.set(card.suit, (counts.get(card.suit) ?? 0) + 1));
      const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      return { groups: false, sequences: false, wanted: card => card.suit === best };
    }
    case 'sequence_A_to_9':
      return { groups: false, sequences: false, wanted: card => A_TO_9.includes(card.value) };
    case 'red_even_sequence_6':
      return { groups: false, sequences: false, wanted: card => isRed(card) && EVEN_VALUES.includes(card.value) };
    case 'seven_odd_cards':
      return { groups: true, sequences: false, wanted: card => ODD_VALUES.includes(card.value) };
    default:
      return { groups: groups > 0, sequences: sequences > 0 };
  }
};

/**
 * L'utilité d'une carte pour la mission en cours : 2 si elle appartient déjà à une
 * combinaison du bon type, 1 si une autre carte de la main l'en rapproche, 0 si elle
 * ne mène à rien. C'est ce qui manquait à l'IA : sans direction, elle défaussait au
 * hasard et ne réunissait jamais de quoi présenter une mission.
 */
const utilityForMission = (card: Card, hand: Card[], shape: MissionShape): number => {
  if (!isNormalCard(card)) return 3;
  if (shape.wanted && !shape.wanted(card)) return 0;
  if (shape.wanted && !shape.groups && !shape.sequences) return 2;

  const value = getCardValueNumber(card.value);
  const others = hand.filter(other => other.id !== card.id);
  const sameValue = others.filter(other => isNormalCard(other) && other.value === card.value).length;
  const neighbours = others.filter(other =>
    isNormalCard(other) && other.suit === card.suit &&
    Math.abs(getCardValueNumber(other.value) - value) <= 2
  ).length;

  const groupScore = shape.groups ? Math.min(2, sameValue) : 0;
  const sequenceScore = shape.sequences ? Math.min(2, neighbours) : 0;
  return Math.max(groupScore, sequenceScore);
};

/**
 * La carte la moins utile à la mission : jamais un joker tant qu'il reste autre chose.
 * À utilité égale, le hasard, pour que l'IA ne garde pas indéfiniment la même main.
 */
export const chooseAIDiscard = (
  state: GameState,
  rng: () => number = Math.random
): string | undefined => {
  const player = currentPlayer(state);
  const hand = player?.hand ?? [];
  if (!player || hand.length === 0) return undefined;

  const normals = hand.filter(isNormalCard);
  const keepable: Card[] = normals.length > 0 ? normals : hand;

  // Après la mission, plus aucune nouvelle suite n'est permise : seuls les groupes
  // peuvent encore vider la main, donc seules les valeurs répétées valent d'être gardées.
  const shapes = player.missionCompletedThisRound
    ? [{ groups: true, sequences: false }]
    : attemptableMissions(player).map(mission => shapeOf(mission, hand));

  const utility = (card: Card) => shapes.length === 0
    ? 0
    : Math.max(...shapes.map(shape => utilityForMission(card, hand, shape)));

  const lowest = Math.min(...keepable.map(utility));
  const choices = keepable.filter(card => utility(card) === lowest);

  return choices[Math.floor(rng() * choices.length)].id;
};
