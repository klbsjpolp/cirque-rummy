import { Card, Combination, Mission, Player } from '../types/game';
import { isJokerCard, isValidGroup, isValidSequence } from './cardUtils';
import { combinationsSatisfyRequirements } from './missionRules';

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
  const available = allMissions.filter(m => !completedMissions.includes(m.id));
  if (available.length === 0) return allMissions[0]?.id ?? 1;
  return available[Math.floor(rng() * available.length)].id;
};

// Re-export for callers who only need the joker check via this module
export { isJokerCard };
