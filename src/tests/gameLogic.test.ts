import { describe, it, expect } from 'vitest';
import {
  canAddToExistingCombination,
  isMissionCompleted,
  pickRandomMissionId,
} from '../utils/gameLogic';
import { Card, Combination, Mission, Player } from '../types/game';
import { createCard, createJokerCard } from './testUtils';
import { MISSIONS } from '../data/missions';

const mkCombination = (
  type: 'group' | 'sequence',
  cards: Card[],
  id = `combo-${Math.random()}`
): Combination => ({ id, type, cards });

const mkPlayer = (
  combinations: Combination[],
  completedMissions: number[] = [],
  currentMission = 1
): Pick<Player, 'combinations' | 'completedMissions' | 'currentMission'> => ({
  combinations,
  completedMissions,
  currentMission,
});

const findMission = (id: number): Mission => {
  const m = MISSIONS.find(x => x.id === id);
  if (!m) throw new Error(`Mission ${id} not found in fixtures`);
  return m;
};

describe('canAddToExistingCombination', () => {
  it('accepts adding a fourth distinct-suit card to a group of 3', () => {
    const combo = mkCombination('group', [
      createCard('7', 'clubs'),
      createCard('7', 'diamonds'),
      createCard('7', 'spades'),
    ]);
    expect(canAddToExistingCombination([createCard('7', 'hearts')], combo)).toBe(true);
  });

  it('rejects adding a card whose suit is already in the group (regression)', () => {
    // Two 7-of-clubs cards exist in the deck (two decks, distinct ids).
    // The old implementation only checked values matched, allowing this invalid add.
    const combo = mkCombination('group', [
      { id: '7-clubs-A', value: '7', suit: 'clubs' },
      createCard('7', 'diamonds'),
      createCard('7', 'spades'),
    ]);
    const duplicateSuit: Card = { id: '7-clubs-B', value: '7', suit: 'clubs' };
    expect(canAddToExistingCombination([duplicateSuit], combo)).toBe(false);
  });

  it('rejects adding a card with a different value to a group', () => {
    const combo = mkCombination('group', [
      createCard('7', 'clubs'),
      createCard('7', 'diamonds'),
      createCard('7', 'spades'),
    ]);
    expect(canAddToExistingCombination([createCard('8', 'hearts')], combo)).toBe(false);
  });

  it('accepts a joker added to a group', () => {
    const combo = mkCombination('group', [
      createCard('7', 'clubs'),
      createCard('7', 'diamonds'),
      createCard('7', 'spades'),
    ]);
    expect(canAddToExistingCombination([createJokerCard()], combo)).toBe(true);
  });

  it('accepts a card extending a sequence', () => {
    const combo = mkCombination('sequence', [
      createCard('4', 'spades'),
      createCard('5', 'spades'),
      createCard('6', 'spades'),
    ]);
    expect(canAddToExistingCombination([createCard('7', 'spades')], combo)).toBe(true);
    expect(canAddToExistingCombination([createCard('3', 'spades')], combo)).toBe(true);
  });

  it('rejects a card with wrong suit on a sequence', () => {
    const combo = mkCombination('sequence', [
      createCard('4', 'spades'),
      createCard('5', 'spades'),
      createCard('6', 'spades'),
    ]);
    expect(canAddToExistingCombination([createCard('7', 'hearts')], combo)).toBe(false);
  });

  it('rejects a non-consecutive card on a sequence', () => {
    const combo = mkCombination('sequence', [
      createCard('4', 'spades'),
      createCard('5', 'spades'),
      createCard('6', 'spades'),
    ]);
    expect(canAddToExistingCombination([createCard('K', 'spades')], combo)).toBe(false);
  });
});

describe('pickRandomMissionId', () => {
  const fixtures: Mission[] = [
    { id: 1, title: 'a', description: '', icon: '', requirements: {} },
    { id: 2, title: 'b', description: '', icon: '', requirements: {} },
    { id: 3, title: 'c', description: '', icon: '', requirements: {} },
  ];

  it('picks the first available mission when rng returns 0', () => {
    expect(pickRandomMissionId(fixtures, [], () => 0)).toBe(1);
  });

  it('skips already-completed missions', () => {
    expect(pickRandomMissionId(fixtures, [1], () => 0)).toBe(2);
    expect(pickRandomMissionId(fixtures, [1, 2], () => 0)).toBe(3);
  });

  it('selects deterministically based on rng', () => {
    // 3 missions, rng=0.5 -> floor(1.5)=1 -> index 1 -> id 2
    expect(pickRandomMissionId(fixtures, [], () => 0.5)).toBe(2);
    // rng=0.99 -> floor(2.97)=2 -> index 2 -> id 3
    expect(pickRandomMissionId(fixtures, [], () => 0.99)).toBe(3);
  });

  it('falls back to first mission id when nothing is available', () => {
    expect(pickRandomMissionId(fixtures, [1, 2, 3], () => 0)).toBe(1);
  });
});

describe('isMissionCompleted', () => {
  describe('Mission 1 — two groups of 3 (standard)', () => {
    const mission = findMission(1);

    it('returns true with two valid groups', () => {
      const player = mkPlayer([
        mkCombination('group', [createCard('7', 'clubs'), createCard('7', 'diamonds'), createCard('7', 'spades')]),
        mkCombination('group', [createCard('K', 'clubs'), createCard('K', 'diamonds'), createCard('K', 'spades')]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(true);
    });

    it('returns false with only one group', () => {
      const player = mkPlayer([
        mkCombination('group', [createCard('7', 'clubs'), createCard('7', 'diamonds'), createCard('7', 'spades')]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(false);
    });
  });

  describe('Mission 2 — sequence of 4 + group of 3 (minSequenceLength)', () => {
    const mission = findMission(2);

    it('returns true with seq>=4 and 1 group', () => {
      const player = mkPlayer([
        mkCombination('sequence', [
          createCard('4', 'spades'),
          createCard('5', 'spades'),
          createCard('6', 'spades'),
          createCard('7', 'spades'),
        ]),
        mkCombination('group', [createCard('K', 'clubs'), createCard('K', 'diamonds'), createCard('K', 'spades')]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(true);
    });

    it('returns false when sequence is only length 3', () => {
      const player = mkPlayer([
        mkCombination('sequence', [
          createCard('4', 'spades'),
          createCard('5', 'spades'),
          createCard('6', 'spades'),
        ]),
        mkCombination('group', [createCard('K', 'clubs'), createCard('K', 'diamonds'), createCard('K', 'spades')]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(false);
    });
  });

  describe('Mission 6 — sequence of 7, same suit', () => {
    const mission = findMission(6);

    it('returns true for a 7-long sequence in one suit', () => {
      const player = mkPlayer([
        mkCombination('sequence', [
          createCard('A', 'hearts'),
          createCard('2', 'hearts'),
          createCard('3', 'hearts'),
          createCard('4', 'hearts'),
          createCard('5', 'hearts'),
          createCard('6', 'hearts'),
          createCard('7', 'hearts'),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(true);
    });

    it('returns false when the sequence is 6 long', () => {
      const player = mkPlayer([
        mkCombination('sequence', [
          createCard('A', 'hearts'),
          createCard('2', 'hearts'),
          createCard('3', 'hearts'),
          createCard('4', 'hearts'),
          createCard('5', 'hearts'),
          createCard('6', 'hearts'),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(false);
    });
  });

  describe('Mission 7 — 7 cards same suit', () => {
    const mission = findMission(7);

    it('returns true when at least 7 normal cards share a suit across combinations', () => {
      const player = mkPlayer([
        mkCombination('sequence', [
          createCard('A', 'hearts'),
          createCard('2', 'hearts'),
          createCard('3', 'hearts'),
          createCard('4', 'hearts'),
        ]),
        mkCombination('group', [
          createCard('5', 'hearts'),
          createCard('5', 'diamonds'),
          createCard('5', 'spades'),
        ]),
        mkCombination('sequence', [
          createCard('6', 'hearts'),
          createCard('7', 'hearts'),
          createCard('8', 'hearts'),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(true);
    });
  });

  describe('Mission 12 — free choice', () => {
    const mission = findMission(12);

    it('completes if any prior mission was already done', () => {
      expect(isMissionCompleted(mkPlayer([], [3]), mission)).toBe(true);
    });
    it('does not complete if no missions have been done', () => {
      expect(isMissionCompleted(mkPlayer([], []), mission)).toBe(false);
    });
  });

  describe('Mission 13 — group of 4 + sequence of 4', () => {
    const mission = findMission(13);

    it('returns true with both', () => {
      const player = mkPlayer([
        mkCombination('group', [
          createCard('K', 'clubs'),
          createCard('K', 'diamonds'),
          createCard('K', 'spades'),
          createCard('K', 'hearts'),
        ]),
        mkCombination('sequence', [
          createCard('4', 'spades'),
          createCard('5', 'spades'),
          createCard('6', 'spades'),
          createCard('7', 'spades'),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(true);
    });

    it('returns false when group is only 3', () => {
      const player = mkPlayer([
        mkCombination('group', [
          createCard('K', 'clubs'),
          createCard('K', 'diamonds'),
          createCard('K', 'spades'),
        ]),
        mkCombination('sequence', [
          createCard('4', 'spades'),
          createCard('5', 'spades'),
          createCard('6', 'spades'),
          createCard('7', 'spades'),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(false);
    });
  });

  describe('Mission 14 — two groups of 4', () => {
    const mission = findMission(14);

    it('passes with two groups of 4', () => {
      const player = mkPlayer([
        mkCombination('group', [
          createCard('K', 'clubs'),
          createCard('K', 'diamonds'),
          createCard('K', 'spades'),
          createCard('K', 'hearts'),
        ]),
        mkCombination('group', [
          createCard('7', 'clubs'),
          createCard('7', 'diamonds'),
          createCard('7', 'spades'),
          createCard('7', 'hearts'),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(true);
    });

    it('fails when one group has only 3 cards', () => {
      const player = mkPlayer([
        mkCombination('group', [
          createCard('K', 'clubs'),
          createCard('K', 'diamonds'),
          createCard('K', 'spades'),
          createCard('K', 'hearts'),
        ]),
        mkCombination('group', [
          createCard('7', 'clubs'),
          createCard('7', 'diamonds'),
          createCard('7', 'spades'),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(false);
    });
  });

  describe('Mission 16 — sequence of 8 with at most 2 suits', () => {
    const mission = findMission(16);

    it('passes with an 8-long sequence in one suit', () => {
      const player = mkPlayer([
        mkCombination('sequence', [
          createCard('A', 'hearts'),
          createCard('2', 'hearts'),
          createCard('3', 'hearts'),
          createCard('4', 'hearts'),
          createCard('5', 'hearts'),
          createCard('6', 'hearts'),
          createCard('7', 'hearts'),
          createCard('8', 'hearts'),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(true);
    });

    it('fails when sequence cards span 3 suits', () => {
      const player = mkPlayer([
        mkCombination('sequence', [
          createCard('A', 'hearts'),
          createCard('2', 'hearts'),
          createCard('3', 'diamonds'),
          createCard('4', 'diamonds'),
          createCard('5', 'spades'),
          createCard('6', 'spades'),
          createCard('7', 'spades'),
          createCard('8', 'spades'),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(false);
    });
  });

  describe('Mission 21 — two sequences of 5, different suits', () => {
    const mission = findMission(21);

    it('passes with two same-length seqs in different suits', () => {
      const player = mkPlayer([
        mkCombination('sequence', [
          createCard('A', 'hearts'),
          createCard('2', 'hearts'),
          createCard('3', 'hearts'),
          createCard('4', 'hearts'),
          createCard('5', 'hearts'),
        ]),
        mkCombination('sequence', [
          createCard('A', 'spades'),
          createCard('2', 'spades'),
          createCard('3', 'spades'),
          createCard('4', 'spades'),
          createCard('5', 'spades'),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(true);
    });

    it('fails when both sequences share a suit', () => {
      const player = mkPlayer([
        mkCombination('sequence', [
          createCard('A', 'hearts'),
          createCard('2', 'hearts'),
          createCard('3', 'hearts'),
          createCard('4', 'hearts'),
          createCard('5', 'hearts'),
        ]),
        mkCombination('sequence', [
          createCard('6', 'hearts'),
          createCard('7', 'hearts'),
          createCard('8', 'hearts'),
          createCard('9', 'hearts'),
          createCard('10', 'hearts'),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(false);
    });
  });

  describe('Mission 24 — full suit A to K', () => {
    const mission = findMission(24);

    it('passes with 13-card sequence in one suit', () => {
      const player = mkPlayer([
        mkCombination('sequence', [
          createCard('A', 'spades'),
          createCard('2', 'spades'),
          createCard('3', 'spades'),
          createCard('4', 'spades'),
          createCard('5', 'spades'),
          createCard('6', 'spades'),
          createCard('7', 'spades'),
          createCard('8', 'spades'),
          createCard('9', 'spades'),
          createCard('10', 'spades'),
          createCard('J', 'spades'),
          createCard('Q', 'spades'),
          createCard('K', 'spades'),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(true);
    });
  });

  describe('Mission 28 — one red group + one black group', () => {
    const mission = findMission(28);

    it('passes with red and black groups', () => {
      const player = mkPlayer([
        mkCombination('group', [
          createCard('5', 'hearts'),
          createCard('5', 'diamonds'),
          createJokerCard(),
        ]),
        mkCombination('group', [
          createCard('K', 'spades'),
          createCard('K', 'clubs'),
          createJokerCard(),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(true);
    });

    it('fails when both groups are red', () => {
      const player = mkPlayer([
        mkCombination('group', [
          createCard('5', 'hearts'),
          createCard('5', 'diamonds'),
          createJokerCard(),
        ]),
        mkCombination('group', [
          createCard('K', 'hearts'),
          createCard('K', 'diamonds'),
          createJokerCard(),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(false);
    });
  });

  describe('Mission 29 — three suits, no diamonds', () => {
    const mission = findMission(29);

    it('passes when group has spades + clubs + hearts and no diamonds', () => {
      const player = mkPlayer([
        mkCombination('group', [
          createCard('5', 'spades'),
          createCard('5', 'clubs'),
          createCard('5', 'hearts'),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(true);
    });

    it('fails when group includes diamonds', () => {
      const player = mkPlayer([
        mkCombination('group', [
          createCard('5', 'spades'),
          createCard('5', 'clubs'),
          createCard('5', 'hearts'),
          createCard('5', 'diamonds'),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(false);
    });
  });

  describe('Mission 30 — red even sequence (2,4,6,8,10,Q)', () => {
    const mission = findMission(30);

    it('passes when all six even values are present in red cards', () => {
      const player = mkPlayer([
        mkCombination('sequence', [
          createCard('2', 'hearts'),
          createCard('4', 'hearts'),
          createCard('6', 'diamonds'),
          createCard('8', 'diamonds'),
          createCard('10', 'hearts'),
          createCard('Q', 'diamonds'),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(true);
    });

    it('fails when one even value is missing', () => {
      const player = mkPlayer([
        mkCombination('sequence', [
          createCard('2', 'hearts'),
          createCard('4', 'hearts'),
          createCard('6', 'diamonds'),
          createCard('8', 'diamonds'),
          createCard('10', 'hearts'),
        ]),
      ]);
      expect(isMissionCompleted(player, mission)).toBe(false);
    });
  });
});
