# Prompt pour Claude Code — Implémentation de Moleculor

> Copiez-collez ce prompt à Claude Code, à la racine de votre projet, avec le dossier `design_handoff_moleculor/` accessible.

---

Tu vas implémenter **Moleculor**, une application mobile de composition moléculaire des aliments destinée aux nutritionnistes. Tout le matériel de design est dans le dossier `design_handoff_moleculor/`.

## Avant de coder

1. **Lis `design_handoff_moleculor/README.md` en entier.** Il décrit les 4 écrans, les overlays, les interactions, l'état, et tous les design tokens (couleurs, typo, formes) au pixel près.
2. **Ouvre `design_handoff_moleculor/design_reference/Moleculor.dc.html`** comme spécification visuelle/comportementale. C'est un prototype HTML — **ne copie pas son moteur de templating ni `support.js` / `ios-frame.jsx`** (ce sont des artefacts du prototype). Sers-t'en uniquement pour les mesures et le comportement exacts.
3. **Regarde les captures dans `design_handoff_moleculor/screenshots/`** : ce sont les références hi-fi à reproduire au pixel (le bezel iPhone autour est à ignorer). La table de correspondance écran/fichier est dans le README.
4. **Étudie `design_reference/foodData.js`** : c'est le modèle de données métier, **réutilisable presque tel quel**. Porte-le dans un module typé.

## Choix de l'environnement

- Si une codebase mobile existe déjà, **recrée les écrans avec ses composants, sa navigation et ses conventions** (design system, lib d'icônes, routing, gestion d'état).
- Sinon, initialise un projet **React Native + Expo + TypeScript** (recommandé pour cette app mobile hi-fi). Annonce ton choix, puis scaffold.

## Travail attendu

1. **Données** : convertis `foodData.js` en TS typé (`Food`, `Molecule`, `Family`, `TreeNode`, `System`, `Micro`…). Conserve les fonctions `buildTree`, `parseAb`, `statusFor`, et les tables `FA_DB`/`AA_DB`/`CAT_INFO`/`MICRO_INFO`/`FAMILIES`. Garde le schéma intact pour pouvoir rebrancher une vraie base (Ciqual/USDA) plus tard.
2. **Design system** : crée les tokens (couleurs, typographie Newsreader/IBM Plex Sans/IBM Plex Mono, rayons, ombres, espacements) depuis la section *Design Tokens* du README. Centralise-les.
3. **Écrans** (hi-fi, au pixel) :
   - **Composition** : anneau de score, tuiles kcal/molécules, donut macros + légende, barres micronutriments (% AJR), liste molécules majeures.
   - **Molécules** : arbre dépliable (chevron = toggle, ligne = ouvre fiche), indentation, halo de statut sur les nœuds à surveiller.
   - **Corps** : silhouette avec pastilles d'organes **cliquables**, carte des interactions **cliquable** (blocs d'intensité), bénéfices et points de vigilance **cliquables**, timeline du parcours digestif.
   - **Comparer** : sélection d'un 2ᵉ aliment, anneaux côte à côte, barres comparatives A/B.
4. **Overlays** (bottom sheets natifs) : **fiche détail** (molécule/nœud/bénéfice/risque) et **fiche système** (mécanisme, intensité, molécules impliquées cliquables → fiche molécule). Plus l'**overlay de recherche** plein écran avec filtrage en direct.
5. **Portion** : stepper ±10 g (10–500). Recalcule en direct kcal, macros, micros, % AJR, quantités de l'arbre, fiches, comparaison, et **réévalue les statuts dynamiques** (sucres, AG saturés, densité calorique) — voir la table dans le README.
6. **Navigation & chaînage** : système → molécule impliquée → fiche molécule, sans cul-de-sac. Changement d'onglet ferme les overlays.
7. **Animations** : transitions natives discrètes uniquement (sheet slide-up ~320ms, voile fade ~220ms). Rien d'agressif.

## Contraintes

- **Hi-fi** : respecte exactement couleurs (`oklch` et hex du README), typo et formes. Pas de palette inventée.
- **Accessibilité** : hit targets ≥ 44pt, contrastes suffisants, labels lisibles par lecteur d'écran.
- **Icônes** : remplace les SVG inline du prototype par le set d'icônes de la codebase.
- **Pas de réseau** : données locales pour ce premier jet. Isole l'accès aux données derrière une couche (repository/hook) pour brancher une API plus tard.
- **Avertissement clinique** : les valeurs nutritionnelles sont des ordres de grandeur de démo — prévois un point d'intégration clair vers une base validée (Ciqual/ANSES, USDA FoodData Central).

## Definition of done

- Les 4 onglets, les 3 overlays et le stepper de portion fonctionnent et correspondent au prototype.
- Tous les éléments cliquables de l'écran Corps ouvrent la bonne fiche.
- Les statuts et valeurs se recalculent correctement quand la portion change.
- Le code compile sans erreur ni warning, et suit les conventions du projet.
- Un court README dans le repo explique comment lancer l'app et où brancher une vraie base nutritionnelle.

Commence par me proposer le plan (stack, structure de dossiers, étapes) avant d'implémenter.
