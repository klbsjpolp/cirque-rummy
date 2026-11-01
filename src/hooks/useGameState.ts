import { useCallback, useEffect, useReducer } from 'react';
import { GameState } from '../types/game';
import {
  GameAction,
  createInitialState,
  gameReducer,
  migrateSavedState
} from '../game/gameReducer';

const STORAGE_KEY = 'cirque-rummy-game-state';
/** Le temps de « réflexion » de l'IA, pour que son tour reste lisible. */
const AI_MOVE_DELAY_MS = 1500;

const loadSavedState = (): GameState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return migrateSavedState(JSON.parse(saved));
    } catch (error) {
      console.error('Erreur lors du chargement de la partie:', error);
    }
  }
  return createInitialState();
};

/**
 * Le hook ne garde que ce qui relève de React : l'état courant, sa persistance, et le
 * minuteur du tour de l'IA. Toutes les règles vivent dans le réducteur, qui est pur.
 */
export const useGameState = () => {
  const [gameState, dispatch] = useReducer(gameReducer, undefined, loadSavedState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    if (!gameState.isAITurn || gameState.isGameOver) return;

    const timer = setTimeout(() => dispatch({ type: 'AI_MOVE' }), AI_MOVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [gameState.isAITurn, gameState.isGameOver]);

  const act = useCallback((action: GameAction) => dispatch(action), []);

  return {
    gameState,

    drawCard: useCallback(
      (fromDiscard: boolean = false) => act({ type: 'DRAW_CARD', fromDiscard }),
      [act]
    ),
    discardCard: useCallback((cardId: string) => act({ type: 'DISCARD_CARD', cardId }), [act]),
    layCombination: useCallback(
      (cardIds: string[], combinationType: 'group' | 'sequence') =>
        act({ type: 'LAY_COMBINATION', cardIds, combinationType }),
      [act]
    ),
    presentMissionCards: useCallback(
      (cardIds: string[]) => act({ type: 'PRESENT_MISSION', cardIds }),
      [act]
    ),
    layEndOfRoundCombinations: useCallback(
      (cardIds: string[]) => act({ type: 'LAY_END_OF_ROUND', cardIds }),
      [act]
    ),
    addToExistingCombination: useCallback(
      (cardIds: string[], combinationId: string, targetPlayerId?: string) =>
        act({ type: 'ADD_TO_COMBINATION', cardIds, combinationId, targetPlayerId }),
      [act]
    ),
    reorderCards: useCallback(
      (fromIndex: number, toIndex: number) => act({ type: 'REORDER_CARDS', fromIndex, toIndex }),
      [act]
    ),
    newGame: useCallback((gameMode: 'pvp' | 'ai' = 'pvp') => act({ type: 'NEW_GAME', gameMode }), [act]),
    resetGame: useCallback(() => {
      localStorage.removeItem(STORAGE_KEY);
      act({ type: 'NEW_GAME', gameMode: 'pvp' });
    }, [act])
  };
};
