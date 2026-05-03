import React from 'react';
import { Mission } from '../types/game';

type Shape = {
  kind: 'group' | 'seq';
  count: number;
  constraint?: string;
  constraintColor?: string;
};

const RED = '#c62b2b';
const BLACK = '#1a1a1a';

function missionToShapes(mission: Mission): Shape[] {
  const G = (count: number, extra: Partial<Shape> = {}): Shape => ({ kind: 'group', count, ...extra });
  const S = (count: number, extra: Partial<Shape> = {}): Shape => ({ kind: 'seq', count, ...extra });

  const reqs = mission.requirements;
  const minSeq = reqs.minSequenceLength ?? 3;
  const groups = reqs.groups ?? 0;
  const sequences = reqs.sequences ?? 0;
  const spec = reqs.specificRequirements;

  // Specific-requirement overrides — built from mission semantics.
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
      return [G(7, { constraint: '♠', constraintColor: BLACK })];
    case 'sequence_8_max_2_suits':
      return [S(8)];
    case 'sequence_A_to_9':
      return [S(9)];
    case 'seven_odd_cards':
      return [G(7)];
    case 'full_suit_A_to_K':
      return [S(13, { constraint: '♠', constraintColor: BLACK })];
    case 'hearts_7_8_9_10':
      return [S(4, { constraint: '♥', constraintColor: RED })];
    case 'spades_and_clubs_sequences':
      return [S(4, { constraint: '♠', constraintColor: BLACK }), S(4, { constraint: '♣', constraintColor: BLACK })];
    case 'red_sequence_5':
      return [S(5, { constraint: '♥', constraintColor: RED })];
    case 'red_even_sequence_6':
      return [S(6, { constraint: '♥', constraintColor: RED })];
    case 'one_red_group_one_black_group':
      return [G(3, { constraint: '♥', constraintColor: RED }), G(3, { constraint: '♠', constraintColor: BLACK })];
    case 'three_suits_no_diamonds':
      return [G(3)];
    case 'different_suits':
      return [S(5, { constraint: '♠', constraintColor: BLACK }), S(5, { constraint: '♥', constraintColor: RED })];
    case 'same_suit':
      return [S(minSeq, { constraint: '♥', constraintColor: RED })];
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

  const chipW = compact ? 18 : 24;
  const chipH = compact ? 26 : 34;
  const gap = compact ? 3 : 4;
  const groupGap = compact ? 12 : 18;
  const arrowSize = compact ? 12 : 15;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: groupGap }}>
      {shapes.map((shape, i) => {
        const isGroup = shape.kind === 'group';
        const arrowColor = isGroup ? '#b07c1a' : '#1f6a4e';
        const chipBg = isGroup ? '#fde9b8' : '#c8ecdd';
        const chipBorder = isGroup ? '#c09233' : '#2d8f6b';
        const constraintColor = shape.constraintColor || (isGroup ? '#7a5410' : '#1f6a4e');

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
              {Array.from({ length: shape.count }).map((_, j) => (
                <div key={j} style={{
                  width: chipW, height: chipH, borderRadius: 3,
                  background: chipBg,
                  border: `1px solid ${chipBorder}`,
                  boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: Math.min(chipW - 6, chipH - 12),
                  color: constraintColor,
                  fontWeight: 700, lineHeight: 1,
                  fontFamily: 'Georgia, serif',
                }}>
                  {shape.constraint || ''}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MissionTarget;
