
import { useState, useEffect } from 'react';
import {GameState, Player, Card, Combination, NormalCard} from '../types/game';
import {
  createDeck,
  isValidGroup,
  isValidSequence,
  isJokerCard,
  isNormalCard,
  validateMissionFromSelection,
  findAllValidCombinations
} from '../utils/cardUtils';
import { MISSIONS } from '../data/missions';
import { AIPlayer } from '../utils/aiPlayer';

const STORAGE_KEY = 'cirque-rummy-game-state';

const getRandomMission = (completedMissions: number[]): number => {
  const availableMissions = MISSIONS.filter(mission => !completedMissions.includes(mission.id));
  if (availableMissions.length === 0) return 1; // Fallback, should not happen
  const randomIndex = Math.floor(Math.random() * availableMissions.length);
  return availableMissions[randomIndex].id;
};

const createPlayer = (id: string, name: string): Player => ({
  id,
  name,
  hand: [],
  currentMission: getRandomMission([]),
  completedMissions: [],
  score: 0,
  combinations: [],

  // Méthode pour vérifier si la mission actuelle est complétée
  isCurrentMissionCompleted() {
    return this.completedMissions.includes(this.currentMission);
  }
});

const initialGameState = (gameMode: 'pvp' | 'ai' = 'pvp'): GameState => {
  const deck = createDeck();
  const player1 = createPlayer('player1', 'Joueur 1');
  const player2 = createPlayer('player2', gameMode === 'ai' ? 'IA Cirque' : 'Joueur 2');

  // Distribuer 13 cartes à chaque joueur
  player1.hand = deck.splice(0, 13);
  player2.hand = deck.splice(0, 13);

  // Première carte sur la pile de défausse
  const discardPile = [deck.pop()!];

  return {
    players: [player1, player2],
    currentPlayerIndex: 0,
    deck,
    discardPile,
    isGameStarted: true,
    isGameOver: false,
    winner: null,
    gameHistory: ['Nouvelle partie commencée'],
    gameMode,
    isAITurn: false,
    cardsDrawnThisTurn: 0,
    hasDrawnThisTurn: false,
    mustDiscardToEndTurn: false
  };
};

// Helper function to restore Player methods after deserialization
const restorePlayerMethods = (player: Omit<Player, 'isCurrentMissionCompleted'>): Player => ({
  ...player,
  isCurrentMissionCompleted() {
    return this.completedMissions.includes(this.currentMission);
  }
});

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        // Restore Player methods that are lost during JSON serialization
        parsedState.players = parsedState.players.map(restorePlayerMethods);

        // Handle backward compatibility: add missing fields
        if (parsedState.cardsDrawnThisTurn === undefined) {
          parsedState.cardsDrawnThisTurn = 0;
        }
        if (parsedState.hasDrawnThisTurn === undefined) {
          parsedState.hasDrawnThisTurn = false;
        }
        if (parsedState.mustDiscardToEndTurn === undefined) {
          parsedState.mustDiscardToEndTurn = false;
        }

        return parsedState;
      } catch (error) {
        console.error('Erreur lors du chargement de la partie:', error);
      }
    }
    return initialGameState();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  // Handle AI turns
  useEffect(() => {
    if (gameState.isAITurn && !gameState.isGameOver) {
      const timer = setTimeout(() => {
        setGameState(prev => {
          const newState = { ...prev };
          AIPlayer.makeMove(newState);
          newState.isAITurn = false;
          return newState;
        });
      }, 1500); // 1.5 second delay for AI move

      return () => clearTimeout(timer);
    }
  }, [gameState.isAITurn, gameState.isGameOver]);

  const drawCard = (fromDiscard: boolean = false) => {
    setGameState(prev => {
      const newState = { ...prev };
      const currentPlayer = newState.players[newState.currentPlayerIndex];

      // Check if player has already drawn a card this turn
      if (newState.cardsDrawnThisTurn >= 1) {
        console.log('Cannot draw more than 1 card per turn');
        return prev; // Return unchanged state
      }

      if (fromDiscard && newState.discardPile.length > 0) {
        const card = newState.discardPile.pop()!;
        currentPlayer.hand.push(card);
        newState.gameHistory.push(`${currentPlayer.name} pioche de la défausse`);
        newState.cardsDrawnThisTurn += 1;
        newState.hasDrawnThisTurn = true;
        newState.mustDiscardToEndTurn = true;
      } else if (newState.deck.length > 0) {
        const card = newState.deck.pop()!;
        currentPlayer.hand.push(card);
        newState.gameHistory.push(`${currentPlayer.name} pioche du paquet`);
        newState.cardsDrawnThisTurn += 1;
        newState.hasDrawnThisTurn = true;
        newState.mustDiscardToEndTurn = true;
      }

      return newState;
    });
  };

  const discardCard = (cardId: string) => {
    setGameState(prev => {
      const newState = { ...prev };
      const currentPlayer = newState.players[newState.currentPlayerIndex];

      // Enforce mandatory draw: player must have drawn a card before discarding
      if (!newState.hasDrawnThisTurn) {
        console.log('Must draw a card before discarding');
        return prev; // Return unchanged state
      }

      const cardIndex = currentPlayer.hand.findIndex(card => card.id === cardId);
      if (cardIndex !== -1) {
        const card = currentPlayer.hand.splice(cardIndex, 1)[0];
        newState.discardPile.push(card);
        newState.gameHistory.push(`${currentPlayer.name} défausse ${isJokerCard(card) ? 'Joker' : card.value + getSuitSymbol(card.suit)}`);

        // Check if round ends (player went out)
        const roundEnded = currentPlayer.hand.length === 0;

        if (roundEnded) {
          checkRoundEnd(newState);
        } else {
          // Continue normal turn progression
          newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;

          // Reset turn state for the new turn
          newState.cardsDrawnThisTurn = 0;
          newState.hasDrawnThisTurn = false;
          newState.mustDiscardToEndTurn = false;

          // Check if it's AI turn
          if (newState.gameMode === 'ai' && newState.currentPlayerIndex === 1) {
            newState.isAITurn = true;
          }
        }
      }

      return newState;
    });
  };

  const layCombination = (cardIds: string[], type: 'group' | 'sequence') => {
    setGameState(prev => {
      const newState = { ...prev };
      const currentPlayer = newState.players[newState.currentPlayerIndex];

      // Check if player has completed their mission and is trying to lay a new sequence
      const hasCompletedMission = currentPlayer.completedMissions.length > 0;
      if (hasCompletedMission && type === 'sequence') {
        // After mission completion, only new groups are allowed, not new sequences
        return prev;
      }

      // Get cards from hand
      const cards = cardIds.map(id => 
        currentPlayer.hand.find(card => card.id === id)
      ).filter(Boolean) as Card[];

      if (cards.length !== cardIds.length) return prev;

      // Validate combination
      const isValid = type === 'group' ? isValidGroup(cards) : isValidSequence(cards);
      if (!isValid) return prev;

      // Remove cards from hand
      cardIds.forEach(cardId => {
        const index = currentPlayer.hand.findIndex(card => card.id === cardId);
        if (index !== -1) currentPlayer.hand.splice(index, 1);
      });

      // Add combination
      const combination: Combination = {
        id: `${currentPlayer.id}-${Date.now()}`,
        cards,
        type
      };
      currentPlayer.combinations.push(combination);

      newState.gameHistory.push(`${currentPlayer.name} pose une ${type === 'group' ? 'groupe' : 'suite'} de ${cards.length} cartes`);

      // Check if mission is completed
      checkMissionCompletion(newState, currentPlayer);

      return newState;
    });
  };

  // New unified function for presenting mission cards
  const presentMissionCards = (cardIds: string[]) => {
    setGameState(prev => {
      const newState = { ...prev };
      const currentPlayer = newState.players[newState.currentPlayerIndex];

      // Enforce mandatory draw: player must have drawn a card before presenting missions
      if (!newState.hasDrawnThisTurn) {
        console.log('Must draw a card before presenting missions');
        return prev; // Return unchanged state
      }

      // Get current mission
      const mission = MISSIONS.find(m => m.id === currentPlayer.currentMission);
      if (!mission) return prev;

      // Get cards from hand
      const cards = cardIds.map(id => 
        currentPlayer.hand.find(card => card.id === id)
      ).filter(Boolean) as Card[];

      if (cards.length !== cardIds.length) return prev;

      // Validate cards against mission requirements using new logic
      const validation = validateMissionFromSelection(cards, mission.requirements);
      if (!validation.isValid) return prev;

      // Remove cards from hand
      cardIds.forEach(cardId => {
        const index = currentPlayer.hand.findIndex(card => card.id === cardId);
        if (index !== -1) currentPlayer.hand.splice(index, 1);
      });

      // Add all combinations
      validation.usedCombinations.forEach((combo, index) => {
        const combination: Combination = {
          id: `${currentPlayer.id}-${Date.now()}-${index}`,
          cards: combo.cards,
          type: combo.type
        };
        currentPlayer.combinations.push(combination);
      });

      const groupCount = validation.usedCombinations.filter(c => c.type === 'group').length;
      const sequenceCount = validation.usedCombinations.filter(c => c.type === 'sequence').length;

      let description: string;
      if (groupCount > 0 && sequenceCount > 0) {
        description = `${groupCount} groupe(s) et ${sequenceCount} suite(s)`;
      } else if (groupCount > 0) {
        description = `${groupCount} groupe(s)`;
      } else {
        description = `${sequenceCount} suite(s)`;
      }

      newState.gameHistory.push(`${currentPlayer.name} présente ${description} pour la mission`);

      // Check if mission is completed
      checkMissionCompletion(newState, currentPlayer);

      return newState;
    });
  };

  // New function for laying down combinations after mission completion
  const layEndOfRoundCombinations = (cardIds: string[]) => {
    setGameState(prev => {
      const newState = { ...prev };
      const currentPlayer = newState.players[newState.currentPlayerIndex];

      // Enforce mandatory draw: player must have drawn a card before laying combinations
      if (!newState.hasDrawnThisTurn) {
        console.log('Must draw a card before laying combinations');
        return prev; // Return unchanged state
      }

      // Check if player has completed at least one mission
      const hasCompletedMission = currentPlayer.completedMissions.length > 0;
      if (!hasCompletedMission) return prev;

      // Get cards from hand
      const cards = cardIds.map(id => 
        currentPlayer.hand.find(card => card.id === id)
      ).filter(Boolean) as Card[];

      if (cards.length !== cardIds.length) return prev;

      // Find all valid combinations in the selected cards
      const { groups } = findAllValidCombinations(cards);

      // Try to find a combination of groups and sequences that uses ALL selected cards
      let bestCombination: {cards: Card[], type: 'group' | 'sequence'}[] = [];
      let allCardsUsed = false;

      // Try different combinations of groups (sequences are not allowed after mission completion)
      const tryGroupCombinations = (groupList: Card[][], currentCombination: Card[][], usedCardIds: Set<string>) => {
        if (usedCardIds.size === cards.length) {
          bestCombination = currentCombination.map(group => ({ cards: group, type: 'group' as const }));
          allCardsUsed = true;
          return true;
        }

        for (let i = 0; i < groupList.length; i++) {
          const group = groupList[i];

          // Check if this group has any cards already used
          const hasUsedCard = group.some(card => usedCardIds.has(card.id));
          if (hasUsedCard) continue;

          // Try adding this group
          const newUsedCardIds = new Set(usedCardIds);
          group.forEach(card => newUsedCardIds.add(card.id));

          const newCombination = [...currentCombination, group];

          if (tryGroupCombinations(groupList.slice(i + 1), newCombination, newUsedCardIds)) {
            return true;
          }
        }

        return false;
      };

      // Try to find a valid combination using only groups
      tryGroupCombinations(groups, [], new Set());

      if (!allCardsUsed) return prev;

      // Remove cards from hand
      cardIds.forEach(cardId => {
        const index = currentPlayer.hand.findIndex(card => card.id === cardId);
        if (index !== -1) currentPlayer.hand.splice(index, 1);
      });

      // Add all combinations
      bestCombination.forEach((combo, index) => {
        const combination: Combination = {
          id: `${currentPlayer.id}-${Date.now()}-${index}`,
          cards: combo.cards,
          type: combo.type
        };
        currentPlayer.combinations.push(combination);
      });

      const groupCount = bestCombination.filter(c => c.type === 'group').length;
      newState.gameHistory.push(`${currentPlayer.name} pose ${groupCount} groupe(s) pour terminer la manche`);

      // Check if round ends (player has no cards left)
      checkRoundEnd(newState);

      return newState;
    });
  };

  // Helper function to check if cards can be added to an existing combination
  const canAddToExistingCombination = (cardsToAdd: Card[], combination: Combination): boolean => {
    // For groups: check if all cards have the same value as the group
    if (combination.type === 'group') {
      const existingValue = combination.cards.find(c => isNormalCard(c))?.value;
      if (!existingValue) return false;

      return cardsToAdd.every(card => {
        if (isJokerCard(card)) return true; // Jokers can be added to any group
        return isNormalCard(card) && card.value === existingValue;
      });
    }

    // For sequences: check if cards can extend the sequence
    if (combination.type === 'sequence') {
      // This is a simplified check - you might want to implement more sophisticated logic
      // to check if the cards can extend the sequence at either end
      const combinedCards = [...combination.cards, ...cardsToAdd];
      return isValidSequence(combinedCards);
    }

    return false;
  };


  const addToExistingCombination = (cardIds: string[], combinationId: string, targetPlayerId?: string) => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    // Le joueur actuel doit avoir complété sa mission actuelle
    if (!currentPlayer.isCurrentMissionCompleted()) {
      setGameState(prev => ({
        ...prev,
        gameHistory: [...prev.gameHistory, `❌ ${currentPlayer.name} doit d'abord terminer sa mission pour étendre des combinaisons !`]
      }));
      return;
    }

    // Si on veut ajouter à une combinaison d'un adversaire
    if (targetPlayerId && targetPlayerId !== currentPlayer.id) {
      const targetPlayer = gameState.players.find(p => p.id === targetPlayerId);
      if (!targetPlayer || !targetPlayer.isCurrentMissionCompleted()) {
        setGameState(prev => ({
          ...prev,
          gameHistory: [...prev.gameHistory, `❌ L'adversaire doit aussi avoir terminé sa mission pour que vous puissiez étendre ses combinaisons !`]
        }));
        return;
      }
    }

    // Reste de la logique existante...
    const targetPlayer = targetPlayerId
      ? gameState.players.find(p => p.id === targetPlayerId) || currentPlayer
      : currentPlayer;

    const targetCombination = targetPlayer.combinations.find(c => c.id === combinationId);
    if (!targetCombination) {
      setGameState(prev => ({
        ...prev,
        gameHistory: [...prev.gameHistory, `❌ Combinaison non trouvée !`]
      }));
      return;
    }

    const cardsToAdd = cardIds.map(id => {
      const card = currentPlayer.hand.find(c => c.id === id);
      if (!card) {
        throw new Error(`Carte non trouvée dans la main : ${id}`);
      }
      return card;
    });

    if (!canAddToExistingCombination(cardsToAdd, targetCombination)) {
      setGameState(prev => ({
        ...prev,
        gameHistory: [...prev.gameHistory, `❌ Impossible d'ajouter ces cartes à cette combinaison !`]
      }));
      return;
    }

    setGameState(prev => {
      const newGameState = { ...prev };
      const newCurrentPlayer = { ...newGameState.players[newGameState.currentPlayerIndex] };
      const newTargetPlayer = targetPlayerId
        ? { ...newGameState.players.find(p => p.id === targetPlayerId)! }
        : newCurrentPlayer;

      // Retirer les cartes de la main du joueur actuel
      newCurrentPlayer.hand = newCurrentPlayer.hand.filter(card =>
        !cardIds.includes(card.id)
      );

      // Ajouter les cartes à la combinaison cible
      const newCombination = {
        ...targetCombination,
        cards: [...targetCombination.cards, ...cardsToAdd]
      };

      newTargetPlayer.combinations = newTargetPlayer.combinations.map(combo =>
        combo.id === combinationId ? newCombination : combo
      );

      // Mettre à jour les joueurs dans l'état
      newGameState.players = newGameState.players.map(player => {
        if (player.id === newCurrentPlayer.id) return newCurrentPlayer;
        if (targetPlayerId && player.id === targetPlayerId) return newTargetPlayer;
        return player;
      });

      const cardsDesc = cardsToAdd.map(card =>
        isJokerCard(card) ? 'Joker' : `${card.value}${getSuitSymbol(card.suit)}`
      ).join(', ');

      const targetDesc = targetPlayerId && targetPlayerId !== currentPlayer.id
        ? ` aux combinaisons de ${newTargetPlayer.name}`
        : ' à ses propres combinaisons';

      newGameState.gameHistory = [
        ...newGameState.gameHistory,
        `${newCurrentPlayer.name} ajoute ${cardsDesc}${targetDesc}`
      ];

      return newGameState;
    });
  };

  const checkMissionCompletion = (gameState: GameState, player: Player) => {
    const mission = MISSIONS.find(m => m.id === player.currentMission);
    if (!mission) return;

    const { requirements } = mission;
    const { combinations } = player;

    let isCompleted = false;

    // Helper functions
    const getAllCards = () => combinations.flatMap(c => c.cards);
    const getGroups = () => combinations.filter(c => c.type === 'group');
    const getSequences = () => combinations.filter(c => c.type === 'sequence');
    const isRedCard = (card: NormalCard) => card.suit === 'hearts' || card.suit === 'diamonds';
    const isBlackCard = (card: NormalCard) => card.suit === 'spades' || card.suit === 'clubs';

    if (requirements.specificRequirements === 'free_choice') {
      // Mission 12: choose a previously completed mission
      isCompleted = player.completedMissions.length > 0;
    } else if (requirements.specificRequirements === '7_same_suit') {
      // Mission 7: 7 cards of same suit
      const suitCounts = combinations.reduce((acc, combo) => {
        combo.cards.forEach(card => {
          if (isNormalCard(card)) {
            acc[card.suit] = (acc[card.suit] || 0) + 1;
          }
        });
        return acc;
      }, {} as Record<string, number>);

      isCompleted = Object.values(suitCounts).some(count => count >= 7);
    } else if (requirements.specificRequirements === 'group_4_sequence_4') {
      // Mission 13: One group of 4 + one sequence of 4
      const groups = getGroups();
      const sequences = getSequences();
      isCompleted = groups.some(g => g.cards.length === 4) && sequences.some(s => s.cards.length >= 4);
    } else if (requirements.specificRequirements === 'groups_of_4') {
      // Mission 14: Two groups of 4
      const groups = getGroups();
      const groupsOf4 = groups.filter(g => g.cards.length === 4);
      isCompleted = groupsOf4.length >= 2;
    } else if (requirements.specificRequirements === 'sequence_8_max_2_suits') {
      // Mission 16: Sequence of 8 with max 2 suits
      const sequences = getSequences();
      isCompleted = sequences.some(seq => {
        if (seq.cards.length < 8) return false;
        const suits = new Set(seq.cards.filter(c => isNormalCard(c)).map(c => c.suit));
        return suits.size <= 2;
      });
    } else if (requirements.specificRequirements === 'two_groups_3_one_group_4') {
      // Mission 17: Two groups of 3 + one group of 4
      const groups = getGroups();
      const groupsOf3 = groups.filter(g => g.cards.length === 3);
      const groupsOf4 = groups.filter(g => g.cards.length === 4);
      isCompleted = groupsOf3.length >= 2 && groupsOf4.length >= 1;
    } else if (requirements.specificRequirements === 'sequence_A_to_9') {
      // Mission 19: Sequence A to 9 (any suits)
      const allCards = getAllCards().filter(c => isNormalCard(c));
      const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9'];
      const hasAllValues = values.every(val => allCards.some(card => card.value === val));
      isCompleted = hasAllValues && allCards.length >= 9;
    } else if (requirements.specificRequirements === 'seven_odd_cards') {
      // Mission 20: Seven odd cards (A, 3, 5, 7, 9, J, K)
      const allCards = getAllCards().filter(c => isNormalCard(c));
      const oddValues = ['A', '3', '5', '7', '9', 'J', 'K'];
      const oddCards = allCards.filter(card => oddValues.includes(card.value));
      isCompleted = oddCards.length >= 7;
    } else if (requirements.specificRequirements === 'different_suits') {
      // Mission 21: Two sequences of 5, different suits
      const sequences = getSequences().filter(s => s.cards.length >= 5);
      if (sequences.length >= 2) {
        const suits1 = new Set(sequences[0].cards.filter(c => isNormalCard(c)).map(c => c.suit));
        const suits2 = new Set(sequences[1].cards.filter(c => isNormalCard(c)).map(c => c.suit));
        const intersection = new Set([...suits1].filter(x => suits2.has(x)));
        isCompleted = intersection.size === 0;
      }
    } else if (requirements.specificRequirements === 'pairs') {
      // Mission 22: 4 groups of 2 cards (pairs)
      const groups = getGroups();
      const pairs = groups.filter(g => g.cards.length === 2);
      isCompleted = pairs.length >= 4;
    } else if (requirements.specificRequirements === 'three_groups_of_4') {
      // Mission 23: Three groups of 4
      const groups = getGroups();
      const groupsOf4 = groups.filter(g => g.cards.length === 4);
      isCompleted = groupsOf4.length >= 3;
    } else if (requirements.specificRequirements === 'full_suit_A_to_K') {
      // Mission 24: Full suit A to K
      const sequences = getSequences();
      isCompleted = sequences.some(seq => {
        if (seq.cards.length < 13) return false;
        const nonJokerCards = seq.cards.filter(c => isNormalCard(c));
        const suits = new Set(nonJokerCards.map(c => c.suit));
        return suits.size === 1;
      });
    } else if (requirements.specificRequirements === 'hearts_7_8_9_10') {
      // Mission 25: 7-8-9-10 of hearts
      const allCards = getAllCards().filter(c => isNormalCard(c));
      const heartsCards = allCards.filter(c => c.suit === 'hearts');
      const requiredValues = ['7', '8', '9', '10'];
      isCompleted = requiredValues.every(val => heartsCards.some(card => card.value === val));
    } else if (requirements.specificRequirements === 'spades_and_clubs_sequences') {
      // Mission 26: Two sequences of 4: one spades, one clubs
      const sequences = getSequences().filter(s => s.cards.length >= 4);
      const spadesSeq = sequences.find(s => s.cards.filter(c => isNormalCard(c)).every(c => c.suit === 'spades'));
      const clubsSeq = sequences.find(s => s.cards.filter(c => isNormalCard(c)).every(c => c.suit === 'clubs'));
      isCompleted = !!spadesSeq && !!clubsSeq;
    } else if (requirements.specificRequirements === 'red_sequence_5') {
      // Mission 27: Sequence of 5 red cards
      const sequences = getSequences();
      isCompleted = sequences.some(seq => {
        if (seq.cards.length < 5) return false;
        const nonJokerCards = seq.cards.filter(c => isNormalCard(c));
        return nonJokerCards.length >= 5 && nonJokerCards.every(c => isRedCard(c));
      });
    } else if (requirements.specificRequirements === 'one_red_group_one_black_group') {
      // Mission 28: Two groups of 3: one red, one black
      const groups = getGroups().filter(g => g.cards.length >= 3);
      const redGroup = groups.find(g => g.cards.filter(c => isNormalCard(c)).every(c => isRedCard(c)));
      const blackGroup = groups.find(g => g.cards.filter(c => isNormalCard(c)).every(c => isBlackCard(c)));
      isCompleted = !!redGroup && !!blackGroup;
    } else if (requirements.specificRequirements === 'three_suits_no_diamonds') {
      // Mission 29: Three identical cards (spades, clubs, hearts only)
      const groups = getGroups();
      isCompleted = groups.some(g => {
        if (g.cards.length < 3) return false;
        const nonJokerCards = g.cards.filter(c => isNormalCard(c));
        const suits = new Set(nonJokerCards.map(c => c.suit));
        return suits.has('spades') && suits.has('clubs') && suits.has('hearts') && !suits.has('diamonds');
      });
    } else if (requirements.specificRequirements === 'red_even_sequence_6') {
      // Mission 30: Even sequence of 6 red cards (2,4,6,8,10,Q)
      const allCards = getAllCards().filter(isNormalCard).filter(isRedCard);
      const evenValues = ['2', '4', '6', '8', '10', 'Q'];
      isCompleted = evenValues.every(val => allCards.some(card => card.value === val));
    } else {
      // Standard missions
      const groups = getGroups();
      const sequences = getSequences();

      const hasRequiredGroups = !requirements.groups || groups.length >= requirements.groups;
      const hasRequiredSequences = !requirements.sequences || sequences.length >= requirements.sequences;

      let hasMinSequenceLength = true;
      if (requirements.minSequenceLength) {
        hasMinSequenceLength = sequences.some(seq => seq.cards.length >= requirements.minSequenceLength!);
      }

      let hasSameSuitRequirement = true;
      if (requirements.specificRequirements === 'same_suit') {
        hasSameSuitRequirement = sequences.some(seq => {
          const nonJokerCards = seq.cards.filter(c => isNormalCard(c));
          return nonJokerCards.length >= (requirements.minSequenceLength || 3) &&
                 nonJokerCards.every(c => c.suit === nonJokerCards[0].suit);
        });
      }

      isCompleted = hasRequiredGroups && hasRequiredSequences && hasMinSequenceLength && hasSameSuitRequirement;
    }

    if (isCompleted) {
      player.completedMissions.push(player.currentMission);
      gameState.gameHistory.push(`🎉 ${player.name} complète la mission ${mission.id}!`);

      // Check win condition - only end game if player completes 7 missions
      if (player.completedMissions.length >= 7) {
        gameState.isGameOver = true;
        gameState.winner = player.name;
        gameState.gameHistory.push(`🏆 ${player.name} remporte la partie!`);
      } else {
        // Assign a new random mission that hasn't been completed yet
        player.currentMission = getRandomMission(player.completedMissions);
      }
    }
  };

  const checkRoundEnd = (gameState: GameState) => {
    // Check if any player has gone out (no cards left)
    const playerWhoWentOut = gameState.players.find(player => player.hand.length === 0);

    if (playerWhoWentOut) {
      gameState.gameHistory.push(`🎪 ${playerWhoWentOut.name} termine la manche!`);

      // Start new round if game is not over
      if (!gameState.isGameOver) {
        startNewRound(gameState, playerWhoWentOut);
      }
    }
  };

  const startNewRound = (gameState: GameState, winner?: Player) => {
    // Give new mission to the winner
    if (winner) {
      winner.currentMission = getRandomMission(winner.completedMissions);
      gameState.gameHistory.push(`🎯 ${winner.name} reçoit une nouvelle mission!`);
    }

    // Clear all combinations from all players
    gameState.players.forEach(player => {
      player.combinations = [];
    });

    // Create new deck and redistribute cards
    const newDeck = createDeck();
    gameState.players.forEach(player => {
      player.hand = newDeck.splice(0, 13);
    });

    // Set new discard pile
    gameState.discardPile = [newDeck.pop()!];
    gameState.deck = newDeck;

    // Reset to first player
    gameState.currentPlayerIndex = 0;
    gameState.isAITurn = false;

    // Reset turn state for the new round
    gameState.cardsDrawnThisTurn = 0;
    gameState.hasDrawnThisTurn = false;
    gameState.mustDiscardToEndTurn = false;

    gameState.gameHistory.push('🎪 Nouvelle manche commencée!');
  };

  const newGame = (gameMode: 'pvp' | 'ai' = 'pvp') => {
    setGameState(initialGameState(gameMode));
  };

  const resetGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGameState(initialGameState());
  };

  const reorderCards = (fromIndex: number, toIndex: number) => {
    setGameState(prev => {
      const newState = { ...prev };
      const currentPlayer = newState.players[newState.currentPlayerIndex];

      // Ensure indices are valid
      if (fromIndex < 0 || fromIndex >= currentPlayer.hand.length || 
          toIndex < 0 || toIndex >= currentPlayer.hand.length) {
        return prev;
      }

      // Create a new hand array with reordered cards
      const newHand = [...currentPlayer.hand];
      const [movedCard] = newHand.splice(fromIndex, 1);
      newHand.splice(toIndex, 0, movedCard);

      currentPlayer.hand = newHand;

      return newState;
    });
  };

  return {
    gameState,
    drawCard,
    discardCard,
    layCombination,
    presentMissionCards,
    layEndOfRoundCombinations,
    addToExistingCombination,
    newGame,
    resetGame,
    reorderCards
  };
};

// Helper function (need to import from cardUtils)
const getSuitSymbol = (suit: string): string => {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
    default: return '';
  }
};
