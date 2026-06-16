# Changelog

Toutes les évolutions notables de Moleculor sont consignées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet
adhère au [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- **Création par l'IA depuis la recherche** : un aliment absent de la base se crée
  via l'IA (« Créer … avec l'IA ») ; à la fin de la génération en arrière-plan, sa
  **fiche complète s'ouvre automatiquement** (Composition), remplie par le modèle.
- **Comparer** : une **2ᵉ loupe** ouvre la recherche pour choisir l'aliment B dans
  toute la base (aliments intégrés + générés par l'IA), en plus des chips rapides.
  Un aliment généré depuis cette recherche est directement placé en B.

### Corrigé

- **Comparer** : sélection de B robuste si l'aliment n'existe plus / vaut A (repli
  automatique sur un autre aliment).

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
