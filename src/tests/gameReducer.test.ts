import { describe, it, expect } from 'vitest';
import { GameAction, createInitialState, gameReducer, migrateSavedState } from '../game/gameReducer';
import { Card, CardSuit, CardValue, Combination, GameState, Player } from '../types/game';

/**
 * Le réducteur ne doit jamais écrire dans l'état qu'il reçoit.
 *
 * Les tests gèlent l'état en profondeur avant chaque action : en module ES (mode
 * strict), toute écriture sur un objet gelé lève une TypeError. Une action qui
 * modifiait une main, une combinaison ou le journal échoue donc ici, au lieu de
 * passer inaperçue jusqu'à ce qu'un memo ou un « annuler » s'y casse les dents.
 */

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  }
  return value;
};

const SUITS: Record<string, CardSuit> = { h: 'hearts', d: 'diamonds', c: 'clubs', s: 'spades' };
const C = (spec: string): Card => {
  const suit = SUITS[spec.slice(-1)];
  const value = spec.slice(0, -1) as CardValue;
  return { id: `${value}-${suit}-0`, value, suit };
};
const ids = (cards: Card[]) => cards.map(c => c.id);

const player = (id: string, name: string, over: Partial<Player> = {}): Player => ({
  id,
  name,
  hand: [C('8c'), C('Jd')],
  currentMission: 1,
  completedMissions: [],
  score: 0,
  combinations: [],
  missionCompletedThisRound: false,
  ...over,
});

const state = (over: Partial<GameState> = {}): GameState => ({
  players: [player('player1', 'Joueur 1'), player('player2', 'Joueur 2')],
  currentPlayerIndex: 0,
  deck: [C('4s'), C('5s'), C('6s')],
  discardPile: [C('7d')],
  isGameStarted: true,
  isGameOver: false,
  winner: null,
  gameHistory: [],
  gameMode: 'pvp',
  isAITurn: false,
  cardsDrawnThisTurn: 0,
  hasDrawnThisTurn: false,
  mustDiscardToEndTurn: false,
  lastDrawnCardId: null,
  ...over,
});

/** Mission 1 : deux groupes de 3. */
const MISSION_1_CARDS = [C('3s'), C('3c'), C('3h'), C('9d'), C('9c'), C('9h')];
const POSED_THREES: Combination = {
  id: 'posed-threes',
  type: 'group',
  cards: [C('3s'), C('3c'), C('3h')],
};

describe('le réducteur ne modifie jamais l\'état reçu', () => {
  const cases: Array<[string, GameState, GameAction]> = [
    [
      'DRAW_CARD depuis le paquet',
      state(),
      { type: 'DRAW_CARD', fromDiscard: false },
    ],
    [
      'DRAW_CARD depuis la défausse',
      state({ discardPile: [C('7d'), C('8d')] }),
      { type: 'DRAW_CARD', fromDiscard: true },
    ],
    [
      'DRAW_CARD qui remélange la défausse',
      state({ deck: [], discardPile: [C('2h'), C('3h'), C('4h')] }),
      { type: 'DRAW_CARD', fromDiscard: false },
    ],
    [
      'DRAW_CARD qui rejoue la manche',
      state({ deck: [], discardPile: [C('7d')] }),
      { type: 'DRAW_CARD', fromDiscard: false },
    ],
    [
      'DISCARD_CARD',
      state({ hasDrawnThisTurn: true, cardsDrawnThisTurn: 1 }),
      { type: 'DISCARD_CARD', cardId: C('8c').id },
    ],
    [
      'DISCARD_CARD qui termine la manche',
      state({
        hasDrawnThisTurn: true,
        cardsDrawnThisTurn: 1,
        players: [player('player1', 'Joueur 1', { hand: [C('8c')] }), player('player2', 'Joueur 2')],
      }),
      { type: 'DISCARD_CARD', cardId: C('8c').id },
    ],
    [
      'LAY_COMBINATION',
      state({
        players: [
          player('player1', 'Joueur 1', { hand: [C('3s'), C('3c'), C('3h')] }),
          player('player2', 'Joueur 2'),
        ],
      }),
      { type: 'LAY_COMBINATION', cardIds: ids([C('3s'), C('3c'), C('3h')]), combinationType: 'group' },
    ],
    [
      'PRESENT_MISSION',
      state({
        hasDrawnThisTurn: true,
        cardsDrawnThisTurn: 1,
        players: [
          player('player1', 'Joueur 1', { hand: [...MISSION_1_CARDS, C('2d')], currentMission: 1 }),
          player('player2', 'Joueur 2'),
        ],
      }),
      { type: 'PRESENT_MISSION', cardIds: ids(MISSION_1_CARDS) },
    ],
    [
      'LAY_END_OF_ROUND',
      state({
        hasDrawnThisTurn: true,
        cardsDrawnThisTurn: 1,
        players: [
          player('player1', 'Joueur 1', {
            hand: [C('Ks'), C('Kc'), C('Kh'), C('2d')],
            missionCompletedThisRound: true,
          }),
          player('player2', 'Joueur 2'),
        ],
      }),
      { type: 'LAY_END_OF_ROUND', cardIds: ids([C('Ks'), C('Kc'), C('Kh')]) },
    ],
    [
      'ADD_TO_COMBINATION',
      state({
        players: [
          player('player1', 'Joueur 1', {
            hand: [C('3d')],
            combinations: [POSED_THREES],
            missionCompletedThisRound: true,
          }),
          player('player2', 'Joueur 2'),
        ],
      }),
      { type: 'ADD_TO_COMBINATION', cardIds: [C('3d').id], combinationId: 'posed-threes', targetPlayerId: 'player1' },
    ],
    [
      'ADD_TO_COMBINATION refusée',
      state(),
      { type: 'ADD_TO_COMBINATION', cardIds: [C('3d').id], combinationId: 'nowhere' },
    ],
    [
      'REORDER_CARDS',
      state(),
      { type: 'REORDER_CARDS', fromIndex: 0, toIndex: 1 },
    ],
    [
      'AI_MOVE',
      state({ gameMode: 'ai', currentPlayerIndex: 1, isAITurn: true }),
      { type: 'AI_MOVE' },
    ],
  ];

  it.each(cases)('%s laisse l\'état précédent intact', (_label, before, action) => {
    const snapshot = JSON.stringify(before);
    deepFreeze(before);

    expect(() => gameReducer(before, action)).not.toThrow();
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it.each(cases)('%s renvoie un nouvel état', (_label, before, action) => {
    const after = gameReducer(before, action);

    // Une action qui s'applique renvoie un autre objet ; une action refusée peut
    // renvoyer le même, mais jamais un état modifié sur place.
    expect(after).toBeDefined();
    expect(after.players).toHaveLength(before.players.length);
  });
});

describe('état initial et reprise de partie', () => {
  it('distribue 13 cartes à chacun et une carte de défausse', () => {
    const fresh = createInitialState('ai');

    expect(fresh.players.map(p => p.hand.length)).toEqual([13, 13]);
    expect(fresh.discardPile).toHaveLength(1);
    expect(fresh.deck).toHaveLength(108 - 27);
    expect(fresh.players[1].name).toBe('IA Cirque');
  });

  it('ne distribue jamais la mission libre en début de partie', () => {
    for (let i = 0; i < 40; i++) {
      const fresh = createInitialState();
      expect(fresh.players.map(p => p.currentMission)).not.toContain(12);
    }
  });

  it('complète une sauvegarde antérieure sans la modifier', () => {
    const saved = {
      ...state(),
      players: [player('player1', 'Joueur 1'), player('player2', 'Joueur 2')],
    } as GameState;
    // Une sauvegarde d'avant la phase post-mission n'a pas le drapeau.
    delete (saved.players[0] as Partial<Player>).missionCompletedThisRound;
    deepFreeze(saved);

    const migrated = migrateSavedState(saved);

    expect(migrated.players[0].missionCompletedThisRound).toBe(false);
    expect(migrated).not.toBe(saved);
  });
});

/**
 * « Une manche se termine lorsqu'un joueur n'a plus de cartes en main » (README).
 *
 * La défausse n'est donc pas le seul chemin : présenter sa mission, poser un groupe
 * ou étendre une combinaison peut aussi vider la main. Sans fin de manche, le joueur
 * se retrouvait sans carte à défausser et son tour ne pouvait plus se terminer.
 */
describe('vider sa main termine la manche, quelle que soit l\'action', () => {
  const drawn = { cardsDrawnThisTurn: 1, hasDrawnThisTurn: true, mustDiscardToEndTurn: true };
  const newRoundDealt = (after: GameState) => {
    expect(after.players.map(p => p.hand.length)).toEqual([13, 13]);
    expect(after.players.flatMap(p => p.combinations)).toEqual([]);
    expect(after.players.map(p => p.missionCompletedThisRound)).toEqual([false, false]);
    expect(after.gameHistory.some(line => line.includes('termine la manche'))).toBe(true);
  };

  it('présenter sa mission avec ses dernières cartes', () => {
    const before = state({
      ...drawn,
      players: [
        player('player1', 'Joueur 1', { hand: [...MISSION_1_CARDS], currentMission: 1 }),
        player('player2', 'Joueur 2', { currentMission: 4 }),
      ],
    });
    deepFreeze(before);

    const after = gameReducer(before, { type: 'PRESENT_MISSION', cardIds: ids(MISSION_1_CARDS) });

    // La mission reste créditée : la manche se termine par-dessus, elle n'annule rien.
    expect(after.players[0].completedMissions).toContain(1);
    newRoundDealt(after);
  });

  it('poser un groupe avec ses dernières cartes', () => {
    const kings = [C('Ks'), C('Kc'), C('Kh')];
    const before = state({
      ...drawn,
      players: [
        player('player1', 'Joueur 1', { hand: kings }),
        player('player2', 'Joueur 2'),
      ],
    });
    deepFreeze(before);

    const after = gameReducer(before, {
      type: 'LAY_COMBINATION',
      cardIds: ids(kings),
      combinationType: 'group',
    });

    newRoundDealt(after);
  });

  it('étendre une combinaison avec sa dernière carte', () => {
    const before = state({
      ...drawn,
      players: [
        player('player1', 'Joueur 1', {
          hand: [C('3d')],
          missionCompletedThisRound: true,
          combinations: [POSED_THREES],
        }),
        player('player2', 'Joueur 2'),
      ],
    });
    deepFreeze(before);

    const after = gameReducer(before, {
      type: 'ADD_TO_COMBINATION',
      cardIds: [C('3d').id],
      combinationId: POSED_THREES.id,
    });

    newRoundDealt(after);
  });

  it('ne termine pas la manche tant qu\'il reste une carte', () => {
    const before = state({
      ...drawn,
      players: [
        player('player1', 'Joueur 1', {
          hand: [C('3d'), C('8s')],
          missionCompletedThisRound: true,
          combinations: [POSED_THREES],
        }),
        player('player2', 'Joueur 2'),
      ],
    });
    deepFreeze(before);

    const after = gameReducer(before, {
      type: 'ADD_TO_COMBINATION',
      cardIds: [C('3d').id],
      combinationId: POSED_THREES.id,
    });

    expect(after.players[0].hand.map(c => c.id)).toEqual([C('8s').id]);
    expect(after.players[0].combinations[0].cards).toHaveLength(4);
    expect(after.gameHistory.some(line => line.includes('termine la manche'))).toBe(false);
  });
});
