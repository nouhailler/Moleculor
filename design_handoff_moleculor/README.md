# Handoff : Moleculor — application de composition moléculaire des aliments

## Overview

**Moleculor** est une application **mobile** destinée aux **professionnels de santé / nutritionnistes**. Elle permet de saisir un aliment et d'en explorer la composition jusqu'au niveau moléculaire : macronutriments, micronutriments, acides gras, acides aminés et composés bioactifs — puis de comprendre leurs **interactions bénéfiques ou néfastes avec le corps humain**.

L'utilisateur peut :
- rechercher un aliment dans une base ;
- consulter un **tableau de bord** (indice santé, calories, donut macros, micronutriments avec % AJR, molécules majeures) ;
- explorer une **arborescence** dépliable *aliment → familles → sous-catégories → molécules*, chaque nœud ouvrant une fiche explicative ;
- voir les **interactions avec le corps** (figure anatomique, carte des systèmes affectés, bénéfices, points de vigilance, parcours digestif) — tout est cliquable et mène à des fiches détaillées ;
- **comparer** deux aliments côte à côte ;
- ajuster la **portion analysée** (10–500 g) : toutes les valeurs et les alertes se recalculent en direct.

## About the Design Files

Les fichiers du dossier `design_reference/` sont des **références de design réalisées en HTML/JS** — un prototype fonctionnel montrant l'apparence et le comportement attendus. **Ce n'est pas du code de production à copier tel quel.**

La tâche consiste à **recréer ce design dans l'environnement cible du projet** en suivant ses patterns établis :
- Si une codebase existe déjà (React Native, Flutter, SwiftUI, Kotlin/Compose, React web responsive…), recréez les écrans avec ses composants, sa navigation et ses conventions.
- Si aucun environnement n'existe encore, le choix recommandé pour cette app mobile est **React Native (Expo)** ou **Flutter** ; à défaut une PWA React. Justifiez le choix puis implémentez.

Le prototype est écrit comme un « Design Component » (un format HTML interne avec un moteur de templating maison + React). **N'importez pas ce moteur.** Servez-vous-en uniquement comme spécification visuelle et comportementale. En revanche, le fichier **`design_reference/foodData.js` est directement réutilisable** : c'est le modèle de données métier (aliments, molécules, familles, calculs), portable en JS/TS quasi tel quel.

## Fidelity

**Haute fidélité (hifi).** Les couleurs, la typographie, les espacements, les rayons et les interactions sont définitifs. Recréez l'UI au pixel près avec les bibliothèques de la codebase. Les valeurs exactes sont dans la section **Design Tokens**.

---

## Captures de référence (hi-fi)

Les captures dans `screenshots/` montrent l'apparence cible exacte. **À respecter au pixel** (couleurs, typo, espacements). Le bezel iPhone autour est l'habillage du prototype — ignorez-le, seul l'écran compte.

| Fichier | Écran / état |
|---|---|
| `01-composition.png` | Composition — indice santé, tuiles kcal/molécules |
| `02-composition-micros-molecules.png` | Composition — micronutriments (% AJR) + molécules majeures |
| `03-arborescence-familles.png` | Molécules — arbre, familles de premier niveau |
| `04-arborescence-acides-amines.png` | Molécules — branche Protéines dépliée (acides aminés) |
| `05-corps-silhouette.png` | Corps — silhouette + pastilles d'organes + légende |
| `06-corps-interactions.png` | Corps — carte des interactions (blocs d'intensité, cliquable) |
| `07-corps-benefices.png` | Corps — liste bénéfices/vigilance cliquables |
| `08-fiche-molecule.png` | Overlay fiche détail (molécule) |
| `09-fiche-systeme.png` | Overlay fiche système (mécanisme + molécules impliquées) |
| `10-comparer.png` | Comparer — sélection + anneaux A/B |
| `11-recherche.png` | Overlay recherche — filtrage en direct |

> Note : les valeurs affichées correspondent à une portion de 100 g de chocolat noir 85 % ; elles se recalculent avec le stepper de portion.

## Architecture du prototype (pour comprendre la source)

- **`Moleculor.dc.html`** — l'app : template (markup inline-styled) + une classe de logique `Component` (état React, handlers, calculs de rendu dans `renderVals()`).
- **`foodData.js`** — la base de données : expose `window.FOOD_DB = { families, foods, order }`. Contient les barèmes, les molécules, et les fonctions `buildTree()` (génération de l'arborescence), `parseAb()`, les tables `FA_DB` (acides gras), `AA_DB` (acides aminés), `CAT_INFO`, `MICRO_INFO`.
- **`ios-frame.jsx`** — simple bezel iPhone de présentation (status bar, home indicator). **À ignorer** : c'est l'habillage du prototype, pas un écran de l'app. Le viewport réel de l'app est ~390×844 pt.
- **`support.js`** — runtime du moteur de prototypage. **À ignorer entièrement.**

### Modèle de données (`foodData.js`) — à réutiliser

Chaque aliment (`FOOD_DB.foods[id]`) a la forme :

```js
{
  id, name, cat, score /*0-100*/, kcal /*/100g*/, tagline, portion: '100 g',
  macros: { lip, gluc, fib, prot, autres, eau },   // grammes /100 g
  sat, mono, poly, sucres, amidon,                  // grammes /100 g
  micros: [ { name, val, unit /*'mg'|'µg'*/, pct /*% AJR /100g*/ } ],
  molecules: [ {
      id, name, formula /*ex 'C₇H₈N₄O₂'*/, fam /*clé famille*/, family /*libellé*/,
      valence /*'b'|'r'|'mixed'|'n'*/, abundance /*ex '≈ 800 mg'*/,
      qty: { n, unit, approx } | { qual },          // quantité parsée, scalable
      role /*résumé court*/, detail /*texte long*/
  } ],
  systems: [ { name, valence, intensity /*1-3*/, note } ],
  tree:      [ nœuds récursifs, voir buildTree() ],
  timeline:  [ { phase, time, note, absorb:[noms molécules] } ],
  benefits:  [ { title, text, fam } ],  // dérivé des molécules valence 'b'
  risks:     [ { title, text, fam } ]   // dérivé des molécules valence 'r'
}
```

**Familles moléculaires** (`FOOD_DB.families`), chacune `{ label, color }` (couleurs en `oklch`) :
`lipides`, `glucides`, `fibres`, `proteines`, `micro`, `bioactifs`.

**Valence** = nature de l'effet : `b` bénéfique, `r` à surveiller, `mixed` effet mixte, `n` neutre.

> Portage : recopiez les structures `SPECS`, `FA_DB`, `AA_DB`, `CAT_INFO`, `MICRO_INFO`, `FAMILIES` et les fonctions `buildTree`/`parseAb`/`makeFood`/`cmp` dans un module TS. Aucune dépendance externe.

---

## Screens / Views

L'app a **4 onglets** (tab bar bas) + **2 overlays** (fiche détail, recherche) + **1 feuille** (fiche système). Viewport mobile, fond global `#f4f2ea`.

### Chrome commun

- **Header** (haut, ~54px de safe-area) : libellé `MOLECULOR` en mono (10px, letter-spacing 3px, `#a39a8b`) + bouton recherche rond (38px, fond blanc, bordure `#e7e1d4`). En dessous : nom de l'aliment en serif 31px, puis une pastille catégorie (mono, fond `#ece7dc`) et le contrôle **Portion analysée** (stepper ± dans une pilule blanche, valeur mono `100 g`).
- **Tab bar** (bas, padding 11px 14px 26px) : fond `rgba(250,249,244,0.92)` + `backdrop-filter: blur(14px)`, bordure haute `#e7e1d4`. 4 items icône+label (label 9.5px). Actif = `#211d17`, inactif = `#a39a8b`.
  - Composition (icône cible) · Molécules (icône arbre) · Corps (icône silhouette) · Comparer (icône barres)

### 1. Composition (onglet par défaut)

**Purpose** : vue d'ensemble nutritionnelle de l'aliment.

**Layout** : colonne scrollable, padding 6px 16px 26px, cartes empilées avec gap.
- **Carte indice santé** (blanc, radius 24px, bordure `#ece7dc`, ombre `0 6px 20px rgba(33,29,23,0.04)`, padding 20px) : à gauche un **anneau** (conic-gradient, Ø 92px, épaisseur ~11%) affichant le score `/100` ; à droite libellé (« Profil très favorable / favorable / correct / à consommer avec modération ») + tagline.
- **Deux tuiles** (kcal, nb molécules) : flex gap 10px, chaque tuile blanc radius 18px, chiffre serif 26px.
- **Macronutriments** : carte avec **donut** (conic-gradient, Ø 104px) + légende (pastille couleur famille, libellé, grammes mono, % à droite).
- **Micronutriments clés** : carte, liste de barres de progression (hauteur 5px, fond `#f0ebe0`, remplissage couleur `micro`) avec `nom`, `valeur unité`, `% AJR`.
- **Molécules majeures** : titre + lien « Arbre complet → » (vert `#2f7d5b`) ; 6 lignes-cartes cliquables (barre couleur famille 6×38px, nom + formule mono + `famille · abondance`, badge valence à droite). Tap → **fiche détail**.

### 2. Molécules (arborescence)

**Purpose** : décomposer l'aliment des familles jusqu'aux molécules.

**Layout** : texte d'intro puis une carte blanche radius 22px contenant des **lignes d'arbre** à indentation croissante (padding-left = `14 + profondeur*18` px).

Chaque ligne :
- **chevron** (8×12px, opacité 0 si feuille, rotation 90° si déplié) — zone de tap dédiée (30×44px) qui **déplie/replie** ;
- **pastille** carrée 9px couleur de la famille — avec **halo** coloré (`box-shadow 0 0 0 3px`) si le nœud est « à surveiller » ou « mixte » ;
- **label** (15px niveau 0, 13.5px en dessous) ;
- **valeur** mono à droite (grammes / mg, recalculée selon la portion).

Le **reste de la ligne** (hors chevron) ouvre la **fiche détail** du nœud. Hiérarchie générée par `buildTree()` :
- Lipides → AG saturés / Mono-insaturés / Poly-insaturés → acides gras nommés (palmitique, stéarique, oléique, linoléique, α-linolénique)
- Glucides → Sucres / Amidon
- Fibres alimentaires → (fibres identifiées)
- Protéines → acides aminés essentiels (leucine, lysine, valine, phénylalanine, thréonine, tryptophane)
- Micronutriments → chaque minéral/vitamine
- Composés bioactifs → polyphénols, alcaloïdes, caroténoïdes…

### 3. Corps (interactions) — entièrement interactif

**Purpose** : visualiser l'effet de l'aliment sur l'organisme.

**Layout** :
- **Carte figure** : silhouette stylisée (tête = cercle 40px ; tronc = rectangle 74×154px radius 38/30 ; dégradés beige `#f6f3ec→#e9e3d6`, bordure `#e3ddcf`). Des **pastilles d'organes** (15px, couleur de valence, halo 4px) sont positionnées sur le corps (tête = nerveux/cognitif, poitrine = cardiovasculaire, ventre = digestif/métabolisme, jambes = muscles/squelette…). Les pastilles d'un même niveau vertical sont décalées horizontalement pour ne pas se superposer. **Chaque pastille est cliquable → fiche système.** À droite : légende (bénéfique vert / mixte ambre / à surveiller terracotta).
- **Carte des interactions** : titre + « Touchez un système ». Liste de lignes **cliquables** (curseur pointer, chevron à droite) : nom du système + **3 blocs d'intensité** (20×6px, remplis selon `intensity` 1-3, couleur de valence) + note courte. Tap → **fiche système**.
- **Bénéfices** : titre vert. Lignes **cliquables** (puce verte 7px + titre + texte + chevron). Tap → fiche détail de la molécule responsable.
- **Points de vigilance** : titre terracotta. Mêmes lignes (puce terracotta). Inclut les **risques dynamiques** déclenchés par la portion (voir plus bas) + les molécules à surveiller. Tap → fiche détail.
- **Parcours digestif** : timeline verticale (puce noire 11px + trait `#e7e1d4`). Chaque phase : nom serif 16px + durée mono + note ; chips vertes des molécules absorbées à cette étape.

### 4. Comparer

**Purpose** : comparer l'aliment courant (A) à un autre (B).

**Layout** :
- **Chips de sélection** horizontales scrollables (pilules ; sélectionnée = fond `#211d17`, texte blanc).
- **Carte deux colonnes** : anneau score (Ø 62px) + nom serif pour A (accent doré `#b98a52`) et B (accent bleu `#6b8e9e`), séparées par un filet vertical.
- **Lignes de comparaison** (Indice santé, Calories, Protéines, Lipides, Glucides, Fibres) : libellé mono + 2 barres (A dorée `#b98a52`, B bleue `#6b8e9e`) normalisées sur le max, valeurs à gauche. Toutes recalculées selon la portion.

### Overlay — Fiche détail (molécule / nœud / bénéfice / risque)

Bottom sheet : voile `rgba(33,29,23,0.32)`, feuille `#f4f2ea` radius 28px haut, max-height 86%, ombre `0 -10px 40px rgba(33,29,23,0.18)`, poignée grise 38×5px.
Contenu : barre de couleur famille (46×6px) · **nom** serif 27px + bouton fermer rond · **formule** mono 16px (masquée si non pertinente, ex. familles) · chips (famille / **badge valence dynamique** / abondance) · « **Rôle dans l'organisme** » + texte 14.5px · encadré blanc « **Présent dans** » = `nom · abondance pour N g [· % AJR]`.

### Overlay — Fiche système

Même structure de bottom sheet. Contenu : barre couleur valence · **nom du système** serif 27px + fermer · badges (**valence** + « **Intensité** modérée/notable/forte » avec 3 blocs) · « **Mécanisme d'action** » + note · « **Molécules impliquées** » = cartes cliquables (barre couleur, nom, chevron) **menant à la fiche molécule** · encadré « Effet pour » = `nom · portion de N g`.

### Overlay — Recherche

Plein écran `#f4f2ea`. Barre de recherche (input + icône loupe) + bouton « Fermer » vert. Compteur « N résultats » / « Tous les aliments ». Liste de cartes (vignette carrée 38px à initiale sur fond couleur famille, nom, `catégorie · kcal`, score coloré). Filtrage en direct sur nom + catégorie. Tap → charge l'aliment, ferme, revient à l'onglet Composition.

---

## Interactions & Behavior

- **Navigation onglets** : change `tab`, réinitialise les overlays (`detail`, `sysOpen`).
- **Arbre** : chevron = toggle expand (état `expanded` par id de nœud) ; reste de la ligne = ouvre fiche.
- **Chaînage des fiches** : système → molécule impliquée → fiche molécule (pas de cul-de-sac). Ouvrir une molécule ferme la fiche système.
- **Bénéfices/vigilance** : ouvrent la fiche de la molécule responsable (résolue par nom) ; les risques dynamiques ouvrent une fiche synthétique.
- **Stepper portion** : ±10 g, bornes 10–500 g. Recalcule **partout** kcal, macros (grammes), micros (valeur + % AJR), quantités de l'arbre, abondances des fiches, lignes de comparaison, et **réévalue les statuts dynamiques**.
- **Recherche** : filtre insensible à la casse sur `name` + `cat`.
- **Transitions** : les animations d'entrée CSS ont été **retirées volontairement** dans le prototype (le runtime les figeait). Dans l'app cible, ajoutez des transitions natives discrètes : bottom sheet slide-up ~320ms `cubic-bezier(.22,1,.36,1)`, voile fade ~220ms, changement d'onglet fade léger. Aucune animation agressive.
- **États** : pas de chargement réseau (données locales). Prévoir un écran vide de recherche (« aucun résultat ») — actuellement le compteur passe à « 0 résultat ».

## State Management

État global de l'app (équivalent d'un store ou de `useState` groupés) :

| Clé | Type | Rôle |
|---|---|---|
| `tab` | `'compo'\|'tree'\|'body'\|'compare'` | onglet actif |
| `foodId` | id aliment | aliment courant (défaut `'chocolat-noir'`) |
| `compareB` | id aliment | aliment B en comparaison (défaut `'puree-amande'`) |
| `searchOpen` | bool | overlay recherche |
| `query` | string | texte de recherche |
| `detail` | objet molécule/nœud/synthétique \| null | fiche détail ouverte |
| `sysOpen` | objet système \| null | fiche système ouverte |
| `expanded` | `{ [nodeId]: bool }` | nœuds dépliés de l'arbre |
| `portion` | number (g) | portion analysée (défaut 100) |

**Statuts dynamiques** (fonction `statusFor(info, factor)` où `factor = portion/100`) :
- *Sucres* : g = base×factor → `< 7` neutre « Quantité modérée » · `≥ 7` mixte « À modérer » · `≥ 18` risque « À surveiller ».
- *AG saturés* : `< 2.5` neutre « Sans excès » · `≥ 2.5` mixte « À modérer » · `≥ 6` risque « À surveiller ».
- *Micronutriment* : pct = basePct×factor → `< 50` « Source d'appoint » · `≥ 50` « Bonne source » · `≥ 100` « Apport excellent » (toujours bénéfique).

**Risques dynamiques** ajoutés aux points de vigilance selon la portion :
- Sucres ≥ 18 g · AG saturés ≥ 6 g · Densité calorique ≥ 350 kcal.

## Design Tokens

### Couleurs
| Rôle | Valeur |
|---|---|
| Fond app | `#f4f2ea` |
| Fond dégradé extérieur (bezel) | `radial-gradient(130% 120% at 50% -10%, #f1eee5, #e6e1d6 58%, #dad4c6)` |
| Surface carte | `#ffffff` |
| Bordure carte | `#ece7dc` |
| Bordure contrôle | `#e7e1d4` |
| Encre principale | `#211d17` |
| Encre secondaire | `#6b6357` |
| Encre tertiaire / mono labels | `#a39a8b` |
| Encre douce (notes) | `#8a8275` |
| Texte sur fiche | `#3a352d` |
| Pastille catégorie (fond) | `#ece7dc` |
| Piste de barre | `#f0ebe0` |
| Voile modal | `rgba(33,29,23,0.32)` |
| **Bénéfique** | `#2f7d5b` (texte vert), pastilles `oklch(0.74 ...)`/halo `rgba(47,125,91,0.18)` |
| **À surveiller** | `#c0633f` · halo `rgba(192,99,63,0.18)` |
| **Effet mixte** | `oklch(0.70 0.11 72)` (ambre) · halo `rgba(196,150,70,0.18)` |
| **Neutre** | `#8a8275` |
| Accent comparaison A | `#b98a52` (doré) |
| Accent comparaison B | `#6b8e9e` (bleu) |

### Couleurs de familles moléculaires (oklch)
| Famille | Couleur |
|---|---|
| Lipides | `oklch(0.74 0.10 80)` |
| Glucides | `oklch(0.72 0.12 62)` |
| Fibres | `oklch(0.64 0.08 132)` |
| Protéines | `oklch(0.58 0.11 32)` |
| Micronutriments | `oklch(0.60 0.07 248)` |
| Composés bioactifs | `oklch(0.56 0.11 330)` |

### Score → couleur
`≥ 75` vert `#2f7d5b` · `66–74` ambre `oklch(0.70 0.12 70)` · `< 66` terracotta `#c0633f`.

### Typographie
- **Serif** : **Newsreader** (Google Fonts), poids 300–600. Titres, scores, noms d'aliments/molécules, phases. Tailles : 31px (titre aliment), 27px (titre fiche), 26px (chiffres tuiles), 16–19px (sous-titres).
- **Sans** : **IBM Plex Sans**, 400/500/600. Corps de texte. Tailles : 11.5–15px.
- **Mono** : **IBM Plex Mono**, 400/500. Étiquettes (uppercase, letter-spacing 1–3px), formules, valeurs chiffrées, %. Tailles : 9.5–16px.

### Espacement / formes
- Rayons : cartes principales **24px**, cartes secondaires **18px**, lignes d'arbre/cartes molécules **14–18px**, pilules/chips **100px**, sheet **28px** (haut).
- Paddings cartes : 16–20px. Gaps verticaux entre sections : ~26px. Padding scroll : 6px 16px 26px.
- Ombres : carte mise en avant `0 6px 20px rgba(33,29,23,0.04)` ; sheet `0 -10px 40px rgba(33,29,23,0.18)`.
- Hit targets : steppers et zones de tap ≥ 30–44px (respecter 44pt mini en natif).

## Assets

- **Aucune image bitmap.** Toutes les icônes sont des **SVG inline** simples (loupe, +/−, chevron, croix, icônes de tab bar, silhouette corps). À remplacer par le set d'icônes de la codebase (Lucide, SF Symbols, Material…).
- **Polices** : Newsreader, IBM Plex Sans, IBM Plex Mono (Google Fonts). En natif, embarquer les fichiers ou utiliser les équivalents système si imposé.
- **Anneaux et donut** : rendus via `conic-gradient`. En natif, utiliser un composant arc/donut (SVG `stroke-dasharray` ou lib de charts).

## Files

Dans `design_handoff_moleculor/design_reference/` :
- **`Moleculor.dc.html`** — prototype complet (UI + logique). Référence visuelle et comportementale principale.
- **`foodData.js`** — base de données métier **réutilisable** (aliments, molécules, familles, calculs d'arbre).
- **`ios-frame.jsx`** — bezel de présentation. **À ignorer.**
- **`support.js`** — runtime du moteur de prototypage. **À ignorer.**

## Données incluses

20 aliments : chocolat noir 85 % (le plus détaillé), purée d'amande, purée de sésame, lait de soja, betterave, tomate, radis, concombre, courgette, poivron rouge, aubergine, fenouil, melon, pastèque, maïs, petit pois, pomme de terre, haricot vert, salade (laitue), graines de tournesol, pain au levain d'épeautre.

> ⚠️ Les valeurs nutritionnelles sont des ordres de grandeur issus de sources publiques, pour la démonstration. Avant un usage clinique, **rebrancher sur une base validée** (Ciqual/ANSES, USDA FoodData Central, ou une API nutritionnelle) en conservant le même schéma de données.
