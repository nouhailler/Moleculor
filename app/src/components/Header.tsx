/* Common chrome header: app label + search button, food name + category pill,
   and the "Portion analysée" stepper. */

import { colors, font, radius, shadow } from '../theme/tokens';
import { SearchIcon, MinusIcon, PlusIcon, GearIcon } from './icons';

interface HeaderProps {
  foodName: string;
  foodCat: string;
  portion: number;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onPortionInc: () => void;
  onPortionDec: () => void;
}

export function Header({ foodName, foodCat, portion, onOpenSearch, onOpenSettings, onPortionInc, onPortionDec }: HeaderProps) {
  return (
    <div
      style={{
        padding: '54px 20px 14px',
        flexShrink: 0,
        background: 'linear-gradient(#f4f2ea 72%, rgba(244,242,234,0))',
        position: 'relative',
        zIndex: 5,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: colors.ink3 }}>
          Moleculor
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <button onClick={onOpenSettings} aria-label="Paramètres" style={roundBtn}>
            <GearIcon />
          </button>
          <button onClick={onOpenSearch} aria-label="Rechercher un aliment" style={roundBtn}>
            <SearchIcon />
          </button>
        </div>
      </div>

      <div onClick={onOpenSearch} style={{ cursor: 'pointer' }}>
        <div style={{ fontFamily: font.serif, fontSize: 31, fontWeight: 400, lineHeight: 1.05, letterSpacing: 0.2 }}>
          {foodName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 10,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: colors.ink2,
              background: colors.chipBg,
              borderRadius: radius.pill,
              padding: '4px 9px',
            }}
          >
            {foodCat}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.ink3 }}>
          Portion analysée
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: colors.surface,
            border: `1px solid ${colors.controlBorder}`,
            borderRadius: radius.pill,
            padding: 4,
          }}
        >
          <button onClick={onPortionDec} aria-label="Diminuer la portion" style={stepBtn}>
            <MinusIcon />
          </button>
          <span style={{ fontFamily: font.mono, fontSize: 13, color: colors.ink, minWidth: 56, textAlign: 'center' }}>
            {portion} g
          </span>
          <button onClick={onPortionInc} aria-label="Augmenter la portion" style={stepBtn}>
            <PlusIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

const roundBtn: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: '50%',
  background: colors.surface,
  border: `1px solid ${colors.controlBorder}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: shadow.control,
  padding: 0,
};

const stepBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
  padding: 0,
};
