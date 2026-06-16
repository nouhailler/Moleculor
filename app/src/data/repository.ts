/* Data access layer — the single seam between the UI and the nutrition source.
   Today it serves the local demo database (foodData.ts). To plug a validated
   source (Ciqual/ANSES, USDA FoodData Central, or a nutrition API), reimplement
   these functions to fetch + map remote records onto the `Food` shape; the rest
   of the app does not change. Functions are async-ready by intent even though
   the local lookups are synchronous. */

import { FOOD_DB } from './foodData';
import type { Food, FoodDB } from './types';

/** Case-insensitive filter over a given DB (built-in + generated), preserving
    display order. Used by the search overlay so dynamically added foods show up. */
export function searchInDB(db: FoodDB, query: string): Food[] {
  const q = query.trim().toLowerCase();
  return db.order
    .map((id) => db.foods[id])
    .filter((f) => f && (!q || f.name.toLowerCase().includes(q) || f.cat.toLowerCase().includes(q)));
}

export function getDB(): FoodDB {
  return FOOD_DB;
}

export function getFamilies() {
  return FOOD_DB.families;
}

export function listFoodIds(): string[] {
  return FOOD_DB.order;
}

export function getFood(id: string): Food | undefined {
  return FOOD_DB.foods[id];
}

export function listFoods(): Food[] {
  return FOOD_DB.order.map((id) => FOOD_DB.foods[id]);
}

/** Case-insensitive filter on name + category, preserving display order. */
export function searchFoods(query: string): Food[] {
  const q = query.trim().toLowerCase();
  return listFoods().filter(
    (f) => !q || f.name.toLowerCase().includes(q) || f.cat.toLowerCase().includes(q),
  );
}
