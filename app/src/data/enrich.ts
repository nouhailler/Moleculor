/* Dynamic enrichment via OpenRouter. When a food is not already in the local
   database, we ask an LLM to produce a compact spec in the exact shape that
   data/foodData.ts#makeFood consumes — makeFood then derives the tree, timeline,
   benefits and risks just like the built-in foods. Everything here is defensive:
   the model's JSON is parsed leniently and sanitised before it reaches makeFood,
   so a noisy response can never crash the app. */

import type { OpenRouterSettings } from './settings';
import type { OffFacts } from './openfoodfacts';

const CHAT_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const MODELS_ENDPOINT = 'https://openrouter.ai/api/v1/models';

const FAMILY_KEYS = ['lipides', 'glucides', 'fibres', 'proteines', 'micro', 'bioactifs'] as const;
const VALENCES = ['b', 'r', 'mixed', 'n'] as const;
const UNITS = ['mg', 'µg'] as const;

export interface OpenRouterModel {
  id: string;
  name: string;
}

/* ── Model catalogue (public endpoint, no key required) ───────────────────── */

export async function fetchModels(): Promise<OpenRouterModel[]> {
  const res = await fetch(MODELS_ENDPOINT, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Liste des modèles indisponible (HTTP ${res.status}).`);
  const json = await res.json();
  const data: any[] = Array.isArray(json?.data) ? json.data : [];
  return data
    .map((m) => ({ id: String(m.id ?? ''), name: String(m.name ?? m.id ?? '') }))
    .filter((m) => m.id)
    .sort((a, b) => a.id.localeCompare(b.id));
}

/* ── Prompt ───────────────────────────────────────────────────────────────── */

function systemPrompt(): string {
  return [
    "Tu es un expert en nutrition et en biochimie alimentaire. Tu produis la composition moléculaire d'un aliment au format JSON STRICT, sans aucun texte autour, sans balises Markdown.",
    'Toutes les valeurs sont rapportées à 100 g d\'aliment cru (sauf mention courante d\'un état cuit).',
    'Schéma exact attendu :',
    '{',
    '  "name": string,                     // nom court en français',
    '  "cat": string,                      // catégorie courte (ex: "Légume racine", "Oléagineux")',
    '  "score": number,                    // indice santé 0-100',
    '  "kcal": number,                     // kcal / 100 g',
    '  "tagline": string,                  // une phrase de synthèse',
    '  "macros": { "lip": number, "gluc": number, "fib": number, "prot": number, "eau": number }, // grammes / 100 g',
    '  "sat": number, "mono": number, "poly": number,   // grammes d\'acides gras / 100 g (0 si non lipidique)',
    '  "sucres": number, "amidon": number,              // grammes / 100 g',
    '  "micros": [ { "name": string, "val": number, "unit": "mg"|"µg", "pct": number } ], // pct = % des AJR pour 100 g',
    '  "molecules": [ { "name": string, "formula": string, "fam": "lipides"|"glucides"|"fibres"|"proteines"|"micro"|"bioactifs", "valence": "b"|"r"|"mixed"|"n", "abundance": string, "role": string, "detail": string } ],',
    '  "systems": [ { "name": string, "valence": "b"|"r"|"mixed"|"n", "intensity": 1|2|3, "note": string } ]',
    '}',
    'Contraintes :',
    "- valence : b = bénéfique, r = à surveiller, mixed = effet mixte, n = neutre.",
    '- formula : formule chimique avec indices Unicode (ex: "C₇H₈N₄O₂", "C₆H₈O₆") ; "—" si non pertinent.',
    "- abundance : quantité lisible avec unité (ex: \"≈ 228 mg\", \"présent\", \"traces\").",
    '- 5 à 8 molecules représentatives (inclure les composés bioactifs marquants et au moins un point de vigilance si pertinent), 3 à 5 systems.',
    '- macros cohérentes : lip+gluc+fib+prot+eau ≤ 100.',
    '- Réponds UNIQUEMENT par l\'objet JSON.',
  ].join('\n');
}

/* ── HTTP call ────────────────────────────────────────────────────────────── */

async function callOpenRouter(userContent: string, s: OpenRouterSettings): Promise<string> {
  let res: Response;
  try {
    res = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${s.apiKey.trim()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': location.origin,
        'X-Title': 'Moleculor',
      },
      body: JSON.stringify({
        model: s.model.trim(),
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt() },
          { role: 'user', content: userContent },
        ],
      }),
    });
  } catch (e) {
    throw new Error('Connexion à OpenRouter impossible. Vérifie ta connexion réseau.');
  }

  if (res.status === 401) throw new Error('Clé OpenRouter refusée (401). Vérifie la clé dans les paramètres.');
  if (res.status === 402) throw new Error('Crédit OpenRouter insuffisant (402).');
  if (res.status === 404) throw new Error(`Modèle « ${s.model} » introuvable (404). Choisis-en un autre.`);
  if (res.status === 429) throw new Error('Trop de requêtes (429). Réessaie dans un instant.');
  if (!res.ok) {
    let msg = `Erreur OpenRouter (HTTP ${res.status}).`;
    try {
      const err = await res.json();
      if (err?.error?.message) msg = String(err.error.message);
    } catch {
      /* keep generic message */
    }
    throw new Error(msg);
  }

  const json = await res.json();
  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Réponse vide du modèle.');
  return content;
}

/* ── JSON extraction + sanitising ─────────────────────────────────────────── */

function extractJson(text: string): any {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through: strip code fences or find the first {...} block */
  }
  const fenced = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try {
    return JSON.parse(fenced);
  } catch {
    /* fall through */
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }
  throw new Error('Le modèle n\'a pas renvoyé de JSON exploitable.');
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : Number(v);
  return Number.isFinite(n) ? n : fallback;
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const str = (v: unknown, fallback = '') => (typeof v === 'string' && v.trim() ? v.trim() : fallback);

function fam(v: unknown): string {
  return (FAMILY_KEYS as readonly string[]).includes(v as string) ? (v as string) : 'bioactifs';
}
function valence(v: unknown): string {
  return (VALENCES as readonly string[]).includes(v as string) ? (v as string) : 'n';
}
function unit(v: unknown): string {
  return (UNITS as readonly string[]).includes(v as string) ? (v as string) : 'mg';
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'aliment';
}

function uniqueId(base: string, taken: string[]): string {
  if (!taken.includes(base)) return base;
  let i = 2;
  while (taken.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

/** Map the model's named-field JSON onto the positional spec makeFood expects. */
function toSpec(raw: any, takenIds: string[]): any {
  if (!raw || typeof raw !== 'object') throw new Error('Réponse du modèle non conforme.');
  const name = str(raw.name);
  if (!name) throw new Error('Le modèle n\'a pas fourni de nom d\'aliment.');

  const m = raw.macros && typeof raw.macros === 'object' ? raw.macros : {};
  const lip = clamp(num(m.lip), 0, 100);
  const gluc = clamp(num(m.gluc), 0, 100);
  const fib = clamp(num(m.fib), 0, 100);
  const prot = clamp(num(m.prot), 0, 100);
  const eau = clamp(num(m.eau), 0, 100);

  const micros = Array.isArray(raw.micros)
    ? raw.micros
        .filter((x: any) => x && str(x.name))
        .slice(0, 8)
        .map((x: any) => [str(x.name), num(x.val), unit(x.unit), clamp(num(x.pct), 0, 1000)])
    : [];

  const molecules = Array.isArray(raw.molecules)
    ? raw.molecules
        .filter((x: any) => x && str(x.name))
        .slice(0, 10)
        .map((x: any) => [
          str(x.name),
          str(x.formula, '—'),
          fam(x.fam),
          valence(x.valence),
          str(x.abundance, 'présent'),
          str(x.role, ''),
          str(x.detail, str(x.role, '')),
        ])
    : [];

  const systems = Array.isArray(raw.systems)
    ? raw.systems
        .filter((x: any) => x && str(x.name))
        .slice(0, 6)
        .map((x: any) => [str(x.name), valence(x.valence), clamp(Math.round(num(x.intensity, 1)), 1, 3), str(x.note, '')])
    : [];

  if (molecules.length === 0) throw new Error('Le modèle n\'a renvoyé aucune molécule.');

  const id = uniqueId(slugify(name), takenIds);
  return {
    id,
    name,
    cat: str(raw.cat, 'Aliment'),
    score: clamp(Math.round(num(raw.score, 60)), 0, 100),
    kcal: Math.max(0, Math.round(num(raw.kcal))),
    tagline: str(raw.tagline, 'Aliment ajouté via enrichissement IA.'),
    lip,
    gluc,
    fib,
    prot,
    eau,
    sat: clamp(num(raw.sat), 0, lip || 100),
    mono: clamp(num(raw.mono), 0, lip || 100),
    poly: clamp(num(raw.poly), 0, lip || 100),
    sucres: clamp(num(raw.sucres), 0, gluc || 100),
    amidon: clamp(num(raw.amidon), 0, gluc || 100),
    micros,
    molecules,
    systems,
    /** marks foods produced by the LLM (vs. the curated built-ins). */
    generated: true,
  };
}

/** Ask the model for a food and return a sanitised spec ready for makeFood.
    `takenIds` lets us guarantee a unique id against the current database. */
export async function generateFoodSpec(query: string, s: OpenRouterSettings, takenIds: string[]): Promise<any> {
  const content = await callOpenRouter(
    `Aliment : « ${query.trim()} ». Donne sa composition moléculaire au format JSON demandé.`,
    s,
  );
  const raw = extractJson(content);
  return toSpec(raw, takenIds);
}

/* ── Barcode flow: Open Food Facts (real macros) + LLM (interpretive layer) ──
   We feed the model the label numbers as ground truth so it doesn't invent
   them, then overwrite every macro field OFF actually provided onto the spec —
   so the real label always wins, and the LLM only contributes the Moleculor
   layer (molecules, systems, micros, score, tagline) plus any macro OFF lacked. */

function factsPrompt(f: OffFacts): string {
  const known: string[] = [];
  const push = (label: string, v: number | undefined, unit: string) => {
    if (typeof v === 'number') known.push(`- ${label} : ${v} ${unit}`);
  };
  push('Énergie', f.kcal, 'kcal');
  push('Lipides', f.lip, 'g');
  push('dont saturés', f.sat, 'g');
  push('dont mono-insaturés', f.mono, 'g');
  push('dont poly-insaturés', f.poly, 'g');
  push('Glucides', f.gluc, 'g');
  push('dont sucres', f.sucres, 'g');
  push('dont amidon', f.amidon, 'g');
  push('Fibres', f.fib, 'g');
  push('Protéines', f.prot, 'g');
  push('Sel', f.salt, 'g');

  return [
    `Produit emballé scanné : « ${offLabelFor(f)} ».`,
    f.category ? `Catégorie Open Food Facts : ${f.category}.` : '',
    f.ingredients ? `Ingrédients : ${f.ingredients.slice(0, 600)}.` : '',
    '',
    'Valeurs nutritionnelles RÉELLES de l\'étiquette (pour 100 g) — utilise-les telles quelles, ne les recalcule pas :',
    known.length ? known.join('\n') : '(non renseignées sur l\'étiquette)',
    '',
    'À partir de ces valeurs et des ingrédients, produis le JSON demandé : reprends ces macros à l\'identique dans "macros"/"sat"/"mono"/"poly"/"sucres"/"amidon", estime les champs manquants, et complète la couche d\'analyse Moleculor (micros, molecules, systems, score, tagline, cat).',
  ]
    .filter(Boolean)
    .join('\n');
}

/** offLabel without importing the module's helper to avoid a cycle at call time. */
function offLabelFor(f: OffFacts): string {
  return f.brand ? `${f.name} — ${f.brand}` : f.name;
}

const clampLip = (v: number | undefined, lip: number) =>
  typeof v === 'number' ? clamp(v, 0, lip || 100) : undefined;

/** Generate a spec for a scanned product: OFF macros as ground truth + LLM. */
export async function generateFoodSpecFromFacts(
  facts: OffFacts,
  s: OpenRouterSettings,
  takenIds: string[],
): Promise<any> {
  const content = await callOpenRouter(factsPrompt(facts), s);
  const raw = extractJson(content);
  const spec = toSpec(raw, takenIds);

  // Open Food Facts wins on every quantitative field it actually provided.
  const lip = typeof facts.lip === 'number' ? clamp(facts.lip, 0, 100) : spec.lip;
  const gluc = typeof facts.gluc === 'number' ? clamp(facts.gluc, 0, 100) : spec.gluc;
  const overrides: Record<string, number> = {};
  if (typeof facts.kcal === 'number') overrides.kcal = Math.max(0, Math.round(facts.kcal));
  if (typeof facts.lip === 'number') overrides.lip = lip;
  if (typeof facts.gluc === 'number') overrides.gluc = gluc;
  if (typeof facts.fib === 'number') overrides.fib = clamp(facts.fib, 0, 100);
  if (typeof facts.prot === 'number') overrides.prot = clamp(facts.prot, 0, 100);
  const sat = clampLip(facts.sat, lip);
  const mono = clampLip(facts.mono, lip);
  const poly = clampLip(facts.poly, lip);
  if (sat !== undefined) overrides.sat = sat;
  if (mono !== undefined) overrides.mono = mono;
  if (poly !== undefined) overrides.poly = poly;
  if (typeof facts.sucres === 'number') overrides.sucres = clamp(facts.sucres, 0, gluc || 100);
  if (typeof facts.amidon === 'number') overrides.amidon = clamp(facts.amidon, 0, gluc || 100);

  return {
    ...spec,
    ...overrides,
    name: facts.name || spec.name,
    /** keep the barcode so the same product isn't re-scanned into a duplicate. */
    barcode: facts.barcode,
    source: 'openfoodfacts',
  };
}
