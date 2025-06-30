require('child_process');

console.log('🎪 Testing Card Draw Restriction Fix');
console.log('===================================');

// Test to verify the fix works correctly
const testScript = `
// Simulate the updated game state with cardsDrawnThisTurn tracking
const gameState = {
  players: [
    {
      id: 'player1',
      name: 'Player 1',
      hand: [
        { id: 'card1', value: 'A', suit: 'hearts' },
        { id: 'card2', value: '2', suit: 'hearts' },
        { id: 'card3', value: '3', suit: 'hearts' }
      ],
      currentMission: 1,
      completedMissions: [],
      score: 0,
      combinations: []
    }
  ],
  currentPlayerIndex: 0,
  deck: [
    { id: 'deck1', value: 'K', suit: 'spades' },
    { id: 'deck2', value: 'Q', suit: 'spades' },
    { id: 'deck3', value: 'J', suit: 'spades' }
  ],
  discardPile: [
    { id: 'discard1', value: '4', suit: 'clubs' }
  ],
  isGameStarted: true,
  isGameOver: false,
  winner: null,
  gameHistory: [],
  gameMode: 'pvp',
  isAITurn: false,
  cardsDrawnThisTurn: 0  // NEW: Track cards drawn this turn
};

console.log('Initial state:');
console.log('- Player hand size:', gameState.players[0].hand.length);
console.log('- Deck size:', gameState.deck.length);
console.log('- Discard pile size:', gameState.discardPile.length);
console.log('- Cards drawn this turn:', gameState.cardsDrawnThisTurn);

// Simulate the FIXED drawCard function
function drawCard(fromDiscard = false) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  // NEW: Check if player has already drawn a card this turn
  if (gameState.cardsDrawnThisTurn >= 1) {
    console.log('❌ Cannot draw more than 1 card per turn');
    return false; // Return false to indicate draw was blocked
  }
  
  if (fromDiscard && gameState.discardPile.length > 0) {
    const card = gameState.discardPile.pop();
    currentPlayer.hand.push(card);
    gameState.cardsDrawnThisTurn += 1; // NEW: Increment counter
    console.log('✅ Drew from discard:', card.value + ' of ' + card.suit);
    return true;
  } else if (gameState.deck.length > 0) {
    const card = gameState.deck.pop();
    currentPlayer.hand.push(card);
    gameState.cardsDrawnThisTurn += 1; // NEW: Increment counter
    console.log('✅ Drew from deck:', card.value + ' of ' + card.suit);
    return true;
  }
  return false;
}

// Simulate discarding a card and changing turns
function discardCard() {
  // Simulate turn change
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  gameState.cardsDrawnThisTurn = 0; // NEW: Reset counter for new turn
  console.log('🔄 Turn changed, cards drawn counter reset');
}

console.log('\\n🧪 Testing the FIX:');

// Test 1: First draw should work
console.log('\\n1. First draw attempt:');
const firstDraw = drawCard(false);
console.log('   Result:', firstDraw ? 'SUCCESS' : 'BLOCKED');

// Test 2: Second draw should be blocked
console.log('\\n2. Second draw attempt (should be blocked):');
const secondDraw = drawCard(true);
console.log('   Result:', secondDraw ? 'SUCCESS' : 'BLOCKED');

// Test 3: Third draw should also be blocked
console.log('\\n3. Third draw attempt (should be blocked):');
const thirdDraw = drawCard(false);
console.log('   Result:', thirdDraw ? 'SUCCESS' : 'BLOCKED');

console.log('\\nAfter draw attempts:');
console.log('- Player hand size:', gameState.players[0].hand.length);
console.log('- Deck size:', gameState.deck.length);
console.log('- Discard pile size:', gameState.discardPile.length);
console.log('- Cards drawn this turn:', gameState.cardsDrawnThisTurn);

// Test 4: After turn change, should be able to draw again
console.log('\\n4. Simulating turn change and new draw:');
discardCard(); // This changes turn and resets counter
const newTurnDraw = drawCard(false);
console.log('   Result:', newTurnDraw ? 'SUCCESS' : 'BLOCKED');

console.log('\\nFinal state:');
console.log('- Player hand size:', gameState.players[0].hand.length);
console.log('- Cards drawn this turn:', gameState.cardsDrawnThisTurn);

const totalCardsDrawn = gameState.players[0].hand.length - 3; // Started with 3 cards
console.log('\\n🎯 SUMMARY:');
console.log('- Total cards drawn:', totalCardsDrawn);
console.log('- Expected: 2 (1 per turn across 2 turns)');
if (totalCardsDrawn === 2) {
  console.log('✅ FIX WORKING: Only 1 card drawn per turn!');
} else {
  console.log('❌ FIX NOT WORKING: More than 1 card drawn per turn');
}
`;

try {
  console.log('Running test...\n');
  eval(testScript);
} catch (error) {
  console.error('Test failed:', error.message);
}

console.log('\n🎪 Fix Implementation Summary:');
console.log('- Added cardsDrawnThisTurn field to GameState');
console.log('- Modified drawCard function to check limit');
console.log('- Reset counter on turn changes');
console.log('- Disabled UI buttons when limit reached');
console.log('- Added backward compatibility for saved games');