import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import GameBoard from '../components/GameBoard';
import { Card, CardSuit, CardValue } from '../types/game';

const STORAGE_KEY = 'cirque-rummy-game-state';

const SUITS: Record<string, CardSuit> = { h: 'hearts', d: 'diamonds', c: 'clubs', s: 'spades' };
const C = (spec: string): Card => {
  const suit = SUITS[spec.slice(-1)];
  const value = spec.slice(0, -1) as CardValue;
  return { id: `${value}-${suit}-0`, value, suit };
};

const seed = (missionCompletedThisRound: boolean) => {
  const hand = [C('3s'), C('3c'), C('3h'), C('9d')];
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    players: [
      { id: 'player1', name: 'Joueur 1', hand, currentMission: 1, completedMissions: [], score: 0, combinations: [], missionCompletedThisRound },
      { id: 'player2', name: 'Joueur 2', hand: [C('8c')], currentMission: 4, completedMissions: [], score: 0, combinations: [], missionCompletedThisRound: false },
    ],
    currentPlayerIndex: 0,
    deck: [C('4s')],
    discardPile: [C('7d')],
    isGameStarted: true,
    isGameOver: false,
    winner: null,
    gameHistory: [],
    gameMode: 'pvp',
    isAITurn: false,
    cardsDrawnThisTurn: 1,
    hasDrawnThisTurn: true,
    mustDiscardToEndTurn: true,
    lastDrawnCardId: null,
  }));
};

beforeEach(() => {
  localStorage.clear();
});

describe('GameBoard', () => {
  it('affiche le plateau d\'une nouvelle partie', () => {
    const { container } = render(<GameBoard />);

    expect(container.textContent).toContain('CIRQUE RUMMY');
    expect(container.textContent).toContain('Mission');
  });

  it('propose de présenter la mission tant qu\'elle n\'est pas accomplie', () => {
    seed(false);
    const { container } = render(<GameBoard />);

    expect(container.textContent).toContain('Présenter mission');
    expect(container.textContent).not.toContain('Poser groupe');
  });

  it('propose de poser un groupe une fois la mission accomplie', () => {
    seed(true);
    const { container } = render(<GameBoard />);

    expect(container.textContent).toContain('Poser groupe');
  });
});
