import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useGameState } from '../hooks/useGameState';
import { Card, CardSuit, CardValue, Combination } from '../types/game';

/**
 * La phase post-mission, au niveau du hook.
 *
 * Une fois sa mission accomplie *dans la manche en cours*, le joueur peut étendre les
 * combinaisons posées et former de nouveaux groupes (jamais de nouvelles suites) pour
 * vider sa main et terminer la manche. Ces droits doivent s'ouvrir dès que la mission
 * est créditée, et se refermer à la manche suivante.
 */

const STORAGE_KEY = 'cirque-rummy-game-state';

const SUITS: Record<string, CardSuit> = { h: 'hearts', d: 'diamonds', c: 'clubs', s: 'spades' };
const C = (spec: string): Card => {
  const suit = SUITS[spec.slice(-1)];
  const value = spec.slice(0, -1) as CardValue;
  return { id: `${value}-${suit}-0`, value, suit };
};
const ids = (cards: Card[]) => cards.map(c => c.id);

// La partie est relue depuis localStorage, donc on la sème sous sa forme sérialisée :
// pas de méthode sur les joueurs, exactement ce que JSON.parse renvoie.
type SeededPlayer = {
  id: string;
  name: string;
  hand: Card[];
  currentMission: number;
  completedMissions: number[];
  score: number;
  combinations: Combination[];
};

const seedGame = (players: [SeededPlayer, SeededPlayer]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    players,
    currentPlayerIndex: 0,
    deck: [C('4s'), C('5s'), C('6s')],
    discardPile: [C('7d')],
    isGameStarted: true,
    isGameOver: false,
    winner: null,
    gameHistory: [],
    gameMode: 'pvp',
    isAITurn: false,
    // Le joueur a déjà pioché : les actions du tour sont ouvertes.
    cardsDrawnThisTurn: 1,
    hasDrawnThisTurn: true,
    mustDiscardToEndTurn: true,
    lastDrawnCardId: null,
  }));
};

const player = (id: string, name: string, over: Partial<SeededPlayer> = {}): SeededPlayer => ({
  id,
  name,
  // Une main non vide par défaut : checkRoundEnd termine la manche dès qu'un joueur
  // n'a plus de cartes, y compris un adversaire qu'on n'aurait pas garni.
  hand: [C('8c'), C('Jd')],
  currentMission: 1,
  completedMissions: [],
  score: 0,
  combinations: [],
  ...over,
});

/** Mission 1 : deux groupes de 3. */
const MISSION_1_CARDS = [C('3s'), C('3c'), C('3h'), C('9d'), C('9c'), C('9h')];
const SPARE_GROUP = [C('Ks'), C('Kc'), C('Kh')];
const EXTENSION_CARD = C('3d');

const startWithMission1 = () => {
  seedGame([
    player('player1', 'Joueur 1', {
      hand: [...MISSION_1_CARDS, EXTENSION_CARD, ...SPARE_GROUP, C('2d')],
      currentMission: 1,
    }),
    player('player2', 'Joueur 2', { currentMission: 4 }),
  ]);
  return renderHook(() => useGameState());
};

beforeEach(() => {
  localStorage.clear();
});

describe('accomplir la mission ouvre la phase post-mission', () => {
  it('crédite la mission présentée', () => {
    const { result } = startWithMission1();

    act(() => result.current.presentMissionCards(ids(MISSION_1_CARDS)));

    expect(result.current.gameState.players[0].completedMissions).toContain(1);
    expect(result.current.gameState.players[0].combinations).toHaveLength(2);
  });

  it('permet ensuite d\'étendre une combinaison posée', () => {
    const { result } = startWithMission1();

    act(() => result.current.presentMissionCards(ids(MISSION_1_CARDS)));

    const threes = result.current.gameState.players[0].combinations
      .find(c => c.cards.some(card => card.id === C('3s').id))!;

    act(() => result.current.addToExistingCombination([EXTENSION_CARD.id], threes.id, 'player1'));

    const extended = result.current.gameState.players[0].combinations
      .find(c => c.id === threes.id)!;
    expect(extended.cards.map(c => c.id)).toContain(EXTENSION_CARD.id);
    expect(result.current.gameState.players[0].hand.map(c => c.id)).not.toContain(EXTENSION_CARD.id);
  });

  it('permet ensuite de poser un nouveau groupe', () => {
    const { result } = startWithMission1();

    act(() => result.current.presentMissionCards(ids(MISSION_1_CARDS)));
    act(() => result.current.layEndOfRoundCombinations(ids(SPARE_GROUP)));

    expect(result.current.gameState.players[0].combinations).toHaveLength(3);
    expect(result.current.gameState.players[0].hand.map(c => c.id))
      .not.toContain(SPARE_GROUP[0].id);
  });

  it('interdit toujours de poser une nouvelle suite', () => {
    seedGame([
      player('player1', 'Joueur 1', {
        hand: [...MISSION_1_CARDS, C('4h'), C('5h'), C('6h')],
        currentMission: 1,
      }),
      player('player2', 'Joueur 2'),
    ]);
    const { result } = renderHook(() => useGameState());

    act(() => result.current.presentMissionCards(ids(MISSION_1_CARDS)));
    const before = result.current.gameState.players[0].combinations.length;

    act(() => result.current.layCombination(ids([C('4h'), C('5h'), C('6h')]), 'sequence'));

    expect(result.current.gameState.players[0].combinations).toHaveLength(before);
  });
});

describe('la phase post-mission est propre à la manche et au joueur', () => {
  it('refuse la pose de groupes quand la mission de la manche n\'est pas accomplie', () => {
    // Manche suivante : le joueur a déjà réussi la mission 5, mais sa mission
    // actuelle (7) reste à faire — les droits post-mission ne sont pas rouverts.
    seedGame([
      player('player1', 'Joueur 1', {
        hand: [...SPARE_GROUP, C('2d')],
        currentMission: 7,
        completedMissions: [5],
      }),
      player('player2', 'Joueur 2'),
    ]);
    const { result } = renderHook(() => useGameState());

    act(() => result.current.layEndOfRoundCombinations(ids(SPARE_GROUP)));

    expect(result.current.gameState.players[0].combinations).toHaveLength(0);
    expect(result.current.gameState.players[0].hand.map(c => c.id)).toContain(SPARE_GROUP[0].id);
  });

  it('refuse l\'extension quand la mission de la manche n\'est pas accomplie', () => {
    seedGame([
      player('player1', 'Joueur 1', {
        hand: [EXTENSION_CARD],
        currentMission: 7,
        completedMissions: [5],
        combinations: [{ id: 'posed-threes', type: 'group', cards: [C('3s'), C('3c'), C('3h')] }],
      }),
      player('player2', 'Joueur 2'),
    ]);
    const { result } = renderHook(() => useGameState());

    act(() => result.current.addToExistingCombination([EXTENSION_CARD.id], 'posed-threes', 'player1'));

    expect(result.current.gameState.players[0].combinations[0].cards).toHaveLength(3);
    expect(result.current.gameState.players[0].hand.map(c => c.id)).toContain(EXTENSION_CARD.id);
  });

  it('se referme à la manche suivante', () => {
    seedGame([
      player('player1', 'Joueur 1', {
        hand: [...MISSION_1_CARDS, C('2d')],
        currentMission: 1,
      }),
      player('player2', 'Joueur 2'),
    ]);
    const { result } = renderHook(() => useGameState());

    act(() => result.current.presentMissionCards(ids(MISSION_1_CARDS)));
    expect(result.current.gameState.players[0].missionCompletedThisRound).toBe(true);
    expect(result.current.gameState.players[1].missionCompletedThisRound).toBe(false);

    // Défausser la dernière carte vide la main : la manche se termine.
    act(() => result.current.discardCard(C('2d').id));

    expect(result.current.gameState.players.map(p => p.missionCompletedThisRound))
      .toEqual([false, false]);
    expect(result.current.gameState.players[0].combinations).toHaveLength(0);
  });

  it('permet d\'étendre la combinaison de l\'adversaire si les deux ont accompli la leur', () => {
    seedGame([
      player('player1', 'Joueur 1', {
        hand: [...MISSION_1_CARDS, EXTENSION_CARD, C('2d')],
        currentMission: 1,
      }),
      player('player2', 'Joueur 2', {
        currentMission: 4,
        combinations: [{ id: 'p2-nines', type: 'group', cards: [C('9s'), C('9c'), C('9h')] }],
      }),
    ]);
    const { result } = renderHook(() => useGameState());

    act(() => result.current.presentMissionCards(ids(MISSION_1_CARDS)));
    // L'adversaire n'a pas fini la sienne : l'extension est refusée.
    act(() => result.current.addToExistingCombination([EXTENSION_CARD.id], 'p2-nines', 'player2'));
    expect(result.current.gameState.players[1].combinations[0].cards).toHaveLength(3);
  });

  it('n\'ouvre pas les droits de l\'adversaire quand un joueur accomplit sa mission', () => {
    seedGame([
      player('player1', 'Joueur 1', {
        hand: [...MISSION_1_CARDS, C('2d'), C('10c')],
        currentMission: 1,
      }),
      player('player2', 'Joueur 2', {
        hand: [EXTENSION_CARD, C('8s')],
        currentMission: 4,
        combinations: [{ id: 'p2-threes', type: 'group', cards: [C('3s'), C('3c'), C('3h')] }],
      }),
    ]);
    const { result } = renderHook(() => useGameState());

    // Joueur 1 accomplit sa mission puis termine son tour.
    act(() => result.current.presentMissionCards(ids(MISSION_1_CARDS)));
    act(() => result.current.discardCard(C('2d').id));
    expect(result.current.gameState.currentPlayerIndex).toBe(1);

    // Joueur 2 pioche, puis tente d'étendre sa propre combinaison sans avoir
    // accompli la sienne.
    act(() => result.current.drawCard());
    act(() => result.current.addToExistingCombination([EXTENSION_CARD.id], 'p2-threes', 'player2'));

    const p2 = result.current.gameState.players[1];
    expect(p2.combinations[0].cards).toHaveLength(3);
    expect(p2.hand.map(c => c.id)).toContain(EXTENSION_CARD.id);
  });
});
