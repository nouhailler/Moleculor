/* System sheet: mechanism, intensity, and the involved molecules (each opens
   the molecule detail sheet — no dead ends). */

import type { Food, Info, Molecule, SystemEntry } from '../data/types';
import { colors, font, radius } from '../theme/tokens';
import { intensityLabel, valColor, valLabel } from '../lib/valence';
import { systemDrivers } from '../lib/status';
import { Sheet } from './Sheet';
import { CloseIcon, Chevron } from '../components/icons';

interface Props {
  system: SystemEntry;
  food: Food;
  portion: number;
  families: Record<string, { label: string; color: string }>;
  onClose: () => void;
  onOpenDetail: (info: Info) => void;
}

export function SystemSheet({ system: s, food, portion, families, onClose, onOpenDetail }: Props) {
  const drivers: Molecule[] = systemDrivers(food, s.name);
  const vc = valColor(s.valence);

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding: '18px 22px 34px' }}>
        <div style={{ height: 6, width: 46, borderRadius: radius.pill, background: vc, marginBottom: 16 }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontFamily: font.serif, fontSize: 27, lineHeight: 1.08 }}>{s.name}</div>
          <button onClick={onClose} aria-label="Fermer" style={closeBtn}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: vc, border: `1px solid ${vc}`, borderRadius: radius.pill, padding: '6px 11px' }}>
            {valLabel(s.valence)}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.ink3 }}>
              Intensité {intensityLabel[s.intensity] || ''}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map((k) => (
                <span key={k} style={{ width: 18, height: 6, borderRadius: 3, background: k < s.intensity ? vc : colors.intensityOff }} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 22, fontFamily: font.mono, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.ink3, marginBottom: 8 }}>
          Mécanisme d’action
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: colors.sheetText }}>{s.note}</div>

        {drivers.length > 0 && (
          <>
            <div style={{ marginTop: 22, fontFamily: font.mono, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.ink3, marginBottom: 10 }}>
              Molécules impliquées
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {drivers.map((m) => (
                <div
                  key={m.id || m.name}
                  onClick={() => onOpenDetail(m)}
                  style={{ background: colors.surface, border: `1px solid ${colors.cardBorder}`, borderRadius: radius.row, padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }}
                >
                  <span style={{ width: 6, height: 26, borderRadius: radius.pill, flexShrink: 0, background: families[m.fam].color }} />
                  <span style={{ flex: 1, fontSize: 14, color: colors.ink }}>{m.name}</span>
                  <Chevron color={colors.chevron} size={7} />
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ marginTop: 22, background: colors.surface, border: `1px solid ${colors.cardBorder}`, borderRadius: radius.cardSm, padding: '15px 17px' }}>
          <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.ink3, marginBottom: 5 }}>
            Effet pour
          </div>
          <div style={{ fontSize: 14, color: colors.ink }}>
            {food.name} · portion de {portion} g
          </div>
        </div>
      </div>
    </Sheet>
  );
}

const closeBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: colors.chipBg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  cursor: 'pointer',
  marginTop: 4,
  border: 'none',
  padding: 0,
};
