import React from 'react';
import { Mission } from '../types/game';

type Shape = {
  kind: 'group' | 'seq';
  count: number;
  cornerSuit?: string;
  cornerSuits?: string[];
  values?: string[];
};

const RED = '#c62b2b';
const BLACK = '#1a1a1a';

const suitColor = (s: string) => (s.includes('♥') || s.includes('♦')) ? RED : BLACK;

function missionToShapes(mission: Mission): Shape[] {
  const G = (count: number, extra: Partial<Shape> = {}): Shape => ({ kind: 'group', count, ...extra });
  const S = (count: number, extra: Partial<Shape> = {}): Shape => ({ kind: 'seq', count, ...extra });

  const reqs = mission.requirements;
  const minSeq = reqs.minSequenceLength ?? 3;
  const groups = reqs.groups ?? 0;
  const sequences = reqs.sequences ?? 0;
  const spec = reqs.specificRequirements;

  switch (spec) {
    case 'groups_of_4':
      return [G(4), G(4)];
    case 'three_groups_of_4':
      return [G(4), G(4), G(4)];
    case 'group_4_sequence_4':
      return [G(4), S(4)];
    case 'two_groups_3_one_group_4':
      return [G(3), G(3), G(4)];
    case '7_same_suit':
      return [G(7, { cornerSuit: '♠' })];
    case 'sequence_8_max_2_suits':
      return [S(8)];
    case 'sequence_A_to_9':
      return [S(9, { values: ['A', '2', '3', '4', '5', '6', '7', '8', '9'] })];
    case 'seven_odd_cards':
      return [G(7, { values: ['A', '3', '5', '7', '9', 'J', 'K'] })];
    case 'full_suit_A_to_K':
      return [S(13, { cornerSuit: '♠', values: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] })];
    case 'hearts_7_8_9_10':
      return [S(4, { cornerSuit: '♥', values: ['7', '8', '9', '10'] })];
    case 'spades_and_clubs_sequences':
      return [S(4, { cornerSuit: '♠' }), S(4, { cornerSuit: '♣' })];
    case 'red_sequence_5':
      return [S(5, { cornerSuit: '♥/♦' })];
    case 'red_even_sequence_6':
      return [S(6, { cornerSuit: '♥/♦', values: ['2', '4', '6', '8', '10', 'Q'] })];
    case 'one_red_group_one_black_group':
      return [G(3, { cornerSuit: '♥/♦' }), G(3, { cornerSuit: '♠/♣' })];
    case 'three_suits_no_diamonds':
      return [G(3, { cornerSuits: ['♠', '♣', '♥'] })];
    case 'different_suits':
      return [S(5, { cornerSuit: '♠' }), S(5, { cornerSuit: '♥' })];
    case 'same_suit':
      return [S(minSeq, { cornerSuit: '♥' })];
  }

  // Generic: groups + sequences combos
  const shapes: Shape[] = [];
  for (let i = 0; i < sequences; i++) shapes.push(S(minSeq));
  for (let i = 0; i < groups; i++) shapes.push(G(3));
  if (shapes.length === 0) shapes.push(G(3));
  return shapes;
}

interface Props {
  mission: Mission;
  compact?: boolean;
}

const MissionTarget: React.FC<Props> = ({ mission, compact = false }) => {
  const shapes = missionToShapes(mission);
  if (!shapes.length) return null;

  const chipW = compact ? 20 : 26;
  const chipH = compact ? 28 : 36;
  const gap = compact ? 3 : 4;
  const groupGap = compact ? 12 : 18;
  const arrowSize = compact ? 12 : 15;
  const cornerFs = compact ? 8 : 9;
  const valueFs = compact ? 11 : 13;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: groupGap }}>
      {shapes.map((shape, i) => {
        const isGroup = shape.kind === 'group';
        const arrowColor = isGroup ? '#b07c1a' : '#1f6a4e';
        const chipBg = isGroup ? '#fde9b8' : '#c8ecdd';
        const chipBorder = isGroup ? '#c09233' : '#2d8f6b';

        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {isGroup ? (
              <div style={{ display: 'flex', gap, marginBottom: 3 }}>
                {Array.from({ length: shape.count }).map((_, j) => (
                  <div key={j} style={{
                    width: chipW, textAlign: 'center',
                    fontSize: arrowSize, lineHeight: 1, fontWeight: 800,
                    color: arrowColor,
                  }}>↑</div>
                ))}
              </div>
            ) : (
              <div style={{
                width: shape.count * chipW + (shape.count - 1) * gap,
                display: 'flex', alignItems: 'center',
                marginBottom: 3, height: arrowSize + 1,
              }}>
                <div style={{ flex: 1, height: 2, background: arrowColor, borderRadius: 1 }} />
                <div style={{
                  width: 0, height: 0,
                  borderTop: `${arrowSize / 2}px solid transparent`,
                  borderBottom: `${arrowSize / 2}px solid transparent`,
                  borderLeft: `${arrowSize - 2}px solid ${arrowColor}`,
                }} />
              </div>
            )}
            <div style={{ display: 'flex', gap }}>
              {Array.from({ length: shape.count }).map((_, j) => {
                const corner = shape.cornerSuits?.[j] ?? shape.cornerSuit;
                const value = shape.values?.[j];
                return (
                  <div key={j} style={{
                    width: chipW, height: chipH, borderRadius: 3,
                    background: chipBg,
                    border: `1px solid ${chipBorder}`,
                    boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.08)',
                    position: 'relative',
                    fontFamily: 'Georgia, serif',
                  }}>
                    {corner && (
                      <div style={{
                        position: 'absolute', top: 1, left: 2,
                        fontSize: cornerFs, lineHeight: 1,
                        color: suitColor(corner),
                        fontWeight: 700, whiteSpace: 'nowrap',
                      }}>{corner}</div>
                    )}
                    {value && (
                      <div style={{
                        position: 'absolute', left: 0, right: 0, bottom: 0,
                        top: corner ? cornerFs + 2 : 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: valueFs, fontWeight: 800,
                        color: BLACK, lineHeight: 1,
                      }}>{value}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MissionTarget;
