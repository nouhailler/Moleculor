/* Valence + score helpers, ported from the prototype's Component methods. */

import type { Valence } from '../data/types';

export function valColor(v: Valence | string): string {
  return (
    ({ b: '#2f7d5b', r: '#c0633f', mixed: 'oklch(0.70 0.11 72)', n: '#8a8275' } as Record<string, string>)[v] ||
    '#8a8275'
  );
}

export function valHalo(v: Valence | string): string {
  return (
    ({
      b: 'rgba(47,125,91,0.18)',
      r: 'rgba(192,99,63,0.18)',
      mixed: 'rgba(196,150,70,0.18)',
      n: 'rgba(138,130,117,0.16)',
    } as Record<string, string>)[v] || 'rgba(138,130,117,0.16)'
  );
}

export function valLabel(v: Valence | string): string {
  return (
    ({ b: 'Bénéfique', r: 'À surveiller', mixed: 'Effet mixte', n: 'Neutre' } as Record<string, string>)[v] ||
    'Neutre'
  );
}

export function scoreColor(s: number): string {
  return s >= 75 ? '#2f7d5b' : s >= 66 ? 'oklch(0.70 0.12 70)' : '#c0633f';
}

export function scoreLabel(s: number): string {
  return s >= 78
    ? 'Profil très favorable'
    : s >= 72
      ? 'Profil favorable'
      : s >= 66
        ? 'Profil correct'
        : 'À consommer avec modération';
}

export const intensityLabel = ['', 'modérée', 'notable', 'forte'];

/** Family swatch used by search result initials (matches prototype swatchFor). */
export function swatchFor(fam: string | undefined): string {
  const m: Record<string, string> = {
    lipides: 'oklch(0.74 0.10 80)',
    glucides: 'oklch(0.72 0.12 62)',
    proteines: 'oklch(0.58 0.11 32)',
    micro: 'oklch(0.60 0.07 248)',
    bioactifs: 'oklch(0.56 0.11 330)',
  };
  return m[fam || ''] || 'oklch(0.64 0.08 132)';
}
