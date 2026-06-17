# Changelog

Toutes les évolutions notables de Moleculor sont consignées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet
adhère au [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- **Scan de code-barres** : importer un produit emballé en le scannant. Le code-barres
  interroge **Open Food Facts** (gratuit, sans clé) pour les valeurs réelles de
  l'étiquette (kcal, lipides/saturés/mono/poly, glucides/sucres/amidon, fibres,
  protéines, sel), puis l'**IA** dérive uniquement la couche Moleculor (molécules,
  systèmes, micros, score, tagline). Approche **hybride** : les macros d'Open Food
  Facts **priment** toujours sur l'IA. Scanner via l'API native `BarcodeDetector`
  (Android/Chrome) avec repli `@zxing/browser` (iOS Safari / Firefox), chargé à la
  demande. Un produit déjà importé est rouvert sans nouvel appel IA (dédup par
  code-barres). Bouton 📷 dans la barre de recherche.
- **Script d'import en masse** (`scripts/import-aliments.sh`) : génère hors-app, via
  OpenRouter, un fichier d'aliments **directement importable** (Paramètres → Importer).
  Reprend fidèlement le prompt et le format de *spec* de l'app, avec cache de reprise
  (relance = 0 token gaspillé). Clé et modèle en paramètres (`-k`, `-m`).
- **Sauvegarde des aliments** (Paramètres) : **export** des aliments créés par l'IA
  dans un fichier JSON et **import** sur un autre appareil pour recréer les fiches à
  l'identique (les *specs* repassent par `makeFood`). L'import déduplique par id et
  n'inclut jamais la clé API.
- **Comparaison fine** : les lignes **Protéines**, **Lipides** et **Glucides** se
  déplient pour comparer les sous-types entre A et B — acides aminés essentiels,
  classes d'acides gras (saturés / mono / poly-insaturés) et types de glucides
  (sucres / amidon) — avec un marqueur **Δ** indiquant quel aliment en contient le
  plus.
- **Création par l'IA depuis la recherche** : un aliment absent de la base se crée
  via l'IA (« Créer … avec l'IA ») ; à la fin de la génération en arrière-plan, sa
  **fiche complète s'ouvre automatiquement** (Composition), remplie par le modèle.
- **Comparer** : une **2ᵉ loupe** ouvre la recherche pour choisir l'aliment B dans
  toute la base (aliments intégrés + générés par l'IA), en plus des chips rapides.
  Un aliment généré depuis cette recherche est directement placé en B.

### Corrigé

- **Comparer** : sélection de B robuste si l'aliment n'existe plus / vaut A (repli
  automatique sur un autre aliment).
- **Déploiement Netlify** : `publish` est résolu relativement à `base`, donc
  `app/dist` pointait vers `app/app/dist` (introuvable) → corrigé en `dist`.

## [0.1.0] — 2026-06-16

Première version publique : application complète + enrichissement IA + PWA.

### Ajouté

- **Application complète** recréée d'après le handoff de design (`design_handoff_moleculor/`) :
  - 4 onglets : **Composition**, **Arborescence** (molécules), **Corps**, **Comparer** ;
  - overlays : fiche molécule, fiche système, recherche ;
  - **stepper de portion** (10–500 g) recalculant valeurs et valences en direct ;
  - 20 aliments intégrés, dérivés via le pattern `makeFood`.
- **Menu Paramètres** : saisie d'une clé API **OpenRouter** et choix d'un modèle
  (récupération du catalogue de modèles en live).
- **Enrichissement dynamique par l'IA** : génération d'un aliment absent de la base,
  assainie puis intégrée comme un aliment natif (`data/enrich.ts`, `data/store.ts`).
- **Génération en arrière-plan** : badge flottant **« IA »** avec sablier animé et
  **décompte en secondes**, sans blocage de la navigation ; succès cliquable pour ouvrir
  l'aliment, sinon affichage de l'erreur (`components/GenerationBadge.tsx`).
- **PWA** : `manifest.webmanifest`, icône molécule (SVG + PNG 192/512 + maskable),
  `apple-touch-icon`, favicon, et balises méta iOS.
- **Déploiement** : `netlify.toml` (base `app/`, publish `app/dist`, fallback SPA,
  en-têtes de cache).
- **Documentation** : `README.md` (vue d'ensemble + visuels), `CONTEXT.md`
  (architecture et décisions), ce `CHANGELOG.md`.

### Sécurité

- ⚠️ La clé OpenRouter est stockée **en clair** dans `localStorage` (acceptable pour une
  démo locale ; à router derrière un proxy backend en production).

[Non publié]: https://github.com/nouhailler/Moleculor/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/nouhailler/Moleculor/releases/tag/v0.1.0
