import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Toaster } from '../components/ui/sonner';
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
    notice: null,
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

describe('les piles se prennent au clavier', () => {
  it('expose la pioche et la défausse comme des boutons nommés', () => {
    seed(false);
    render(<GameBoard />);

    const deck = screen.getByRole('button', { name: /piocher au paquet/i });
    const discard = screen.getByRole('button', { name: /piocher la carte visible/i });

    expect(deck.tagName).toBe('BUTTON');
    expect(discard.tagName).toBe('BUTTON');
  });

  it('désactive les piles quand la pioche du tour est déjà faite', () => {
    // La partie semée a déjà pioché : les deux piles sont hors d'usage, et le disent
    // au lieu de rester cliquables sans effet.
    seed(false);
    render(<GameBoard />);

    expect(screen.getByTestId('deck-pile').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('discard-pile').hasAttribute('disabled')).toBe(true);
  });
});

describe('un refus se voit à l\'écran', () => {
  it('affiche pourquoi la pose est refusée', async () => {
    // Mission 1 (deux groupes de 3) avec un seul groupe sélectionné : la pose est
    // refusée, et le joueur doit l'apprendre autrement qu'en voyant l'écran figé.
    seed(false);
    render(<><Toaster /><GameBoard /></>);

    const cards = ['3 de pique', '3 de trèfle', '3 de cœur'];
    cards.forEach(name => fireEvent.click(screen.getByRole('button', { name: new RegExp(name, 'i') })));
    fireEvent.click(screen.getByRole('button', { name: /présenter mission/i }));

    expect(await screen.findByText(/n'accomplit pas la mission/i)).toBeDefined();
  });
});
