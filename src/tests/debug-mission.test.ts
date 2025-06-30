import { describe, it, expect } from 'vitest'
import { MISSIONS } from '../data/missions'
import { validateMissionFromSelection } from '../utils/cardUtils'
import { createCard } from './testUtils'

describe('Debug Mission Test', () => {
  it('should test just Mission 1 basic case', () => {
    console.log('🔍 Starting debug test for Mission 1');

    const mission = MISSIONS.find(m => m.id === 1);
    console.log('📋 Mission found:', mission);

    const cards = [
      createCard('7', 'clubs'),
      createCard('7', 'diamonds'),
      createCard('7', 'spades'),
      createCard('J', 'clubs'),
      createCard('J', 'diamonds'),
      createCard('J', 'hearts')
    ];

    console.log('🃏 Cards created:', cards.map(c => `${c.value}-${c.suit}`));
    console.log('🔄 About to call validateMissionFromSelection...');

    const result = validateMissionFromSelection(cards, mission.requirements);

    console.log('✅ validateMissionFromSelection completed');
    console.log('📊 Result:', result);

    expect(result.isValid).toBe(true);
  });
});
