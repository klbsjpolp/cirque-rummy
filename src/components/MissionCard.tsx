
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
        'p-4 rounded-lg border-2 transition-all duration-200',
        isActive && 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-lg',
        isCompleted && 'border-green-500 bg-gradient-to-br from-green-50 to-green-100',
        !isActive && !isCompleted && 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-lg text-red-800">
          Mission {mission.id}
        </h3>
        {isActive && <span className="text-2xl">🎯</span>}
        {isCompleted && <span className="text-2xl">✅</span>}
      </div>
      <h4 className="font-semibold text-red-600 mb-1">{mission.title}</h4>
      <p className="text-sm text-gray-700">{mission.description}</p>
    </div>
  );
};

export default MissionCard;
