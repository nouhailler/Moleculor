/* Dynamic status + system-driver resolution, ported from the prototype.
   `factor` is always portion / 100. */

import type { Food, Info, Molecule, Valence } from '../data/types';
import { valLabel } from './valence';

export interface Status {
  valence: Valence;
  label: string;
}

/** Recompute valence + label from the analysed portion (sugars / saturated fat
   / micronutrient thresholds), falling back to the static valence. */
export function statusFor(info: Info | null | undefined, factor: number): Status {
  if (!info) return { valence: 'n', label: '' };
  const d = info.dyn;
  if (d) {
    if (d.type === 'sucres') {
      const g = d.base * factor;
      const v: Valence = g >= 18 ? 'r' : g >= 7 ? 'mixed' : 'n';
      return { valence: v, label: v === 'r' ? 'À surveiller' : v === 'mixed' ? 'À modérer' : 'Quantité modérée' };
    }
    if (d.type === 'sat') {
      const g = d.base * factor;
      const v: Valence = g >= 6 ? 'r' : g >= 2.5 ? 'mixed' : 'n';
      return { valence: v, label: v === 'r' ? 'À surveiller' : v === 'mixed' ? 'À modérer' : 'Sans excès' };
    }
    if (d.type === 'micro') {
      const p = d.basePct * factor;
      return { valence: 'b', label: p >= 100 ? 'Apport excellent' : p >= 50 ? 'Bonne source' : 'Source d’appoint' };
    }
  }
  return { valence: info.valence, label: valLabel(info.valence) };
}

export function findMol(food: Food, name: string): Molecule | null {
  return food.molecules.find((m) => m.name === name) || null;
}

const KW: Record<string, string[]> = {
  cardio: ['vascul', 'endothél', 'monoxyde', 'cholestérol', 'ldl', 'lipid', 'press', 'nitrat', 'oléique', 'flavan', 'stérol', 'lycopèn', 'citrullin', 'potassium', 'oméga', 'linol', 'épicatéch'],
  nerv: ['nerveux', 'vigilance', 'humeur', 'dopamine', 'sérotonin', 'adénosine', 'cogniti', 'cérébr', 'neuro', 'stimul', 'théobromine', 'caféine', 'phénylé'],
  digest: ['fibre', 'microbiote', 'prébiot', 'transit', 'digest', 'ballonn', 'spasm', 'tanin', 'astringen', 'ferment', 'butyrate', 'fodmap', 'gluten', 'glucosinol', 'anéthol'],
  metab: ['glyc', 'insulin', 'énerg', 'calor', 'métabol', 'amidon', 'sucre', 'hypoglyc', 'chlorogén'],
  muscle: ['muscul', 'osseu', 'minéralis', 'calcium', 'magnésium', 'phosphore', 'contract', 'vitamine k', 'squelet'],
  immun: ['immun', 'défens', 'vitamine c', 'sélénium'],
  peau: ['collagèn', 'peau', 'tissu', 'cicatris', 'caroténo'],
  yeux: ['rétine', 'macula', 'lutéine', 'zéaxanth', 'vision'],
  hydrat: ['eau', 'hydrat', 'potassium'],
  renal: ['oxalat', 'réna', 'calcul'],
  hormonal: ['œstrog', 'hormon', 'isoflavone', 'phyto', 'génist'],
};

/** Rank molecules likely responsible for a system's effect (keyword scoring). */
export function systemDrivers(food: Food, sysName: string): Molecule[] {
  const n = sysName.toLowerCase();
  let key = 'metab';
  if (/cardio|sang/.test(n)) key = 'cardio';
  else if (/nerv|cogn/.test(n)) key = 'nerv';
  else if (/digest/.test(n)) key = 'digest';
  else if (/muscle|squelet/.test(n)) key = 'muscle';
  else if (/immun/.test(n)) key = 'immun';
  else if (/peau|tissu/.test(n)) key = 'peau';
  else if (/yeux/.test(n)) key = 'yeux';
  else if (/hydrat/.test(n)) key = 'hydrat';
  else if (/rén/.test(n)) key = 'renal';
  else if (/hormon/.test(n)) key = 'hormonal';
  const kws = KW[key] || [];
  const scored = food.molecules
    .map((m) => {
      const hay = (m.name + ' ' + (m.role || '') + ' ' + (m.detail || '')).toLowerCase();
      let sc = 0;
      kws.forEach((k) => {
        if (hay.indexOf(k) >= 0) sc++;
      });
      return { m, sc };
    })
    .filter((x) => x.sc > 0)
    .sort((a, b) => b.sc - a.sc);
  return scored.slice(0, 4).map((x) => x.m);
}

/** Position of an organ dot on the silhouette by system name. */
export function bodyLoc(name: string): { top: string; left: string } {
  const n = name.toLowerCase();
  if (/nerv|cogn|cervea/.test(n)) return { top: '8%', left: '50%' };
  if (/cardio|sang/.test(n)) return { top: '33%', left: '50%' };
  if (/immun|tissu|peau/.test(n)) return { top: '21%', left: '74%' };
  if (/yeux/.test(n)) return { top: '7%', left: '66%' };
  if (/muscle|squelet/.test(n)) return { top: '74%', left: '40%' };
  if (/hydrat/.test(n)) return { top: '46%', left: '26%' };
  return { top: '53%', left: '50%' };
}
