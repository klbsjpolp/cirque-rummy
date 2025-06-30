require('child_process');

console.log('🎪 Testing Card Draw Restriction Issue');
console.log('=====================================');

// Test to verify the current behavior allows multiple card draws per turn
const testScript = `
// Simulate the current game state and test multiple card draws
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
  isAITurn: false
};

console.log('Initial state:');
console.log('- Player hand size:', gameState.players[0].hand.length);
console.log('- Deck size:', gameState.deck.length);
console.log('- Discard pile size:', gameState.discardPile.length);

// Simulate drawing from deck (current behavior)
function drawCard(fromDiscard = false) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  if (fromDiscard && gameState.discardPile.length > 0) {
    const card = gameState.discardPile.pop();
    currentPlayer.hand.push(card);
    console.log('Drew from discard:', card.value + ' of ' + card.suit);
  } else if (gameState.deck.length > 0) {
    const card = gameState.deck.pop();
    currentPlayer.hand.push(card);
    console.log('Drew from deck:', card.value + ' of ' + card.suit);
  }
}

console.log('\\n🚨 Testing multiple draws in same turn (CURRENT ISSUE):');

// Draw multiple cards in the same turn (this should be restricted)
drawCard(false); // Draw from deck
drawCard(true);  // Draw from discard
drawCard(false); // Draw from deck again

console.log('\\nAfter multiple draws:');
console.log('- Player hand size:', gameState.players[0].hand.length);
console.log('- Deck size:', gameState.deck.length);
console.log('- Discard pile size:', gameState.discardPile.length);

console.log('\\n❌ ISSUE CONFIRMED: Player was able to draw', gameState.players[0].hand.length - 3, 'cards in one turn!');
console.log('✅ EXPECTED: Player should only be able to draw 1 card per turn');
`;

try {
  console.log('Running test...\n');
  eval(testScript);
} catch (error) {
  console.error('Test failed:', error.message);
}

console.log('\n🎯 SOLUTION NEEDED:');
console.log('- Add tracking for cards drawn per turn');
console.log('- Modify drawCard function to check if card already drawn');
console.log('- Update UI to disable draw buttons after first draw');
console.log('- Reset draw counter when turn changes');