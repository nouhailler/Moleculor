/* Tab 4 — Comparer: pick a 2nd food, side-by-side score rings, A/B bars
   (normalised to the row max), all recomputed from the portion. The Protéines,
   Lipides and Glucides rows expand to a fine breakdown (amino acids, fatty-acid
   classes, sugar types) with a Δ marker showing which food has more of each. */

import { useState } from 'react';
import type { Food, FoodDB } from '../data/types';
import { colors, font, radius, shadow } from '../theme/tokens';
import { fmt } from '../lib/format';
import { Ring } from '../components/Ring';
import { SearchIcon, Chevron } from '../components/icons';

interface Props {
  food: Food; // A
  db: FoodDB;
  factor: number;
  portion: number;
  compareB: string;
  onPickB: (id: string) => void;
  /** Open the search overlay to choose the food to compare against. */
  onSearch: () => void;
}

interface Line {
  label: string;
  a: number;
  b: number;
  unit: string;
}
interface Row extends Line {
  /** Set when the row can expand to a fine sub-type breakdown. */
  key?: string;
  max?: number;
  subs?: Line[];
}

/** Essential amino acids derived in the food's tree (grams / 100 g), by name. */
function aminoAcids(f: Food): Record<string, number> {
  const pro = f.tree.find((n) => n.id === 'pro');
  const out: Record<string, number> = {};
  if (pro) {
    for (const c of pro.children) {
      if (c.id.startsWith('aa:') && c.qty && c.qty.n != null) out[c.label] = c.qty.n;
    }
  }
  return out;
}

export function CompareScreen({ food, db, factor, portion, compareB, onPickB, onSearch }: Props) {
  const A = food;
  // Fall back to the first other food if B is unset, equals A, or no longer exists.
  const bId = compareB !== A.id && db.foods[compareB] ? compareB : db.order.find((x) => x !== A.id)!;
  const B = db.foods[bId];

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const valStr = (v: number, unit: string) => fmt(v) + (unit ? ' ' + unit : '');

  // ── Fine breakdowns ──────────────────────────────────────────────────────
  const aaA = aminoAcids(A);
  const aaB = aminoAcids(B);
  const aaNames = [...new Set([...Object.keys(aaA), ...Object.keys(aaB)])];
  const protSubs: Line[] = aaNames.map((nm) => ({ label: nm, a: (aaA[nm] || 0) * factor, b: (aaB[nm] || 0) * factor, unit: 'g' }));

  const lipSubs: Line[] = [
    { label: 'Saturés (AGS)', a: A.sat * factor, b: B.sat * factor, unit: 'g' },
    { label: 'Mono-insaturés (AGMI)', a: A.mono * factor, b: B.mono * factor, unit: 'g' },
    { label: 'Poly-insaturés (AGPI)', a: A.poly * factor, b: B.poly * factor, unit: 'g' },
  ];
  const glucSubs: Line[] = [
    { label: 'Sucres', a: A.sucres * factor, b: B.sucres * factor, unit: 'g' },
    { label: 'Amidon', a: A.amidon * factor, b: B.amidon * factor, unit: 'g' },
  ];

  const rows: Row[] = [
    { label: 'Indice santé', a: A.score, b: B.score, unit: '/100', max: 100 },
    { label: 'Calories', a: Math.round(A.kcal * factor), b: Math.round(B.kcal * factor), unit: 'kcal' },
    { key: 'prot', label: 'Protéines', a: A.macros.prot * factor, b: B.macros.prot * factor, unit: 'g', subs: protSubs },
    { key: 'lip', label: 'Lipides', a: A.macros.lip * factor, b: B.macros.lip * factor, unit: 'g', subs: lipSubs },
    { key: 'gluc', label: 'Glucides', a: A.macros.gluc * factor, b: B.macros.gluc * factor, unit: 'g', subs: glucSubs },
    { label: 'Fibres', a: A.macros.fib * factor, b: B.macros.fib * factor, unit: 'g' },
  ];

  // A small A/B bar pair, normalised to `max`.
  const barPair = (a: number, b: number, max: number, unit: string, thin = false) => {
    const h = thin ? 6 : 7;
    const w = thin ? 56 : 64;
    const fs = thin ? 11.5 : 12;
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontFamily: font.mono, fontSize: fs, width: w, flexShrink: 0, color: colors.ink }}>{valStr(a, unit)}</span>
          <div style={{ flex: 1, height: h, borderRadius: radius.pill, background: colors.track, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: radius.pill, width: `${(a / max) * 100}%`, background: colors.compareA }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: font.mono, fontSize: fs, width: w, flexShrink: 0, color: colors.ink }}>{valStr(b, unit)}</span>
          <div style={{ flex: 1, height: h, borderRadius: radius.pill, background: colors.track, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: radius.pill, width: `${(b / max) * 100}%`, background: colors.compareB }} />
          </div>
        </div>
      </>
    );
  };

  // The Δ marker: which food has more of this sub-type, and by how much.
  const deltaChip = (a: number, b: number, unit: string) => {
    const d = a - b;
    const ad = Math.abs(d);
    const denom = Math.max(a, b);
    const rel = denom > 0 ? ad / denom : 0;
    if (denom < 0.05 || (ad < 0.1 && rel < 0.05)) {
      return <span style={{ fontFamily: font.mono, fontSize: 10.5, color: colors.ink3 }}>≈ identique</span>;
    }
    const isA = d > 0;
    const color = isA ? colors.compareA : colors.compareB;
    return (
      <span style={{ fontFamily: font.mono, fontSize: 10.5, color, whiteSpace: 'nowrap' }}>
        Δ {isA ? 'A' : 'B'} +{valStr(ad, unit)}
      </span>
    );
  };

  return (
    <div style={{ animation: 'molFade .26s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '4px 4px 10px' }}>
        <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.ink2 }}>
          Comparer avec
        </span>
        <button
          onClick={onSearch}
          aria-label="Rechercher un aliment à comparer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
            border: `1px solid ${colors.controlBorder}`,
            background: colors.surface,
            borderRadius: radius.pill,
            padding: '7px 12px',
            fontFamily: font.sans,
            fontSize: 12.5,
            color: colors.ink2,
            cursor: 'pointer',
          }}
        >
          <SearchIcon size={14} color={colors.ink2} />
          Rechercher
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 4px 12px', margin: '0 -4px' }}>
        {db.order
          .filter((id) => id !== A.id)
          .map((id) => {
            const f = db.foods[id];
            const active = id === bId;
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

      <div style={{ fontSize: 11.5, color: colors.inkSoft, margin: '12px 4px 8px', lineHeight: 1.5 }}>
        Touchez <b style={{ color: colors.ink2 }}>Protéines</b>, <b style={{ color: colors.ink2 }}>Lipides</b> ou{' '}
        <b style={{ color: colors.ink2 }}>Glucides</b> pour comparer les sous-types en détail.
      </div>

      <div style={{ background: colors.surface, border: `1px solid ${colors.cardBorder}`, borderRadius: radius.card, padding: '8px 18px', marginTop: 4 }}>
        {rows.map((r, i) => {
          const max = r.max || Math.max(r.a, r.b) * 1.15 || 1;
          const hasSubs = !!(r.key && r.subs && r.subs.length > 0 && (r.a > 0 || r.b > 0));
          const isOpen = r.key ? !!open[r.key] : false;
          const gMax = hasSubs ? Math.max(...r.subs!.map((s) => Math.max(s.a, s.b)), 0.0001) : 1;
          return (
            <div key={r.label} style={{ padding: '14px 0', borderBottom: `1px solid ${i === rows.length - 1 ? 'transparent' : colors.separator}` }}>
              <div
                onClick={hasSubs ? () => toggle(r.key!) : undefined}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 9, cursor: hasSubs ? 'pointer' : 'default' }}
              >
                <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.ink3 }}>
                  {r.label}
                </span>
                {hasSubs && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: font.mono, fontSize: 9.5, color: colors.ink3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {isOpen ? 'Réduire' : 'Détailler'}
                    </span>
                    <Chevron rotated={isOpen} size={7} color={colors.chevron} />
                  </span>
                )}
              </div>
              {barPair(r.a, r.b, max, r.unit)}

              {isOpen && hasSubs && (
                <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: `2px solid ${colors.separator}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {r.subs!.map((s) => (
                    <div key={s.label}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: colors.ink2 }}>{s.label}</span>
                        {deltaChip(s.a, s.b, s.unit)}
                      </div>
                      {barPair(s.a, s.b, gMax, s.unit, true)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
