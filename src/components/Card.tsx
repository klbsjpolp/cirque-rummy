
import React from 'react';
import { Card as CardType } from '../types/game';
import { getSuitSymbol, getSuitColor } from '../utils/cardUtils';
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

  if (card.isJoker) {
    return (
      <div
        className={cn(
          'bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-gold-400 rounded-lg cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-white font-bold shadow-lg',
          sizeClasses[size],
          isSelected && 'ring-4 ring-yellow-400 transform -translate-y-2',
          'hover:shadow-xl hover:scale-105',
          className
        )}
        onClick={onClick}
      >
        <div className="text-2xl">🃏</div>
        <div className="text-xs">JOKER</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-900 rounded-lg cursor-pointer transition-all duration-200 flex flex-col justify-between p-1 shadow-lg',
        sizeClasses[size],
        isSelected && 'ring-4 ring-yellow-400 transform -translate-y-2',
        'hover:shadow-xl hover:scale-105',
        className
      )}
      onClick={onClick}
    >
      <div className={cn('font-bold text-left', getSuitColor(card.suit))}>
        <div>{card.value}</div>
        <div className="text-lg leading-none">{getSuitSymbol(card.suit)}</div>
      </div>
      <div className={cn('font-bold text-right rotate-180', getSuitColor(card.suit))}>
        <div>{card.value}</div>
        <div className="text-lg leading-none">{getSuitSymbol(card.suit)}</div>
      </div>
    </div>
  );
};

export default Card;
