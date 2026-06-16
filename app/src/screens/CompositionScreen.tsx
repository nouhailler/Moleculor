/* Tab 1 — Composition: score ring, kcal/molecules tiles, macro donut + legend,
   micronutrient bars (% AJR), and the top molecules list. */

import type { Food, Info } from '../data/types';
import { colors, font, radius, shadow } from '../theme/tokens';
import { Ring } from '../components/Ring';
import { Donut, type DonutSeg } from '../components/Donut';
import { fmt, fmtQty } from '../lib/format';
import { scoreLabel, valColor, valLabel } from '../lib/valence';

interface Props {
  food: Food;
  factor: number;
  families: Record<string, { label: string; color: string }>;
  onOpenDetail: (info: Info) => void;
  onGoTree: () => void;
}

const sectionLabel: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: 11,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  color: colors.ink2,
};

export function CompositionScreen({ food, factor, families, onOpenDetail, onGoTree }: Props) {
  const segDefs = [
    { key: 'lipides', label: 'Lipides', g: food.macros.lip },
    { key: 'glucides', label: 'Glucides', g: food.macros.gluc },
    { key: 'fibres', label: 'Fibres', g: food.macros.fib },
    { key: 'proteines', label: 'Protéines', g: food.macros.prot },
    { key: 'autres', label: 'Eau & autres', g: food.macros.eau + food.macros.autres },
  ].filter((s) => s.g > 0);
  const tot = segDefs.reduce((a, s) => a + s.g, 0) || 1;
  const segs = segDefs.map((s) => ({
    color: s.key === 'autres' ? '#dcd6c8' : families[s.key].color,
    pct: (s.g / tot) * 100,
    label: s.label,
    g: s.g,
  }));
  const donutSegs: DonutSeg[] = segs.map((s) => ({ color: s.color, pct: s.pct }));

  return (
    <div style={{ animation: 'molFade .26s ease both' }}>
      {/* Health score card */}
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: radius.card,
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          boxShadow: shadow.card,
        }}
      >
        <Ring score={food.score} size={92} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...sectionLabel, color: colors.ink3, marginBottom: 5 }}>Indice santé</div>
          <div style={{ fontFamily: font.serif, fontSize: 19, lineHeight: 1.15, marginBottom: 8 }}>{scoreLabel(food.score)}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.45, color: colors.ink2 }}>
            {food.tagline || 'Profil nutritionnel détaillé ci-dessous.'}
          </div>
        </div>
      </div>

      {/* Tiles */}
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <div style={tile}>
          <div style={{ fontFamily: font.serif, fontSize: 26, lineHeight: 1 }}>{Math.round(food.kcal * factor)}</div>
          <div style={tileLabel}>kcal / {food.portion}</div>
        </div>
        <div style={tile}>
          <div style={{ fontFamily: font.serif, fontSize: 26, lineHeight: 1 }}>{food.molecules.length}</div>
          <div style={tileLabel}>molécules notables</div>
        </div>
      </div>

      {/* Macros */}
      <div style={{ ...sectionLabel, margin: '26px 4px 12px' }}>Macronutriments</div>
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: radius.card,
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <Donut segs={donutSegs} size={104} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11 }}>
          {segs.map((m) => (
            <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, flexShrink: 0, background: m.color }} />
              <span style={{ flex: 1, fontSize: 13, color: colors.ink }}>{m.label}</span>
              <span style={{ fontFamily: font.mono, fontSize: 12, color: colors.ink, whiteSpace: 'nowrap' }}>
                {fmt(m.g * factor)} g
              </span>
              <span style={{ fontFamily: font.mono, fontSize: 10, color: colors.ink3, width: 34, textAlign: 'right' }}>
                {Math.round(m.pct)} %
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Micros */}
      <div style={{ ...sectionLabel, margin: '26px 4px 12px' }}>Micronutriments clés</div>
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: radius.card,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {food.micros.map((mi) => {
          const p = mi.pct * factor;
          return (
            <div key={mi.name}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13.5, color: colors.ink }}>{mi.name}</span>
                <span style={{ fontFamily: font.mono, fontSize: 12, color: colors.ink2 }}>
                  {fmtQty({ n: mi.val, unit: mi.unit }, factor)} <span style={{ color: '#bdb4a4' }}>· {Math.round(p)} % AJR</span>
                </span>
              </div>
              <div style={{ height: 5, borderRadius: radius.pill, background: colors.track, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: radius.pill, width: `${Math.min(p, 100)}%`, background: families.micro.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Top molecules */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '26px 4px 12px' }}>
        <div style={sectionLabel}>Molécules majeures</div>
        <div onClick={onGoTree} style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: 0.5, color: colors.benefic, cursor: 'pointer' }}>
          Arbre complet →
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {food.molecules.slice(0, 6).map((m) => (
          <div
            key={m.id || m.name}
            onClick={() => onOpenDetail(m)}
            style={{
              background: colors.surface,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: radius.cardSm,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              cursor: 'pointer',
            }}
          >
            <span style={{ width: 6, height: 38, borderRadius: radius.pill, flexShrink: 0, background: families[m.fam].color }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 14.5, color: colors.ink }}>{m.name}</span>
                <span style={{ fontFamily: font.mono, fontSize: 11, color: colors.ink3 }}>{m.formula}</span>
              </div>
              <div style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 2 }}>
                {m.family} · {fmtQty(m.qty, factor)}
              </div>
            </div>
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 9.5,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: valColor(m.valence),
                border: `1px solid ${valColor(m.valence)}`,
                borderRadius: radius.pill,
                padding: '3px 8px',
                flexShrink: 0,
                opacity: 0.9,
              }}
            >
              {valLabel(m.valence)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const tile: React.CSSProperties = {
  flex: 1,
  background: colors.surface,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radius.cardSm,
  padding: '14px 16px',
};
const tileLabel: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: 10,
  letterSpacing: 1,
  textTransform: 'uppercase',
  color: colors.ink3,
  marginTop: 4,
};
