
export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardValue = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  value: CardValue;
  suit: CardSuit;
  isJoker: boolean;
}

export interface Combination {
  id: string;
  cards: Card[];
  type: 'group' | 'sequence';
}

export interface Mission {
  id: number;
  title: string;
  description: string;
  requirements: {
    groups?: number;
    sequences?: number;
    minSequenceLength?: number;
    specificRequirements?: string;
  };
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  currentMission: number;
  completedMissions: number[];
  score: number;
  combinations: Combination[];
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  deck: Card[];
  discardPile: Card[];
  isGameStarted: boolean;
  isGameOver: boolean;
  winner: string | null;
  gameHistory: string[];
}
