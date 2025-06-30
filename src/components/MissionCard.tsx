
import React from 'react';
import { Mission } from '../types/game';
import { cn } from '@/lib/utils';

interface MissionCardProps {
  mission: Mission;
  isActive?: boolean;
  isCompleted?: boolean;
  className?: string;
}

const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  isActive = false,
  isCompleted = false,
  className = ''
}) => {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border-4 transition-all duration-200 relative overflow-hidden',
        isActive && 'border-circus-gold bg-gradient-to-br from-circus-cream via-yellow-50 to-circus-cream shadow-2xl transform scale-105',
        isCompleted && 'border-green-600 bg-gradient-to-br from-green-100 via-emerald-50 to-green-100 shadow-xl',
        !isActive && !isCompleted && 'border-circus-navy bg-gradient-to-br from-gray-100 via-slate-50 to-gray-100 shadow-md',
        className
      )}
    >
      {/* Texture de fond vintage */}
      <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-transparent via-circus-gold to-transparent"></div>

      {/* Coins décoratifs */}
      {isActive && (
        <>
          <div className="absolute top-1 left-1 w-2 h-2 bg-circus-gold rounded-full"></div>
          <div className="absolute top-1 right-1 w-2 h-2 bg-circus-gold rounded-full"></div>
          <div className="absolute bottom-1 left-1 w-2 h-2 bg-circus-gold rounded-full"></div>
          <div className="absolute bottom-1 right-1 w-2 h-2 bg-circus-gold rounded-full"></div>
        </>
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-circus text-lg text-circus-red">
            Spectacle {mission.id}
          </h3>
          {isActive && <span className="text-2xl animate-gentle-pulse">🎯</span>}
          {isCompleted && <span className="text-2xl">✅</span>}
        </div>
        <h4 className="font-bold text-circus-navy mb-2 text-center border-b border-circus-gold pb-1">
          {mission.title}
        </h4>
        <p className="text-sm text-circus-black leading-relaxed">
          {mission.description}
        </p>
      </div>
    </div>
  );
};

export default MissionCard;
