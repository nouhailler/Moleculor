/* Settings sheet — OpenRouter API key + model picker. The key/model are used to
   enrich the food database on demand (see data/enrich.ts). Models can be loaded
   live from OpenRouter's public catalogue and filtered via a datalist. */

import { useState } from 'react';
import { colors, font, radius } from '../theme/tokens';
import { Sheet } from './Sheet';
import { CloseIcon } from '../components/icons';
import { fetchModels, type OpenRouterModel } from '../data/enrich';
import type { OpenRouterSettings } from '../data/settings';

interface Props {
  settings: OpenRouterSettings;
  onSave: (s: OpenRouterSettings) => void;
  onClose: () => void;
}

const label: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: 10,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  color: colors.ink3,
  display: 'block',
  marginBottom: 8,
};

const input: React.CSSProperties = {
  width: '100%',
  border: `1px solid ${colors.controlBorder}`,
  borderRadius: radius.row,
  background: colors.surface,
  padding: '11px 13px',
  fontFamily: font.sans,
  fontSize: 14,
  color: colors.ink,
  outline: 'none',
};

export function SettingsSheet({ settings, onSave, onClose }: Props) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);
  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const loadModels = async () => {
    setLoadingModels(true);
    setModelsError(null);
    try {
      setModels(await fetchModels());
    } catch (e) {
      setModelsError(e instanceof Error ? e.message : 'Échec du chargement.');
    } finally {
      setLoadingModels(false);
    }
  };

  const save = () => {
    onSave({ apiKey: apiKey.trim(), model: model.trim() });
    onClose();
  };

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding: '18px 20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: font.serif, fontSize: 27, fontWeight: 400, color: colors.ink, lineHeight: 1.1 }}>
              Paramètres
            </div>
            <div style={{ fontSize: 12.5, color: colors.ink2, marginTop: 6, lineHeight: 1.45 }}>
              Connecte une clé OpenRouter pour enrichir la base avec des aliments absents, générés par le modèle choisi.
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={closeBtn}>
            <CloseIcon />
          </button>
        </div>

        {/* API key */}
        <div style={{ marginTop: 22 }}>
          <label style={label} htmlFor="or-key">Clé API OpenRouter</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="or-key"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-…"
              autoComplete="off"
              spellCheck={false}
              style={{ ...input, flex: 1 }}
            />
            <button onClick={() => setShowKey((v) => !v)} style={ghostBtn}>
              {showKey ? 'Masquer' : 'Voir'}
            </button>
          </div>
          <div style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 7, lineHeight: 1.45 }}>
            Stockée localement sur cet appareil (localStorage). Crée une clé sur openrouter.ai/keys.
          </div>
        </div>

        {/* Model */}
        <div style={{ marginTop: 20 }}>
          <label style={label} htmlFor="or-model">Modèle</label>
          <input
            id="or-model"
            list="or-models"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="ex. anthropic/claude-sonnet-4.5"
            autoComplete="off"
            spellCheck={false}
            style={input}
          />
          <datalist id="or-models">
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </datalist>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 9 }}>
            <button onClick={loadModels} disabled={loadingModels} style={ghostBtn}>
              {loadingModels ? 'Chargement…' : models.length ? 'Recharger la liste' : 'Charger les modèles'}
            </button>
            {models.length > 0 && !modelsError && (
              <span style={{ fontSize: 11.5, color: colors.ink3 }}>{models.length} modèles disponibles</span>
            )}
            {modelsError && <span style={{ fontSize: 11.5, color: colors.watch }}>{modelsError}</span>}
          </div>
        </div>

        <button onClick={save} style={saveBtn}>Enregistrer</button>
      </div>
    </Sheet>
  );
}

const closeBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  flexShrink: 0,
  background: colors.surface,
  border: `1px solid ${colors.controlBorder}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
};

const ghostBtn: React.CSSProperties = {
  border: `1px solid ${colors.controlBorder}`,
  background: colors.surface,
  borderRadius: radius.pill,
  padding: '9px 14px',
  fontFamily: font.sans,
  fontSize: 13,
  color: colors.ink2,
  cursor: 'pointer',
  flexShrink: 0,
};

const saveBtn: React.CSSProperties = {
  width: '100%',
  marginTop: 26,
  border: 'none',
  background: colors.ink,
  color: '#fff',
  borderRadius: radius.pill,
  padding: '14px',
  fontFamily: font.sans,
  fontSize: 14.5,
  fontWeight: 500,
  cursor: 'pointer',
};
