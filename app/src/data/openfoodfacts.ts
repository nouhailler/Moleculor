/* Open Food Facts lookup: turn a scanned barcode into the *quantitative* ground
   truth for a product (the real label numbers — kcal, macros, fatty acids).
   These facts are then handed to the LLM (see enrich.ts#generateFoodSpecFromFacts)
   which only derives the interpretive Moleculor layer (molecules, systems, score…)
   and never has to invent the macros. Open Food Facts is free, keyless and of
   French origin, with strong coverage of packaged products sold in Europe. */

const API = 'https://world.openfoodfacts.org/api/v2/product';

/** The slice of an OFF product we actually use, normalised per 100 g.
    A field is `undefined` when OFF has no value for it — callers must treat
    "missing" differently from "zero" (so the LLM can fill the gap). */
export interface OffFacts {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  ingredients?: string;
  image?: string;
  nutriscore?: string;
  kcal?: number;
  lip?: number;
  sat?: number;
  mono?: number;
  poly?: number;
  gluc?: number;
  sucres?: number;
  amidon?: number;
  fib?: number;
  prot?: number;
  salt?: number;
}

/** Parse a possibly-stringy OFF number; returns undefined when absent/garbage. */
function n(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const x = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : Number(v);
  return Number.isFinite(x) ? x : undefined;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

/** A scanned barcode is an EAN/UPC: 8–14 digits. */
export function isValidBarcode(code: string): boolean {
  return /^\d{8,14}$/.test(code.trim());
}

/** Fetch a product by barcode. Resolves to null when the product is unknown,
    throws (with a French message) on a network/HTTP failure. */
export async function fetchOffProduct(barcode: string): Promise<OffFacts | null> {
  const code = barcode.trim();
  let res: Response;
  try {
    res = await fetch(`${API}/${encodeURIComponent(code)}.json`, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new Error('Connexion à Open Food Facts impossible. Vérifie ta connexion réseau.');
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Food Facts indisponible (HTTP ${res.status}).`);

  const json = await res.json();
  if (json?.status !== 1 || !json?.product) return null;

  const p = json.product;
  const nut = p.nutriments && typeof p.nutriments === 'object' ? p.nutriments : {};

  const cats = str(p.categories);
  return {
    barcode: code,
    name: str(p.product_name_fr) || str(p.product_name) || str(p.generic_name_fr) || str(p.generic_name) || '',
    brand: str(p.brands),
    category: cats ? cats.split(',').pop()?.trim() : undefined,
    ingredients: str(p.ingredients_text_fr) || str(p.ingredients_text),
    image: str(p.image_front_small_url) || str(p.image_small_url) || str(p.image_url),
    nutriscore: str(p.nutriscore_grade || p.nutrition_grades),
    kcal: n(nut['energy-kcal_100g']),
    lip: n(nut['fat_100g']),
    sat: n(nut['saturated-fat_100g']),
    mono: n(nut['monounsaturated-fat_100g']),
    poly: n(nut['polyunsaturated-fat_100g']),
    gluc: n(nut['carbohydrates_100g']),
    sucres: n(nut['sugars_100g']),
    amidon: n(nut['starch_100g']),
    fib: n(nut['fiber_100g']),
    prot: n(nut['proteins_100g']),
    salt: n(nut['salt_100g']),
  };
}

/** A short human-readable label for the scanned product (name + brand). */
export function offLabel(f: OffFacts): string {
  return f.brand ? `${f.name} — ${f.brand}` : f.name;
}
