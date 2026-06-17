# Contexte & architecture — Moleculor

Ce document explique le **pourquoi** des choix techniques. Pour le **quoi** et le **comment lancer**, voir le [README](README.md).

## 🎯 Intention produit

Rendre tangible la chaîne **aliment → famille de nutriments → molécule → effet sur le corps**, sur un format mobile, avec une portion ajustable qui recalcule tout en direct. L'app est volontairement *read-only* côté utilisateur (pas de saisie de repas) : c'est un explorateur, pas un tracker.

## 🏛️ Décisions d'architecture

### 1. Tout dérive d'un *spec* compact via `makeFood`

Chaque aliment est décrit par un **spec** minimal (macros, micros, molécules, systèmes…). `makeFood(spec)` (`app/src/data/foodData.ts`) en **dérive** automatiquement :

- l'arborescence des familles (`buildTree`),
- la timeline de digestion,
- les bénéfices, interactions et points de vigilance.

**Conséquence clé** : l'IA n'a qu'à produire ce spec compact — pas l'objet `Food` complet. Tout le reste est dérivé de façon déterministe et cohérente avec les aliments intégrés. Moins de surface pour des incohérences, et le même code de rendu sert les deux origines.

### 2. La base est « vivante » : intégrée + générée

- `FOOD_DB` : les aliments intégrés (specs → `makeFood`).
- `useFoodDB` (`app/src/hooks/useFoodDB.ts`) : fusionne les aliments intégrés et les aliments générés en une seule `FoodDB` réactive.
- `store.ts` (`buildDB`) : applique `makeFood` à chaque spec généré, en ignorant silencieusement les doublons ou les specs invalides (try/catch) pour qu'un mauvais enregistrement ne casse jamais l'app.

### 3. On persiste des *specs*, pas des `Food`

Les aliments générés sont stockés dans `localStorage` (`moleculor.generated`) sous forme de **specs**, pas d'objets `Food` dérivés.

**Pourquoi** : si la dérivation (`makeFood`, l'arbre, la timeline…) évolue, les aliments déjà générés profitent automatiquement des améliorations au prochain chargement. Stocker l'objet dérivé l'aurait figé.

### 4. Génération IA en arrière-plan, non bloquante

`startGenerate` (`app/src/App.tsx`) lance la requête OpenRouter **sans l'attendre** (fire-and-forget) et ferme la recherche immédiatement. L'état d'avancement vit dans un `GenJob` rendu par `GenerationBadge` (badge flottant avec timer interne). La navigation entre onglets et fiches reste totalement libre pendant la génération.

### 5. Robustesse face aux sorties LLM

`enrich.ts` ne fait jamais confiance à la sortie du modèle :

- extraction tolérante du JSON (parse direct → retrait des fences Markdown → premier `{...}`),
- assainissement systématique : `clamp` des nombres, coercition des clés de famille / valences / unités vers des valeurs autorisées, génération d'un `id` unique.

Une réponse bruitée produit au pire un aliment dégradé, jamais un crash.

### 6. Sauvegarde = export/import des *specs*

L'export (`store.ts` → `buildExport`) sérialise les *specs* générés (pas les `Food`),
enveloppés dans `{ app, type, version, exportedAt, count, foods }`. L'import
(`parseImport` + `mergeSpecs`) accepte le wrapper **ou** un tableau brut, déduplique
par id contre les aliments intégrés et existants, et fait repasser chaque *spec* par
`makeFood`. Conséquence : un fichier de sauvegarde recrée les fiches à l'identique sur
un autre appareil, et profite des améliorations futures de la dérivation. La clé API
n'est jamais incluse dans l'export.

### 7. La comparaison fine relit l'arbre dérivé

L'écran Comparer déplie Protéines / Lipides / Glucides en sous-types. Les classes
d'acides gras (`sat`/`mono`/`poly`) et les sucres (`sucres`/`amidon`) viennent des
champs directs de `Food` ; les **acides aminés essentiels** sont lus depuis les nœuds
`aa:` de l'arbre déjà construit par `buildTree`. Conséquence : la décomposition marche
aussi pour les aliments générés par l'IA, sans calcul dédié. Un marqueur **Δ** indique
l'aliment dominant par sous-type.

### 8. Scan de code-barres : Open Food Facts pour les chiffres, IA pour l'analyse

Le flux code-barres sépare **deux sources de vérité** selon la nature de la donnée :

- **Open Food Facts** (`app/src/data/openfoodfacts.ts`) fournit les valeurs
  *quantitatives* réelles de l'étiquette (kcal, macros, classes d'acides gras…).
  Une IA les *inventerait* — autant lire l'étiquette. Base gratuite, sans clé,
  d'origine française, à forte couverture des produits emballés.
- **L'IA** (`enrich.ts` → `generateFoodSpecFromFacts`) reçoit ces chiffres **comme
  contraintes** et ne produit que la couche d'interprétation Moleculor (molécules,
  systèmes, micros, score, tagline) — la valeur ajoutée qui n'existe dans aucune base.

`generateFoodSpecFromFacts` **écrase** ensuite chaque macro effectivement fournie par
Open Food Facts sur le *spec* renvoyé par le modèle : l'étiquette gagne toujours, l'IA
ne complète que les champs manquants. Plus **précis** (pas d'hallucination des macros)
et plus **économe** (le modèle travaille moins). Le *spec* obtenu repart par le pipeline
commun (`toSpec` → `addFood` → `makeFood`) ; il garde `barcode` + `source: 'openfoodfacts'`
pour dédupliquer un re-scan et apparaître dans l'export/import comme tout aliment généré.

Le scan lui-même (`components/BarcodeScanner.tsx`) privilégie l'API native
`BarcodeDetector` (zéro dépendance) et **charge `@zxing/browser` à la demande** en repli
(iOS Safari, Firefox) — la lib reste hors du bundle initial. Le flux exige une clé
OpenRouter (couche IA) : sans clé, le bouton renvoie vers les Paramètres.

## 🧬 Modèle de données

Défini dans `app/src/data/types.ts`. Pièces principales :

| Type | Rôle |
|---|---|
| `Family` / `FamilyKey` | les 6 familles : `lipides`, `glucides`, `fibres`, `proteines`, `micro`, `bioactifs` |
| `Valence` | `b` (bénéfique) · `r` (à surveiller) · `mixed` · `n` (neutre) |
| `Molecule` | nom, formule, famille, valence, abondance, rôle |
| `Micro` | micronutriment : valeur, unité (`mg` / `µg`), % AJR |
| `SystemEntry` | système du corps touché + intensité + note |
| `TreeNode` | nœud de l'arborescence dérivée |
| `Food` / `FoodDB` | aliment complet dérivé / base indexée (`foods` + `order`) |

## 🔌 Brancher une vraie base nutritionnelle

Les valeurs intégrées sont des **ordres de grandeur de démonstration**. Tout l'accès aux données passe par une couche fine :

- `app/src/data/repository.ts` — recherche / accès aux aliments.
- `app/src/data/store.ts` — fusion base intégrée + aliments générés.

Pour brancher **Ciqual / ANSES**, **USDA FoodData Central** ou une API nutritionnelle : réimplémenter ces fonctions pour mapper les enregistrements distants sur le type `Food` (idéalement en produisant un *spec* puis en passant par `makeFood`). Le reste de l'app — écrans, overlays, comparaison, portion dynamique — est inchangé.

## 🌐 OpenRouter

- Endpoint chat : `POST https://openrouter.ai/api/v1/chat/completions` (compatible OpenAI).
- Liste des modèles : `GET https://openrouter.ai/api/v1/models` (public, sans clé).
- Réglages (clé + modèle) : `localStorage` → `moleculor.openrouter`.
- Auth : header `Authorization: Bearer <clé>`, plus `HTTP-Referer` / `X-Title`.

> ⚠️ La clé vit **en clair** dans le navigateur. Pour une mise en production, la router via un proxy backend.

## 🛒 Open Food Facts

- Produit par code-barres : `GET https://world.openfoodfacts.org/api/v2/product/<code>.json` (public, sans clé).
- Mapping vers un *spec* partiel : `app/src/data/openfoodfacts.ts` (`fetchOffProduct`).
- Source des **macros réelles** uniquement ; la couche d'analyse vient de l'IA (cf. décision n°8).

## 🎨 Design

Aucune palette inventée : toutes les couleurs, polices, rayons et ombres viennent de `app/src/theme/tokens.ts`, transcrits du handoff de design (`design_handoff_moleculor/`). Pas de librairie UI : icônes en SVG inline (`components/icons.tsx`), animations en keyframes CSS (`index.css`).
