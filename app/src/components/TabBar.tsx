/* Bottom tab bar — 4 items, frosted background. */

import { colors } from '../theme/tokens';
import { TabComposition, TabTree, TabBody, TabCompare } from './icons';

export type Tab = 'compo' | 'tree' | 'body' | 'compare';

const ITEMS: { tab: Tab; label: string; Icon: (p: { size?: number }) => JSX.Element }[] = [
  { tab: 'compo', label: 'Composition', Icon: TabComposition },
  { tab: 'tree', label: 'Molécules', Icon: TabTree },
  { tab: 'body', label: 'Corps', Icon: TabBody },
  { tab: 'compare', label: 'Comparer', Icon: TabCompare },
];

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div
      style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        padding: '11px 14px 26px',
        background: 'rgba(250,249,244,0.92)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderTop: `1px solid ${colors.controlBorder}`,
        position: 'relative',
        zIndex: 5,
      }}
    >
      {ITEMS.map(({ tab: t, label, Icon }) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          aria-label={label}
          aria-current={tab === t ? 'page' : undefined}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 5,
            cursor: 'pointer',
            color: tab === t ? colors.ink : colors.ink3,
            border: 'none',
            background: 'transparent',
            padding: 0,
          }}
        >
          <Icon />
          <span style={{ fontSize: 9.5, letterSpacing: 0.3 }}>{label}</span>
        </button>
      ))}
    </div>
  );
}
