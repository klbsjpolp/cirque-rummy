import { Card, Combination, Mission, Player } from '../types/game';
import { isJokerCard, isValidGroup, isValidSequence, shuffleDeck } from './cardUtils';
import { combinationsSatisfyRequirements, isFreeChoice, replayableMissions } from './missionRules';

export const isMissionCompleted = (
  player: Pick<Player, 'combinations' | 'completedMissions'>,
  mission: Mission
): boolean =>
  combinationsSatisfyRequirements(
    player.combinations,
    mission.requirements,
    player.completedMissions
  );

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
  // La mission libre consiste à rejouer une mission déjà réussie : la distribuer à un
  // joueur qui n'a rien à rejouer le condamnerait à une mission impossible.
  const hasSomethingToReplay = replayableMissions(allMissions, completedMissions).length > 0;

  const available = allMissions.filter(mission =>
    !completedMissions.includes(mission.id) &&
    (hasSomethingToReplay || !isFreeChoice(mission.requirements))
  );

  if (available.length === 0) return allMissions[0]?.id ?? 1;
  return available[Math.floor(rng() * available.length)].id;
};

/**
 * Quand la pioche est vide, la défausse — sauf sa carte visible — est remélangée pour
 * la reformer. Sans cela, une manche qui épuisait le paquet ne pouvait plus avancer :
 * il ne restait qu'à reprendre indéfiniment la carte du dessus de la défausse.
 */
export const replenishDeck = (
  deck: Card[],
  discardPile: Card[]
): { deck: Card[]; discardPile: Card[] } => {
  if (deck.length > 0 || discardPile.length <= 1) return { deck, discardPile };

  const visible = discardPile[discardPile.length - 1];
  return { deck: shuffleDeck(discardPile.slice(0, -1)), discardPile: [visible] };
};

// Re-export for callers who only need the joker check via this module
export { isJokerCard };
