
import React, { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { MISSIONS } from '../data/missions';
import Card from './Card';
import MissionCard from './MissionCard';
import { Button } from '@/components/ui/button';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const GameBoard: React.FC = () => {
  const { gameState, drawCard, discardCard, newGame, resetGame } = useGameState();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const otherPlayer = gameState.players[1 - gameState.currentPlayerIndex];
  const currentMission = MISSIONS.find(m => m.id === currentPlayer.currentMission);

  const handleCardClick = (cardId: string) => {
    setSelectedCardId(selectedCardId === cardId ? null : cardId);
  };

  const handleDiscard = () => {
    if (selectedCardId) {
      discardCard(selectedCardId);
      setSelectedCardId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black text-white p-4">
      {/* Header avec style cirque */}
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-400 mb-2">
          🎪 JOKRUMMY 🎪
        </h1>
        <div className="text-xl text-yellow-300">
          ⭐ Cirque des Cartes Mystérieuses ⭐
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Missions */}
        <div className="lg:col-span-1">
          <UICard className="bg-gradient-to-br from-amber-100 to-amber-200 border-4 border-yellow-600">
            <CardHeader>
              <CardTitle className="text-red-800 text-center">
                🎯 Missions du Cirque
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentMission && (
                <MissionCard 
                  mission={currentMission} 
                  isActive={true}
                  className="mb-4"
                />
              )}
              <div className="text-sm text-red-700">
                <p>Mission actuelle: {currentPlayer.currentMission}/12</p>
                <p>Missions complétées: {currentPlayer.completedMissions.length}</p>
              </div>
            </CardContent>
          </UICard>

          {/* Actions */}
          <div className="mt-4 space-y-2">
            <Button 
              onClick={() => drawCard(false)} 
              className="w-full bg-blue-700 hover:bg-blue-600"
            >
              🂠 Piocher du paquet
            </Button>
            <Button 
              onClick={() => drawCard(true)} 
              className="w-full bg-green-700 hover:bg-green-600"
              disabled={gameState.discardPile.length === 0}
            >
              🃏 Piocher de la défausse
            </Button>
            <Button 
              onClick={handleDiscard} 
              disabled={!selectedCardId}
              className="w-full bg-red-700 hover:bg-red-600"
            >
              🗑️ Défausser la carte sélectionnée
            </Button>
          </div>
        </div>

        {/* Colonne centrale - Plateau de jeu */}
        <div className="lg:col-span-2">
          {/* Informations des joueurs */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <UICard className={`border-4 ${gameState.currentPlayerIndex === 0 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-400 bg-gray-50'}`}>
              <CardContent className="p-4">
                <h3 className="font-bold text-red-800">
                  {gameState.players[0].name}
                  {gameState.currentPlayerIndex === 0 && ' 🎭'}
                </h3>
                <p className="text-sm text-gray-600">
                  Cartes: {gameState.players[0].hand.length} | 
                  Mission: {gameState.players[0].currentMission}
                </p>
              </CardContent>
            </UICard>
            
            <UICard className={`border-4 ${gameState.currentPlayerIndex === 1 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-400 bg-gray-50'}`}>
              <CardContent className="p-4">
                <h3 className="font-bold text-red-800">
                  {gameState.players[1].name}
                  {gameState.currentPlayerIndex === 1 && ' 🎭'}
                </h3>
                <p className="text-sm text-gray-600">
                  Cartes: {gameState.players[1].hand.length} | 
                  Mission: {gameState.players[1].currentMission}
                </p>
              </CardContent>
            </UICard>
          </div>

          {/* Pioche et défausse */}
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <h3 className="text-yellow-300 font-bold mb-2">📚 Pioche</h3>
              <div className="w-16 h-24 bg-gradient-to-br from-blue-800 to-blue-900 border-2 border-blue-400 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs">{gameState.deck.length}</span>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-yellow-300 font-bold mb-2">🗑️ Défausse</h3>
              {gameState.discardPile.length > 0 ? (
                <Card 
                  card={gameState.discardPile[gameState.discardPile.length - 1]} 
                  size="medium"
                />
              ) : (
                <div className="w-16 h-24 border-2 border-dashed border-gray-400 rounded-lg"></div>
              )}
            </div>
          </div>

          {/* Main du joueur actuel */}
          <UICard className="bg-gradient-to-br from-purple-900 to-purple-800 border-4 border-purple-400">
            <CardHeader>
              <CardTitle className="text-center text-yellow-300">
                🃏 Main de {currentPlayer.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 justify-center">
                {currentPlayer.hand.map(card => (
                  <Card
                    key={card.id}
                    card={card}
                    isSelected={selectedCardId === card.id}
                    onClick={() => handleCardClick(card.id)}
                    size="medium"
                  />
                ))}
              </div>
            </CardContent>
          </UICard>
        </div>
      </div>

      {/* Historique */}
      <div className="mt-6 text-center">
        <Button 
          onClick={() => setShowHistory(!showHistory)}
          variant="outline"
          className="bg-yellow-600 text-black hover:bg-yellow-500"
        >
          {showHistory ? '🔼' : '🔽'} Historique du spectacle
        </Button>
        
        {showHistory && (
          <UICard className="mt-4 bg-black bg-opacity-50 border-yellow-600">
            <CardContent className="p-4">
              <div className="max-h-32 overflow-y-auto">
                {gameState.gameHistory.map((entry, index) => (
                  <p key={index} className="text-sm text-yellow-200">
                    {entry}
                  </p>
                ))}
              </div>
            </CardContent>
          </UICard>
        )}
      </div>

      {/* Contrôles de jeu */}
      <div className="mt-6 text-center space-x-4">
        <Button onClick={newGame} className="bg-green-700 hover:bg-green-600">
          🎪 Nouvelle représentation
        </Button>
        <Button onClick={resetGame} variant="outline" className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white">
          🔄 Recommencer
        </Button>
      </div>
    </div>
  );
};

export default GameBoard;
