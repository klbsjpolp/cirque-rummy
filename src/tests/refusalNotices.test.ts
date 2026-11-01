import { describe, it, expect } from 'vitest';
import { GameAction, createInitialState, gameReducer, migrateSavedState } from '../game/gameReducer';
import { Card, CardSuit, CardValue, Combination, GameState, Player } from '../types/game';

/**
 * Dire au joueur pourquoi une action est refusée.
 *
 * Le réducteur refusait en silence : il renvoyait l'état inchangé et l'écran ne
 * bougeait pas, sans un mot. Chaque refus porte maintenant un avis — un message et
 * un numéro qui change à chaque fois, pour que l'interface puisse le montrer même
 * deux fois de suite. Le réducteur reste pur : il ne connaît pas les notifications.
 */

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
  notice: null,
  ...over,
});

const drawn = { cardsDrawnThisTurn: 1, hasDrawnThisTurn: true, mustDiscardToEndTurn: true };
const MISSION_1_CARDS = [C('3s'), C('3c'), C('3h'), C('9d'), C('9c'), C('9h')];
const POSED_THREES: Combination = { id: 'posed-threes', type: 'group', cards: [C('3s'), C('3c'), C('3h')] };

/** Le message de l'avis porté par l'état après une action. */
const noticeOf = (before: GameState, action: GameAction): string | undefined =>
  gameReducer(before, action).notice?.message;

describe('un refus explique pourquoi', () => {
  it('piocher deux fois dans le même tour', () => {
    expect(noticeOf(state(drawn), { type: 'DRAW_CARD', fromDiscard: false }))
      .toMatch(/déjà pioché/i);
  });

  it('défausser avant d\'avoir pioché', () => {
    expect(noticeOf(state(), { type: 'DISCARD_CARD', cardId: C('8c').id }))
      .toMatch(/piochez/i);
  });

  it('présenter sa mission avant d\'avoir pioché', () => {
    expect(noticeOf(state(), { type: 'PRESENT_MISSION', cardIds: ids(MISSION_1_CARDS) }))
      .toMatch(/piochez/i);
  });

  it('présenter une sélection qui n\'accomplit pas la mission', () => {
    const before = state({
      ...drawn,
      players: [
        player('player1', 'Joueur 1', { hand: [C('3s'), C('3c'), C('3h'), C('2d')], currentMission: 1 }),
        player('player2', 'Joueur 2'),
      ],
    });

    expect(noticeOf(before, { type: 'PRESENT_MISSION', cardIds: ids([C('3s'), C('3c'), C('3h')]) }))
      .toMatch(/mission/i);
  });

  it('poser une suite après sa mission', () => {
    const before = state({
      ...drawn,
      players: [
        player('player1', 'Joueur 1', {
          hand: [C('4h'), C('5h'), C('6h')],
          missionCompletedThisRound: true,
        }),
        player('player2', 'Joueur 2'),
      ],
    });

    expect(noticeOf(before, {
      type: 'LAY_COMBINATION',
      cardIds: ids([C('4h'), C('5h'), C('6h')]),
      combinationType: 'sequence',
    })).toMatch(/suite/i);
  });

  it('poser des cartes qui ne forment pas une combinaison', () => {
    const before = state({
      ...drawn,
      players: [
        player('player1', 'Joueur 1', { hand: [C('4h'), C('9s'), C('Kd')] }),
        player('player2', 'Joueur 2'),
      ],
    });

    expect(noticeOf(before, {
      type: 'LAY_COMBINATION',
      cardIds: ids([C('4h'), C('9s'), C('Kd')]),
      combinationType: 'group',
    })).toMatch(/groupe/i);
  });

  it('poser des groupes de fin de manche sans avoir accompli sa mission', () => {
    const before = state({
      ...drawn,
      players: [
        player('player1', 'Joueur 1', { hand: [C('Ks'), C('Kc'), C('Kh')] }),
        player('player2', 'Joueur 2'),
      ],
    });

    expect(noticeOf(before, { type: 'LAY_END_OF_ROUND', cardIds: ids([C('Ks'), C('Kc'), C('Kh')]) }))
      .toMatch(/mission/i);
  });

  it('poser des groupes de fin de manche qui n\'en sont pas', () => {
    const before = state({
      ...drawn,
      players: [
        player('player1', 'Joueur 1', {
          hand: [C('Ks'), C('2c'), C('7h')],
          missionCompletedThisRound: true,
        }),
        player('player2', 'Joueur 2'),
      ],
    });

    expect(noticeOf(before, { type: 'LAY_END_OF_ROUND', cardIds: ids([C('Ks'), C('2c'), C('7h')]) }))
      .toMatch(/groupe/i);
  });

  it('étendre une combinaison sans avoir accompli sa mission', () => {
    const before = state({
      ...drawn,
      players: [
        player('player1', 'Joueur 1', { hand: [C('3d')], combinations: [POSED_THREES] }),
        player('player2', 'Joueur 2'),
      ],
    });

    expect(noticeOf(before, {
      type: 'ADD_TO_COMBINATION',
      cardIds: [C('3d').id],
      combinationId: POSED_THREES.id,
    })).toMatch(/mission/i);
  });

  it('étendre une combinaison avec des cartes qui ne vont pas', () => {
    const before = state({
      ...drawn,
      players: [
        player('player1', 'Joueur 1', {
          hand: [C('7h')],
          missionCompletedThisRound: true,
          combinations: [POSED_THREES],
        }),
        player('player2', 'Joueur 2'),
      ],
    });

    expect(noticeOf(before, {
      type: 'ADD_TO_COMBINATION',
      cardIds: [C('7h').id],
      combinationId: POSED_THREES.id,
    })).toMatch(/impossible/i);
  });
});

describe('l\'avis se renouvelle, et ne survit pas à ce qui réussit', () => {
  it('change de numéro quand le même refus se répète', () => {
    const first = gameReducer(state(drawn), { type: 'DRAW_CARD', fromDiscard: false });
    const second = gameReducer(first, { type: 'DRAW_CARD', fromDiscard: false });

    expect(first.notice!.message).toBe(second.notice!.message);
    expect(second.notice!.id).toBeGreaterThan(first.notice!.id);
  });

  it('n\'apparaît pas quand l\'action réussit', () => {
    const after = gameReducer(state(), { type: 'DRAW_CARD', fromDiscard: false });

    expect(after.notice).toBeNull();
    expect(after.players[0].hand).toHaveLength(3);
  });

  it('disparaît à l\'action suivante qui réussit', () => {
    const refused = gameReducer(state(), { type: 'DISCARD_CARD', cardId: C('8c').id });
    expect(refused.notice).not.toBeNull();

    const after = gameReducer(refused, { type: 'DRAW_CARD', fromDiscard: false });
    expect(after.notice).toBeNull();
  });

  it('n\'est pas rechargé depuis une partie sauvegardée', () => {
    // Sinon un refus d'avant la fermeture de l'onglet réapparaîtrait au rechargement.
    const saved = { ...state(), notice: { id: 3, message: 'Vous avez déjà pioché ce tour-ci.' } };

    expect(migrateSavedState(saved).notice).toBeNull();
  });

  it('une partie neuve n\'en porte pas', () => {
    expect(createInitialState('ai').notice).toBeNull();
  });
});
