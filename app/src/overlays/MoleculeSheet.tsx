/* Detail sheet for a molecule / tree node / benefit / risk. */

import type { Food, Info } from '../data/types';
import { colors, font, radius } from '../theme/tokens';
import { fmtQty } from '../lib/format';
import { statusFor } from '../lib/status';
import { valColor } from '../lib/valence';
import { Sheet } from './Sheet';
import { CloseIcon } from '../components/icons';

interface Props {
  info: Info;
  food: Food;
  factor: number;
  portion: number;
  families: Record<string, { label: string; color: string }>;
  onClose: () => void;
}

const monoLabel: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: 10,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  color: colors.ink3,
  marginBottom: 8,
};

export function MoleculeSheet({ info, food, factor, portion, families, onClose }: Props) {
  const hasF = !!(info.formula && info.formula !== '—');
  const stt = statusFor(info, factor);
  const ab = fmtQty(info.qty, factor);
  const pctStr = info.pct != null ? ' · ' + Math.round(info.pct * factor) + ' % AJR' : '';
  const present = food.name + ' · ' + ab + ' pour ' + portion + ' g' + pctStr;
  const famColor = (families[info.fam] || { color: '#8a8275' }).color;

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding: '18px 22px 34px' }}>
        <div style={{ height: 6, width: 46, borderRadius: radius.pill, background: famColor, marginBottom: 16 }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontFamily: font.serif, fontSize: 27, lineHeight: 1.08 }}>{info.name}</div>
          <button onClick={onClose} aria-label="Fermer" style={closeBtn}>
            <CloseIcon />
          </button>
        </div>
        {hasF && (
          <div style={{ fontFamily: font.mono, fontSize: 16, color: colors.ink2, marginTop: 8, letterSpacing: 0.5 }}>
            {info.formula}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <span style={chip}>{info.family}</span>
          <span style={{ ...chip, background: 'transparent', color: valColor(stt.valence), border: `1px solid ${valColor(stt.valence)}` }}>
            {stt.label}
          </span>
          <span style={chip}>{ab}</span>
        </div>

        <div style={{ ...monoLabel, marginTop: 22 }}>Rôle dans l’organisme</div>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: colors.sheetText }}>{info.detail}</div>

        <div style={{ marginTop: 22, background: colors.surface, border: `1px solid ${colors.cardBorder}`, borderRadius: radius.cardSm, padding: '15px 17px' }}>
          <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.ink3, marginBottom: 5 }}>
            Présent dans
          </div>
          <div style={{ fontSize: 14, color: colors.ink }}>{present}</div>
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
const chip: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: 10,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  color: colors.ink2,
  background: colors.chipBg,
  borderRadius: radius.pill,
  padding: '6px 11px',
};
