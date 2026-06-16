/* Tab 3 — Corps: clickable organ dots on a silhouette, the interactions map
   (intensity blocks), clickable benefits + dynamic risks, and the digestive
   timeline. */

import type { Food, Info, SystemEntry } from '../data/types';
import { colors, font, radius } from '../theme/tokens';
import { fmt } from '../lib/format';
import { bodyLoc, findMol } from '../lib/status';
import { valColor, valHalo } from '../lib/valence';
import { Chevron } from '../components/icons';

interface Props {
  food: Food;
  factor: number;
  onOpenDetail: (info: Info) => void;
  onOpenSystem: (s: SystemEntry) => void;
}

const sectionLabel: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: 11,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  color: colors.ink2,
};

export function BodyScreen({ food, factor, onOpenDetail, onOpenSystem }: Props) {
  // Organ dots: place by system name, then spread horizontally when several
  // dots share the same vertical level (matches prototype).
  const rawDots = food.systems.map((s) => {
    const l = bodyLoc(s.name);
    return { top: l.top, left: l.left, color: valColor(s.valence), halo: valHalo(s.valence), system: s };
  });
  const byTop: Record<string, typeof rawDots> = {};
  rawDots.forEach((d) => {
    (byTop[d.top] = byTop[d.top] || []).push(d);
  });
  Object.keys(byTop).forEach((k) => {
    const g = byTop[k];
    const n = g.length;
    if (n > 1) g.forEach((d, i) => (d.left = `${50 + (i - (n - 1) / 2) * 26}%`));
  });

  // Dynamic risks driven by the analysed portion + static molecule risks.
  type RiskItem = { title: string; text: string; detail: Info | null };
  const dyn: RiskItem[] = [];
  const sg = food.sucres * factor;
  if (sg >= 18)
    dyn.push({
      title: 'Sucres',
      text: 'Charge glycémique élevée pour cette portion (' + fmt(sg) + ' g de sucres).',
      detail: {
        name: 'Sucres', formula: '—', fam: 'glucides', family: 'Glucides', valence: 'r',
        qty: { n: food.sucres, unit: 'g' }, dyn: { type: 'sucres', base: food.sucres },
        detail: 'Sucres simples (glucose, fructose, saccharose) apportant une énergie rapide mais élevant la glycémie. À cette portion, l’apport devient notable — à modérer chez les profils insulino-résistants.',
      },
    });
  const sf = food.sat * factor;
  if (sf >= 6)
    dyn.push({
      title: 'Acides gras saturés',
      text: 'Apport élevé en saturés pour cette portion (' + fmt(sf) + ' g).',
      detail: {
        name: 'Acides gras saturés', formula: '—', fam: 'lipides', family: 'Lipides', valence: 'r',
        qty: { n: food.sat, unit: 'g' }, dyn: { type: 'sat', base: food.sat },
        detail: 'Acides gras saturés. Au-delà de ~6 g par prise, leur effet sur le cholestérol LDL devient à surveiller (l’impact réel dépend du type — l’acide stéarique reste neutre).',
      },
    });
  const kc = food.kcal * factor;
  if (kc >= 350)
    dyn.push({
      title: 'Densité calorique',
      text: 'Portion énergétique (' + Math.round(kc) + ' kcal) à intégrer dans la ration quotidienne.',
      detail: {
        name: 'Densité calorique', formula: '—', fam: 'lipides', family: 'Apport énergétique', valence: 'r',
        qty: { n: food.kcal, unit: 'kcal' },
        detail: 'Cet aliment est dense en énergie. La portion analysée représente une fraction notable des besoins journaliers (~2000 kcal) — à équilibrer sur la journée.',
      },
    });
  const allRisks: RiskItem[] = dyn.concat(
    food.risks.map((r) => ({ title: r.title, text: r.text, detail: findMol(food, r.title) })),
  );

  return (
    <div style={{ animation: 'molFade .26s ease both' }}>
      {/* Silhouette */}
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: radius.card,
          padding: 18,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', width: 116, height: 210, flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(#f6f3ec,#ece6da)', border: '1px solid #e3ddcf' }} />
          <div style={{ position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)', width: 74, height: 154, borderRadius: '38px 38px 30px 30px', background: 'linear-gradient(#f6f3ec,#e9e3d6)', border: '1px solid #e3ddcf' }} />
          {rawDots.map((d, i) => (
            <div
              key={i}
              onClick={() => onOpenSystem(d.system)}
              aria-label={d.system.name}
              style={{
                position: 'absolute',
                top: d.top,
                left: d.left,
                transform: 'translate(-50%,-50%)',
                width: 15,
                height: 15,
                borderRadius: '50%',
                background: d.color,
                boxShadow: `0 0 0 4px ${d.halo}`,
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...sectionLabel, color: colors.ink3, letterSpacing: 1.5, marginBottom: 8 }}>Systèmes touchés</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { c: colors.benefic, t: 'Effet bénéfique' },
              { c: 'oklch(0.70 0.11 72)', t: 'Effet mixte' },
              { c: colors.watch, t: 'À surveiller' },
            ].map((l) => (
              <div key={l.t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: l.c, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: colors.ink2, whiteSpace: 'nowrap' }}>{l.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactions map */}
      <div style={{ margin: '26px 4px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={sectionLabel}>Carte des interactions</span>
        <span style={{ fontSize: 11, color: '#bdb4a4' }}>Touchez un système</span>
      </div>
      <div style={{ background: colors.surface, border: `1px solid ${colors.cardBorder}`, borderRadius: radius.card, padding: '6px 18px' }}>
        {food.systems.map((s, i) => (
          <div
            key={s.name}
            onClick={() => onOpenSystem(s)}
            style={{ padding: '14px 0', borderBottom: `1px solid ${i === food.systems.length - 1 ? 'transparent' : colors.separator}`, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 14, color: colors.ink }}>{s.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map((k) => (
                    <span key={k} style={{ width: 20, height: 6, borderRadius: 3, background: k < s.intensity ? valColor(s.valence) : colors.chipBg }} />
                  ))}
                </div>
                <Chevron color={colors.chevron} size={7} />
              </div>
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.45, color: colors.inkSoft }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Benefits */}
      <div style={{ ...sectionLabel, color: colors.benefic, margin: '26px 4px 12px' }}>Bénéfices</div>
      <div style={{ background: colors.surface, border: `1px solid ${colors.cardBorder}`, borderRadius: radius.card, padding: '4px 18px' }}>
        {food.benefits.map((b, i) => {
          const m = findMol(food, b.title);
          return (
            <div
              key={b.title + i}
              onClick={() => m && onOpenDetail(m)}
              style={{ padding: '13px 0', borderBottom: `1px solid ${i === food.benefits.length - 1 ? 'transparent' : colors.separator}`, display: 'flex', gap: 11, cursor: 'pointer', alignItems: 'flex-start' }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.benefic, marginTop: 6, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13.5, color: colors.ink }}>{b.title}</span>
                <div style={{ fontSize: 12, lineHeight: 1.45, color: colors.inkSoft, marginTop: 2 }}>{b.text}</div>
              </div>
              <span style={{ flexShrink: 0, marginTop: 4 }}>
                <Chevron color={colors.chevron} size={7} />
              </span>
            </div>
          );
        })}
      </div>

      {/* Risks */}
      {allRisks.length > 0 && (
        <>
          <div style={{ ...sectionLabel, color: colors.watch, margin: '26px 4px 12px' }}>Points de vigilance</div>
          <div style={{ background: colors.surface, border: `1px solid ${colors.cardBorder}`, borderRadius: radius.card, padding: '4px 18px' }}>
            {allRisks.map((r, i) => (
              <div
                key={r.title + i}
                onClick={() => r.detail && onOpenDetail(r.detail)}
                style={{ padding: '13px 0', borderBottom: `1px solid ${i === allRisks.length - 1 ? 'transparent' : colors.separator}`, display: 'flex', gap: 11, cursor: 'pointer', alignItems: 'flex-start' }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.watch, marginTop: 6, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13.5, color: colors.ink }}>{r.title}</span>
                  <div style={{ fontSize: 12, lineHeight: 1.45, color: colors.inkSoft, marginTop: 2 }}>{r.text}</div>
                </div>
                <span style={{ flexShrink: 0, marginTop: 4 }}>
                  <Chevron color={colors.chevron} size={7} />
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Timeline */}
      <div style={{ ...sectionLabel, margin: '26px 4px 12px' }}>Parcours digestif</div>
      <div style={{ background: colors.surface, border: `1px solid ${colors.cardBorder}`, borderRadius: radius.card, padding: '20px 20px 8px' }}>
        {food.timeline.map((t, i) => (
          <div key={t.phase} style={{ display: 'flex', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: colors.ink, marginTop: 3 }} />
              <span style={{ width: 2, flex: 1, background: i === food.timeline.length - 1 ? 'transparent' : colors.controlBorder, margin: '4px 0' }} />
            </div>
            <div style={{ paddingBottom: 18, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: font.serif, fontSize: 16, color: colors.ink }}>{t.phase}</span>
                <span style={{ fontFamily: font.mono, fontSize: 10, color: colors.ink3 }}>{t.time}</span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: colors.inkSoft, marginTop: 4 }}>{t.note}</div>
              {t.absorb && t.absorb.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {t.absorb.map((a) => (
                    <span key={a} style={{ fontFamily: font.mono, fontSize: 10, color: colors.benefic, background: colors.absorbChipBg, borderRadius: radius.pill, padding: '3px 9px' }}>
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
