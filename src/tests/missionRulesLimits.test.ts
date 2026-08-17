import { describe, it, expect } from 'vitest';
import {
  findGroupsOnlyLayout,
  isValidGroup,
  isValidSequence,
  validateMissionFromSelection
} from '../utils/cardUtils';
import { canAddToExistingCombination, isMissionCompleted } from '../utils/gameLogic';
import { MISSIONS } from '../data/missions';
import { Card, CardSuit, CardValue, Combination, Mission } from '../types/game';

/**
 * Les bornes que les règles doivent refuser. Un joker remplace n'importe quelle carte,
 * mais une seule à la fois : il ne peut pas tenir deux rôles simultanément, ni faire
 * exister une combinaison impossible (un groupe de 5, une suite de 14).
 */

const SUITS: Record<string, CardSuit> = { h: 'hearts', d: 'diamonds', c: 'clubs', s: 'spades' };
const C = (spec: string, deck = 0): Card => {
  const suit = SUITS[spec.slice(-1)];
  const value = spec.slice(0, -1) as CardValue;
  return { id: `${value}-${suit}-${deck}`, value, suit };
};
const J = (i: number): Card => ({ id: `joker-${i}`, isJoker: true });
const mission = (id: number): Mission => MISSIONS.find(m => m.id === id)!;
const combo = (type: 'group' | 'sequence', cards: Card[], i = 0): Combination => ({ id: `c${i}`, cards, type });
const credited = (missionId: number, combinations: Combination[]) =>
  isMissionCompleted({ combinations, completedMissions: [] }, mission(missionId));

describe('un groupe ne dépasse pas quatre cartes', () => {
  it('refuse quatre couleurs plus un joker', () => {
    expect(isValidGroup([C('7h'), C('7d'), C('7c'), C('7s'), J(0)])).toBe(false);
  });

  it('refuse d\'étendre un groupe complet avec un joker', () => {
    expect(canAddToExistingCombination([J(0)], combo('group', [C('7h'), C('7d'), C('7c'), C('7s')]))).toBe(false);
  });

  it('ne pose jamais un groupe de cinq cartes', () => {
    const selection = [C('Ks'), C('Kh'), C('Kd'), C('Kc'), C('2s'), C('2h'), C('2d'), C('2c'), J(0)];
    const result = validateMissionFromSelection(selection, mission(1).requirements);
    const oversized = result.usedCombinations.filter(u => u.type === 'group' && u.cards.length > 4);
    expect(oversized).toEqual([]);
  });
});

describe('une suite tient dans A..K', () => {
  it('refuse une suite de 14 cartes', () => {
    const fullSuit = (['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as CardValue[])
      .map(v => C(`${v}h`));
    expect(isValidSequence([...fullSuit, J(0)])).toBe(false);
  });

  it('accepte 10-J-Q-K prolongé vers le bas par deux jokers', () => {
    // Placement possible : 8-9-10-J-Q-K, les jokers valant 8 et 9.
    expect(isValidSequence([C('10h'), C('Jh'), C('Qh'), C('Kh'), J(0), J(1)])).toBe(true);
  });

  it('accepte des jokers qui prolongent la suite vers le bas', () => {
    expect(isValidSequence([C('Jh'), C('Qh'), C('Kh'), J(0), J(1)])).toBe(true);
  });

  it('mission 24 : refuse une couleur de 14 cartes', () => {
    const selection = [
      C('Ah'), C('2h'), C('3h'), C('4h'), C('5h'), C('6h'), C('7h'), C('8h'), C('9h'), C('10h'),
      J(0), J(1), J(2), J(3),
    ];
    expect(validateMissionFromSelection(selection, mission(24).requirements).isValid).toBe(false);
  });
});

describe('un joker ne tient qu\'un rôle à la fois', () => {
  it('mission 7 : les jokers des autres combinaisons ne complètent pas la couleur', () => {
    expect(credited(7, [
      combo('sequence', [C('2h'), C('3h'), C('4h'), C('5h'), C('6h')], 0),
      combo('sequence', [C('7s'), C('8s'), J(0)], 1),
      combo('group', [C('Kd'), J(1), J(2)], 2),
    ])).toBe(false);
  });

  it('mission 20 : un joker qui remplace une carte paire n\'est pas impair', () => {
    expect(credited(20, [
      combo('group', [C('3h'), C('3s'), C('3c'), C('3d')], 0),
      combo('group', [C('8h'), J(0), J(1)], 1),
      combo('group', [C('4h'), C('4s'), J(2)], 2),
    ])).toBe(false);
  });

  it('mission 20 : un joker qui remplace une carte impaire compte', () => {
    expect(credited(20, [
      combo('group', [C('3h'), C('3s'), C('3c'), J(0)], 0),
      combo('group', [C('9d'), C('9c'), C('9h')], 1),
    ])).toBe(true);
  });

  it('mission 19 : les jokers des autres combinaisons ne complètent pas la suite', () => {
    expect(credited(19, [
      combo('sequence', [C('Ah'), C('2h'), C('3h'), C('4h'), C('5h')], 0),
      combo('group', [C('Kd'), C('Ks'), J(0), J(1)], 1),
      combo('group', [C('Qd'), C('Qs'), J(2), J(3)], 2),
    ])).toBe(false);
  });

  it('mission 30 : la suite paire rouge doit être rouge, jokers compris dans sa combinaison', () => {
    expect(credited(30, [
      combo('sequence', [C('2d'), C('4h'), C('6d')], 0),
      combo('group', [C('8s'), J(0), J(1)], 1),
      combo('group', [C('10s'), C('10c'), J(2)], 2),
    ])).toBe(false);
  });
});

describe('toutes les suites exigées atteignent la longueur demandée', () => {
  it('mission 3 : une suite de 4 et une de 3 ne suffisent pas', () => {
    expect(credited(3, [
      combo('sequence', [C('3h'), C('4h'), C('5h'), C('6h')], 0),
      combo('sequence', [C('9s'), C('10s'), C('Js')], 1),
    ])).toBe(false);
  });

  it('mission 3 : deux suites de 4 suffisent', () => {
    expect(credited(3, [
      combo('sequence', [C('3h'), C('4h'), C('5h'), C('6h')], 0),
      combo('sequence', [C('9s'), C('10s'), C('Js'), C('Qs')], 1),
    ])).toBe(true);
  });

  it('mission 11 : deux suites de 6 sont exigées, pas une seule', () => {
    expect(credited(11, [
      combo('sequence', [C('2h'), C('3h'), C('4h'), C('5h'), C('6h'), C('7h')], 0),
      combo('sequence', [C('9s'), C('10s'), C('Js')], 1),
    ])).toBe(false);
  });
});

describe('mission 29 : trois couleurs, dont au moins deux visibles', () => {
  it('refuse une seule couleur réelle', () => {
    const result = validateMissionFromSelection([C('5s'), J(0), J(1)], mission(29).requirements);
    expect(result.isValid).toBe(false);
  });

  it('accepte deux couleurs réelles et un joker', () => {
    const result = validateMissionFromSelection([C('5s'), C('5c'), J(0)], mission(29).requirements);
    expect(result.isValid).toBe(true);
  });
});

describe('la pose de fin de manche distribue des jokers distincts', () => {
  it('deux groupes à joker peuvent être posés ensemble', () => {
    const selection = [C('7s'), C('7h'), J(0), C('8s'), C('8h'), J(1)];
    const layout = findGroupsOnlyLayout(selection);

    expect(layout).not.toBeNull();
    expect(layout!.flatMap(u => u.cards.map(c => c.id)).sort())
      .toEqual(selection.map(c => c.id).sort());
  });
});
