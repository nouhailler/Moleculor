/* Full-screen search overlay with live filtering on name + category, plus
   on-demand AI enrichment: when a food is missing, generate it via OpenRouter
   (see data/enrich.ts) and add it to the live database. */

import type { FoodDB } from '../data/types';
import { colors, font, radius } from '../theme/tokens';
import { scoreColor, swatchFor } from '../lib/valence';
import { searchInDB } from '../data/repository';
import { SearchIcon, SparkleIcon, HourglassIcon } from '../components/icons';

interface Props {
  db: FoodDB;
  query: string;
  onQuery: (q: string) => void;
  onClose: () => void;
  onPick: (id: string) => void;
  /** True when an OpenRouter key + model are configured. */
  canGenerate: boolean;
  /** True when a background generation is already running. */
  generating: boolean;
  /** Start generating the queried food in the background, then close the search. */
  onGenerate: (query: string) => void;
  onOpenSettings: () => void;
}

export function SearchOverlay({ db, query, onQuery, onClose, onPick, canGenerate, generating, onGenerate, onOpenSettings }: Props) {
  const q = query.trim();
  const results = searchInDB(db, query);
  const n = results.length;
  const resultLabel = q ? `${n} résultat${n > 1 ? 's' : ''}` : 'Tous les aliments';
  const exact = results.some((f) => f.name.toLowerCase() === q.toLowerCase());
  const showGenerate = q.length > 1 && !exact;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, background: colors.appBg, display: 'flex', flexDirection: 'column', animation: 'molOv .2s ease both' }}>
      <div style={{ padding: '54px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, background: colors.surface, border: `1px solid ${colors.controlBorder}`, borderRadius: radius.row, padding: '11px 14px' }}>
          <SearchIcon size={16} color={colors.ink3} />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Rechercher un aliment…"
            autoFocus
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: font.sans, fontSize: 15, color: colors.ink }}
          />
        </div>
        <div onClick={onClose} style={{ fontSize: 14.5, color: colors.benefic, cursor: 'pointer', flexShrink: 0 }}>
          Fermer
        </div>
      </div>

      <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.ink3, padding: '8px 22px 6px' }}>
        {resultLabel}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>
        {n === 0 && (
          <div style={{ textAlign: 'center', color: colors.inkSoft, fontSize: 13.5, padding: '28px 16px 18px', lineHeight: 1.5 }}>
            Aucun aliment listé ne correspond à « {q} ».
          </div>
        )}

        {showGenerate && (
          <div style={{ marginBottom: n === 0 ? 4 : 12 }}>
            {canGenerate ? (
              <button
                onClick={() => onGenerate(q)}
                disabled={generating}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'left',
                  background: colors.surface,
                  border: `1px solid ${generating ? colors.controlBorder : colors.benefic}`,
                  borderRadius: 16,
                  padding: '14px 16px',
                  cursor: generating ? 'default' : 'pointer',
                  opacity: generating ? 0.7 : 1,
                }}
              >
                {generating ? (
                  <span style={{ display: 'flex', animation: 'molSpin 1.2s linear infinite' }}>
                    <HourglassIcon />
                  </span>
                ) : (
                  <SparkleIcon />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, color: generating ? colors.ink2 : colors.benefic, fontWeight: 500 }}>
                    {generating ? 'Génération déjà en cours…' : `Générer « ${q} » avec l’IA`}
                  </div>
                  <div style={{ fontSize: 11.5, color: colors.ink3, marginTop: 2 }}>
                    {generating ? 'Suis la progression sur le badge IA' : 'Génération en arrière-plan, puis ajoutée à la base'}
                  </div>
                </div>
              </button>
            ) : (
              <div style={{ background: colors.surface, border: `1px solid ${colors.cardBorder}`, borderRadius: 16, padding: '14px 16px' }}>
                <div style={{ fontSize: 13.5, color: colors.ink2, lineHeight: 1.5 }}>
                  Cet aliment n’est pas dans la base. Configure une clé OpenRouter pour le générer automatiquement.
                </div>
                <button
                  onClick={onOpenSettings}
                  style={{ marginTop: 11, border: `1px solid ${colors.controlBorder}`, background: colors.appBg, borderRadius: radius.pill, padding: '9px 14px', fontFamily: font.sans, fontSize: 13, color: colors.ink, cursor: 'pointer' }}
                >
                  Ouvrir les paramètres
                </button>
              </div>
            )}
          </div>
        )}

        {n > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map((f) => (
              <div
                key={f.id}
                onClick={() => onPick(f.id)}
                style={{ background: colors.surface, border: `1px solid ${colors.cardBorder}`, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer' }}
              >
                <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: swatchFor((f.molecules[0] || {}).fam), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.serif, fontSize: 17, color: '#fff' }}>
                  {f.name.charAt(0).toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, color: colors.ink }}>{f.name}</div>
                  <div style={{ fontSize: 11.5, color: colors.ink3, marginTop: 1 }}>
                    {f.cat} · {f.kcal} kcal
                  </div>
                </div>
                <span style={{ fontFamily: font.mono, fontSize: 13, color: scoreColor(f.score), flexShrink: 0 }}>{f.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
