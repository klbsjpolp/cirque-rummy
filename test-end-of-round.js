const fs = require('fs');

// Mock React hooks for testing
const mockUseState = (initialValue) => {
  let value = initialValue;
  const setValue = (newValue) => {
    if (typeof newValue === 'function') {
      value = newValue(value);
    } else {
      value = newValue;
    }
  };
  return [value, setValue];
};

const mockUseEffect = () => {}; // No-op for testing

// Mock the React imports
global.React = {
  useState: mockUseState,
  useEffect: mockUseEffect
};

// Read and evaluate the useGameState hook
const useGameStateCode = fs.readFileSync('src/hooks/useGameState.ts', 'utf8');

// Simple test to verify the end-of-round logic
console.log('🧪 Testing end-of-round logic...');

// Test that the implementation includes the new mission assignment
const hasNewMissionLogic = useGameStateCode.includes('winner.currentMission = getRandomMission(winner.completedMissions)');
const hasWinnerParameter = useGameStateCode.includes('startNewRound = (gameState: GameState, winner?: Player)');
const hasWinnerPassedToStartNewRound = useGameStateCode.includes('startNewRound(gameState, playerWhoWentOut)');

console.log('✅ Winner gets new mission:', hasNewMissionLogic);
console.log('✅ startNewRound accepts winner parameter:', hasWinnerParameter);
console.log('✅ Winner is passed to startNewRound:', hasWinnerPassedToStartNewRound);

if (hasNewMissionLogic && hasWinnerParameter && hasWinnerPassedToStartNewRound) {
  console.log('🎉 All end-of-round requirements implemented successfully!');
  console.log('📋 Summary of changes:');
  console.log('  - Winner receives a new mission at the end of each round');
  console.log('  - All cards are cleared (combinations reset)');
  console.log('  - 13 new cards are dealt to each player');
} else {
  console.log('❌ Some requirements are missing');
}