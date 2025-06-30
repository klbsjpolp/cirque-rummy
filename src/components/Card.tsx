
import React from 'react';
import { Card as CardType } from '../types/game';
import { getSuitSymbol, getSuitColor, isJokerCard } from '../utils/cardUtils';
import { cn } from '@/lib/utils';

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const Card: React.FC<CardProps> = ({ 
  card, 
  isSelected = false, 
  onClick, 
  className = '',
  size = 'medium'
}) => {
  const sizeClasses = {
    small: 'w-12 h-16 text-xs',
    medium: 'w-16 h-24 text-sm',
    large: 'w-20 h-28 text-base'
  };

  if (isJokerCard(card)) {
    return (
      <div
        className={cn(
          'bg-gradient-to-br from-purple-700 via-purple-600 to-purple-800 border-4 border-circus-gold rounded-lg cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-circus-cream font-bold shadow-2xl relative overflow-hidden',
          sizeClasses[size],
          isSelected && 'ring-4 ring-circus-gold transform -translate-y-3 animate-gentle-pulse',
          'hover:shadow-2xl hover:scale-110 hover:rotate-3',
          className
        )}
        onClick={onClick}
      >
        {/* Effet de brillance */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-20 animate-gentle-pulse"></div>

        {/* Liseré violet décoratif */}
        <div className="absolute inset-1 border-2 border-purple-300 rounded-md opacity-50"></div>

        <div className="text-3xl animate-bounce relative z-10">🃏</div>
        <div className="text-xs font-circus relative z-10">JOKER</div>

        {/* Étoiles décoratives */}
        <div className="absolute top-1 left-1 text-xs text-circus-gold">✨</div>
        <div className="absolute top-1 right-1 text-xs text-circus-gold">✨</div>
        <div className="absolute bottom-1 left-1 text-xs text-circus-gold">✨</div>
        <div className="absolute bottom-1 right-1 text-xs text-circus-gold">✨</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-circus-cream via-amber-50 to-circus-cream border-3 border-circus-navy rounded-lg cursor-pointer transition-all duration-300 flex flex-col justify-between p-1 shadow-xl relative overflow-hidden',
        sizeClasses[size],
        isSelected && 'ring-4 ring-circus-gold transform -translate-y-3 shadow-2xl',
        'hover:shadow-2xl hover:scale-105 hover:-rotate-1',
        className
      )}
      onClick={onClick}
    >
      {/* Texture de fond ivoire */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-circus-cream to-transparent opacity-30"></div>

      {/* Coins arrondis décoratifs */}
      <div className="absolute top-1 left-1 w-1 h-1 bg-circus-gold rounded-full opacity-60"></div>
      <div className="absolute top-1 right-1 w-1 h-1 bg-circus-gold rounded-full opacity-60"></div>
      <div className="absolute bottom-1 left-1 w-1 h-1 bg-circus-gold rounded-full opacity-60"></div>
      <div className="absolute bottom-1 right-1 w-1 h-1 bg-circus-gold rounded-full opacity-60"></div>

      <div className={cn('font-bold text-left relative z-10', getSuitColor(card.suit))}>
        <div className="text-sm">{card.value}</div>
        <div className="text-lg leading-none">{getSuitSymbol(card.suit)}</div>
      </div>
      <div className={cn('font-bold text-right rotate-180 relative z-10 -mb-1', getSuitColor(card.suit))}>
        <div className="text-sm">{card.value}</div>
        <div className="text-lg leading-none">{getSuitSymbol(card.suit)}</div>
      </div>
    </div>
  );
};

export default Card;
