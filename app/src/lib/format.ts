/* Number + quantity formatting, ported from the prototype (French locale:
   comma decimal separator). */

import type { Qty } from '../data/types';

export function fmt(n: number): string {
  const v = Number(n);
  const s = (Number.isInteger(v) ? v : v.toFixed(1)).toString();
  return s.replace('.', ',');
}

/** Scale a parsed quantity by `factor` (= portion / 100) and render it. */
export function fmtQty(qty: Qty | null | undefined, factor: number): string {
  if (!qty) return '';
  if (qty.qual != null) return qty.qual;
  const v = (qty.n ?? 0) * factor;
  const dec = qty.unit === 'g' ? 1 : v < 10 ? 1 : 0;
  return (qty.approx ? '≈ ' : '') + v.toFixed(dec).replace('.', ',') + ' ' + qty.unit;
}
