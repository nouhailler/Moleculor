/* Tab 4 — Comparer: pick a 2nd food, side-by-side score rings, A/B bars
   (normalised to the row max), all recomputed from the portion. */

import type { Food, FoodDB } from '../data/types';
import { colors, font, radius, shadow } from '../theme/tokens';
import { fmt } from '../lib/format';
import { Ring } from '../components/Ring';

interface Props {
  food: Food; // A
  db: FoodDB;
  factor: number;
  portion: number;
  compareB: string;
  onPickB: (id: string) => void;
}

export function CompareScreen({ food, db, factor, portion, compareB, onPickB }: Props) {
  const A = food;
  const bId = compareB === A.id ? db.order.find((x) => x !== A.id)! : compareB;
  const B = db.foods[bId];

  const mk = (label: string, a: number, b: number, unit: string, max?: number) => {
    const m = max || Math.max(a, b) * 1.15 || 1;
    return {
      label,
      aStr: fmt(a) + (unit ? ' ' + unit : ''),
      bStr: fmt(b) + (unit ? ' ' + unit : ''),
      aW: `${(a / m) * 100}%`,
      bW: `${(b / m) * 100}%`,
    };
  };
  const rows = [
    mk('Indice santé', A.score, B.score, '/100', 100),
    mk('Calories', Math.round(A.kcal * factor), Math.round(B.kcal * factor), 'kcal'),
    mk('Protéines', A.macros.prot * factor, B.macros.prot * factor, 'g'),
    mk('Lipides', A.macros.lip * factor, B.macros.lip * factor, 'g'),
    mk('Glucides', A.macros.gluc * factor, B.macros.gluc * factor, 'g'),
    mk('Fibres', A.macros.fib * factor, B.macros.fib * factor, 'g'),
  ];

  return (
    <div style={{ animation: 'molFade .26s ease both' }}>
      <div style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.ink2, margin: '4px 4px 10px' }}>
        Comparer avec
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 4px 12px', margin: '0 -4px' }}>
        {db.order
          .filter((id) => id !== A.id)
          .map((id) => {
            const f = db.foods[id];
            const active = id === compareB;
            return (
              <div
                key={id}
                onClick={() => onPickB(id)}
                style={{
                  flexShrink: 0,
                  fontSize: 12.5,
                  whiteSpace: 'nowrap',
                  padding: '8px 14px',
                  borderRadius: radius.pill,
                  cursor: 'pointer',
                  border: `1px solid ${active ? colors.ink : colors.controlBorder}`,
                  background: active ? colors.ink : colors.surface,
                  color: active ? '#fff' : colors.ink2,
                }}
              >
                {f.name}
              </div>
            );
          })}
      </div>

      <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.ink3, margin: '0 4px 10px' }}>
        À portions égales · {portion} g
      </div>
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: radius.card,
          padding: 20,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          boxShadow: shadow.card,
        }}
      >
        <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
          <Ring score={A.score} size={62} />
          <div style={{ fontFamily: font.serif, fontSize: 16, lineHeight: 1.1 }}>{A.name}</div>
          <div style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: colors.compareA }}>A</div>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: colors.cardBorder }} />
        <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
          <Ring score={B.score} size={62} />
          <div style={{ fontFamily: font.serif, fontSize: 16, lineHeight: 1.1 }}>{B.name}</div>
          <div style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: colors.compareB }}>B</div>
        </div>
      </div>

      <div style={{ background: colors.surface, border: `1px solid ${colors.cardBorder}`, borderRadius: radius.card, padding: '8px 18px', marginTop: 12 }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{ padding: '14px 0', borderBottom: `1px solid ${i === rows.length - 1 ? 'transparent' : colors.separator}` }}>
            <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.ink3, marginBottom: 9 }}>
              {r.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
              <span style={{ fontFamily: font.mono, fontSize: 12, width: 64, flexShrink: 0, color: colors.ink }}>{r.aStr}</span>
              <div style={{ flex: 1, height: 7, borderRadius: radius.pill, background: colors.track, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: radius.pill, width: r.aW, background: colors.compareA }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: font.mono, fontSize: 12, width: 64, flexShrink: 0, color: colors.ink }}>{r.bStr}</span>
              <div style={{ flex: 1, height: 7, borderRadius: radius.pill, background: colors.track, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: radius.pill, width: r.bW, background: colors.compareB }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
