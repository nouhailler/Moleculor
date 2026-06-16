/* Runtime food store: the built-in database (foodData.ts) merged with foods the
   user generated via OpenRouter. Generated specs are persisted as the compact
   makeFood spec — not the derived Food — so the tree/timeline/etc. are always
   rebuilt by the same code path as the curated foods, and the schema stays
   forward-compatible. */

import { FOOD_DB, makeFood } from './foodData';
import type { FoodDB } from './types';

const STORAGE_KEY = 'moleculor.generated';

export function loadGeneratedSpecs(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGeneratedSpecs(specs: any[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(specs));
  } catch {
    /* storage unavailable — generated foods just won't persist */
  }
}

/* ── Backup: export / import generated foods ───────────────────────────────
   We export the compact specs (not derived Food objects): everything — tree,
   timeline, benefits, risks — is rebuilt by makeFood on import, so a backup
   recreates the exact same sheets on another device and stays schema-robust. */

export const EXPORT_VERSION = 1;

export interface FoodsExport {
  app: 'Moleculor';
  type: 'foods-export';
  version: number;
  exportedAt: string;
  count: number;
  foods: any[];
}

/** A spec is usable if it has an id, a name and at least one molecule. */
export function isValidSpec(s: any): boolean {
  return !!s && typeof s.id === 'string' && typeof s.name === 'string' && Array.isArray(s.molecules) && s.molecules.length > 0;
}

export function buildExport(specs: any[]): FoodsExport {
  return {
    app: 'Moleculor',
    type: 'foods-export',
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    count: specs.length,
    foods: specs,
  };
}

/** Parse an exported file: accepts the wrapper object or a bare array of specs.
    Throws a French message if the shape is unrecognised. */
export function parseImport(text: string): any[] {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Fichier illisible : JSON invalide.');
  }
  const list = Array.isArray(data) ? data : Array.isArray(data?.foods) ? data.foods : null;
  if (!list) throw new Error('Fichier non reconnu : aucun aliment trouvé.');
  return list;
}

/** Merge incoming specs into existing, skipping built-in ids and duplicates. */
export function mergeSpecs(existing: any[], incoming: any[]): { specs: any[]; added: number; skipped: number } {
  const taken = new Set<string>([...FOOD_DB.order, ...existing.map((s) => s.id)]);
  const specs = [...existing];
  let added = 0;
  let skipped = 0;
  for (const s of incoming) {
    if (!isValidSpec(s) || taken.has(s.id)) {
      skipped++;
      continue;
    }
    taken.add(s.id);
    specs.push(s);
    added++;
  }
  return { specs, added, skipped };
}

/** Merge the built-in DB with the generated specs (generated ones appended,
    so they sort after the curated foods in search). Built-in foods win on id
    collision — sanitised spec ids are deduped against the DB before saving. */
export function buildDB(specs: any[]): FoodDB {
  const foods = { ...FOOD_DB.foods };
  const order = [...FOOD_DB.order];
  for (const spec of specs) {
    if (!spec || typeof spec.id !== 'string' || foods[spec.id]) continue;
    try {
      foods[spec.id] = makeFood(spec);
      order.push(spec.id);
    } catch {
      /* skip a malformed persisted spec rather than breaking the whole DB */
    }
  }
  return { families: FOOD_DB.families, foods, order };
}
