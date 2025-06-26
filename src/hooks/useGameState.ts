
import { useState, useEffect } from 'react';
import { GameState, Player, Card } from '../types/game';
import { createDeck } from '../utils/cardUtils';

const STORAGE_KEY = 'jokrummy-game-state';

const createPlayer = (id: string, name: string): Player => ({
  id,
  name,
  hand: [],
  currentMission: 1,
  completedMissions: [],
  score: 0,
  combinations: []
});

const initialGameState = (): GameState => {
  const deck = createDeck();
  const player1 = createPlayer('player1', 'Joueur 1');
  const player2 = createPlayer('player2', 'Joueur 2');
  
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
    gameHistory: ['Nouvelle partie commencée']
  };
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Erreur lors du chargement de la partie:', error);
      }
    }
    return initialGameState();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  const drawCard = (fromDiscard: boolean = false) => {
    setGameState(prev => {
      const newState = { ...prev };
      const currentPlayer = newState.players[newState.currentPlayerIndex];
      
      if (fromDiscard && newState.discardPile.length > 0) {
        const card = newState.discardPile.pop()!;
        currentPlayer.hand.push(card);
        newState.gameHistory.push(`${currentPlayer.name} pioche de la défausse`);
      } else if (newState.deck.length > 0) {
        const card = newState.deck.pop()!;
        currentPlayer.hand.push(card);
        newState.gameHistory.push(`${currentPlayer.name} pioche du paquet`);
      }
      
      return newState;
    });
  };

  const discardCard = (cardId: string) => {
    setGameState(prev => {
      const newState = { ...prev };
      const currentPlayer = newState.players[newState.currentPlayerIndex];
      
      const cardIndex = currentPlayer.hand.findIndex(card => card.id === cardId);
      if (cardIndex !== -1) {
        const card = currentPlayer.hand.splice(cardIndex, 1)[0];
        newState.discardPile.push(card);
        newState.gameHistory.push(`${currentPlayer.name} défausse ${card.isJoker ? 'Joker' : card.value + getSuitSymbol(card.suit)}`);
        
        // Passer au joueur suivant
        newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
      }
      
      return newState;
    });
  };

  const newGame = () => {
    setGameState(initialGameState());
  };

  const resetGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGameState(initialGameState());
  };

  return {
    gameState,
    drawCard,
    discardCard,
    newGame,
    resetGame,
    setGameState
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
