# Moleculor

Application mobile (hi-fi, viewport ~390×844) de composition moléculaire des aliments, recréée d'après `design_handoff_moleculor/`. Stack : **React 18 + Vite + TypeScript** (PWA web responsive).

## Lancer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b + build de production
npm run typecheck  # vérification de types seule
```

## Écrans

4 onglets (Composition, Molécules, Corps, Comparer) + 3 overlays (fiche molécule, fiche système, recherche) + un menu Paramètres. Stepper de portion (10–500 g) qui recalcule valeurs et statuts dynamiques en direct.

## Enrichissement dynamique via OpenRouter

Quand un aliment n'est pas dans la base, on peut le générer à la volée :

1. Ouvrir **⚙ Paramètres** (header), saisir une **clé API OpenRouter** et choisir un **modèle** (bouton « Charger les modèles » pour récupérer le catalogue live depuis OpenRouter).
2. Dans la recherche, taper un aliment absent → bouton **« Générer … avec l'IA »**.
3. La génération se fait **en arrière-plan** : la recherche se ferme aussitôt et la navigation reste libre. Un **badge flottant « IA »** affiche un sablier qui tourne et un décompte en secondes ; à la fin il passe en succès (cliquable pour ouvrir l'aliment) ou en erreur (`components/GenerationBadge.tsx`).
4. Le modèle renvoie un *spec* compact ; il est **assaini** (`data/enrich.ts`), passé à `makeFood` (qui dérive arbre, timeline, bénéfices/risques comme les aliments intégrés) et ajouté à la base.

Les aliments générés sont **persistés** en `localStorage` (clé `moleculor.generated`) sous forme de specs — pas de l'objet `Food` dérivé — pour rester compatibles si le schéma évolue.

- Clé/modèle : `localStorage` (`moleculor.openrouter`). ⚠️ La clé est stockée en clair côté client : pour une mise en production, la déplacer derrière un proxy backend.
- L'appel utilise l'endpoint OpenAI-compatible `POST https://openrouter.ai/api/v1/chat/completions`.

## Brancher une vraie base nutritionnelle

Les valeurs intégrées sont des ordres de grandeur de démonstration. Tout l'accès aux données passe par `src/data/repository.ts` (et `src/data/store.ts` pour la fusion base intégrée + aliments générés). Pour brancher **Ciqual/ANSES**, **USDA FoodData Central** ou une API nutritionnelle, réimplémenter ces fonctions pour mapper les enregistrements distants sur le type `Food` (`src/data/types.ts`) — le reste de l'app est inchangé.

## Structure

```
src/
  data/        types, foodData (base + makeFood/buildTree), repository, store, settings, enrich
  hooks/       useFoodDB (base vivante : intégrée + générée)
  theme/       tokens (couleurs, typo, rayons, ombres)
  components/  Header, TabBar, Ring, Donut, icons
  screens/     Composition, Tree, Body, Compare
  overlays/    Sheet, MoleculeSheet, SystemSheet, SearchOverlay, SettingsSheet
```
