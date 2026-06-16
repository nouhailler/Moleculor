/* Dynamic enrichment via OpenRouter. When a food is not already in the local
   database, we ask an LLM to produce a compact spec in the exact shape that
   data/foodData.ts#makeFood consumes — makeFood then derives the tree, timeline,
   benefits and risks just like the built-in foods. Everything here is defensive:
   the model's JSON is parsed leniently and sanitised before it reaches makeFood,
   so a noisy response can never crash the app. */

import type { OpenRouterSettings } from './settings';

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

async function callOpenRouter(query: string, s: OpenRouterSettings): Promise<string> {
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
          { role: 'user', content: `Aliment : « ${query.trim()} ». Donne sa composition moléculaire au format JSON demandé.` },
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
  const content = await callOpenRouter(query, s);
  const raw = extractJson(content);
  return toSpec(raw, takenIds);
}
