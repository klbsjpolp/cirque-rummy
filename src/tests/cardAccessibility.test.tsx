import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Card from '../components/Card';
import { Card as CardType } from '../types/game';

/**
 * Les cartes au clavier et au lecteur d'écran.
 *
 * Une carte était un `div` cliquable : aucun rôle, aucun nom, pas de tabulation, pas
 * de touche. Toute la partie se joue en cliquant des cartes — elle était donc
 * injouable autrement qu'à la souris, et muette pour un lecteur d'écran.
 *
 * Une carte sur laquelle on peut agir est maintenant un vrai bouton : le navigateur
 * lui donne le focus, l'activation au clavier et l'annonce de son nom. Une carte
 * simplement posée reste une image nommée.
 */

const RED_KING: CardType = { id: 'K-hearts-0', value: 'K', suit: 'hearts' };
const JOKER: CardType = { id: 'joker-0', isJoker: true };

describe('une carte sur laquelle on peut agir est un bouton', () => {
  it('porte un nom lisible, valeur et couleur', () => {
    render(<Card card={RED_KING} onClick={() => {}} />);

    expect(screen.getByRole('button', { name: /roi de cœur/i })).toBeDefined();
  });

  it('nomme le joker', () => {
    render(<Card card={JOKER} onClick={() => {}} />);

    expect(screen.getByRole('button', { name: /joker/i })).toBeDefined();
  });

  it('annonce qu\'elle est sélectionnée', () => {
    const { rerender } = render(<Card card={RED_KING} onClick={() => {}} />);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('false');

    rerender(<Card card={RED_KING} isSelected onClick={() => {}} />);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
  });

  it('annonce la carte qui vient d\'être piochée', () => {
    render(<Card card={RED_KING} justDrawn onClick={() => {}} />);

    expect(screen.getByRole('button', { name: /piochée/i })).toBeDefined();
  });

  it('s\'active comme un bouton', () => {
    const onClick = vi.fn();
    render(<Card card={RED_KING} onClick={onClick} />);

    const button = screen.getByRole('button');
    // Un vrai bouton reçoit le focus et s'active à Entrée et à Espace — c'est le
    // navigateur qui s'en charge, et c'est pour ça qu'on en fait un.
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.hasAttribute('disabled')).toBe(false);

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('une carte posée reste nommée, sans être cliquable', () => {
  it('est une image, pas un bouton', () => {
    render(<Card card={RED_KING} />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('img', { name: /roi de cœur/i })).toBeDefined();
  });

  it('nomme les quatre couleurs', () => {
    const cards: CardType[] = [
      { id: 'A-spades-0', value: 'A', suit: 'spades' },
      { id: '7-clubs-0', value: '7', suit: 'clubs' },
      { id: '10-diamonds-0', value: '10', suit: 'diamonds' },
      { id: 'Q-hearts-0', value: 'Q', suit: 'hearts' },
    ];
    render(<div>{cards.map(card => <Card key={card.id} card={card} />)}</div>);

    expect(screen.getByRole('img', { name: /as de pique/i })).toBeDefined();
    expect(screen.getByRole('img', { name: /7 de trèfle/i })).toBeDefined();
    expect(screen.getByRole('img', { name: /10 de carreau/i })).toBeDefined();
    expect(screen.getByRole('img', { name: /dame de cœur/i })).toBeDefined();
  });
});
