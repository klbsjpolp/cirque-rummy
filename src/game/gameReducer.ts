import { Card, Combination, GameState, Mission, Player } from '../types/game';
import {
  createDeck,
  findGroupsOnlyLayout,
  getSuitSymbol,
  isJokerCard,
  isValidGroup,
  isValidSequence,
  validateMissionFromSelection
} from '../utils/cardUtils';
import { MISSIONS } from '../data/missions';
import {
  canAddToExistingCombination,
  isMissionCompleted,
  pickRandomMissionId,
  replenishDeck
} from '../utils/gameLogic';
import { isFreeChoice, replayableMissions } from '../utils/missionRules';
import {
  chooseAIDiscard,
  chooseAIDraw,
  chooseAIExtension,
  chooseAIGroupsToLay,
  chooseAIMissionCards
} from '../utils/aiPlayer';

/**
 * L'état de la partie, comme fonction pure de l'état précédent et d'une action.
 *
 * Les actions ne modifient jamais l'état reçu : elles en renvoient un nouveau. Les
 * anciennes mises à jour écrivaient dans les objets de l'état précédent — mains,
 * combinaisons, journal — et ne tenaient que parce que rien en aval ne comparait les
 * références. Tout ici est donc testable sans React, et un état antérieur reste
 * intact (ce qui rend un futur « annuler » possible).
 *
 * Le hasard (mélange du paquet, tirage des missions) et `Date.now()` restent appelés
 * ici : le réducteur est immuable, pas déterministe. `pickRandomMissionId` accepte un
 * générateur injectable pour les tests qui en ont besoin.
 */

export type GameAction =
  | { type: 'DRAW_CARD'; fromDiscard?: boolean }
  | { type: 'DISCARD_CARD'; cardId: string }
  | { type: 'LAY_COMBINATION'; cardIds: string[]; combinationType: 'group' | 'sequence' }
  | { type: 'PRESENT_MISSION'; cardIds: string[] }
  | { type: 'LAY_END_OF_ROUND'; cardIds: string[] }
  | { type: 'ADD_TO_COMBINATION'; cardIds: string[]; combinationId: string; targetPlayerId?: string }
  | { type: 'REORDER_CARDS'; fromIndex: number; toIndex: number }
  | { type: 'AI_MOVE' }
  | { type: 'NEW_GAME'; gameMode?: 'pvp' | 'ai' };

const STARTING_HAND_SIZE = 13;
const MISSIONS_TO_WIN = 7;

const getRandomMission = (completedMissions: number[]): number =>
  pickRandomMissionId(MISSIONS, completedMissions);

// ── Petits outils immuables ────────────────────────────────

const withHistory = (state: GameState, ...lines: string[]): GameState =>
  lines.length === 0 ? state : { ...state, gameHistory: [...state.gameHistory, ...lines] };

/**
 * Refuser une action en disant pourquoi. L'état ne change pas autrement : seul l'avis
 * est posé, et son numéro avance pour que le même refus répété se voie quand même.
 */
const refuseWith = (state: GameState, message: string, ...history: string[]): GameState =>
  withHistory(
    { ...state, notice: { id: (state.notice?.id ?? 0) + 1, message } },
    ...history
  );

const withPlayerAt = (
  state: GameState,
  index: number,
  update: (player: Player) => Player
): GameState => ({
  ...state,
  players: state.players.map((player, i) => (i === index ? update(player) : player))
});

const withoutCards = (player: Player, cardIds: string[]): Player => {
  const removed = new Set(cardIds);
  return { ...player, hand: player.hand.filter(card => !removed.has(card.id)) };
};

const cardsFromHand = (player: Player, cardIds: string[]): Card[] | null => {
  const cards = cardIds
    .map(id => player.hand.find(card => card.id === id))
    .filter((card): card is Card => card !== undefined);
  return cards.length === cardIds.length ? cards : null;
};

const asCombinations = (
  player: Player,
  laid: { cards: Card[]; type: 'group' | 'sequence' }[]
): Combination[] =>
  laid.map((combo, index) => ({
    id: `${player.id}-${Date.now()}-${index}`,
    cards: combo.cards,
    type: combo.type
  }));

// ── Déroulé de la partie ───────────────────────────────────

const createPlayer = (id: string, name: string): Player => ({
  id,
  name,
  hand: [],
  currentMission: getRandomMission([]),
  completedMissions: [],
  score: 0,
  combinations: [],
  missionCompletedThisRound: false
});

export const createInitialState = (gameMode: 'pvp' | 'ai' = 'pvp'): GameState => {
  const deck = createDeck();
  const hands = [deck.splice(0, STARTING_HAND_SIZE), deck.splice(0, STARTING_HAND_SIZE)];

  return {
    players: [
      { ...createPlayer('player1', 'Joueur 1'), hand: hands[0] },
      { ...createPlayer('player2', gameMode === 'ai' ? 'IA Cirque' : 'Joueur 2'), hand: hands[1] }
    ],
    currentPlayerIndex: 0,
    deck,
    discardPile: [deck.pop()!],
    isGameStarted: true,
    isGameOver: false,
    winner: null,
    gameHistory: ['Nouvelle partie commencée'],
    gameMode,
    isAITurn: false,
    cardsDrawnThisTurn: 0,
    hasDrawnThisTurn: false,
    mustDiscardToEndTurn: false,
    lastDrawnCardId: null,
    notice: null
  };
};

/** Une partie sauvegardée avant l'ajout d'un champ le retrouve ici. */
export const migrateSavedState = (saved: GameState): GameState => ({
  ...saved,
  // Un refus d'avant la fermeture de l'onglet n'a plus rien à dire au rechargement.
  notice: null,
  cardsDrawnThisTurn: saved.cardsDrawnThisTurn ?? 0,
  hasDrawnThisTurn: saved.hasDrawnThisTurn ?? false,
  mustDiscardToEndTurn: saved.mustDiscardToEndTurn ?? false,
  lastDrawnCardId: saved.lastDrawnCardId ?? null,
  players: saved.players.map(player => ({
    ...player,
    // Par défaut la phase post-mission est refermée : elle se rouvrira dès que la
    // mission de la manche sera accomplie.
    missionCompletedThisRound: player.missionCompletedThisRound ?? false
  }))
});

const freshTurnState = {
  currentPlayerIndex: 0,
  isAITurn: false,
  cardsDrawnThisTurn: 0,
  hasDrawnThisTurn: false,
  mustDiscardToEndTurn: false,
  lastDrawnCardId: null
} as const;

const startNewRound = (state: GameState, winnerId?: string): GameState => {
  const deck = createDeck();
  const hands = state.players.map(() => deck.splice(0, STARTING_HAND_SIZE));
  const winner = winnerId ? state.players.find(p => p.id === winnerId) : undefined;

  const players = state.players.map((player, index) => ({
    ...player,
    hand: hands[index],
    combinations: [],
    missionCompletedThisRound: false,
    currentMission: player.id === winnerId
      ? getRandomMission(player.completedMissions)
      : player.currentMission
  }));

  return withHistory(
    {
      ...state,
      ...freshTurnState,
      players,
      deck,
      discardPile: [deck.pop()!]
    },
    ...(winner ? [`🎯 ${winner.name} reçoit une nouvelle mission!`] : []),
    '🎪 Nouvelle manche commencée!'
  );
};

/** Une manche s'arrête dès qu'un joueur n'a plus de cartes. */
const endRoundIfSomeoneWentOut = (state: GameState): GameState => {
  const wentOut = state.players.find(player => player.hand.length === 0);
  if (!wentOut) return state;

  const announced = withHistory(state, `🎪 ${wentOut.name} termine la manche!`);
  return announced.isGameOver ? announced : startNewRound(announced, wentOut.id);
};

const creditMission = (state: GameState, playerIndex: number, mission: Mission): GameState => {
  const player = state.players[playerIndex];
  const completedMissions = [...player.completedMissions, mission.id];
  const hasWon = completedMissions.length >= MISSIONS_TO_WIN;

  const credited = withPlayerAt(state, playerIndex, current => ({
    ...current,
    completedMissions,
    missionCompletedThisRound: true,
    currentMission: hasWon ? current.currentMission : getRandomMission(completedMissions)
  }));

  const announced = withHistory(credited, `🎉 ${player.name} complète la mission ${mission.id}!`);

  return hasWon
    ? withHistory(
        { ...announced, isGameOver: true, winner: player.name },
        `🏆 ${player.name} remporte la partie!`
      )
    : announced;
};

/** Crédite la mission en cours si la table l'accomplit (pose hors mission). */
const creditMissionIfCompleted = (state: GameState, playerIndex: number): GameState => {
  const player = state.players[playerIndex];
  const mission = MISSIONS.find(m => m.id === player.currentMission);
  if (!mission || !isMissionCompleted(player, mission)) return state;
  return creditMission(state, playerIndex, mission);
};

// ── Actions ────────────────────────────────────────────────

const drawCard = (state: GameState, fromDiscard: boolean): GameState => {
  if (state.cardsDrawnThisTurn >= 1) {
    return refuseWith(state, 'Vous avez déjà pioché ce tour-ci : posez ou défaussez.');
  }

  const player = state.players[state.currentPlayerIndex];

  if (fromDiscard && state.discardPile.length > 0) {
    const discardPile = state.discardPile.slice(0, -1);
    const drawn = state.discardPile[state.discardPile.length - 1];
    return takeCard(
      { ...state, discardPile },
      drawn,
      `${player.name} pioche de la défausse`
    );
  }

  // Paquet épuisé : la défausse est remélangée pour le reformer.
  const replenished = replenishDeck(state.deck, state.discardPile);
  const refilled = replenished.deck === state.deck
    ? state
    : withHistory(
        { ...state, deck: replenished.deck, discardPile: replenished.discardPile },
        '🎪 La défausse est remélangée pour reformer la pioche'
      );

  if (refilled.deck.length === 0) {
    // Ni paquet ni défausse à remélanger : la manche ne peut plus avancer.
    return startNewRound(
      withHistory(refilled, '🎪 Plus rien à piocher : la manche est rejouée')
    );
  }

  const drawn = refilled.deck[refilled.deck.length - 1];
  return takeCard(
    { ...refilled, deck: refilled.deck.slice(0, -1) },
    drawn,
    `${player.name} pioche du paquet`
  );
};

const takeCard = (state: GameState, drawn: Card, line: string): GameState =>
  withHistory(
    {
      ...withPlayerAt(state, state.currentPlayerIndex, player => ({
        ...player,
        hand: [...player.hand, drawn]
      })),
      cardsDrawnThisTurn: state.cardsDrawnThisTurn + 1,
      hasDrawnThisTurn: true,
      mustDiscardToEndTurn: true,
      lastDrawnCardId: drawn.id
    },
    line
  );

const discardCard = (state: GameState, cardId: string): GameState => {
  if (!state.hasDrawnThisTurn) {
    return refuseWith(state, 'Piochez une carte avant de défausser.');
  }

  const player = state.players[state.currentPlayerIndex];
  const card = player.hand.find(c => c.id === cardId);
  if (!card) return state;

  const discarded = withHistory(
    {
      ...withPlayerAt(state, state.currentPlayerIndex, p => withoutCards(p, [cardId])),
      discardPile: [...state.discardPile, card]
    },
    `${player.name} défausse ${isJokerCard(card) ? 'Joker' : card.value + getSuitSymbol(card.suit)}`
  );

  if (discarded.players[discarded.currentPlayerIndex].hand.length === 0) {
    return endRoundIfSomeoneWentOut(discarded);
  }

  const nextPlayerIndex = (discarded.currentPlayerIndex + 1) % discarded.players.length;
  return {
    ...discarded,
    currentPlayerIndex: nextPlayerIndex,
    cardsDrawnThisTurn: 0,
    hasDrawnThisTurn: false,
    mustDiscardToEndTurn: false,
    lastDrawnCardId: null,
    isAITurn: discarded.gameMode === 'ai' && nextPlayerIndex === 1
  };
};

const layCombination = (
  state: GameState,
  cardIds: string[],
  type: 'group' | 'sequence'
): GameState => {
  const index = state.currentPlayerIndex;
  const player = state.players[index];

  // Après la mission de la manche, plus aucune nouvelle suite.
  if (player.missionCompletedThisRound && type === 'sequence') {
    return refuseWith(state, 'Après votre mission, vous ne pouvez plus poser de nouvelle suite.');
  }

  const cards = cardsFromHand(player, cardIds);
  if (!cards) return state;
  if (!(type === 'group' ? isValidGroup(cards) : isValidSequence(cards))) {
    return refuseWith(
      state,
      `Ces cartes ne forment pas ${type === 'group' ? 'un groupe' : 'une suite'} valide.`
    );
  }

  const laid = withHistory(
    withPlayerAt(state, index, current => ({
      ...withoutCards(current, cardIds),
      combinations: [...current.combinations, ...asCombinations(current, [{ cards, type }])]
    })),
    `${player.name} pose une ${type === 'group' ? 'groupe' : 'suite'} de ${cards.length} cartes`
  );

  return endRoundIfSomeoneWentOut(creditMissionIfCompleted(laid, index));
};

const presentMission = (state: GameState, cardIds: string[]): GameState => {
  if (!state.hasDrawnThisTurn) {
    return refuseWith(state, 'Piochez une carte avant de présenter votre mission.');
  }

  const index = state.currentPlayerIndex;
  const player = state.players[index];
  const mission = MISSIONS.find(m => m.id === player.currentMission);
  if (!mission) return state;

  const cards = cardsFromHand(player, cardIds);
  if (!cards) return state;

  // Pour la mission libre, le joueur choisit la mission à rejouer en posant ses
  // cartes : on retient la première de ses missions réussies que la sélection
  // accomplit.
  const attempts = isFreeChoice(mission.requirements)
    ? replayableMissions(MISSIONS, player.completedMissions)
    : [mission];

  let validation: ReturnType<typeof validateMissionFromSelection> | undefined;
  let replayed: Mission | undefined;
  for (const attempt of attempts) {
    const candidate = validateMissionFromSelection(cards, attempt.requirements);
    if (candidate.isValid) {
      validation = candidate;
      replayed = attempt;
      break;
    }
  }
  if (!validation) {
    return refuseWith(state, `Cette sélection n'accomplit pas la mission « ${mission.title} ».`);
  }

  const groupCount = validation.usedCombinations.filter(c => c.type === 'group').length;
  const sequenceCount = validation.usedCombinations.filter(c => c.type === 'sequence').length;
  const description = groupCount > 0 && sequenceCount > 0
    ? `${groupCount} groupe(s) et ${sequenceCount} suite(s)`
    : groupCount > 0
      ? `${groupCount} groupe(s)`
      : `${sequenceCount} suite(s)`;
  const missionDesc = replayed && replayed.id !== mission.id
    ? `pour la mission libre, en rejouant « ${replayed.title} »`
    : 'pour la mission';

  const laid = withHistory(
    withPlayerAt(state, index, current => ({
      ...withoutCards(current, cardIds),
      combinations: [...current.combinations, ...asCombinations(current, validation!.usedCombinations)]
    })),
    `${player.name} présente ${description} ${missionDesc}`
  );

  // La validation ci-dessus a vérifié la mission entière sur cette sélection : c'est
  // donc elle qui crédite la mission.
  return endRoundIfSomeoneWentOut(creditMission(laid, index, mission));
};

const layEndOfRound = (state: GameState, cardIds: string[]): GameState => {
  if (!state.hasDrawnThisTurn) {
    return refuseWith(state, 'Piochez une carte avant de poser.');
  }

  const index = state.currentPlayerIndex;
  const player = state.players[index];
  // La pose de fin de manche n'est ouverte qu'après la mission de *cette* manche.
  if (!player.missionCompletedThisRound) {
    return refuseWith(state, 'Accomplissez d\'abord votre mission de la manche pour poser d\'autres groupes.');
  }

  const cards = cardsFromHand(player, cardIds);
  if (!cards) return state;

  // Seuls de nouveaux groupes sont permis : il faut une disposition en groupes qui
  // utilise toutes les cartes sélectionnées.
  const layout = findGroupsOnlyLayout(cards);
  if (!layout) {
    return refuseWith(state, 'Ces cartes ne forment pas des groupes valides.');
  }

  const laid = withHistory(
    withPlayerAt(state, index, current => ({
      ...withoutCards(current, cardIds),
      combinations: [...current.combinations, ...asCombinations(current, layout)]
    })),
    `${player.name} pose ${layout.length} groupe(s) pour terminer la manche`
  );

  return endRoundIfSomeoneWentOut(laid);
};

const addToCombination = (
  state: GameState,
  cardIds: string[],
  combinationId: string,
  targetPlayerId?: string
): GameState => {
  const refuse = (reason: string) => refuseWith(state, reason, `❌ ${reason}`);

  const player = state.players[state.currentPlayerIndex];
  if (!player.missionCompletedThisRound) {
    return refuse(`${player.name} doit d'abord terminer sa mission pour étendre des combinaisons !`);
  }

  const target = targetPlayerId
    ? state.players.find(p => p.id === targetPlayerId)
    : player;
  if (!target) return refuse('Joueur introuvable !');

  if (target.id !== player.id && !target.missionCompletedThisRound) {
    return refuse(`L'adversaire doit aussi avoir terminé sa mission pour que vous puissiez étendre ses combinaisons !`);
  }

  const combination = target.combinations.find(c => c.id === combinationId);
  if (!combination) return refuse('Combinaison non trouvée !');

  const cards = cardsFromHand(player, cardIds);
  if (!cards) return refuse('Ces cartes ne sont pas dans votre main !');
  if (!canAddToExistingCombination(cards, combination)) {
    return refuse(`Impossible d'ajouter ces cartes à cette combinaison !`);
  }

  // Un seul passage sur les joueurs : étendre sa propre combinaison change la main et
  // la combinaison du *même* joueur.
  const players = state.players.map(current => {
    let updated = current;
    if (current.id === player.id) updated = withoutCards(updated, cardIds);
    if (current.id === target.id) {
      updated = {
        ...updated,
        combinations: updated.combinations.map(combo =>
          combo.id === combinationId ? { ...combo, cards: [...combo.cards, ...cards] } : combo
        )
      };
    }
    return updated;
  });

  const cardsDesc = cards
    .map(card => (isJokerCard(card) ? 'Joker' : `${card.value}${getSuitSymbol(card.suit)}`))
    .join(', ');
  const targetDesc = target.id === player.id
    ? ' à ses propres combinaisons'
    : ` aux combinaisons de ${target.name}`;

  return endRoundIfSomeoneWentOut(
    withHistory({ ...state, players }, `${player.name} ajoute ${cardsDesc}${targetDesc}`)
  );
};

const reorderCards = (state: GameState, fromIndex: number, toIndex: number): GameState => {
  const player = state.players[state.currentPlayerIndex];
  const lastIndex = player.hand.length - 1;
  if (fromIndex < 0 || fromIndex > lastIndex || toIndex < 0 || toIndex > lastIndex) return state;

  const hand = [...player.hand];
  const [moved] = hand.splice(fromIndex, 1);
  hand.splice(toIndex, 0, moved);

  return withPlayerAt(state, state.currentPlayerIndex, current => ({ ...current, hand }));
};

/**
 * L'IA décide, le réducteur applique : elle passe par les mêmes actions que le joueur
 * humain, donc par les mêmes règles (mission créditée, fin de manche, pioche
 * remélangée).
 *
 * Son tour suit celui d'un joueur : piocher, présenter sa mission, puis — une fois la
 * mission accomplie — étendre et poser pour vider sa main, et enfin défausser. Après
 * chaque étape on vérifie qu'elle est toujours en train de jouer : accomplir sa
 * mission peut vider sa main, ce qui termine la manche (ou la partie) sur-le-champ.
 */
const playAITurn = (state: GameState): GameState => {
  const aiIndex = state.currentPlayerIndex;
  const stillPlaying = (current: GameState): boolean =>
    !current.isGameOver &&
    current.currentPlayerIndex === aiIndex &&
    current.hasDrawnThisTurn &&
    current.players[aiIndex].hand.length > 0;

  const done = (current: GameState): GameState => ({ ...current, isAITurn: false });

  let next = drawCard(state, chooseAIDraw(state));
  if (!stillPlaying(next)) return done(next);

  const missionCards = chooseAIMissionCards(next);
  if (missionCards) {
    next = presentMission(next, missionCards);
    if (!stillPlaying(next)) return done(next);
  }

  // Une extension à la fois, recalculée sur l'état à jour : la main et les
  // combinaisons changent à chaque ajout. La main borne le nombre de tours.
  for (let step = 0; step < next.players[aiIndex].hand.length; step++) {
    const extension = chooseAIExtension(next);
    if (!extension) break;
    next = addToCombination(next, extension.cardIds, extension.combinationId, extension.targetPlayerId);
    if (!stillPlaying(next)) return done(next);
  }

  const groupCards = chooseAIGroupsToLay(next);
  if (groupCards.length > 0) {
    next = layEndOfRound(next, groupCards);
    if (!stillPlaying(next)) return done(next);
  }

  const discardId = chooseAIDiscard(next);
  return done(discardId === undefined ? next : discardCard(next, discardId));
};

/**
 * Le réducteur : il applique l'action, puis tient l'avis à jour.
 *
 * Une action qui aboutit efface l'avis du refus précédent — sinon le message resterait
 * affiché alors que le joueur a corrigé son geste. Une action refusée pose le sien.
 */
export const gameReducer = (state: GameState, action: GameAction): GameState => {
  const next = applyAction(state, action);

  if (next === state) return next;                 // refusé sans rien changer
  if (next.notice !== state.notice) return next;   // l'action a posé son propre avis
  return state.notice === null ? next : { ...next, notice: null };
};

const applyAction = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'DRAW_CARD':
      return drawCard(state, action.fromDiscard ?? false);
    case 'DISCARD_CARD':
      return discardCard(state, action.cardId);
    case 'LAY_COMBINATION':
      return layCombination(state, action.cardIds, action.combinationType);
    case 'PRESENT_MISSION':
      return presentMission(state, action.cardIds);
    case 'LAY_END_OF_ROUND':
      return layEndOfRound(state, action.cardIds);
    case 'ADD_TO_COMBINATION':
      return addToCombination(state, action.cardIds, action.combinationId, action.targetPlayerId);
    case 'REORDER_CARDS':
      return reorderCards(state, action.fromIndex, action.toIndex);
    case 'AI_MOVE':
      return playAITurn(state);
    case 'NEW_GAME':
      return createInitialState(action.gameMode ?? 'pvp');
    default:
      return state;
  }
};
