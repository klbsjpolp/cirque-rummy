
export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardValue = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export type SpecificRequirement = 
  | 'same_suit' 
  | 'groups_of_4' 
  | 'group_4_sequence_4'
  | 'free_choice'
  | '7_same_suit'
  | 'sequence_8_max_2_suits'
  | 'two_groups_3_one_group_4'
  | 'sequence_A_to_9'
  | 'seven_odd_cards'
  | 'different_suits'
  | 'pairs'
  | 'three_groups_of_4'
  | 'full_suit_A_to_K'
  | 'hearts_7_8_9_10'
  | 'spades_and_clubs_sequences'
  | 'red_sequence_5'
  | 'one_red_group_one_black_group'
  | 'three_suits_no_diamonds'
  | 'red_even_sequence_6';

export interface MissionRequirements {
  groups?: number;
  sequences?: number;
  minSequenceLength?: number;
  specificRequirements?: SpecificRequirement;
}

export type NormalCard = {
  id: string,
  value: CardValue,
  suit: CardSuit
}
export type JokerCard = {
  id: string,
  isJoker: true;
}
export type Card = NormalCard | JokerCard;

export interface Combination {
  id: string;
  cards: Card[];
  type: 'group' | 'sequence';
}

export interface Mission {
  id: number;
  title: string;
  description: string;
  icon: string;
  requirements: MissionRequirements;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  currentMission: number;
  completedMissions: number[];
  score: number;
  combinations: Combination[];

  // Méthode pour vérifier si la mission actuelle est complétée
  isCurrentMissionCompleted(): boolean;

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
  gameMode: 'pvp' | 'ai';
  isAITurn: boolean;
  cardsDrawnThisTurn: number;
  hasDrawnThisTurn: boolean;
  mustDiscardToEndTurn: boolean;
}
