import React, { useMemo, useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { MISSIONS } from '../data/missions';
import { Card as CardType, Player } from '../types/game';
import { isJokerCard } from '../utils/cardUtils';
import Card, { CardBack } from './Card';
import MissionTarget from './MissionTarget';

// ── Palette ────────────────────────────────────────────────
const C = {
  bg: '#1a0d12',
  bgTop: '#251319',
  surface: '#f6efe0',
  ink: '#1a1a1a',
  inkSoft: '#4a4038',
  red: '#b8242c',
  redDark: '#8a1a20',
  gold: '#d4a84a',
  goldBright: '#e8c14a',
  teal: '#2d8f6b',
  muted: '#7a6e5e',
};

const RANK_ORDER = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUIT_ORDER: Array<'spades' | 'hearts' | 'clubs' | 'diamonds'> = ['spades', 'hearts', 'clubs', 'diamonds'];

type SortMode = 'none' | 'rank' | 'suit';
type TurnStep = 'draw' | 'play' | 'discard';

function sortHand(hand: CardType[], mode: SortMode): CardType[] {
  if (mode === 'none') return hand;
  const copy = [...hand];
  copy.sort((a, b) => {
    if (isJokerCard(a)) return 1;
    if (isJokerCard(b)) return -1;
    if (mode === 'rank') {
      return (
        RANK_ORDER.indexOf(a.value) - RANK_ORDER.indexOf(b.value) ||
        SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit)
      );
    }
    return (
      SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit) ||
      RANK_ORDER.indexOf(a.value) - RANK_ORDER.indexOf(b.value)
    );
  });
  return copy;
}

function highlightForMission(hand: CardType[], missionId: number): string[] {
  const mission = MISSIONS.find(m => m.id === missionId);
  if (!mission) return [];
  const spec = mission.requirements.specificRequirements;
  const ids: string[] = [];
  for (const c of hand) {
    if (isJokerCard(c)) {
      ids.push(c.id);
      continue;
    }
    if (spec === 'hearts_7_8_9_10' && c.suit === 'hearts' && ['7', '8', '9', '10'].includes(c.value)) ids.push(c.id);
    else if (spec === 'red_sequence_5' && (c.suit === 'hearts' || c.suit === 'diamonds')) ids.push(c.id);
    else if (spec === 'red_even_sequence_6' && (c.suit === 'hearts' || c.suit === 'diamonds') && ['2','4','6','8','10','Q'].includes(c.value)) ids.push(c.id);
    else if (spec === '7_same_suit' && c.suit === 'spades') ids.push(c.id);
    else if (spec === 'same_suit') ids.push(c.id);
    else if (spec === 'seven_odd_cards' && ['A','3','5','7','9','J','K'].includes(c.value)) ids.push(c.id);
  }
  return ids;
}

// ── Atoms ──────────────────────────────────────────────────
const Pill: React.FC<{ children: React.ReactNode; tone?: 'default' | 'gold' | 'red'; size?: 'sm' | 'md' }> = ({
  children,
  tone = 'default',
  size = 'sm',
}) => {
  const tones = {
    default: { bg: 'rgba(255,255,255,0.08)', fg: 'rgba(255,255,255,0.85)', bd: 'rgba(255,255,255,0.12)' },
    gold:    { bg: 'rgba(212,168,74,0.18)', fg: '#e8c14a', bd: 'rgba(212,168,74,0.45)' },
    red:     { bg: 'rgba(184,36,44,0.2)', fg: '#ff9d9d', bd: 'rgba(184,36,44,0.45)' },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: size === 'sm' ? '3px 8px' : '5px 12px',
      borderRadius: 999, fontSize: size === 'sm' ? 11 : 13, fontWeight: 600,
      background: t.bg, color: t.fg, border: `1px solid ${t.bd}`,
      letterSpacing: 0.2, whiteSpace: 'nowrap', flexShrink: 0,
    }}>{children}</span>
  );
};

const Btn: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  primary?: boolean;
  tone?: 'red' | 'teal' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}> = ({ children, onClick, disabled, primary, tone, size = 'md', style: extraStyle = {} }) => {
  const sizes = { sm: { p: '8px 12px', fs: 13, h: 36 }, md: { p: '12px 16px', fs: 15, h: 48 }, lg: { p: '14px 18px', fs: 16, h: 56 } };
  const s = sizes[size];
  let bg = '#2e2026', fg = '#f3e7c7', bd = 'rgba(255,255,255,0.08)';
  if (primary)         { bg = C.gold; fg = C.ink; bd = '#a07f2a'; }
  if (tone === 'red')  { bg = C.red; fg = '#fff'; bd = C.redDark; }
  if (tone === 'teal') { bg = C.teal; fg = '#fff'; bd = '#1f6a4e'; }
  if (tone === 'ghost'){ bg = 'transparent'; fg = 'rgba(255,255,255,0.75)'; bd = 'rgba(255,255,255,0.18)'; }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: s.p, minHeight: s.h, borderRadius: 10,
      background: bg, color: fg, border: `1px solid ${bd}`,
      fontSize: s.fs, fontWeight: 700, letterSpacing: 0.3,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1, fontFamily: 'inherit',
      boxShadow: primary ? '0 4px 12px rgba(212,168,74,0.3)' : 'none',
      transition: 'all 0.15s', ...extraStyle,
    }}>{children}</button>
  );
};

// ── Turn step indicator ────────────────────────────────────
const TurnStepBar: React.FC<{ step: TurnStep }> = ({ step }) => {
  const steps: { id: TurnStep; label: string }[] = [
    { id: 'draw', label: 'Piocher' },
    { id: 'play', label: 'Jouer' },
    { id: 'discard', label: 'Défausser' },
  ];
  const idx = steps.findIndex(s => s.id === step);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {steps.map((s, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <React.Fragment key={s.id}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 999,
              background: active ? C.gold : done ? 'rgba(212,168,74,0.15)' : 'rgba(255,255,255,0.06)',
              color: active ? C.ink : done ? C.gold : 'rgba(255,255,255,0.5)',
              fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
              border: active ? '1px solid #a07f2a' : '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.2s',
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: 999,
                background: active ? C.ink : done ? C.gold : 'rgba(255,255,255,0.12)',
                color: active ? C.gold : done ? C.ink : 'rgba(255,255,255,0.5)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
              }}>{done ? '✓' : i + 1}</span>
              <span>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: '0 0 8px', height: 2, background: done ? C.gold : 'rgba(255,255,255,0.1)', borderRadius: 1 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── Player status ─────────────────────────────────────────
const PlayerStatus: React.FC<{
  name: string; isCurrent: boolean; isOpponent?: boolean;
  cards: number; missionsDone: number; isAI?: boolean;
}> = ({ name, isCurrent, isOpponent, cards, missionsDone, isAI }) => {
  const icon = isOpponent ? (isAI ? '🤖' : '♛') : '♔';
  return (
    <div style={{
      flex: 1, padding: '10px 12px', borderRadius: 12,
      background: isCurrent ? 'rgba(212,168,74,0.14)' : 'rgba(255,255,255,0.04)',
      border: isCurrent ? `1px solid ${C.gold}` : '1px solid rgba(255,255,255,0.08)',
      display: 'flex', flexDirection: 'column', gap: 6,
      transition: 'all 0.2s', minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 999,
            background: isCurrent ? C.gold : 'rgba(255,255,255,0.1)',
            color: isCurrent ? C.ink : 'rgba(255,255,255,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
          }}>{icon}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: 0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        </div>
        {isCurrent && <Pill tone="gold">À toi</Pill>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)' }}>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{cards}</span>
          <span>cartes</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: 2,
              background: i < missionsDone ? C.gold : 'rgba(255,255,255,0.12)',
              transform: 'rotate(45deg)',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Mission panel ──────────────────────────────────────────
const MissionPanel: React.FC<{ player: Player }> = ({ player }) => {
  const mission = MISSIONS.find(m => m.id === player.currentMission);
  if (!mission) return null;
  return (
    <div style={{
      background: C.surface, borderRadius: 14, padding: '14px 16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(180,140,60,0.25)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6, background: C.red, color: C.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 13,
          }}>{mission.id}</div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: C.red }}>
            {player.completedMissions.includes(mission.id) ? 'Mission accomplie' : 'Mission en cours'}
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
          {player.completedMissions.length}/7 missions
        </div>
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, lineHeight: 1.25, marginBottom: 10, fontFamily: 'Georgia, serif' }}>
        {mission.title}
      </div>
      <div style={{
        padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.035)',
        border: '1px dashed rgba(0,0,0,0.12)', marginBottom: 8,
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
          Forme à réussir
        </div>
        <MissionTarget mission={mission} />
      </div>
      <div style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.4 }}>{mission.description}</div>
    </div>
  );
};

// ── Deck + discard ─────────────────────────────────────────
const DeckArea: React.FC<{
  deckCount: number;
  topDiscard: CardType | null;
  canDraw: boolean;
  onDrawDeck: () => void;
  onDrawDiscard: () => void;
}> = ({ deckCount, topDiscard, canDraw, onDrawDeck, onDrawDiscard }) => (
  <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div onClick={canDraw && deckCount > 0 ? onDrawDeck : undefined} style={{
        position: 'relative',
        cursor: canDraw && deckCount > 0 ? 'pointer' : 'default',
        filter: canDraw ? 'none' : 'grayscale(0.4) brightness(0.7)',
      }}>
        <div style={{ position: 'absolute', top: 3, left: 3 }}><CardBack /></div>
        <div style={{ position: 'absolute', top: 1.5, left: 1.5 }}><CardBack /></div>
        <div style={{ position: 'relative' }}><CardBack /></div>
        <div style={{
          position: 'absolute', bottom: -8, right: -6, background: C.ink, color: C.gold,
          fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
          border: `1px solid ${C.gold}`,
        }}>{deckCount}</div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Pioche</div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div onClick={canDraw && topDiscard ? onDrawDiscard : undefined} style={{
        width: 60, height: 86, borderRadius: 8,
        background: topDiscard ? 'transparent' : 'rgba(255,255,255,0.04)',
        border: topDiscard ? 'none' : '1.5px dashed rgba(255,255,255,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: canDraw && topDiscard ? 'pointer' : 'default',
      }}>
        {topDiscard
          ? <Card card={topDiscard} />
          : <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>vide</div>
        }
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Défausse</div>
    </div>
  </div>
);

// ── Hand ────────────────────────────────────────────────────
const Hand: React.FC<{
  cards: CardType[];
  selected: string[];
  onToggle: (id: string) => void;
  sortMode: SortMode;
  onSort: (m: SortMode) => void;
  highlightIds: string[];
  compact: boolean;
}> = ({ cards, selected, onToggle, sortMode, onSort, highlightIds, compact }) => {
  const sorted = useMemo(() => sortHand(cards, sortMode), [cards, sortMode]);
  const cardW = compact ? 48 : 60;
  const cardSize = compact ? 'small' : 'medium';
  const handWidth = compact ? 320 : 440;
  const overlap = cards.length * cardW > handWidth
    ? Math.max(-30, -(cardW - handWidth / cards.length))
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        <div style={{ fontSize: 10, letterSpacing: 1, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
          Votre main · {cards.length}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, letterSpacing: 1, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>Trier</span>
          <div style={{ display: 'flex', gap: 4, padding: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}>
            {([
              { k: 'none' as const, label: 'Manuel' },
              { k: 'rank' as const, label: 'A→K' },
              { k: 'suit' as const, label: '♠♥♣♦' },
            ]).map(({ k, label }) => (
              <button key={k} onClick={() => onSort(k)} style={{
                padding: '4px 10px', fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                borderRadius: 6, border: 'none',
                background: sortMode === k ? C.gold : 'transparent',
                color: sortMode === k ? C.ink : 'rgba(255,255,255,0.75)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        minHeight: compact ? 96 : 116, padding: '14px 4px 8px',
        background: 'rgba(0,0,0,0.25)', borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', position: 'relative' }}>
          {sorted.map((c, i) => (
            <div key={c.id} style={{ marginLeft: i === 0 ? 0 : overlap, zIndex: selected.includes(c.id) ? 50 : i }}>
              <Card
                card={c}
                size={cardSize}
                isSelected={selected.includes(c.id)}
                highlighted={highlightIds.includes(c.id)}
                onClick={() => onToggle(c.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Table combos ───────────────────────────────────────────
const TableCombos: React.FC<{ player: Player; canExtend: boolean; onExtend: (comboId: string) => void; selectedCount: number }> = ({
  player, canExtend, onExtend, selectedCount,
}) => {
  if (!player.combinations.length) return null;
  return (
    <div style={{
      background: 'rgba(45,143,107,0.12)', border: '1px solid rgba(45,143,107,0.35)',
      borderRadius: 12, padding: '10px 12px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#7edcb6', marginBottom: 8 }}>
        Numéros posés · {player.combinations.length}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {player.combinations.map((c) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
              padding: '2px 6px', borderRadius: 4,
              background: c.type === 'group' ? 'rgba(212,168,74,0.25)' : 'rgba(45,143,107,0.3)',
              color: c.type === 'group' ? '#e8c14a' : '#7edcb6',
              minWidth: 54, textAlign: 'center',
            }}>{c.type === 'group' ? 'Groupe' : 'Suite'}</div>
            <div style={{ display: 'flex' }}>
              {c.cards.map((card, j) => (
                <div key={card.id} style={{ marginLeft: j === 0 ? 0 : -18 }}>
                  <Card card={card} size="small" />
                </div>
              ))}
            </div>
            {canExtend && selectedCount > 0 && (
              <Btn size="sm" tone="teal" onClick={() => onExtend(c.id)}>
                + Étendre ({selectedCount})
              </Btn>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Action bar ─────────────────────────────────────────────
const ActionBar: React.FC<{
  step: TurnStep;
  selectedCount: number;
  missionDone: boolean;
  onPlay: () => void;
  onDiscard: () => void;
  onClear: () => void;
}> = ({ step, selectedCount, missionDone, onPlay, onDiscard, onClear }) => {
  const canPlay = selectedCount >= 3 && step !== 'draw';
  const canDiscard = selectedCount === 1 && step !== 'draw';
  const primaryLabel = step === 'discard'
    ? 'Défausser cette carte'
    : missionDone ? 'Poser groupe' : 'Présenter mission';
  const primaryAction = step === 'discard' ? onDiscard : onPlay;
  const primaryEnabled = step === 'discard' ? canDiscard : canPlay;

  return (
    <div style={{
      background: C.bgTop, borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '10px 12px 14px',
      display: 'flex', flexDirection: 'column', gap: 8,
      boxShadow: '0 -8px 24px rgba(0,0,0,0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 22 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
          {selectedCount === 0 ? (
            step === 'draw' ? 'Piochez une carte pour commencer'
              : step === 'discard' ? 'Sélectionnez 1 carte à défausser'
              : 'Sélectionnez 3 cartes ou plus, ou 1 pour défausser'
          ) : (
            <>
              <span style={{ color: C.gold, fontWeight: 700 }}>{selectedCount}</span>
              <span> carte{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}</span>
            </>
          )}
        </div>
        {selectedCount > 0 && (
          <button onClick={onClear} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)',
            fontSize: 12, cursor: 'pointer', padding: 4, fontFamily: 'inherit',
          }}>✕ Annuler</button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {step !== 'draw' && selectedCount === 1 && (
          <Btn onClick={onDiscard} tone="red" style={{ flex: 1 }}>Défausser</Btn>
        )}
        <Btn onClick={primaryAction} disabled={!primaryEnabled} primary style={{ flex: 1 }}>
          {primaryLabel}
        </Btn>
      </div>
    </div>
  );
};

// ── Main GameBoard ────────────────────────────────────────
const GameBoard: React.FC = () => {
  const {
    gameState, drawCard, discardCard, presentMissionCards,
    layEndOfRoundCombinations, addToExistingCombination, newGame, resetGame,
  } = useGameState();
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('rank');
  const [showHistory, setShowHistory] = useState(false);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const displayedPlayer = gameState.gameMode === 'ai' ? gameState.players[0] : currentPlayer;
  const opponent = gameState.players.find(p => p.id !== displayedPlayer.id)!;
  const isDisplayedTurn = currentPlayer.id === displayedPlayer.id && !gameState.isAITurn;

  const step: TurnStep = !gameState.hasDrawnThisTurn ? 'draw' : 'play';

  const compact = typeof window !== 'undefined' && window.innerWidth < 600;

  const highlightIds = useMemo(
    () => highlightForMission(displayedPlayer.hand, displayedPlayer.currentMission),
    [displayedPlayer.hand, displayedPlayer.currentMission]
  );

  const toggleCard = (id: string) => setSelectedCardIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const clearSelection = () => setSelectedCardIds([]);

  const handlePlay = () => {
    if (selectedCardIds.length < 3) return;
    if (currentPlayer.isCurrentMissionCompleted()) {
      layEndOfRoundCombinations(selectedCardIds);
    } else {
      presentMissionCards(selectedCardIds);
    }
    setSelectedCardIds([]);
  };

  const handleDiscard = () => {
    if (selectedCardIds.length === 1) {
      discardCard(selectedCardIds[0]);
      setSelectedCardIds([]);
    }
  };

  const handleExtend = (comboId: string) => {
    if (!selectedCardIds.length) return;
    addToExistingCombination(selectedCardIds, comboId, displayedPlayer.id);
    setSelectedCardIds([]);
  };

  const topDiscard = gameState.discardPile.length > 0
    ? gameState.discardPile[gameState.discardPile.length - 1]
    : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(120% 80% at 50% 0%, ${C.bgTop} 0%, ${C.bg} 60%)`,
      color: '#fff',
      fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: compact ? '10px 12px 8px' : '12px 20px 10px',
        background: C.bgTop, borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0,
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.gold, fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700,
              boxShadow: 'inset 0 0 0 1px rgba(212,168,74,0.4)',
            }}>★</div>
            <div>
              <div style={{
                fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 16, fontWeight: 700,
                color: C.gold, letterSpacing: 1, lineHeight: 1,
              }}>CIRQUE RUMMY</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>
                {gameState.gameMode === 'ai' ? 'Contre l\'automate' : 'Duel'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowHistory(v => !v)} style={{
              background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999,
              padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>📜 Journal</button>
          </div>
        </div>

        <TurnStepBar step={step} />

        <div style={{ display: 'flex', gap: 8 }}>
          <PlayerStatus
            name={displayedPlayer.name}
            isCurrent={isDisplayedTurn}
            cards={displayedPlayer.hand.length}
            missionsDone={displayedPlayer.completedMissions.length}
          />
          <PlayerStatus
            name={opponent.name}
            isCurrent={!isDisplayedTurn && !gameState.isGameOver}
            isOpponent
            isAI={gameState.gameMode === 'ai'}
            cards={opponent.hand.length}
            missionsDone={opponent.completedMissions.length}
          />
        </div>
      </div>

      {/* Scrollable middle */}
      <div style={{
        flex: 1, padding: compact ? 12 : '14px 20px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <MissionPanel player={displayedPlayer} />

        <DeckArea
          deckCount={gameState.deck.length}
          topDiscard={topDiscard}
          canDraw={isDisplayedTurn && !gameState.hasDrawnThisTurn && !gameState.isGameOver}
          onDrawDeck={() => drawCard(false)}
          onDrawDiscard={() => drawCard(true)}
        />

        <TableCombos
          player={displayedPlayer}
          canExtend={isDisplayedTurn && displayedPlayer.completedMissions.length > 0}
          onExtend={handleExtend}
          selectedCount={selectedCardIds.length}
        />

        {opponent.combinations.length > 0 && (
          <div style={{ opacity: 0.85 }}>
            <TableCombos
              player={opponent}
              canExtend={isDisplayedTurn && displayedPlayer.completedMissions.length > 0}
              onExtend={handleExtend}
              selectedCount={selectedCardIds.length}
            />
          </div>
        )}

        {showHistory && (
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '10px 12px', maxHeight: 200, overflowY: 'auto',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
              Journal du spectacle
            </div>
            {gameState.gameHistory.length === 0 ? (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Le spectacle commence…</div>
            ) : gameState.gameHistory.slice().reverse().map((entry, i) => (
              <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: C.gold }}>•</span> {entry}
              </div>
            ))}
          </div>
        )}

        {gameState.isAITurn && (
          <div style={{
            background: 'rgba(30,58,95,0.4)', border: '1px solid rgba(212,168,74,0.3)',
            borderRadius: 12, padding: 14, textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>🤖</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>L'automate calcule son tour…</div>
          </div>
        )}

        {gameState.isGameOver && (
          <div style={{
            background: `linear-gradient(135deg, ${C.gold}, #b8902f)`,
            borderRadius: 12, padding: 18, color: C.ink, textAlign: 'center',
            boxShadow: '0 4px 20px rgba(212,168,74,0.4)',
          }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
              Fin du spectacle !
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{gameState.winner} remporte la partie.</div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Btn onClick={() => newGame('pvp')}>Nouveau duel</Btn>
              <Btn onClick={() => newGame('ai')} primary>Jouer contre l'IA</Btn>
            </div>
          </div>
        )}

        {/* Game controls */}
        {!gameState.isGameOver && (
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Btn size="sm" tone="ghost" onClick={() => newGame('pvp')} style={{ flex: 1 }}>Duel</Btn>
            <Btn size="sm" tone="ghost" onClick={() => newGame('ai')} style={{ flex: 1 }}>vs IA</Btn>
            <Btn size="sm" tone="ghost" onClick={resetGame} style={{ flex: 1 }}>Réinitialiser</Btn>
          </div>
        )}
      </div>

      {/* Sticky hand + action bar */}
      <div style={{
        flexShrink: 0, background: C.bgTop, borderTop: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', bottom: 0, zIndex: 20,
      }}>
        <div style={{ padding: compact ? '10px 12px 0' : '12px 20px 0' }}>
          <Hand
            cards={displayedPlayer.hand}
            selected={selectedCardIds}
            onToggle={toggleCard}
            sortMode={sortMode}
            onSort={setSortMode}
            highlightIds={step === 'play' ? highlightIds : []}
            compact={compact}
          />
        </div>
        <ActionBar
          step={step}
          selectedCount={selectedCardIds.length}
          missionDone={currentPlayer.isCurrentMissionCompleted()}
          onPlay={handlePlay}
          onDiscard={handleDiscard}
          onClear={clearSelection}
        />
      </div>
    </div>
  );
};

export default GameBoard;
