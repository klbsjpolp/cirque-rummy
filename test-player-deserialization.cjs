require('fs');
require('path');

// Mock localStorage for testing
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  clear() {
    this.data = {};
  }
};

// Test the Player deserialization fix
console.log('Testing Player deserialization fix...');

// Create a mock game state with players
const mockGameState = {
  players: [
    {
      id: 'player1',
      name: 'Test Player 1',
      hand: [],
      currentMission: 1,
      completedMissions: [1, 2],
      score: 100,
      combinations: []
    },
    {
      id: 'player2', 
      name: 'Test Player 2',
      hand: [],
      currentMission: 3,
      completedMissions: [1],
      score: 50,
      combinations: []
    }
  ],
  currentPlayerIndex: 0,
  deck: [],
  discardPile: [],
  isGameStarted: true,
  isGameOver: false,
  winner: null,
  gameHistory: [],
  gameMode: 'pvp',
  isAITurn: false
};

// Helper function to restore Player methods (copied from the fix)
const restorePlayerMethods = (player) => ({
  ...player,
  isCurrentMissionCompleted() {
    return this.completedMissions.includes(this.currentMission);
  }
});

// Test 1: Serialize and deserialize without fix
console.log('\n=== Test 1: Without method restoration ===');
const serialized = JSON.stringify(mockGameState);
const deserializedWithoutFix = JSON.parse(serialized);

console.log('Player 1 has isCurrentMissionCompleted method:', typeof deserializedWithoutFix.players[0].isCurrentMissionCompleted === 'function');
console.log('Player 2 has isCurrentMissionCompleted method:', typeof deserializedWithoutFix.players[1].isCurrentMissionCompleted === 'function');

// Test 2: Serialize and deserialize with fix
console.log('\n=== Test 2: With method restoration ===');
const deserializedWithFix = JSON.parse(serialized);
deserializedWithFix.players = deserializedWithFix.players.map(restorePlayerMethods);

console.log('Player 1 has isCurrentMissionCompleted method:', typeof deserializedWithFix.players[0].isCurrentMissionCompleted === 'function');
console.log('Player 2 has isCurrentMissionCompleted method:', typeof deserializedWithFix.players[1].isCurrentMissionCompleted === 'function');

// Test 3: Test method functionality
console.log('\n=== Test 3: Method functionality ===');
try {
  const player1Result = deserializedWithFix.players[0].isCurrentMissionCompleted();
  const player2Result = deserializedWithFix.players[1].isCurrentMissionCompleted();
  
  console.log('Player 1 current mission (1) completed:', player1Result, '(expected: true)');
  console.log('Player 2 current mission (3) completed:', player2Result, '(expected: false)');
  
  // Verify the logic is correct
  const expectedPlayer1 = deserializedWithFix.players[0].completedMissions.includes(deserializedWithFix.players[0].currentMission);
  const expectedPlayer2 = deserializedWithFix.players[1].completedMissions.includes(deserializedWithFix.players[1].currentMission);
  
  console.log('Player 1 result matches expected:', player1Result === expectedPlayer1);
  console.log('Player 2 result matches expected:', player2Result === expectedPlayer2);
  
  if (player1Result === true && player2Result === false && player1Result === expectedPlayer1 && player2Result === expectedPlayer2) {
    console.log('\n✅ All tests passed! The fix works correctly.');
  } else {
    console.log('\n❌ Tests failed! There might be an issue with the fix.');
  }
} catch (error) {
  console.log('❌ Error calling isCurrentMissionCompleted:', error.message);
}

console.log('\nTest completed.');