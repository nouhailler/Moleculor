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

## 🎨 Design

Aucune palette inventée : toutes les couleurs, polices, rayons et ombres viennent de `app/src/theme/tokens.ts`, transcrits du handoff de design (`design_handoff_moleculor/`). Pas de librairie UI : icônes en SVG inline (`components/icons.tsx`), animations en keyframes CSS (`index.css`).
