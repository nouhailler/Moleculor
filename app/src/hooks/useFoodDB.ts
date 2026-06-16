/* Holds the live food database in React state so generated foods appear
   immediately and survive reloads (persisted via store.ts). */

import { useCallback, useMemo, useState } from 'react';
import type { FoodDB } from '../data/types';
import { buildDB, loadGeneratedSpecs, saveGeneratedSpecs, mergeSpecs } from '../data/store';

export function useFoodDB(): {
  db: FoodDB;
  addFood: (spec: any) => string;
  /** Merge imported specs (from a backup file); returns how many were kept/skipped. */
  importSpecs: (incoming: any[]) => { added: number; skipped: number };
  /** The user-generated specs, as persisted — used to build an export. */
  generatedSpecs: any[];
  generatedIds: string[];
} {
  const [specs, setSpecs] = useState<any[]>(loadGeneratedSpecs);

  const db = useMemo(() => buildDB(specs), [specs]);

  const addFood = useCallback((spec: any): string => {
    setSpecs((prev) => {
      const next = [...prev, spec];
      saveGeneratedSpecs(next);
      return next;
    });
    return spec.id;
  }, []);

  const importSpecs = useCallback(
    (incoming: any[]): { added: number; skipped: number } => {
      const { specs: next, added, skipped } = mergeSpecs(specs, incoming);
      if (added > 0) {
        saveGeneratedSpecs(next);
        setSpecs(next);
      }
      return { added, skipped };
    },
    [specs],
  );

  const generatedIds = useMemo(() => specs.map((s) => s.id), [specs]);

  return { db, addFood, importSpecs, generatedSpecs: specs, generatedIds };
}
