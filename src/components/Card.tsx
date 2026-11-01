import React from 'react';
import { Card as CardType, CardSuit, CardValue } from '../types/game';
import { isJokerCard } from '../utils/cardUtils';

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  highlighted?: boolean;
  justDrawn?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  style?: 'clean' | 'vintage';
}

const SUIT_GLYPH: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };

/**
 * Le nom parlé d'une carte. Les glyphes (♥, K) ne se lisent pas : un lecteur d'écran
 * annonçait « K noir cœur » ou rien du tout. Ces noms-là s'entendent.
 */
const SUIT_NAMES: Record<CardSuit, string> = {
  hearts: 'cœur',
  diamonds: 'carreau',
  clubs: 'trèfle',
  spades: 'pique',
};
const VALUE_NAMES: Partial<Record<CardValue, string>> = {
  A: 'as',
  J: 'valet',
  Q: 'dame',
  K: 'roi',
};

const cardName = (card: CardType): string =>
  isJokerCard(card)
    ? 'Joker'
    : `${VALUE_NAMES[card.value] ?? card.value} de ${SUIT_NAMES[card.suit]}`;

/** Le nom complet, état compris : c'est ce qu'un lecteur d'écran annonce. */
const accessibleName = (card: CardType, isSelected: boolean, justDrawn: boolean): string => {
  const states = [
    isSelected ? 'sélectionnée' : null,
    justDrawn ? 'piochée à l\'instant' : null,
  ].filter(Boolean);
  return states.length > 0 ? `${cardName(card)}, ${states.join(', ')}` : cardName(card);
};
const SUIT_COLOR: Record<string, string> = { hearts: '#c62b2b', diamonds: '#c62b2b', clubs: '#1a1a1a', spades: '#1a1a1a' };

/** Ce qu'un `<button>` apporte de lui-même et qu'une carte ne veut pas. */
const BUTTON_RESET: React.CSSProperties = {
  appearance: 'none',
  margin: 0,
  font: 'inherit',
  textAlign: 'left',
  display: 'block',
};

const SIZES = {
  small:  { w: 48, h: 68,  rank: 18, suit: 18, pad: 4, center: 22 },
  medium: { w: 60, h: 86,  rank: 22, suit: 22, pad: 5, center: 30 },
  large:  { w: 74, h: 108, rank: 28, suit: 28, pad: 6, center: 38 },
};

/**
 * L'enveloppe de la carte.
 *
 * Une carte sur laquelle on peut agir est un vrai `<button>` : le navigateur lui donne
 * le focus, l'activation à Entrée et à Espace, et l'annonce de son nom — tout ce qu'un
 * `div` cliquable ne donne pas. Une carte simplement posée n'est pas interactive :
 * c'est une image, mais une image nommée.
 *
 * Ce composant vit au niveau du module, et non dans le rendu de `Card` : un composant
 * recréé à chaque rendu remonte ses enfants, et la carte perdrait le focus clavier.
 */
const CardShell: React.FC<{
  label: string;
  isSelected: boolean;
  onClick?: () => void;
  className: string;
  style: React.CSSProperties;
  children: React.ReactNode;
}> = ({ label, isSelected, onClick, className, style, children }) => onClick
  ? (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isSelected}
      className={`cr-card ${className}`.trim()}
      style={{ ...style, ...BUTTON_RESET }}
    >
      {children}
    </button>
  )
  : (
    <div role="img" aria-label={label} className={className} style={style}>
      {children}
    </div>
  );

const Card: React.FC<CardProps> = ({
  card,
  isSelected = false,
  highlighted = false,
  justDrawn = false,
  onClick,
  className = '',
  size = 'medium',
  style = 'vintage',
}) => {
  const s = SIZES[size];
  const isVintage = style === 'vintage';

  const label = accessibleName(card, isSelected, justDrawn);
  const shell = { label, isSelected, onClick, className };

  const baseShadow = isSelected
    ? '0 10px 20px rgba(0,0,0,0.22), 0 0 0 2px #e8c14a'
    : highlighted
      ? '0 4px 10px rgba(232,193,74,0.35), 0 0 0 1.5px #e8c14a'
      : isVintage
        ? '0 2px 6px rgba(60,40,20,0.2)'
        : '0 2px 4px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.04)';

  const baseBorder = isSelected
    ? '2px solid #e8c14a'
    : justDrawn
      ? '2px solid #5fd4a8'
      : isVintage ? '1px solid #d4bf86' : '1px solid rgba(0,0,0,0.15)';

  const baseStyle: React.CSSProperties = {
    width: s.w,
    height: s.h,
    borderRadius: 8,
    border: baseBorder,
    boxShadow: baseShadow,
    position: 'relative',
    padding: s.pad,
    boxSizing: 'border-box',
    cursor: onClick ? 'pointer' : 'default',
    transform: isSelected ? 'translateY(-10px)' : 'translateY(0)',
    transition: 'transform 0.18s cubic-bezier(.2,.7,.3,1), box-shadow 0.18s',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  };

  if (isJokerCard(card)) {
    const bg = isVintage
      ? 'linear-gradient(160deg, #fdf6e3 0%, #f4ead0 100%)'
      : '#ffffff';
    const jokerInk = '#4a2a7a';
    return (
      <CardShell
        {...shell}
        style={{
          ...baseStyle,
          background: bg,
          color: jokerInk,
          fontFamily: isVintage ? 'Georgia, "Times New Roman", serif' : '-apple-system, "SF Pro Display", system-ui, sans-serif',
        }}
      >
        {isVintage && (
          <div style={{ position: 'absolute', inset: 2, border: '1px solid rgba(180,140,60,0.3)', borderRadius: 6, pointerEvents: 'none' }} />
        )}
        <div style={{ position: 'absolute', top: s.pad, left: s.pad + 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1, zIndex: 1 }}>
          <div style={{ fontSize: Math.max(10, s.rank - 8), fontWeight: 700, letterSpacing: 1.5, color: jokerInk }}>JKR</div>
          <div style={{ fontSize: s.suit, marginTop: 1, color: jokerInk }}>★</div>
        </div>
        <div style={{ position: 'absolute', bottom: s.pad, right: s.pad + 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1, zIndex: 1, transform: 'rotate(180deg)', transformOrigin: 'center' }}>
          <div style={{ fontSize: Math.max(10, s.rank - 8), fontWeight: 700, letterSpacing: 1.5, color: jokerInk }}>JKR</div>
          <div style={{ fontSize: s.suit, marginTop: 1, color: jokerInk }}>★</div>
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: s.center + 6, lineHeight: 1, color: jokerInk }}>★</div>
        </div>
      </CardShell>
    );
  }

  const color = SUIT_COLOR[card.suit];
  const glyph = SUIT_GLYPH[card.suit];

  if (!isVintage) {
    return (
      <CardShell
        {...shell}
        style={{
          ...baseStyle,
          background: '#ffffff',
          color,
          fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
        }}
      >
        <div style={{ position: 'absolute', top: s.pad, left: s.pad + 1, fontSize: s.rank, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1 }}>
          {card.value}
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: Math.round(s.center * 1.35), lineHeight: 1 }}>{glyph}</div>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell
      {...shell}
      style={{
        ...baseStyle,
        background: 'linear-gradient(160deg, #fdf6e3 0%, #f4ead0 100%)',
        color,
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
    >
      <div style={{ position: 'absolute', inset: 2, border: '1px solid rgba(180,140,60,0.3)', borderRadius: 6, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1, zIndex: 1 }}>
        <div style={{ fontSize: s.rank, fontWeight: 700, letterSpacing: -0.5 }}>{card.value}</div>
        <div style={{ fontSize: s.suit, marginTop: 1 }}>{glyph}</div>
      </div>
      <div style={{ position: 'absolute', bottom: s.pad, right: s.pad + 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1, zIndex: 1, transform: 'rotate(180deg)', transformOrigin: 'center' }}>
        <div style={{ fontSize: s.rank, fontWeight: 700, letterSpacing: -0.5 }}>{card.value}</div>
        <div style={{ fontSize: s.suit, marginTop: 1 }}>{glyph}</div>
      </div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{
          fontSize: Math.round(s.center * 1.5),
          lineHeight: 1,
          color: '#d4a84a',
          textShadow: '0 1px 0 rgba(120,80,20,0.25)',
        }}>★</div>
      </div>
    </CardShell>
  );
};

export const CardBack: React.FC<{ size?: 'small' | 'medium' | 'large'; style?: 'clean' | 'vintage' }> = ({
  size = 'medium',
  style = 'vintage',
}) => {
  const s = SIZES[size];
  const pattern = style === 'vintage'
    ? 'repeating-linear-gradient(45deg, #c43a4c 0 6px, #a62434 6px 12px)'
    : 'repeating-linear-gradient(45deg, #3a6a9e 0 6px, #2e5584 6px 12px)';
  return (
    <div style={{
      width: s.w, height: s.h, borderRadius: 8,
      background: pattern,
      border: '1px solid rgba(0,0,0,0.18)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 4, borderRadius: 6,
        border: '1px solid rgba(255,228,150,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,235,170,0.98)', fontSize: s.w > 50 ? 20 : 14, fontFamily: 'Georgia, serif',
      }}>★</div>
    </div>
  );
};

export default Card;
