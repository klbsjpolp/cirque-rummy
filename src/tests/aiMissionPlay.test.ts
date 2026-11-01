import { describe, it, expect, afterEach, vi } from 'vitest';
import { findMissionSelection, validateMissionFromSelection } from '../utils/cardUtils';
import { chooseAIDiscard, chooseAIDraw } from '../utils/aiPlayer';
import { createInitialState, gameReducer } from '../game/gameReducer';
import { MISSIONS } from '../data/missions';
import { Card, CardSuit, CardValue, Combination, GameState, Mission, Player } from '../types/game';

/**
 * L'IA joue ses missions.
 *
 * Elle ne décide que *quoi* jouer : c'est le réducteur qui applique, par les mêmes
 * actions que le joueur humain. Ces tests vérifient donc deux choses séparément — la
 * recherche d'une sélection qui accomplit la mission, et le tour que l'IA en tire.
 */

const SUITS: Record<string, CardSuit> = { h: 'hearts', d: 'diamonds', c: 'clubs', s: 'spades' };
const C = (spec: string, deck = 0): Card => {
  const suit = SUITS[spec.slice(-1)];
  const value = spec.slice(0, -1) as CardValue;
  return { id: `${value}-${suit}-${deck}`, value, suit };
};
const J = (i: number): Card => ({ id: `joker-${i}`, isJoker: true });
const mission = (id: number): Mission => MISSIONS.find(m => m.id === id)!;
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
  players: [player('player1', 'Joueur 1'), player('ai', 'IA Cirque')],
  // L'IA est le joueur 1.
  currentPlayerIndex: 1,
  deck: [C('4s'), C('5s'), C('6s')],
  discardPile: [C('7d')],
  isGameStarted: true,
  isGameOver: false,
  winner: null,
  gameHistory: [],
  gameMode: 'ai',
  isAITurn: true,
  cardsDrawnThisTurn: 0,
  hasDrawnThisTurn: false,
  mustDiscardToEndTurn: false,
  lastDrawnCardId: null,
  notice: null,
  ...over,
});

const aiMove = (s: GameState): GameState => gameReducer(s, { type: 'AI_MOVE' });

/** La sélection trouvée doit sortir de la main, et la pose doit l'accepter. */
const expectPlayable = (hand: Card[], missionId: number) => {
  const selection = findMissionSelection(hand, mission(missionId).requirements);

  expect(selection).not.toBeNull();
  expect(selection!.every(card => hand.some(c => c.id === card.id))).toBe(true);
  expect(new Set(ids(selection!)).size).toBe(selection!.length);
  expect(validateMissionFromSelection(selection!, mission(missionId).requirements).isValid).toBe(true);
  return selection!;
};

describe('trouver dans une main une sélection qui accomplit la mission', () => {
  it('mission 1 : deux groupes de 3 parmi quatorze cartes', () => {
    const hand = [
      C('3s'), C('3c'), C('3h'), C('9d'), C('9c'), C('9h'),
      C('2d'), C('4h'), C('7s'), C('Jc'), C('Qh'), C('Kd'), C('8h'), C('10c'),
    ];

    expect(expectPlayable(hand, 1)).toHaveLength(6);
  });

  it('se sert des jokers de la main', () => {
    const hand = [C('3s'), C('3c'), J(0), C('9d'), C('9c'), J(1), C('2d'), C('Kd')];

    const selection = expectPlayable(hand, 1);
    expect(selection.filter(c => 'isJoker' in c)).toHaveLength(2);
  });

  it('ne trouve rien quand la main ne peut pas accomplir la mission', () => {
    const hand = [C('2d'), C('4h'), C('7s'), C('Jc'), C('Qh'), C('Kd'), C('10c')];

    expect(findMissionSelection(hand, mission(1).requirements)).toBeNull();
  });

  it('mission 3 : deux suites de 4, pas une de 4 et une de 3', () => {
    const hand = [
      C('3h'), C('4h'), C('5h'), C('6h'), C('9s'), C('10s'), C('Js'), C('Qs'), C('2d'),
    ];

    expect(expectPlayable(hand, 3)).toHaveLength(8);
  });

  it('mission 24 : la couleur complète A→K', () => {
    const hearts = (['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as CardValue[])
      .map(v => C(`${v}h`));

    expect(expectPlayable([...hearts, C('4s')], 24)).toHaveLength(13);
  });

  it('mission 7 : sept cartes d\'une même couleur', () => {
    const hand = [
      C('2s'), C('5s'), C('7s'), C('9s'), C('Js'), C('Qs'), C('Ks'), C('3h'), C('4d'),
    ];

    const selection = expectPlayable(hand, 7);
    expect(selection).toHaveLength(7);
  });

  it('mission 19 : la suite A→9, couleurs libres', () => {
    const hand = [
      C('Ah'), C('2s'), C('3h'), C('4d'), C('5c'), C('6h'), C('7s'), C('8h'), C('9d'), C('Kc'),
    ];

    expect(expectPlayable(hand, 19)).toHaveLength(9);
  });

  it('mission 30 : six cartes rouges paires', () => {
    const hand = [
      C('2h'), C('4d'), C('6h'), C('8d'), C('10h'), C('Qd'), C('3s'), C('Kc'),
    ];

    expect(expectPlayable(hand, 30)).toHaveLength(6);
  });

  it('mission 20 : sept cartes impaires', () => {
    const hand = [
      C('3s'), C('3c'), C('3h'), C('3d'), C('9d'), C('9c'), C('9h'), C('2d'), C('4h'),
    ];

    expectPlayable(hand, 20);
  });

  it('mission 12 : la mission libre se traite mission par mission', () => {
    // La mission libre n'a pas d'exigence propre : c'est à l'appelant d'essayer les
    // missions déjà réussies. La recherche ne doit donc rien inventer.
    const hand = [C('3s'), C('3c'), C('3h'), C('9d'), C('9c'), C('9h')];

    expect(findMissionSelection(hand, mission(12).requirements)).toBeNull();
  });
});

describe('le tour de l\'IA', () => {
  const MISSION_1_CARDS = [C('3s'), C('3c'), C('3h'), C('9d'), C('9c'), C('9h')];

  it('présente sa mission puis défausse', () => {
    const before = state({
      players: [
        player('player1', 'Joueur 1'),
        player('ai', 'IA Cirque', { hand: [...MISSION_1_CARDS, C('2d')], currentMission: 1 }),
      ],
    });

    const after = aiMove(before);

    expect(after.players[1].completedMissions).toContain(1);
    expect(after.players[1].combinations).toHaveLength(2);
    // Elle a pioché (7 → 8 cartes), posé 6 cartes et défaussé : il en reste une.
    expect(after.players[1].hand).toHaveLength(1);
    expect(after.currentPlayerIndex).toBe(0);
    expect(after.isAITurn).toBe(false);
  });

  it('rejoue une mission réussie quand elle tire la mission libre', () => {
    const before = state({
      players: [
        player('player1', 'Joueur 1'),
        player('ai', 'IA Cirque', {
          hand: [...MISSION_1_CARDS, C('2d')],
          currentMission: 12,
          completedMissions: [1],
        }),
      ],
    });

    const after = aiMove(before);

    expect(after.players[1].completedMissions).toEqual([1, 12]);
    expect(after.players[1].combinations).toHaveLength(2);
  });

  it('pioche à la défausse quand la carte visible débloque sa mission', () => {
    const missing = C('9h');
    const before = state({
      discardPile: [C('7d'), missing],
      players: [
        player('player1', 'Joueur 1'),
        player('ai', 'IA Cirque', {
          hand: [C('3s'), C('3c'), C('3h'), C('9d'), C('9c'), C('2d')],
          currentMission: 1,
        }),
      ],
    });

    expect(chooseAIDraw(before)).toBe(true);

    const after = aiMove(before);
    expect(after.players[1].completedMissions).toContain(1);
  });

  it('pioche à la défausse quand la carte visible complète une combinaison en formation', () => {
    const before = state({
      discardPile: [C('7d'), C('3h')],
      players: [
        player('player1', 'Joueur 1'),
        // Mission 1 : le 3♥ ne finit pas la mission, mais il complète le groupe de 3.
        player('ai', 'IA Cirque', { hand: [C('3s'), C('3c'), C('Kd')], currentMission: 1 }),
      ],
    });

    expect(chooseAIDraw(before)).toBe(true);
  });

  it('pioche au paquet quand la défausse ne sert à rien', () => {
    const before = state({
      discardPile: [C('7d'), C('Kc')],
      players: [
        player('player1', 'Joueur 1'),
        player('ai', 'IA Cirque', { hand: [C('3s'), C('5h'), C('9d')], currentMission: 1 }),
      ],
    });

    expect(chooseAIDraw(before)).toBe(false);
  });

  it('ne défausse pas un joker quand elle a des cartes normales', () => {
    const before = state({
      players: [
        player('player1', 'Joueur 1'),
        player('ai', 'IA Cirque', { hand: [J(0), C('2d'), C('7s')] }),
      ],
    });

    const discarded = chooseAIDiscard(before);
    expect(discarded).not.toBe(J(0).id);
  });

  it('garde ce qui sert sa mission : les valeurs répétées pour une mission de groupes', () => {
    const before = state({
      players: [
        player('player1', 'Joueur 1'),
        // Mission 1 : deux groupes. La suite en cœurs ne sert à rien ici.
        player('ai', 'IA Cirque', { hand: [C('3s'), C('3c'), C('Kd')], currentMission: 1 }),
      ],
    });

    expect(chooseAIDiscard(before)).toBe(C('Kd').id);
  });

  it('garde ce qui sert sa mission : les couleurs suivies pour une mission de suites', () => {
    const before = state({
      players: [
        player('player1', 'Joueur 1'),
        // Mission 3 : deux suites de 4. Les paires de même valeur ne servent à rien.
        player('ai', 'IA Cirque', { hand: [C('4h'), C('5h'), C('Kd'), C('Kc')], currentMission: 3 }),
      ],
    });

    const discarded = chooseAIDiscard(before);
    expect([C('Kd').id, C('Kc').id]).toContain(discarded);
  });

  it('après sa mission, étend les combinaisons posées et termine la manche', () => {
    const posed: Combination = {
      id: 'ai-threes',
      type: 'group',
      cards: [C('3s'), C('3c'), C('3h')],
    };
    const before = state({
      cardsDrawnThisTurn: 1,
      hasDrawnThisTurn: true,
      mustDiscardToEndTurn: true,
      deck: [C('4s'), C('5s'), C('6s')],
      players: [
        player('player1', 'Joueur 1'),
        player('ai', 'IA Cirque', {
          hand: [C('3d')],
          missionCompletedThisRound: true,
          combinations: [posed],
        }),
      ],
    });

    const after = aiMove(before);

    // Vider sa main termine la manche : une nouvelle est distribuée.
    expect(after.gameHistory.some(line => line.includes('termine la manche'))).toBe(true);
    expect(after.players.map(p => p.hand.length)).toEqual([13, 13]);
  });

  it('après sa mission, pose les groupes qu\'elle peut encore former', () => {
    const before = state({
      cardsDrawnThisTurn: 1,
      hasDrawnThisTurn: true,
      mustDiscardToEndTurn: true,
      players: [
        player('player1', 'Joueur 1'),
        player('ai', 'IA Cirque', {
          hand: [C('Ks'), C('Kc'), C('Kh'), C('2d'), C('7s')],
          missionCompletedThisRound: true,
          combinations: [{ id: 'ai-nines', type: 'group', cards: [C('9s'), C('9c'), C('9h')] }],
        }),
      ],
    });

    const after = aiMove(before);

    expect(after.players[1].combinations.some(c => c.cards.some(card => card.id === C('Ks').id)))
      .toBe(true);
  });

  it('joue un tour ordinaire quand rien n\'est posable', () => {
    const before = state({
      players: [
        player('player1', 'Joueur 1'),
        player('ai', 'IA Cirque', { hand: [C('2d'), C('7s'), C('Jc')], currentMission: 1 }),
      ],
    });

    const after = aiMove(before);

    expect(after.players[1].hand).toHaveLength(3);
    expect(after.players[1].combinations).toEqual([]);
    expect(after.discardPile).toHaveLength(before.discardPile.length + 1);
    expect(after.currentPlayerIndex).toBe(0);
  });
});

/**
 * L'IA contre elle-même, sur un hasard semé : la partie entière est reproductible,
 * donc ce test dit quelque chose de stable sur sa force et pas sur sa chance.
 */
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

type SelfPlay = { state: GameState; moves: number; credits: number; rounds: number };

const selfPlay = (seed: number, maxMoves: number): SelfPlay => {
  vi.spyOn(Math, 'random').mockImplementation(mulberry32(seed));

  let state = createInitialState('ai');
  let moves = 0;
  let credits = 0;
  let rounds = 0;

  while (!state.isGameOver && moves < maxMoves) {
    const before = state;
    state = aiMove(state);
    moves++;

    // Un tour doit toujours faire avancer la partie : même sans rien à poser, l'IA
    // pioche et défausse, donc l'état change.
    expect(state).not.toBe(before);

    const added = state.gameHistory.slice(before.gameHistory.length);
    if (added.some(line => line.includes('Nouvelle manche'))) rounds++;
    credits += added.filter(line => line.includes('complète la mission')).length;
  }

  return { state, moves, credits, rounds };
};

describe('une partie entière jouée par l\'IA', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('se gagne : sept missions accomplies, sans jamais bloquer un tour', () => {
    const { state, credits, rounds } = selfPlay(1, 1500);

    expect(state.isGameOver).toBe(true);
    expect(state.winner).toBeTruthy();
    expect(state.players.some(p => p.completedMissions.length >= 7)).toBe(true);
    expect(credits).toBeGreaterThanOrEqual(7);
    expect(rounds).toBeGreaterThan(0);
  }, 60_000);

  it('accomplit des missions et enchaîne les manches même sur une partie qui traîne', () => {
    // Certaines missions demandent douze cartes précises : la partie peut durer. L'IA
    // doit tout de même accomplir des missions et terminer des manches en chemin.
    const { credits, rounds } = selfPlay(5, 1500);

    expect(credits).toBeGreaterThan(0);
    expect(rounds).toBeGreaterThan(0);
  }, 60_000);
});
