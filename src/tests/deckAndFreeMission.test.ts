import { describe, it, expect, beforeEach } from 'vitest';
import { act, fireEvent, render, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { useGameState } from '../hooks/useGameState';
import { pickRandomMissionId, replenishDeck } from '../utils/gameLogic';
import { MISSIONS } from '../data/missions';
import { Card, CardSuit, CardValue, Combination } from '../types/game';

/**
 * Deux impasses de la partie : la pioche qui s'épuise sans jamais être remélangée,
 * et la mission 12 « Mission libre », qu'aucune sélection ne pouvait accomplir.
 */

const STORAGE_KEY = 'cirque-rummy-game-state';

const SUITS: Record<string, CardSuit> = { h: 'hearts', d: 'diamonds', c: 'clubs', s: 'spades' };
const C = (spec: string): Card => {
  const suit = SUITS[spec.slice(-1)];
  const value = spec.slice(0, -1) as CardValue;
  return { id: `${value}-${suit}-0`, value, suit };
};
const ids = (cards: Card[]) => cards.map(c => c.id);

type SeededPlayer = {
  id: string;
  name: string;
  hand: Card[];
  currentMission: number;
  completedMissions: number[];
  score: number;
  combinations: Combination[];
};

const player = (id: string, name: string, over: Partial<SeededPlayer> = {}): SeededPlayer => ({
  id,
  name,
  hand: [C('8c'), C('Jd')],
  currentMission: 1,
  completedMissions: [],
  score: 0,
  combinations: [],
  ...over,
});

const seedGame = (
  players: [SeededPlayer, SeededPlayer],
  table: { deck: Card[]; discardPile: Card[] },
) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    players,
    currentPlayerIndex: 0,
    deck: table.deck,
    discardPile: table.discardPile,
    isGameStarted: true,
    isGameOver: false,
    winner: null,
    gameHistory: [],
    gameMode: 'pvp',
    isAITurn: false,
    cardsDrawnThisTurn: 0,
    hasDrawnThisTurn: false,
    mustDiscardToEndTurn: false,
    lastDrawnCardId: null,
  }));
};

const FREE_MISSION = MISSIONS.find(m => m.requirements.specificRequirements === 'free_choice')!;
/** Mission 1 : deux groupes de 3. */
const MISSION_1_CARDS = [C('3s'), C('3c'), C('3h'), C('9d'), C('9c'), C('9h')];

beforeEach(() => {
  localStorage.clear();
});

describe('la pioche épuisée est reconstituée depuis la défausse', () => {
  it('remélange la défausse en gardant sa carte visible', () => {
    const discardPile = [C('2h'), C('3h'), C('4h'), C('5h')];
    const result = replenishDeck([], discardPile);

    expect(result.discardPile.map(c => c.id)).toEqual([C('5h').id]);
    expect(result.deck.map(c => c.id).sort())
      .toEqual([C('2h').id, C('3h').id, C('4h').id].sort());
  });

  it('ne touche à rien tant que la pioche a des cartes', () => {
    const deck = [C('Kd')];
    const discardPile = [C('2h'), C('3h')];
    const result = replenishDeck(deck, discardPile);

    expect(result.deck).toBe(deck);
    expect(result.discardPile).toBe(discardPile);
  });

  it('permet de piocher alors que le paquet est vide', () => {
    seedGame(
      [player('player1', 'Joueur 1'), player('player2', 'Joueur 2')],
      { deck: [], discardPile: [C('2h'), C('3h'), C('4h'), C('5h')] },
    );
    const { result } = renderHook(() => useGameState());

    act(() => result.current.drawCard());

    expect(result.current.gameState.players[0].hand).toHaveLength(3);
    expect(result.current.gameState.hasDrawnThisTurn).toBe(true);
    // Trois cartes remélangées, moins celle qui vient d'être piochée.
    expect(result.current.gameState.deck).toHaveLength(2);
    expect(result.current.gameState.discardPile.map(c => c.id)).toEqual([C('5h').id]);
  });

  it('rejoue la manche quand plus aucune carte ne peut être piochée', () => {
    seedGame(
      [player('player1', 'Joueur 1'), player('player2', 'Joueur 2')],
      { deck: [], discardPile: [C('5h')] },
    );
    const { result } = renderHook(() => useGameState());

    act(() => result.current.drawCard());

    // Nouvelle manche : mains complètes et pioche reconstituée.
    expect(result.current.gameState.players[0].hand).toHaveLength(13);
    expect(result.current.gameState.deck.length).toBeGreaterThan(0);
    expect(result.current.gameState.gameHistory.join(' ')).toContain('pioche');
  });
});

describe('le plateau laisse piocher sur un paquet reconstituable', () => {
  it('rend la pioche cliquable quand la défausse peut la reformer', async () => {
    seedGame(
      [player('player1', 'Joueur 1'), player('player2', 'Joueur 2')],
      { deck: [], discardPile: [C('2h'), C('3h'), C('4h'), C('5h')] },
    );
    const { default: GameBoard } = await import('../components/GameBoard');
    const { container } = render(createElement(GameBoard));

    // La pastille du paquet affiche 0 ; cliquer dessus doit tout de même piocher.
    const deckPile = container.querySelector('[data-testid="deck-pile"]') as HTMLElement;
    expect(deckPile).not.toBeNull();
    fireEvent.click(deckPile);

    expect(container.textContent).toContain('Défausser');
  });
});

describe('mission libre : rejouer une mission déjà réussie', () => {
  it('accepte une sélection qui accomplit une mission déjà réussie', () => {
    seedGame(
      [
        player('player1', 'Joueur 1', {
          hand: [...MISSION_1_CARDS, C('2d')],
          currentMission: FREE_MISSION.id,
          completedMissions: [1],
        }),
        player('player2', 'Joueur 2'),
      ],
      { deck: [C('Kd')], discardPile: [C('7d')] },
    );
    const { result } = renderHook(() => useGameState());

    act(() => result.current.drawCard());
    act(() => result.current.presentMissionCards(ids(MISSION_1_CARDS)));

    expect(result.current.gameState.players[0].completedMissions).toContain(FREE_MISSION.id);
    expect(result.current.gameState.players[0].combinations).toHaveLength(2);
  });

  it('refuse une sélection qui n\'accomplit aucune mission déjà réussie', () => {
    seedGame(
      [
        player('player1', 'Joueur 1', {
          hand: [...MISSION_1_CARDS, C('2d')],
          currentMission: FREE_MISSION.id,
          // Mission 4 demande trois groupes de 3 : la sélection n'en forme que deux.
          completedMissions: [4],
        }),
        player('player2', 'Joueur 2'),
      ],
      { deck: [C('Kd')], discardPile: [C('7d')] },
    );
    const { result } = renderHook(() => useGameState());

    act(() => result.current.drawCard());
    act(() => result.current.presentMissionCards(ids(MISSION_1_CARDS)));

    expect(result.current.gameState.players[0].completedMissions).not.toContain(FREE_MISSION.id);
    expect(result.current.gameState.players[0].combinations).toHaveLength(0);
  });

  it('n\'est jamais distribuée à un joueur qui n\'a rien à rejouer', () => {
    // Balayer tout l'intervalle du tirage : la mission libre ne doit sortir pour
    // aucune valeur, ni en début de partie, ni si elle est la seule déjà réussie.
    for (const completed of [[], [FREE_MISSION.id]]) {
      for (let i = 0; i < MISSIONS.length; i++) {
        const rng = () => i / MISSIONS.length;
        expect(pickRandomMissionId(MISSIONS, completed, rng)).not.toBe(FREE_MISSION.id);
      }
    }
  });

  it('reste distribuable une fois une vraie mission réussie', () => {
    const freeIndex = MISSIONS.filter(m => !([1].includes(m.id)))
      .findIndex(m => m.id === FREE_MISSION.id);
    const available = MISSIONS.filter(m => ![1].includes(m.id));
    const rng = () => freeIndex / available.length;

    expect(pickRandomMissionId(MISSIONS, [1], rng)).toBe(FREE_MISSION.id);
  });
});
