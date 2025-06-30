# Cirque Rummy Game Mechanics Test Suite

This test suite provides comprehensive coverage of the Cirque Rummy game mechanics based on the game description in the main README.md file. The tests are designed to validate the core game logic and ensure the base game mechanics work correctly.

## Test Coverage

### 1. Card Utilities (`cardUtils.test.ts`)
Tests the fundamental card operations:
- **Deck Creation**: Validates that a deck contains 108 cards (2 standard decks + 4 jokers)
- **Deck Shuffling**: Ensures shuffling maintains card count and doesn't modify original deck
- **Card Value Conversion**: Tests numeric conversion for face cards (A=1, J=11, Q=12, K=13)
- **Suit Symbols and Colors**: Validates suit symbol display and color classification
- **Group Validation**: Tests the rule "3+ cards of same value, different suits"
- **Sequence Validation**: Tests the rule "3+ consecutive cards of same suit"
- **Joker Handling**: Validates joker usage in combinations

### 2. Mission System (`missions.test.ts`)
Tests the mission mechanics:
- **Mission Data Structure**: Validates all 30 missions are properly defined
- **Basic Missions**: Tests missions 1-4 (groups and sequences)
- **Advanced Missions**: Tests complex missions like "7 cards same suit"
- **Special Requirements**: Tests missions with specific suit/value constraints
- **Mission Validation Logic**: Ensures mission requirements match game rules
- **Game Flow Rules**: Tests turn structure, round ending, mission progression

### 3. Game Flow (`gameFlow.test.ts`)
Tests the overall game mechanics:
- **Game Initialization**: 2 players, 13 cards each, proper deck setup
- **Turn Mechanics**: Draw → Play (optional) → Discard sequence
- **Combination Laying**: Validates laying groups and sequences
- **Extending Combinations**: Tests post-mission completion rules
- **Round Ending**: Tests round end conditions and new round setup
- **Game Ending**: Tests win condition (7 completed missions)
- **AI Player Support**: Tests AI vs Human gameplay mechanics
- **Game State Validation**: Ensures consistent game state throughout

## Key Game Rules Tested

Based on the README.md description, the tests validate:

1. **Basic Mechanics**:
   - Turn-based gameplay with alternating players
   - Draw → Play (optional) → Discard turn structure
   - Groups: 3+ cards same value, different suits
   - Sequences: 3+ consecutive cards, same suit
   - Jokers can replace any card in combinations

2. **Mission System**:
   - 30 different missions with varying requirements
   - Random mission assignment
   - 7 missions needed to win
   - Mission progression rules

3. **Round Management**:
   - Round ends when player has no cards
   - New round: 13 cards per player, combinations reset
   - Mission continuation vs. new mission assignment

4. **Post-Mission Rules**:
   - Extend own combinations after mission completion
   - Extend opponent combinations (if both completed missions)
   - Form new groups of 3+ cards

5. **AI Integration**:
   - AI vs Human gameplay support
   - Hidden AI missions
   - Automatic AI turn handling

## Running the Tests

```bash
# Run all tests once
npm run test:run

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui
```

## Test Results

The test suite currently includes:
- **83 total tests**
- **82 passing tests**
- **1 failing test** (joker handling in sequences - identifies potential implementation issue)

## Important Notes

1. **Test-Driven Validation**: These tests are based on the game description in README.md, not the current implementation. They serve as a specification for how the game should work.

2. **Implementation Issues**: Failing tests indicate areas where the current implementation may not match the intended game mechanics.

3. **Future Development**: Always run these tests when making changes to ensure base game logic remains intact.

4. **Joker Handling**: The failing test reveals that joker handling in sequences may need attention in the implementation.

## Test Philosophy

These tests follow the principle of testing the **intended behavior** described in the game rules rather than the current implementation. This approach helps identify discrepancies between the specification and implementation, ensuring the game works as designed.

## Adding New Tests

When adding new features or modifying game mechanics:

1. First, add tests that describe the expected behavior
2. Run tests to see current state
3. Implement the feature to make tests pass
4. Ensure all existing tests still pass

This approach maintains the integrity of the base game mechanics while allowing for safe feature development.