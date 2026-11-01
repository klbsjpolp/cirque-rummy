import { GameState } from '../types/game';

/**
 * L'adversaire automatique, réduit à ses décisions : où piocher, quoi défausser.
 *
 * Elle ne touche pas à l'état — le réducteur applique ses choix par les mêmes actions
 * que le joueur humain, donc avec les mêmes règles (pioche remélangée, fin de manche).
 * L'ancienne version modifiait l'état directement et portait sa propre copie de la
 * fin de manche, qui avait divergé de celle du jeu.
 *
 * Elle reste rudimentaire : elle pioche au paquet et défausse au hasard, sans jamais
 * rien poser. La rendre capable de jouer ses missions est une étape à part entière.
 */

export const chooseAIDraw = (_state: GameState): boolean => false;

export const chooseAIDiscard = (
  state: GameState,
  rng: () => number = Math.random
): string | undefined => {
  const hand = state.players[state.currentPlayerIndex]?.hand ?? [];
  if (hand.length === 0) return undefined;

  return hand[Math.floor(rng() * hand.length)].id;
};
