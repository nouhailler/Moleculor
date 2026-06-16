/* Holds the live food database in React state so generated foods appear
   immediately and survive reloads (persisted via store.ts). */

import { useCallback, useMemo, useState } from 'react';
import type { FoodDB } from '../data/types';
import { buildDB, loadGeneratedSpecs, saveGeneratedSpecs } from '../data/store';

export function useFoodDB(): {
  db: FoodDB;
  addFood: (spec: any) => string;
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

  const generatedIds = useMemo(() => specs.map((s) => s.id), [specs]);

  return { db, addFood, generatedIds };
}
