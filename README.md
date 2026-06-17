<div align="center">

<img src="app/public/icon.svg" alt="Logo Moleculor" width="120" height="120" />

# 🧬 Moleculor

### Explore la composition **moléculaire** des aliments — du nutriment à la molécule, jusqu'à son effet sur le corps.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)](#-installer-en-pwa)
[![Deploy: Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify&logoColor=white)](https://www.netlify.com)
[![IA: OpenRouter](https://img.shields.io/badge/IA-OpenRouter-7C3AED)](https://openrouter.ai)

</div>

---

## 🍎 C'est quoi ?

**Moleculor** est une application mobile (PWA) qui décompose un aliment couche par couche :

> 🥄 **Aliment** → 🧱 **Familles** (lipides, glucides, fibres, protéines, micros, bioactifs) → ⚛️ **Molécules** → 🫀 **Effets sur le corps**

On choisit un aliment, on ajuste la **portion** (10–500 g), et toutes les valeurs et tous les statuts (bénéfique / à surveiller) se recalculent en direct. Et si un aliment manque dans la base, l'**IA le génère à la volée**. 🤖✨

## ✨ Fonctionnalités

| | Fonctionnalité | Détail |
|---|---|---|
| 🔬 | **Composition** | Anneaux de macros, micronutriments et molécules clés par aliment |
| 🌳 | **Arborescence** | Familles → sous-familles → molécules, dépliables (acides gras, acides aminés…) |
| 🫀 | **Corps** | Silhouette, systèmes touchés, bénéfices, interactions et points de vigilance |
| ⚖️ | **Comparer** | Deux aliments côte à côte, à portion égale ; **2ᵉ loupe** pour choisir l'aliment B ; lignes **Protéines / Lipides / Glucides dépliables** (acides aminés, classes d'acides gras, sucres) avec marqueur **Δ** des différences |
| 🎚️ | **Portion dynamique** | Stepper 10–500 g, recalcul live des valeurs et des valences |
| 🤖 | **Enrichissement IA** | Génère un aliment absent via **OpenRouter** (clé + modèle au choix) |
| 📷 | **Scan code-barres** | Scanne un produit emballé → valeurs réelles via **Open Food Facts** + couche d'analyse par l'IA |
| ⏳ | **Génération en arrière-plan** | Badge flottant « IA » avec sablier animé + décompte en secondes, navigation jamais bloquée |
| 💾 | **Sauvegarde** | **Export / import** des aliments créés par l'IA (fichier JSON) pour recréer les fiches sur un autre appareil |
| 📱 | **PWA installable** | Icône d'app, plein écran, prête pour Netlify |

## 📸 Aperçu des écrans

### 🔬 Composition

<div align="center">

| Anneaux & macros | Micros & molécules |
|:---:|:---:|
| <img src="design_handoff_moleculor/screenshots/01-composition.png" width="220" /> | <img src="design_handoff_moleculor/screenshots/02-composition-micros-molecules.png" width="220" /> |

</div>

### 🌳 Arborescence

<div align="center">

| Familles | Acides aminés dépliés |
|:---:|:---:|
| <img src="design_handoff_moleculor/screenshots/03-arborescence-familles.png" width="220" /> | <img src="design_handoff_moleculor/screenshots/04-arborescence-acides-amines.png" width="220" /> |

</div>

### 🫀 Corps

<div align="center">

| Silhouette | Interactions | Bénéfices |
|:---:|:---:|:---:|
| <img src="design_handoff_moleculor/screenshots/05-corps-silhouette.png" width="220" /> | <img src="design_handoff_moleculor/screenshots/06-corps-interactions.png" width="220" /> | <img src="design_handoff_moleculor/screenshots/07-corps-benefices.png" width="220" /> |

</div>

### ⚖️ Comparer · 🔍 Recherche · 🔎 Fiches détaillées

<div align="center">

| Comparer | Recherche | Fiche molécule | Fiche système |
|:---:|:---:|:---:|:---:|
| <img src="design_handoff_moleculor/screenshots/10-comparer.png" width="200" /> | <img src="design_handoff_moleculor/screenshots/11-recherche.png" width="200" /> | <img src="design_handoff_moleculor/screenshots/08-fiche-molecule.png" width="200" /> | <img src="design_handoff_moleculor/screenshots/09-fiche-systeme.png" width="200" /> |

</div>

## 🚀 Démarrage

```bash
cd app
npm install
npm run dev        # → http://localhost:5173
```

Autres scripts :

```bash
npm run build      # tsc -b + build de production (sortie : app/dist)
npm run preview    # sert le build de prod en local
npm run typecheck  # vérification de types seule
```

## 🤖 Enrichissement par l'IA (OpenRouter)

Quand un aliment n'existe pas encore, on peut le **générer** :

1. ⚙️ **Paramètres** (header) → saisir une **clé API OpenRouter** et choisir un **modèle** (« Charger les modèles » récupère le catalogue live).
2. 🔍 Dans la recherche, taper un aliment absent → **« Créer … avec l'IA »**.
3. ⏳ La génération tourne **en arrière-plan** : un badge flottant **« IA »** affiche un sablier qui tourne et un **décompte en secondes**, sans jamais bloquer la navigation.
4. ✅ À la fin, la **fiche complète s'ouvre automatiquement** (Composition) — remplie par l'IA : composition, molécules, effets sur le corps. En cas d'échec, le badge affiche l'erreur.
5. 🧪 Sous le capot : le modèle renvoie un *spec* compact → **assaini** → passé à `makeFood`, qui dérive arbre, timeline, bénéfices et risques exactement comme les aliments intégrés.

Les aliments générés sont **persistés** dans `localStorage` sous forme de *specs* (pas l'objet `Food` dérivé), pour rester compatibles si le schéma évolue.

### 💾 Sauvegarde (changer d'appareil)

Dans **⚙ Paramètres → Sauvegarde des aliments** : **Exporter** télécharge un fichier JSON contenant tous tes aliments créés par l'IA ; **Importer** le relit sur un autre appareil et **recrée les fiches à l'identique** (les *specs* repassent par `makeFood`). L'import ignore les doublons et n'inclut pas la clé API.

> ⚠️ **Sécurité** — la clé OpenRouter est stockée **en clair** côté client (`localStorage`). Acceptable pour une démo locale ; en production, la déplacer derrière un proxy backend pour qu'elle n'atteigne jamais le navigateur.

### 📷 Scanner un code-barres

Dans la recherche, le bouton 📷 ouvre la caméra pour scanner un produit emballé :

1. 🔎 Le code-barres interroge **Open Food Facts** (base gratuite, sans clé) pour les **valeurs réelles de l'étiquette** : kcal, lipides (saturés / mono / poly), glucides (sucres / amidon), fibres, protéines, sel.
2. 🤖 L'**IA** reçoit ces chiffres comme contraintes et n'ajoute que la **couche Moleculor** (molécules, systèmes, micros, score, tagline) — les macros d'Open Food Facts **priment** toujours.
3. ✅ La fiche s'ouvre, remplie. Un produit déjà scanné est rouvert **sans nouvel appel IA** (dédup par code-barres).

Le scan utilise l'API native `BarcodeDetector` quand elle est disponible (Android/Chrome) et bascule sinon sur `@zxing/browser` (iOS Safari, Firefox), chargé à la demande. La caméra nécessite **HTTPS** (donc le site déployé, pas `localhost`) et une clé OpenRouter configurée.

### 📦 Import en masse (hors-app)

Pour intégrer une longue liste d'aliments sans grignoter de tokens en session, `scripts/import-aliments.sh` génère via OpenRouter un fichier **directement importable** (⚙ Paramètres → Importer). Il réutilise le même prompt et le même format de *spec* que l'app, avec un cache de reprise.

```bash
./scripts/import-aliments.sh -k "sk-or-..." -m "anthropic/claude-sonnet-4.5"
# puis : ⚙ Paramètres → Importer des aliments → moleculor-import.json
```

## 📱 Installer en PWA

L'app embarque un `manifest.webmanifest`, une icône maskable et les balises `apple-touch-icon`. Une fois déployée (HTTPS), « Ajouter à l'écran d'accueil » l'installe en plein écran avec l'icône molécule. 🧬

L'icône source est `app/public/icon.svg` ; les PNG (192 / 512 / apple-touch) se régénèrent avec `node app/rasterize.mjs` après modification.

### Déployer sur Netlify

Le `netlify.toml` à la racine est déjà configuré (base `app/`, fallback SPA, en-têtes de cache) :

| Réglage | Valeur |
|---|---|
| Base directory | `app` |
| Build command | `npm run build` |
| Publish directory | `dist` |

> ℹ️ `command` et `publish` sont résolus **relativement à `base`** : le répertoire publié est donc `dist` (et non `app/dist`, qui pointerait vers `app/app/dist`).

→ Connecter le dépôt sur Netlify, ou `netlify deploy --prod`.

## 🗂️ Structure du dépôt

```
.
├── README.md                 # ce fichier
├── CONTEXT.md                # contexte produit + décisions d'architecture
├── CHANGELOG.md              # historique des versions
├── netlify.toml              # config de déploiement (PWA / SPA)
├── scripts/                  # import-aliments.sh (génération en masse → fichier importable)
├── app/                      # l'application React + Vite
│   ├── public/               # icônes PWA + manifest
│   └── src/
│       ├── data/             # types, foodData (base + makeFood), repository, store, settings, enrich, openfoodfacts
│       ├── hooks/            # useFoodDB (base vivante : intégrée + générée)
│       ├── theme/            # tokens (couleurs, typo, rayons, ombres)
│       ├── components/       # Header, TabBar, Ring, Donut, GenerationBadge, BarcodeScanner, icons
│       ├── screens/          # Composition, Tree, Body, Compare
│       └── overlays/         # Sheet, MoleculeSheet, SystemSheet, SearchOverlay, SettingsSheet
└── design_handoff_moleculor/ # spec de design d'origine + captures de référence
```

## 🧱 Stack

**React 18** · **Vite 5** · **TypeScript 5** · PWA · OpenRouter (génération IA) · Open Food Facts (macros par code-barres) · `@zxing/browser` (scan, en repli, lazy) · zéro dépendance UI (SVG inline, design tokens maison).

## 🧭 En savoir plus

- 📖 [`CONTEXT.md`](CONTEXT.md) — modèle de données, pattern `makeFood`, et où brancher une vraie base nutritionnelle (Ciqual / ANSES / USDA).
- 📝 [`CHANGELOG.md`](CHANGELOG.md) — historique des versions.
- 🎨 [`app/README.md`](app/README.md) — notes techniques de l'app.

---

<div align="center">
<sub>Les valeurs nutritionnelles intégrées sont des ordres de grandeur de démonstration — voir <a href="CONTEXT.md">CONTEXT.md</a> pour brancher une source officielle.</sub>
</div>
