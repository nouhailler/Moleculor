/* OpenRouter settings — the API key + chosen model used to enrich the food
   database on demand. Persisted in localStorage (local demo: the key is stored
   in clear; for production move it behind a backend proxy so it never reaches
   the client). */

export interface OpenRouterSettings {
  apiKey: string;
  /** OpenRouter model slug, e.g. "anthropic/claude-sonnet-4.5". */
  model: string;
}

const STORAGE_KEY = 'moleculor.openrouter';

const EMPTY: OpenRouterSettings = { apiKey: '', model: '' };

export function loadSettings(): OpenRouterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return {
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      model: typeof parsed.model === 'string' ? parsed.model : '',
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveSettings(s: OpenRouterSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiKey: s.apiKey.trim(), model: s.model.trim() }));
  } catch {
    /* storage unavailable — settings simply won't persist this session */
  }
}

/** Generation is only possible once both a key and a model are configured. */
export function settingsReady(s: OpenRouterSettings): boolean {
  return s.apiKey.trim().length > 0 && s.model.trim().length > 0;
}
