const { validateMissionFromSelection } = require('./src/utils/cardUtils.ts');
const { MISSIONS } = require('./src/data/missions.ts');

// Test script to verify the new mission validation logic
console.log('Testing mission validation with free card selection...');

// Create test cards
function createCard(value, suit) {
  return {
    id: `${value}-${suit}-${Math.random()}`,
    value,
    suit,
    type: 'normal'
  };
}

// Test Mission 1: Two groups of 3
console.log('\n=== Testing Mission 1: Two groups of 3 ===');
const selectedCards = [
  createCard('7', 'clubs'),
  createCard('7', 'diamonds'), 
  createCard('7', 'spades'),
  createCard('J', 'clubs'),
  createCard('J', 'diamonds'),
  createCard('J', 'hearts')
];

const mission1 = MISSIONS.find(m => m.id === 1);
console.log('Mission 1 requirements:', mission1.requirements);

try {
  const validation = validateMissionFromSelection(selectedCards, mission1.requirements);
  console.log('Validation result:', validation);
} catch (error) {
  console.log('Error during validation:', error.message);
}

console.log('Test script completed.');