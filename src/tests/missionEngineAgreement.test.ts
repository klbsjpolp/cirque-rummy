import { describe, it, expect } from 'vitest';
import { validateMissionFromSelection } from '../utils/cardUtils';
import { isMissionCompleted } from '../utils/gameLogic';
import { MISSIONS } from '../data/missions';
import { Card, CardSuit, CardValue, Combination, Mission } from '../types/game';

/**
 * The presenter (`validateMissionFromSelection`) decides whether a selection may be
 * laid down; the checker (`isMissionCompleted`) decides whether the mission is credited.
 * If they ever disagree, the player loses the cards and gets nothing — so this file
 * asserts, for every mission, that anything the presenter accepts the checker credits.
 */

const SUITS: Record<string, CardSuit> = { h: 'hearts', d: 'diamonds', c: 'clubs', s: 'spades' };

/** `C('10h')` → 10 of hearts. Second copy of the same card: `C('7h', 1)`. */
const C = (spec: string, deck = 0): Card => {
  const suitKey = spec.slice(-1);
  const value = spec.slice(0, -1) as CardValue;
  const suit = SUITS[suitKey];
  if (!suit) throw new Error(`bad suit in card spec: ${spec}`);
  return { id: `${value}-${suit}-${deck}`, value, suit };
};

let jokerSeq = 0;
const J = (): Card => ({ id: `joker-${jokerSeq++}`, isJoker: true });

const hand = (...specs: (string | Card)[]): Card[] =>
  specs.map(s => (typeof s === 'string' ? C(s) : s));

const asCombinations = (used: { cards: Card[]; type: 'group' | 'sequence' }[]): Combination[] =>
  used.map((u, i) => ({ id: `combo-${i}`, cards: u.cards, type: u.type }));

const mission = (id: number): Mission => {
  const m = MISSIONS.find(x => x.id === id);
  if (!m) throw new Error(`mission ${id} not found`);
  return m;
};

/** Runs both engines over one selection and reports what each concluded. */
const runBothEngines = (missionId: number, cards: Card[]) => {
  const m = mission(missionId);
  const presented = validateMissionFromSelection(cards, m.requirements);
  const credited = isMissionCompleted(
    { combinations: asCombinations(presented.usedCombinations), completedMissions: [] },
    m
  );
  return { presented: presented.isValid, credited, layout: presented.usedCombinations };
};

/** A selection the game should accept end to end: laid down *and* credited. */
const expectPlayable = (missionId: number, cards: Card[]) => {
  const { presented, credited } = runBothEngines(missionId, cards);
  expect(
    { mission: missionId, presented, credited },
    `mission ${missionId}: ${mission(missionId).title}`
  ).toEqual({ mission: missionId, presented: true, credited: true });
};

// Every mission that can be satisfied without jokers, with a hand-built selection.
const JOKERLESS: Array<[number, Card[]]> = [
  [1,  hand('3s', '3c', '3h', '9d', '9c', '9h')],
  [2,  hand('4s', '5s', '6s', '7s', '9h', '9d', '9c')],
  [3,  hand('3c', '4c', '5c', '6c', '9h', '10h', 'Jh', 'Qh')],
  [4,  hand('5d', '5c', '5s', '8s', '8h', '8c', 'Qd', 'Qs', 'Qh')],
  [5,  hand('2s', '3s', '4s', '5s', '6c', '6d', '6h', 'Jc', 'Jd', 'Js')],
  [6,  hand('3h', '4h', '5h', '6h', '7h', '8h', '9h')],
  [7,  hand('2s', '4s', '5s', '7s', '9s', 'Js', 'Ks')],
  [8,  hand('2c', '3c', '4c', '5c', '7h', '8h', '9h', '10h', 'Qd', 'Qs', 'Qc')],
  [9,  hand('3d', '3s', '3h', '6c', '6s', '6d', '8c', '8d', '8h', 'Ks', 'Kc', 'Kh')],
  [10, hand('As', '2s', '3s', '4s', '6h', '7h', '8h', '9h', '9c', '10c', 'Jc', 'Qc')],
  [11, hand('2s', '3s', '4s', '5s', '6s', '7s', '8d', '9d', '10d', 'Jd', 'Qd', 'Kd')],
  [13, hand('8h', '8c', '8d', '8s', '3d', '4d', '5d', '6d')],
  [14, hand('9s', '9d', '9c', '9h', 'Qc', 'Qd', 'Qs', 'Qh')],
  [15, hand('4s', '5s', '6s', '7s', '8s', '2c', '2d', '2h')],
  [16, hand('5s', '6s', '7s', '8s', '9s', '10c', 'Jc', 'Qc')],
  [17, hand('3c', '3h', '3s', '7d', '7c', '7s', 'Ah', 'As', 'Ac', 'Ad')],
  [18, hand('2d', '3d', '4d', '5s', '6s', '7s', '8c', '9c', '10c')],
  [19, hand('As', '2d', '3s', '4c', '5h', '6c', '7s', '8d', '9c')],
  [20, hand('3s', '3c', '3h', '9d', '9c', '9h', 'Ks', 'Kc', 'Kh')],
  [21, hand('2c', '3c', '4c', '5c', '6c', '7d', '8d', '9d', '10d', 'Jd')],
  [23, hand('5h', '5c', '5s', '5d', '8c', '8d', '8s', '8h', 'Ks', 'Kd', 'Kc', 'Kh')],
  [24, hand('Ad', '2d', '3d', '4d', '5d', '6d', '7d', '8d', '9d', '10d', 'Jd', 'Qd', 'Kd')],
  [25, hand('7h', '8h', '9h', '10h')],
  [26, hand('3s', '4s', '5s', '6s', '9c', '10c', 'Jc', 'Qc')],
  [27, hand('4d', '5d', '6d', '7d', '8d')],
  [29, hand('Qs', 'Qc', 'Qh')],
  [30, hand('2d', '4h', '6d', '8h', '10d', 'Qh')],
];

// The same missions again, with jokers standing in for cards. This is where the two
// engines diverged: the presenter treats a joker as any card, the checker used to
// count only real cards.
const WITH_JOKERS: Array<[number, Card[]]> = [
  [1,  hand('3s', '3c', J(), '9d', '9c', '9h')],
  [2,  hand('4s', '5s', J(), '7s', '9h', '9d', '9c')],
  [3,  hand('3c', '4c', J(), '6c', '9h', '10h', 'Jh', 'Qh')],
  [4,  hand('5d', '5c', J(), '8s', '8h', '8c', 'Qd', 'Qs', 'Qh')],
  [6,  hand('3h', '4h', '5h', J(), '7h', '8h', '9h')],
  [7,  hand('2s', '4s', '5s', '7s', '9s', 'Js', J())],
  [9,  hand('3d', '3s', J(), '6c', '6s', '6d', '8c', '8d', '8h', 'Ks', 'Kc', 'Kh')],
  [11, hand('2s', '3s', '4s', '5s', '6s', J(), '8d', '9d', '10d', 'Jd', 'Qd', 'Kd')],
  [13, hand('8h', '8c', '8d', J(), '3d', '4d', '5d', '6d')],
  [14, hand('9s', '9d', '9c', J(), 'Qc', 'Qd', 'Qs', 'Qh')],
  [16, hand('5s', '6s', '7s', J(), '9s', '10c', 'Jc', 'Qc')],
  [18, hand('2d', '3d', J(), '5s', '6s', '7s', '8c', '9c', '10c')],
  [19, hand('As', '2d', '3s', J(), '5h', '6c', '7s', '8d', '9c')],
  [20, hand('3s', '3c', '3h', '9d', '9c', '9h', J())],
  [21, hand('2c', '3c', J(), '5c', '6c', '7d', '8d', '9d', '10d', 'Jd')],
  [24, hand('Ad', '2d', '3d', '4d', '5d', J(), '7d', '8d', '9d', '10d', 'Jd', 'Qd', 'Kd')],
  [25, hand('7h', '8h', '9h', J())],
  [26, hand('3s', '4s', J(), '6s', '9c', '10c', 'Jc', 'Qc')],
  [27, hand('4d', '5d', J(), '7d', '8d')],
  [29, hand('Qs', 'Qc', J())],
  [30, hand('2d', '4h', '6d', '8h', J(), 'Qh')],
  // Mission 28 wants an all-red group of 3, but only two red suits exist, so a group of
  // three different red suits is impossible: this mission always needs a joker per group.
  [28, hand('7h', '7d', J(), '10c', '10s', J())],
];

describe('mission engines agree (jokerless selections)', () => {
  it.each(JOKERLESS)('mission %i is laid down and credited', (id, cards) => {
    expectPlayable(id, cards);
  });
});

describe('mission engines agree (jokers standing in for cards)', () => {
  it.each(WITH_JOKERS)('mission %i is laid down and credited', (id, cards) => {
    expectPlayable(id, cards);
  });
});

describe('presenter and checker never disagree', () => {
  it('accepts nothing it will not credit, across every selection above', () => {
    const disagreements = [...JOKERLESS, ...WITH_JOKERS]
      .map(([id, cards]) => ({ id, ...runBothEngines(id, cards) }))
      .filter(r => r.presented && !r.credited)
      .map(r => `mission ${r.id} (${mission(r.id).title})`);

    expect(disagreements).toEqual([]);
  });
});

describe('known gaps', () => {
  it('mission 12 (Mission libre) still cannot be presented', () => {
    // Tracked separately: `free_choice` has no presenter case, so the mission is a dead
    // end until the "replay a completed mission" picker exists.
    const { presented } = runBothEngines(12, hand('3s', '3c', '3h'));
    expect(presented).toBe(false);
  });
});
