
import React, { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { MISSIONS } from '../data/missions';
import Card from './Card';
import { Button } from '@/components/ui/button';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const GameBoard: React.FC = () => {
  const { gameState, drawCard, discardCard, presentMissionCards, layEndOfRoundCombinations, addToExistingCombination, newGame, resetGame, reorderCards } = useGameState();
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedCardSource, setDraggedCardSource] = useState<'hand' | 'discard' | 'deck' | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dropZoneActive, setDropZoneActive] = useState<'hand' | 'discard' | null>(null);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  // En mode IA, toujours afficher la main du joueur 1 (humain)
  const displayedPlayer = gameState.gameMode === 'ai' ? gameState.players[0] : currentPlayer;

  const handleCardClick = (cardId: string) => {
    setSelectedCardIds(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handleDiscard = () => {
    if (selectedCardIds.length === 1) {
      discardCard(selectedCardIds[0]);
      setSelectedCardIds([]);
    }
  };


  const clearSelection = () => {
    setSelectedCardIds([]);
  };

  const handlePresentMission = () => {
    if (selectedCardIds.length >= 3) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];

      if (!currentPlayer.isCurrentMissionCompleted()) {
        // Mission actuelle pas encore complétée - validation de mission
        presentMissionCards(selectedCardIds);
      } else {
        // Mission actuelle déjà complétée - poser de nouveaux groupes uniquement
        layEndOfRoundCombinations(selectedCardIds);
      }
      setSelectedCardIds([]);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, cardIndex: number, source: 'hand' | 'discard' | 'deck' = 'hand', cardId?: string) => {
    setDraggedCardIndex(cardIndex);
    setDraggedCardSource(source);
    setDraggedCardId(cardId || null);

    // If dragging from deck, immediately draw the card to reveal it
    if (source === 'deck' && gameState.deck.length > 0) {
      drawCard(false);
      // Get the card that will be drawn (it's the last card in the deck)
      const drawnCard = gameState.deck[gameState.deck.length - 1];
      setDraggedCardId(drawnCard.id);
    }

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Required for Firefox
  };

  const handleDragOver = (e: React.DragEvent, cardIndex?: number, dropZone?: 'hand' | 'discard') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (dropZone) {
      setDropZoneActive(dropZone);
    } else if (cardIndex !== undefined) {
      setDragOverIndex(cardIndex);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
    setDropZoneActive(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex?: number, dropZone?: 'hand' | 'discard') => {
    e.preventDefault();

    if (draggedCardSource === 'hand' && dropZone === 'discard' && draggedCardId) {
      // Drag from hand to discard pile
      discardCard(draggedCardId);
    } else if (draggedCardSource === 'discard' && dropZone === 'hand') {
      // Drag from discard pile to hand
      drawCard(true);
    } else if (draggedCardSource === 'deck' && dropZone === 'hand') {
      // Drag from deck to hand - card was already drawn in handleDragStart
      // No need to draw again, card is already in hand
    } else if (draggedCardSource === 'deck' && !dropZone) {
      // Drag from deck but dropped in invalid location - card is already in hand at the end
      // This is the desired behavior: card goes to last place in hand
    } else if (draggedCardIndex !== null && dropIndex !== undefined && draggedCardIndex !== dropIndex && draggedCardSource === 'hand') {
      // Reorder cards within hand
      reorderCards(draggedCardIndex, dropIndex);
    }

    // Reset all drag states
    setDraggedCardIndex(null);
    setDragOverIndex(null);
    setDraggedCardSource(null);
    setDraggedCardId(null);
    setDropZoneActive(null);
  };

  const handleDragEnd = () => {
    setDraggedCardIndex(null);
    setDragOverIndex(null);
    setDraggedCardSource(null);
    setDraggedCardId(null);
    setDropZoneActive(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black text-white p-4">
      {/* Header avec style cirque vintage */}
      <div className="text-center mb-8 relative">
        {/* Titre principal avec police cirque */}
        <h1 className="font-circus text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-circus-gold via-yellow-300 to-circus-gold mb-3 drop-shadow-2xl relative z-10">
          🎪 CIRQUE RUMMY 🎪
        </h1>

        {/* Sous-titre avec style affiche vintage */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-circus-red to-transparent h-px top-1/2 transform -translate-y-1/2"></div>
          <div className="text-xl md:text-2xl text-circus-cream font-semibold bg-gradient-to-br from-red-900 to-black px-6 py-2 rounded-full border-2 border-circus-gold shadow-lg relative z-10">
            ⭐ Cirque des cartes mystérieuses ⭐
          </div>
        </div>

        {/* Rideaux décoratifs */}
        <div className="absolute left-0 top-0 text-6xl text-circus-red opacity-70 transform rotate-[-30deg]">🎭</div>
        <div className="absolute right-0 top-0 text-6xl text-circus-red opacity-70 transform rotate-[30deg]">🎭</div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Missions */}
        <div className="lg:col-span-1">
          <UICard className="bg-gradient-to-br from-circus-cream via-amber-50 to-circus-cream border-4 border-circus-gold shadow-2xl relative overflow-hidden">
            {/* Cadre décoratif doré */}
            <div className="absolute inset-0 border-8 border-double border-circus-gold opacity-50 rounded-lg"></div>
            <div className="absolute top-2 left-2 w-4 h-4 bg-circus-gold rounded-full"></div>
            <div className="absolute top-2 right-2 w-4 h-4 bg-circus-gold rounded-full"></div>
            <div className="absolute bottom-2 left-2 w-4 h-4 bg-circus-gold rounded-full"></div>
            <div className="absolute bottom-2 right-2 w-4 h-4 bg-circus-gold rounded-full"></div>

            <CardHeader className="relative z-10">
              <CardTitle className="text-circus-red text-center font-circus text-2xl">
                🎯 Mission du cirque 🎪
              </CardTitle>
              <div className="text-center text-sm text-circus-navy font-semibold">
                ✨ Spectacle à accomplir #{(() => {
                  // En mode IA, afficher la mission du joueur 1 (humain)
                  // En mode normal, afficher la mission du joueur actuel
                  const missionPlayer = gameState.gameMode === 'ai' ? gameState.players[0] : currentPlayer;
                  const mission = MISSIONS.find(m => m.id === missionPlayer.currentMission);
                  return mission ? mission.id .toString(): '';
                })()} ✨
              </div>
              {/* Afficher la mission en cours */}
              {(() => {
                // En mode IA, afficher la mission du joueur 1 (humain)
                // En mode normal, afficher la mission du joueur actuel
                const missionPlayer = gameState.gameMode === 'ai' ? gameState.players[0] : currentPlayer;
                const mission = MISSIONS.find(m => m.id === missionPlayer.currentMission);

                return mission ? (
                  <>
                    <div className="text-center mb-2">
                      <span className="text-2xl">{mission.icon}</span>
                    </div>
                    <h5 className="font-bold text-circus-navy text-center mb-2">
                      {mission.title}
                    </h5>
                    <p className="text-sm text-circus-black text-center">
                      {mission.description}
                    </p>
                  </>
                ) : null;
              })()}
            </CardHeader>
          </UICard>

          {/* Turn Status Indicator */}
          {!gameState.isGameOver && !gameState.isAITurn && (
            <div className="mt-4 p-3 bg-gradient-to-br from-circus-gold via-yellow-200 to-circus-gold border-2 border-circus-red rounded-lg text-center">
              <div className="text-circus-black font-circus text-sm font-bold">
                {!gameState.hasDrawnThisTurn ? (
                  <>🎯 ÉTAPE 1: Piochez une carte pour commencer votre tour</>
                ) : gameState.mustDiscardToEndTurn ? (
                  <>🎪 ÉTAPE 3: Défaussez une carte pour terminer votre tour</>
                ) : (
                  <>✨ ÉTAPE 2: Jouez vos cartes (optionnel) puis défaussez</>
                )}
              </div>
            </div>
          )}

          {/* Actions - Boutons style cirque */}
          <div className="mt-4 space-y-3">
            <Button 
              onClick={() => drawCard(false)} 
              className="w-full bg-gradient-to-br from-circus-navy via-blue-700 to-circus-navy hover:from-blue-600 hover:to-blue-800 border-2 border-circus-gold text-circus-cream font-circus text-lg py-3 shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden"
              disabled={gameState.isGameOver || gameState.isAITurn || gameState.cardsDrawnThisTurn >= 1}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-circus-gold to-transparent opacity-20"></div>
              <span className="relative z-10">🎩 Piocher du Chapeau Magique</span>
            </Button>
            <Button 
              onClick={() => drawCard(true)} 
              className="w-full bg-gradient-to-br from-green-700 via-emerald-600 to-green-800 hover:from-green-600 hover:to-emerald-700 border-2 border-circus-gold text-circus-cream font-circus text-lg py-3 shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden"
              disabled={gameState.discardPile.length === 0 || gameState.isGameOver || gameState.isAITurn || gameState.cardsDrawnThisTurn >= 1}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-circus-gold to-transparent opacity-20"></div>
              <span className="relative z-10">🗑️ Récupérer de la Défausse</span>
            </Button>

            {/* Combination controls - Style numéros de cirque */}
            <div className="border-t-4 border-circus-gold pt-4 mt-4 bg-gradient-to-br from-circus-black via-gray-800 to-circus-black rounded-lg p-3">
              <div className="text-center text-circus-gold font-circus text-sm mb-3">
                ✨ Préparer un Numéro ✨
              </div>

              <Button 
                onClick={handlePresentMission} 
                disabled={selectedCardIds.length < 3 || gameState.isGameOver || gameState.isAITurn || !gameState.hasDrawnThisTurn}
                className="w-full bg-gradient-to-br from-purple-700 via-purple-600 to-purple-800 hover:from-purple-600 hover:to-purple-700 border-2 border-circus-gold text-circus-cream font-circus text-lg py-3 mb-3 shadow-xl transform transition-all duration-300 hover:scale-105 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-circus-gold to-transparent opacity-20"></div>
                <span className="relative z-10">
                  {(() => {
                    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

                    return currentPlayer.isCurrentMissionCompleted()
                      ? `🎪 Poser Groupes (${selectedCardIds.length} cartes)`
                      : `🪄 Présenter Mission (${selectedCardIds.length} cartes)`;
                  })()}
                </span>
              </Button>

              <Button 
                onClick={clearSelection} 
                disabled={selectedCardIds.length === 0 || gameState.isAITurn}
                className="w-full bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 border-2 border-circus-navy text-circus-cream font-circus py-2 mb-3 shadow-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                ❌ Annuler Sélection
              </Button>
            </div>

            <Button 
              onClick={handleDiscard} 
              disabled={selectedCardIds.length !== 1 || gameState.isGameOver || gameState.isAITurn || !gameState.hasDrawnThisTurn}
              className="w-full bg-gradient-to-br from-circus-red via-red-600 to-red-800 hover:from-red-600 hover:to-red-700 border-2 border-circus-gold text-circus-cream font-circus text-lg py-3 shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-circus-gold to-transparent opacity-20"></div>
              <span className="relative z-10">
                🗑️ Défausser ({selectedCardIds.length === 1 ? '1 carte' : 'sélectionnez 1 carte'})
                {gameState.mustDiscardToEndTurn && ' - Obligatoire pour finir le tour'}
              </span>
            </Button>
          </div>
        </div>

        {/* Colonne centrale - Plateau de jeu */}
        <div className="lg:col-span-2">
          {/* Panneaux Joueurs - Style pancartes de foire */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Joueur 1 */}
            <UICard className={`border-4 relative overflow-hidden transform transition-all duration-300 ${
              gameState.currentPlayerIndex === 0 
                ? 'border-circus-gold bg-gradient-to-br from-circus-cream via-yellow-100 to-circus-cream shadow-2xl scale-105 animate-gentle-pulse' 
                : 'border-circus-navy bg-gradient-to-br from-gray-100 via-slate-100 to-gray-100 shadow-lg'
            }`}>
              {/* Décoration de pancarte */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-circus-red via-circus-gold to-circus-red"></div>
              <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-circus-red via-circus-gold to-circus-red"></div>

              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl">🎩</div>
                  {gameState.currentPlayerIndex === 0 && (
                    <div className="text-2xl animate-bounce">🎭</div>
                  )}
                </div>
                <h3 className="font-circus text-lg text-circus-red text-center mb-2">
                  {gameState.players[0].name}
                </h3>

                {/* Cartes restantes avec icônes */}
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="text-xs font-semibold text-circus-navy">Cartes:</span>
                  <div className="flex items-center">
                    {Array.from({ length: gameState.players[0].hand.length }, (_, i) => (
                      <span key={i} className="text-blue-600 text-sm">🃏</span>
                    ))}
                  </div>
                </div>

                {/* Missions avec icônes de cibles */}
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs font-semibold text-circus-navy">Missions:</span>
                  <div className="flex items-center">
                    {Array.from({ length: 7 }, (_, i) => (
                      <span 
                        key={i} 
                        className={gameState.players[0].completedMissions.length > i ? "text-xs" : "grayscale opacity-50 text-xs"}
                      >
                        🎯
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </UICard>

            {/* Joueur 2 */}
            <UICard className={`border-4 relative overflow-hidden transform transition-all duration-300 ${
              gameState.currentPlayerIndex === 1 
                ? 'border-circus-gold bg-gradient-to-br from-circus-cream via-yellow-100 to-circus-cream shadow-2xl scale-105 animate-gentle-pulse' 
                : 'border-circus-navy bg-gradient-to-br from-gray-100 via-slate-100 to-gray-100 shadow-lg'
            }`}>
              {/* Décoration de pancarte */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-circus-red via-circus-gold to-circus-red"></div>
              <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-circus-red via-circus-gold to-circus-red"></div>

              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl">{gameState.gameMode === 'ai' ? '🤖' : '🪄'}</div>
                  {gameState.currentPlayerIndex === 1 && (
                    <div className="text-2xl animate-bounce">🎭</div>
                  )}
                </div>
                <h3 className="font-circus text-lg text-circus-red text-center mb-2">
                  {gameState.players[1].name}
                </h3>

                {/* Cartes restantes avec icônes */}
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="text-xs font-semibold text-circus-navy">Cartes:</span>
                  <div className="flex items-center">
                    {Array.from({ length: gameState.players[1].hand.length }, (_, i) => (
                      <span key={i} className="text-blue-600 text-sm">🃏</span>
                    ))}
                  </div>
                </div>

                {/* Missions avec icônes de cibles */}
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs font-semibold text-circus-navy">Missions:</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 7 }, (_, i) => (
                      <span 
                        key={i} 
                        className={gameState.players[1].completedMissions.length > i ? "text-xs" : "grayscale opacity-50 text-xs"}
                      >
                        🎯
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </UICard>
          </div>

          {/* Chapeau et défausse - Style caisses anciennes */}
          <div className="flex justify-center gap-12 mb-6">
            {/* Chapeau - Caisse mystérieuse */}
            <div className="text-center group">
              <h3 className="text-circus-gold font-circus text-lg mb-3 flex items-center justify-center gap-2">
                🎩 Chapeau Magique 🎩
              </h3>
              <div className="relative">
                {/* Caisse 3D */}
                <div 
                  className="w-20 h-28 bg-gradient-to-br from-amber-800 via-amber-700 to-amber-900 border-4 border-circus-gold rounded-lg flex items-center justify-center relative overflow-hidden shadow-2xl transform transition-all duration-300 hover:scale-110 hover:rotate-3 cursor-move"
                  draggable={!gameState.isGameOver && !gameState.isAITurn && gameState.deck.length > 0}
                  onDragStart={(e) => handleDragStart(e, 0, 'deck')}
                  onDragEnd={handleDragEnd}
                >
                  {/* Texture bois */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-600 to-transparent opacity-30"></div>

                  {/* Clous décoratifs */}
                  <div className="absolute top-2 left-2 w-1 h-1 bg-circus-black rounded-full"></div>
                  <div className="absolute top-2 right-2 w-1 h-1 bg-circus-black rounded-full"></div>
                  <div className="absolute bottom-2 left-2 w-1 h-1 bg-circus-black rounded-full"></div>
                  <div className="absolute bottom-2 right-2 w-1 h-1 bg-circus-black rounded-full"></div>

                  {/* Contenu */}
                  <div className="text-center relative z-10">
                    <div className="text-2xl mb-1 animate-gentle-pulse">🎴</div>
                    <span className="text-circus-cream text-sm font-bold bg-circus-black bg-opacity-50 px-2 py-1 rounded">
                      {gameState.deck.length}
                    </span>
                  </div>

                  {/* Effet de brillance */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-circus-gold to-transparent opacity-20 group-hover:animate-gentle-pulse"></div>
                </div>

                {/* Ombre 3D */}
                <div className="absolute top-2 left-2 w-20 h-28 bg-circus-black opacity-30 rounded-lg -z-10"></div>
              </div>
            </div>

            {/* Défausse - Caisse ouverte */}
            <div className="text-center group">
              <h3 className="text-circus-gold font-circus text-lg mb-3 flex items-center justify-center gap-2">
                🗑️ Défausse du Cirque 🗑️
              </h3>
              <div 
                className={`relative ${dropZoneActive === 'discard' ? 'ring-4 ring-circus-gold animate-pulse' : ''}`}
                onDragOver={(e) => handleDragOver(e, undefined, 'discard')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, undefined, 'discard')}
              >
                {gameState.discardPile.length > 0 ? (
                  <div className="relative">
                    {/* Caisse de fond */}
                    <div className="absolute inset-0 w-20 h-28 bg-gradient-to-br from-red-800 via-red-700 to-red-900 border-4 border-circus-gold rounded-lg shadow-xl">
                      {/* Clous décoratifs */}
                      <div className="absolute top-2 left-2 w-1 h-1 bg-circus-black rounded-full"></div>
                      <div className="absolute top-2 right-2 w-1 h-1 bg-circus-black rounded-full"></div>
                      <div className="absolute bottom-2 left-2 w-1 h-1 bg-circus-black rounded-full"></div>
                      <div className="absolute bottom-2 right-2 w-1 h-1 bg-circus-black rounded-full"></div>
                    </div>

                    {/* Carte visible */}
                    <div 
                      className="relative z-10 transform hover:scale-105 transition-all duration-300 cursor-move"
                      draggable={!gameState.isGameOver && !gameState.isAITurn}
                      onDragStart={(e) => handleDragStart(e, 0, 'discard', gameState.discardPile[gameState.discardPile.length - 1].id)}
                      onDragEnd={handleDragEnd}
                    >
                      <Card 
                        card={gameState.discardPile[gameState.discardPile.length - 1]} 
                        size="medium"
                      />
                    </div>

                    {/* Ombre 3D */}
                    <div className="absolute top-2 left-2 w-20 h-28 bg-circus-black opacity-30 rounded-lg -z-20"></div>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Caisse vide */}
                    <div className="w-20 h-28 bg-gradient-to-br from-gray-600 via-gray-500 to-gray-700 border-4 border-dashed border-circus-navy rounded-lg flex items-center justify-center shadow-xl relative overflow-hidden">
                      {/* Texture */}
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-400 to-transparent opacity-30"></div>

                      {/* Clous décoratifs */}
                      <div className="absolute top-2 left-2 w-1 h-1 bg-circus-black rounded-full"></div>
                      <div className="absolute top-2 right-2 w-1 h-1 bg-circus-black rounded-full"></div>
                      <div className="absolute bottom-2 left-2 w-1 h-1 bg-circus-black rounded-full"></div>
                      <div className="absolute bottom-2 right-2 w-1 h-1 bg-circus-black rounded-full"></div>

                      <div className="text-gray-400 text-2xl opacity-50">📦</div>
                    </div>

                    {/* Ombre 3D */}
                    <div className="absolute top-2 left-2 w-20 h-28 bg-circus-black opacity-30 rounded-lg -z-10"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main du joueur actuel - Style scène de cirque */}
          <UICard className="bg-gradient-to-br from-purple-900 via-purple-800 to-circus-black border-4 border-circus-gold shadow-2xl relative overflow-hidden">
            {/* Rideaux de scène */}
            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-circus-red via-circus-gold to-circus-red"></div>
            <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-r from-circus-red via-circus-gold to-circus-red"></div>

            {/* Projecteurs */}
            <div className="absolute top-2 left-4 w-3 h-3 bg-circus-gold rounded-full animate-gentle-pulse"></div>
            <div className="absolute top-2 right-4 w-3 h-3 bg-circus-gold rounded-full animate-gentle-pulse"></div>

            <CardHeader className="relative z-10">
              <CardTitle className="text-center text-circus-gold font-circus text-2xl">
                🎭 Scène de {displayedPlayer.name} 🎭
              </CardTitle>
              <div className="text-center text-circus-cream text-sm">
                ✨ Cartes en Main ✨
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div 
                className={`flex flex-nowrap justify-center p-4 bg-gradient-to-br from-transparent via-purple-700 to-transparent rounded-lg ${
                  displayedPlayer.hand.length > 13
                    ? 'gap-0'
                    : displayedPlayer.hand.length > 8 
                    ? 'gap-0 -space-x-2 sm:space-x-0 sm:gap-1 md:space-x-0' 
                    : displayedPlayer.hand.length > 6 
                      ? 'gap-1 sm:gap-2' 
                      : 'gap-2'
                } ${dropZoneActive === 'hand' ? 'ring-4 ring-circus-gold animate-pulse' : ''}`}
                onDragOver={(e) => handleDragOver(e, undefined, 'hand')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, undefined, 'hand')}
              >
                {displayedPlayer.hand.map((card, index) => (
                  <div 
                    key={card.id} 
                    className={`transform transition-all duration-300 hover:scale-110 hover:z-10 cursor-move ${
                      draggedCardIndex === index ? 'opacity-50 scale-95' : ''
                    } ${
                      dragOverIndex === index ? 'scale-110 ring-4 ring-circus-gold z-10' : ''
                    } ${
                      displayedPlayer.hand.length > 8 ? 'hover:scale-125' : ''
                    }`}
                    style={{
                      zIndex: dragOverIndex === index || selectedCardIds.includes(card.id) ? 20 : 10
                    }}
                    draggable={!gameState.isGameOver && !gameState.isAITurn}
                    onDragStart={(e) => handleDragStart(e, index, 'hand', card.id)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <Card
                      card={card}
                      isSelected={selectedCardIds.includes(card.id)}
                      onClick={() => handleCardClick(card.id)}
                      size={displayedPlayer.hand.length > 10 ? "small" : displayedPlayer.hand.length > 7 ? "medium" : "medium"}
                      className={displayedPlayer.hand.length > 8 ? "sm:w-14 sm:h-20" : ""}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </UICard>

          {/* Numéros de Cirque - Combinaisons posées */}
          {displayedPlayer.combinations.length > 0 && (
            <UICard className="mt-6 bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-900 border-4 border-circus-gold shadow-2xl relative overflow-hidden">
              {/* Décoration de chapiteau */}
              <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-r from-circus-red via-circus-gold to-circus-red"></div>
              <div className="absolute top-1 left-0 w-full h-4 bg-gradient-to-r from-transparent via-circus-gold to-transparent opacity-50"></div>

              {/* Étoiles décoratives */}
              <div className="absolute top-3 left-4 text-circus-gold text-xl animate-gentle-pulse">⭐</div>
              <div className="absolute top-3 right-4 text-circus-gold text-xl animate-gentle-pulse">⭐</div>

              <CardHeader className="relative z-10 pt-8">
                <CardTitle className="text-center text-circus-gold font-circus text-2xl">
                  🏆 Numéros Présentés par {displayedPlayer.name} 🏆
                </CardTitle>
                <div className="text-center text-circus-cream text-sm">
                  ✨ Spectacles Réussis ✨
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-6">
                  {displayedPlayer.combinations.map((combination, index) => (
                    <div key={combination.id} className="border-4 border-circus-gold rounded-lg p-4 bg-gradient-to-br from-circus-cream via-amber-50 to-circus-cream shadow-xl relative overflow-hidden">
                      {/* Cadre décoratif */}
                      <div className="absolute inset-1 border-2 border-double border-circus-gold opacity-30 rounded-md"></div>

                      {/* Coins dorés */}
                      <div className="absolute top-1 left-1 w-2 h-2 bg-circus-gold rounded-full"></div>
                      <div className="absolute top-1 right-1 w-2 h-2 bg-circus-gold rounded-full"></div>
                      <div className="absolute bottom-1 left-1 w-2 h-2 bg-circus-gold rounded-full"></div>
                      <div className="absolute bottom-1 right-1 w-2 h-2 bg-circus-gold rounded-full"></div>

                      <div className="relative z-10">
                        <h4 className="text-lg font-circus text-circus-red text-center mb-3 border-b-2 border-circus-gold pb-2">
                          {combination.type === 'group' ? '🎯 Numéro de Groupe' : '🔗 Numéro de Suite'} #{index + 1}
                        </h4>
                        <div className="flex flex-wrap gap-2 justify-center bg-gradient-to-br from-transparent via-circus-cream to-transparent p-3 rounded-lg">
                          {combination.cards.map(card => (
                            <div key={card.id} className="transform hover:scale-110 transition-all duration-300">
                              <Card
                                card={card}
                                size="small"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Extension button - only show if current player has completed mission and has selected cards */}
                        {gameState.players[gameState.currentPlayerIndex].completedMissions.length > 0 && 
                         selectedCardIds.length > 0 && 
                         !gameState.isGameOver && 
                         !gameState.isAITurn && (
                          <div className="mt-3 text-center">
                            <Button
                              onClick={() => {
                                addToExistingCombination(selectedCardIds, combination.id, displayedPlayer.id);
                                setSelectedCardIds([]);
                              }}
                              size="sm"
                              className="bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-circus text-sm px-4 py-2 border-2 border-circus-gold shadow-lg transform transition-all duration-300 hover:scale-105"
                            >
                              ➕ Étendre cette combinaison ({selectedCardIds.length})
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </UICard>
          )}

          {/* Game Over Display */}
          {gameState.isGameOver && (
            <UICard className="mt-6 bg-gradient-to-br from-yellow-600 to-yellow-700 border-4 border-yellow-300">
              <CardContent className="p-6 text-center">
                <h2 className="text-3xl font-bold text-black mb-4">
                  🎉 FIN DU SPECTACLE! 🎉
                </h2>
                <p className="text-xl text-black mb-4">
                  🏆 {gameState.winner} remporte la partie!
                </p>
                <p className="text-lg text-black">
                  Félicitations pour avoir complété 7 missions du cirque!
                </p>
              </CardContent>
            </UICard>
          )}
        </div>
      </div>

      {/* Journal du Cirque - Historique */}
      <div className="mt-8 text-center">
        <Button 
          onClick={() => setShowHistory(!showHistory)}
          className="bg-gradient-to-br from-circus-gold via-yellow-500 to-circus-gold hover:from-yellow-500 hover:to-yellow-600 text-circus-black font-circus text-lg px-8 py-3 border-4 border-circus-red shadow-2xl transform transition-all duration-300 hover:scale-105 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-circus-cream to-transparent opacity-30"></div>
          <span className="relative z-10">
            {showHistory ? '🔼' : '🔽'} 📜 Journal du Spectacle 📜
          </span>
        </Button>

        {showHistory && (
          <UICard className="mt-6 bg-gradient-to-br from-circus-cream via-amber-50 to-circus-cream border-4 border-circus-gold shadow-2xl relative overflow-hidden">
            {/* Décoration de parchemin */}
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-circus-gold via-amber-600 to-circus-gold"></div>
            <div className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-r from-circus-gold via-amber-600 to-circus-gold"></div>

            {/* Coins de parchemin */}
            <div className="absolute top-2 left-2 w-3 h-3 bg-circus-gold transform rotate-45"></div>
            <div className="absolute top-2 right-2 w-3 h-3 bg-circus-gold transform rotate-45"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 bg-circus-gold transform rotate-45"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 bg-circus-gold transform rotate-45"></div>

            <CardHeader className="relative z-10">
              <CardTitle className="text-center text-circus-red font-circus text-xl">
                📖 Chronique des Événements 📖
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 relative z-10">
              <div className="max-h-40 overflow-y-auto bg-gradient-to-br from-transparent via-circus-cream to-transparent p-4 rounded-lg border-2 border-circus-gold">
                {gameState.gameHistory.map((entry, index) => (
                  <p key={index} className="text-sm text-circus-black mb-2 font-semibold leading-relaxed border-b border-circus-gold border-opacity-30 pb-1">
                    <span className="text-circus-red">•</span> {entry}
                  </p>
                ))}
                {gameState.gameHistory.length === 0 && (
                  <p className="text-circus-navy italic text-center">
                    Le spectacle commence... 🎭
                  </p>
                )}
              </div>
            </CardContent>
          </UICard>
        )}
      </div>

      {/* Contrôles de jeu - Style billetterie de cirque */}
      <div className="mt-8 text-center space-y-6">
        <div className="bg-gradient-to-br from-circus-black via-gray-800 to-circus-black p-6 rounded-lg border-4 border-circus-gold shadow-2xl relative overflow-hidden">
          {/* Décoration de chapiteau */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-circus-red via-circus-gold to-circus-red"></div>
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-circus-red via-circus-gold to-circus-red"></div>

          <h3 className="text-circus-gold font-circus text-xl mb-4">🎫 Billetterie du Cirque 🎫</h3>

          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <Button 
              onClick={() => newGame('pvp')} 
              className="bg-gradient-to-br from-green-700 via-emerald-600 to-green-800 hover:from-green-600 hover:to-emerald-700 border-3 border-circus-gold text-circus-cream font-circus text-lg px-6 py-3 shadow-xl transform transition-all duration-300 hover:scale-110 hover:rotate-1 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-circus-gold to-transparent opacity-20"></div>
              <span className="relative z-10">🎪 Duel de Magiciens</span>
            </Button>
            <Button 
              onClick={() => newGame('ai')} 
              className="bg-gradient-to-br from-circus-navy via-blue-700 to-circus-navy hover:from-blue-600 hover:to-blue-800 border-3 border-circus-gold text-circus-cream font-circus text-lg px-6 py-3 shadow-xl transform transition-all duration-300 hover:scale-110 hover:-rotate-1 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-circus-gold to-transparent opacity-20"></div>
              <span className="relative z-10">🤖 Défier l'Automate</span>
            </Button>
          </div>

          <div>
            <Button 
              onClick={resetGame} 
              className="bg-gradient-to-br from-circus-red via-red-600 to-red-800 hover:from-red-600 hover:to-red-700 border-3 border-circus-gold text-circus-cream font-circus text-lg px-6 py-3 shadow-xl transform transition-all duration-300 hover:scale-105 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-circus-gold to-transparent opacity-20"></div>
              <span className="relative z-10">🔄 Nouveau Spectacle</span>
            </Button>
          </div>
        </div>

        {gameState.isAITurn && (
          <div className="bg-gradient-to-br from-circus-navy via-blue-800 to-circus-navy border-4 border-circus-gold rounded-lg p-6 shadow-2xl relative overflow-hidden">
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-circus-gold to-transparent opacity-10 animate-gentle-pulse"></div>

            <div className="relative z-10 text-center">
              <div className="text-4xl mb-2 animate-spin">🤖</div>
              <p className="text-circus-cream font-circus text-lg animate-gentle-pulse">
                L'Automate calcule son prochain tour...
              </p>
              <div className="flex justify-center space-x-1 mt-3">
                <div className="w-2 h-2 bg-circus-gold rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-circus-gold rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-circus-gold rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameBoard;
