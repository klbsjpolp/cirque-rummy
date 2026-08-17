
import { useState, useEffect } from 'react';
import {GameState, Player, Card, Combination, Mission} from '../types/game';
import {
  createDeck,
  isValidGroup,
  isValidSequence,
  isJokerCard,
  validateMissionFromSelection,
  findGroupsOnlyLayout,
  getSuitSymbol
} from '../utils/cardUtils';
import { MISSIONS } from '../data/missions';
import { AIPlayer } from '../utils/aiPlayer';
import {
  canAddToExistingCombination,
  isMissionCompleted,
  pickRandomMissionId
} from '../utils/gameLogic';

const STORAGE_KEY = 'cirque-rummy-game-state';

const getRandomMission = (completedMissions: number[]): number =>
  pickRandomMissionId(MISSIONS, completedMissions);

const createPlayer = (id: string, name: string): Player => ({
  id,
  name,
  hand: [],
  currentMission: getRandomMission([]),
  completedMissions: [],
  score: 0,
  combinations: [],
  missionCompletedThisRound: false
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
    mustDiscardToEndTurn: false,
    lastDrawnCardId: null
  };
};

// Une partie sauvegardée avant l'ajout d'un champ le retrouve ici. Les joueurs sont
// des données pures, donc rien à reconstruire après JSON.parse.
const migrateSavedState = (saved: GameState): GameState => ({
  ...saved,
  cardsDrawnThisTurn: saved.cardsDrawnThisTurn ?? 0,
  hasDrawnThisTurn: saved.hasDrawnThisTurn ?? false,
  mustDiscardToEndTurn: saved.mustDiscardToEndTurn ?? false,
  lastDrawnCardId: saved.lastDrawnCardId ?? null,
  players: saved.players.map(player => ({
    ...player,
    // Par défaut la phase post-mission est refermée : elle se rouvrira dès que la
    // mission de la manche sera accomplie.
    missionCompletedThisRound: player.missionCompletedThisRound ?? false
  }))
});

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return migrateSavedState(JSON.parse(saved));
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

      let drawnCard: Card | undefined;
      if (fromDiscard && newState.discardPile.length > 0) {
        newState.discardPile = [...newState.discardPile];
        drawnCard = newState.discardPile.pop()!;
        newState.gameHistory.push(`${currentPlayer.name} pioche de la défausse`);
      } else if (newState.deck.length > 0) {
        newState.deck = [...newState.deck];
        drawnCard = newState.deck.pop()!;
        newState.gameHistory.push(`${currentPlayer.name} pioche du paquet`);
      }

      if (drawnCard) {
        const updatedPlayer = { ...currentPlayer, hand: [...currentPlayer.hand, drawnCard] };
        newState.players = newState.players.map((p, i) => i === newState.currentPlayerIndex ? updatedPlayer : p);
        newState.cardsDrawnThisTurn += 1;
        newState.hasDrawnThisTurn = true;
        newState.mustDiscardToEndTurn = true;
        newState.lastDrawnCardId = drawnCard.id;
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
        currentPlayer.hand = [...currentPlayer.hand];
        newState.discardPile = [...newState.discardPile];
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
          newState.lastDrawnCardId = null;

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
      if (currentPlayer.missionCompletedThisRound && type === 'sequence') {
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
      currentPlayer.hand = [...currentPlayer.hand];
      currentPlayer.combinations = [...currentPlayer.combinations];
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
      currentPlayer.hand = [...currentPlayer.hand];
      currentPlayer.combinations = [...currentPlayer.combinations];
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

      // La validation ci-dessus a vérifié la mission entière sur cette sélection :
      // c'est donc elle qui crédite la mission. Rejouer une seconde validation sur
      // la table pouvait la refuser et consommer les cartes pour rien.
      creditMission(newState, currentPlayer, mission);

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

      // La pose de fin de manche n'est ouverte qu'après la mission de *cette* manche.
      if (!currentPlayer.missionCompletedThisRound) return prev;

      // Get cards from hand
      const cards = cardIds.map(id => 
        currentPlayer.hand.find(card => card.id === id)
      ).filter(Boolean) as Card[];

      if (cards.length !== cardIds.length) return prev;

      // Après la mission, seuls de nouveaux groupes sont permis : on cherche une
      // disposition en groupes qui utilise toutes les cartes sélectionnées.
      const bestCombination = findGroupsOnlyLayout(cards);
      if (!bestCombination) return prev;

      // Remove cards from hand
      currentPlayer.hand = [...currentPlayer.hand];
      currentPlayer.combinations = [...currentPlayer.combinations];
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

  const addToExistingCombination = (cardIds: string[], combinationId: string, targetPlayerId?: string) => {
    setGameState(prev => {
      const refuse = (reason: string): GameState => ({
        ...prev,
        gameHistory: [...prev.gameHistory, `❌ ${reason}`]
      });

      const currentPlayer = prev.players[prev.currentPlayerIndex];

      // Le joueur actuel doit avoir accompli sa mission dans cette manche
      if (!currentPlayer.missionCompletedThisRound) {
        return refuse(`${currentPlayer.name} doit d'abord terminer sa mission pour étendre des combinaisons !`);
      }

      const targetPlayer = targetPlayerId
        ? prev.players.find(p => p.id === targetPlayerId)
        : currentPlayer;

      if (!targetPlayer) return refuse('Joueur introuvable !');

      // Étendre les combinaisons de l'adversaire exige qu'il ait aussi terminé la sienne
      if (targetPlayer.id !== currentPlayer.id && !targetPlayer.missionCompletedThisRound) {
        return refuse(`L'adversaire doit aussi avoir terminé sa mission pour que vous puissiez étendre ses combinaisons !`);
      }

      const targetCombination = targetPlayer.combinations.find(c => c.id === combinationId);
      if (!targetCombination) return refuse('Combinaison non trouvée !');

      const cardsToAdd = cardIds
        .map(id => currentPlayer.hand.find(card => card.id === id))
        .filter((card): card is Card => card !== undefined);

      if (cardsToAdd.length !== cardIds.length) {
        return refuse('Ces cartes ne sont pas dans votre main !');
      }

      if (!canAddToExistingCombination(cardsToAdd, targetCombination)) {
        return refuse(`Impossible d'ajouter ces cartes à cette combinaison !`);
      }

      // Un seul passage sur les joueurs : quand on étend sa propre combinaison, la main
      // et la combinaison changent sur le *même* joueur — les mettre à jour sur deux
      // copies distinctes faisait disparaître les cartes sans agrandir la combinaison.
      const removed = new Set(cardIds);
      const players = prev.players.map(player => {
        let updated = player;

        if (player.id === currentPlayer.id) {
          updated = { ...updated, hand: updated.hand.filter(card => !removed.has(card.id)) };
        }

        if (player.id === targetPlayer.id) {
          updated = {
            ...updated,
            combinations: updated.combinations.map(combo =>
              combo.id === combinationId
                ? { ...combo, cards: [...combo.cards, ...cardsToAdd] }
                : combo
            )
          };
        }

        return updated;
      });

      const cardsDesc = cardsToAdd.map(card =>
        isJokerCard(card) ? 'Joker' : `${card.value}${getSuitSymbol(card.suit)}`
      ).join(', ');
      const targetDesc = targetPlayer.id === currentPlayer.id
        ? ' à ses propres combinaisons'
        : ` aux combinaisons de ${targetPlayer.name}`;

      return {
        ...prev,
        players,
        gameHistory: [...prev.gameHistory, `${currentPlayer.name} ajoute ${cardsDesc}${targetDesc}`]
      };
    });
  };

  const creditMission = (gameState: GameState, player: Player, mission: Mission) => {
    player.completedMissions.push(mission.id);
    player.missionCompletedThisRound = true;
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
  };

  const checkMissionCompletion = (gameState: GameState, player: Player) => {
    const mission = MISSIONS.find(m => m.id === player.currentMission);
    if (!mission) return;

    if (isMissionCompleted(player, mission)) {
      creditMission(gameState, player, mission);
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
      player.missionCompletedThisRound = false;
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
    gameState.lastDrawnCardId = null;

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
