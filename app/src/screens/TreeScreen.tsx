/* Tab 2 — Molécules: collapsible tree (chevron toggles, row opens the detail
   sheet), increasing indentation, status halo on watch/mixed nodes. */

import type { Food, Info, TreeNode } from '../data/types';
import { colors, font, radius } from '../theme/tokens';
import { fmtQty } from '../lib/format';
import { statusFor } from '../lib/status';
import { valHalo } from '../lib/valence';
import { Chevron } from '../components/icons';

interface Props {
  food: Food;
  factor: number;
  families: Record<string, { label: string; color: string }>;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  onOpenDetail: (info: Info) => void;
}

interface Row {
  id: string;
  label: string;
  value: string;
  color: string;
  halo: string;
  pad: number;
  fontSize: number;
  hasChildren: boolean;
  expanded: boolean;
  info: Info;
  toggleId: string | null;
}

function flatten(
  nodes: TreeNode[],
  depth: number,
  out: Row[],
  ctx: { factor: number; expanded: Record<string, boolean>; families: Props['families'] },
): Row[] {
  nodes.forEach((n) => {
    const has = n.children && n.children.length > 0;
    const exp = !!ctx.expanded[n.id];
    const stt = statusFor(n.info, ctx.factor);
    const flag = stt.valence === 'r' || stt.valence === 'mixed';
    out.push({
      id: n.id,
      label: n.label,
      value: fmtQty(n.qty, ctx.factor),
      color: ctx.families[n.fam].color,
      halo: flag ? valHalo(stt.valence) : 'transparent',
      pad: 14 + depth * 18,
      fontSize: depth === 0 ? 15 : 13.5,
      hasChildren: !!has,
      expanded: exp,
      info: n.info,
      toggleId: has ? n.id : null,
    });
    if (has && exp) flatten(n.children, depth + 1, out, ctx);
  });
  return out;
}

export function TreeScreen({ food, factor, families, expanded, onToggle, onOpenDetail }: Props) {
  const rows = flatten(food.tree, 0, [], { factor, expanded, families });

  return (
    <div style={{ animation: 'molFade .26s ease both' }}>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: colors.ink2, margin: '4px 4px 16px' }}>
        Décomposition hiérarchique de l’aliment, des grandes familles jusqu’aux molécules individuelles. Touchez une molécule
        pour son détail.
      </div>
      <div style={{ background: colors.surface, border: `1px solid ${colors.cardBorder}`, borderRadius: 22, padding: 6, overflow: 'hidden' }}>
        {rows.map((row) => (
          <div
            key={row.id}
            onClick={() => onOpenDetail(row.info)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 12px',
              paddingLeft: row.pad,
              cursor: 'pointer',
              borderRadius: radius.row,
            }}
          >
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (row.toggleId) onToggle(row.toggleId);
              }}
              style={{
                width: 30,
                height: 44,
                margin: '-12px 0 -12px -8px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: row.hasChildren ? 'pointer' : 'default',
              }}
            >
              <Chevron color={colors.chevronTree} opacity={row.hasChildren ? 1 : 0} rotated={row.expanded} size={8} />
            </span>
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 3,
                flexShrink: 0,
                background: row.color,
                boxShadow: `0 0 0 3px ${row.halo}`,
              }}
            />
            <span style={{ flex: 1, minWidth: 0, fontSize: row.fontSize, color: colors.ink }}>{row.label}</span>
            <span style={{ fontFamily: font.mono, fontSize: 11, color: colors.ink3, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
