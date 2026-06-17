#!/usr/bin/env bash
#
# import-aliments.sh — Génère en masse des fiches Moleculor via OpenRouter
# et produit un fichier JSON directement importable dans l'application
# (Paramètres → Importer des aliments).
#
# Le script reproduit EXACTEMENT le prompt système et le format de spec
# (app/src/data/enrich.ts + store.ts) :
#   - mêmes contraintes de schéma demandées au modèle ;
#   - même transformation « champs nommés » → spec positionnel attendu par makeFood ;
#   - même enveloppe d'export ({ app, type, version, foods }).
#
# Reprise automatique : chaque aliment réussi est mis en cache dans .cache/.
# Relancer le script ne régénère que ce qui manque (donc 0 token gaspillé).
#
# Dépendances : bash, curl, jq, iconv (coreutils/glibc — présents par défaut).
#
# Usage :
#   ./scripts/import-aliments.sh -k "sk-or-..." -m "anthropic/claude-sonnet-4.5"
#   ./scripts/import-aliments.sh --key "sk-or-..." --model "openai/gpt-4o-mini" liste.txt
#
#   Les variables d'environnement servent de repli si une option est absente :
#   OPENROUTER_API_KEY=sk-or-... MODEL=... ./scripts/import-aliments.sh
#
# Options :
#   -k, --key    KEY     clé API OpenRouter (repli : $OPENROUTER_API_KEY)
#   -m, --model  MODEL   slug du modèle      (repli : $MODEL, défaut sonnet-4.5)
#   -o, --out    FILE    fichier de sortie   (défaut : moleculor-import.json)
#   -h, --help           affiche cette aide
#   [fichier]            liste personnalisée (1 nom/ligne) ; sinon liste intégrée
#
# Résultat : moleculor-import.json  (à importer dans l'app)

set -euo pipefail

# ── Configuration (valeurs par défaut / repli sur l'environnement) ───────────
API_KEY="${OPENROUTER_API_KEY:-}"
MODEL="${MODEL:-anthropic/claude-sonnet-4.5}"
ENDPOINT="https://openrouter.ai/api/v1/chat/completions"
OUT="${OUT:-moleculor-import.json}"
CACHE_DIR=".cache/moleculor-specs"
SLEEP_BETWEEN="${SLEEP_BETWEEN:-0.5}"   # pause entre 2 appels (politesse / quotas)
MAX_RETRIES="${MAX_RETRIES:-4}"

usage() { sed -n '18,30p' "$0" | sed 's/^# \{0,1\}//'; }

# ── Parsing des options ──────────────────────────────────────────────────────
ITEMS_FILE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -k|--key)   API_KEY="${2:-}"; shift 2 ;;
    -m|--model) MODEL="${2:-}";   shift 2 ;;
    -o|--out)   OUT="${2:-}";     shift 2 ;;
    -h|--help)  usage; exit 0 ;;
    --) shift; break ;;
    -*) echo "✗ Option inconnue : $1" >&2; usage >&2; exit 1 ;;
    *)  ITEMS_FILE="$1"; shift ;;
  esac
done
[[ $# -gt 0 && -z "$ITEMS_FILE" ]] && ITEMS_FILE="$1"

if [[ -z "$API_KEY" ]]; then
  echo "✗ Clé OpenRouter absente." >&2
  echo "  Passe-la via  -k \"sk-or-...\"  ou  export OPENROUTER_API_KEY=\"sk-or-...\"" >&2
  exit 1
fi
if [[ -z "$MODEL" ]]; then
  echo "✗ Modèle absent. Passe-le via  -m \"anthropic/claude-sonnet-4.5\"" >&2
  exit 1
fi
for bin in curl jq iconv; do
  command -v "$bin" >/dev/null 2>&1 || { echo "✗ Outil manquant : $bin" >&2; exit 1; }
done

mkdir -p "$CACHE_DIR"

# ── Liste des aliments ───────────────────────────────────────────────────────
# Soit un fichier passé en argument (1 nom par ligne), soit la liste intégrée.
read_items() {
  if [[ "${1:-}" != "" && -f "$1" ]]; then
    grep -vE '^\s*$' "$1"
    return
  fi
  cat <<'ITEMS'
Artichaut
Asperge
Aubergine
Bette
Betterave
Brocoli
Carotte
Céleri branche
Céleri rave
Chou blanc
Chou rouge
Chou frisé
Chou kale
Chou chinois
Chou-rave
Chou de Bruxelles
Chou Milan
Chou pointu
Chou cabus
Chou palmier
Concombre
Cornichon
Courge butternut
Courge musquée
Courge spaghetti
Courge patidou
Courgette
Cresson
Daikon
Endive
Épinard
Fenouil
Fève
Flageolet
Haricot vert
Haricot beurre
Haricot mungo
Haricot azuki
Laitue
Laitue romaine
Laitue batavia
Laitue feuille de chêne
Laitue iceberg
Mâche
Maïs doux
Melon
Mizuna
Navet
Oignon jaune
Oignon rouge
Oignon blanc
Oignon cébette
Pak choï
Panais
Patate douce
Pâtisson
Petit pois
Piment
Poireau
Poivron
Pomme de terre
Pourpier
Radis
Radis noir
Radis daikon
Raifort
Roquette
Rutabaga
Salsifis
Scorsonère
Topinambour
Tomate
Tomatillo
Ail
Échalote
Gingembre
Gombo
Potiron
Potimarron
Pois chiche vert
Pois mange-tout
Pois cassé
Rhubarbe
Roquette sauvage
Tétragone
Tomate cerise
Tomate prune
Tomate noire
Tomate jaune
Tomate ananas
Tomate raisin
Tomate italienne
Tomate verte
Topinambour rouge
Courge longue de Nice
Courge delicata
Courge kabocha
Courge turban
Courge Hubbard
Courge acorn
Courge buttercup
Courgette trompette
Oseille
Persil tubéreux
Piment doux
Piment fort
Quinoa feuille
Radis pastèque
Rave
Souchet comestible
Crosne du Japon
Dolique asperge
Épinard de Malabar
Amarante feuille
Arroche
Cardon
Chayote
Chicorée frisée
Chicorée scarole
Chou pak choi
Chou tatsoi
Chou mizuna
Chou komatsuna
Courge galeuse
Courge sucrine
Chou vert
Chou cavalier
Chou sibérien
Chou cabus précoce
Chou cabus tardif
Cerfeuil tubéreux
Claytone de Cuba
Margose
Moutarde brune
Okra
Oignon rocambole
Ortie potagère
Oseille sanguine
Pak choi nain
Laitue asperge
Haricot kilomètre
Courge miniature
Courge géante
Courge verte d'Italie
Zucchini
Wasabi
Catalonia
Bardane
Melon Charentais
Melon Cantaloup
Melon Galia
Melon Honeydew
Haricot grimpant
Fraise
Citrouille
Asperge blanche
Asperge violette
Betterave jaune
Betterave Chioggia
Aubergine blanche
Aubergine longue
Carotte Nantaise
Carotte Chantenay
Carotte violette
Concombre mini
Concombre de serre
Fraise remontante
Navet boule d'or
Navet de Milan
Poivron rouge
Poivron jaune
Poivron corne
Pomme de terre primeur
Pomme de terre à chair ferme
Pomme de terre vitelotte
Basilic
Persil plat
Ciboulette
Aneth
Coriandre
Estragon
Mélisse
Menthe
Origan
Romarin
Sauge
Sarriette
Thym
Cerfeuil
Bourrache
Livèche
Marjolaine
Laurier sauce
Lentille verte
Soja
Lupin blanc
Câprier
Carvi
Curcuma
Pastèque
Basilic thaï
Basilic pourpre
Basilic citron
Blé tendre
Blé dur
Blé noir
Épeautre
Petit épeautre
cerise
pomme
poire
kaki
kiwi
raisin
mirabelle
prune
noix
groseille
abricot
pêche
sésame
banane
orange
cacahuete
pamplemousse
amande
cajou
Macadamia
noix du brésil
citron
graine de tournesol
mandarine
ananas
fruit de la passion
myrtille
verveine citron
groseille à maquereau
ITEMS
}

# ── Prompt système (copie fidèle de enrich.ts#systemPrompt) ──────────────────
SYSTEM_PROMPT=$(cat <<'PROMPT'
Tu es un expert en nutrition et en biochimie alimentaire. Tu produis la composition moléculaire d'un aliment au format JSON STRICT, sans aucun texte autour, sans balises Markdown.
Toutes les valeurs sont rapportées à 100 g d'aliment cru (sauf mention courante d'un état cuit).
Schéma exact attendu :
{
  "name": string,                     // nom court en français
  "cat": string,                      // catégorie courte (ex: "Légume racine", "Oléagineux")
  "score": number,                    // indice santé 0-100
  "kcal": number,                     // kcal / 100 g
  "tagline": string,                  // une phrase de synthèse
  "macros": { "lip": number, "gluc": number, "fib": number, "prot": number, "eau": number }, // grammes / 100 g
  "sat": number, "mono": number, "poly": number,   // grammes d'acides gras / 100 g (0 si non lipidique)
  "sucres": number, "amidon": number,              // grammes / 100 g
  "micros": [ { "name": string, "val": number, "unit": "mg"|"µg", "pct": number } ], // pct = % des AJR pour 100 g
  "molecules": [ { "name": string, "formula": string, "fam": "lipides"|"glucides"|"fibres"|"proteines"|"micro"|"bioactifs", "valence": "b"|"r"|"mixed"|"n", "abundance": string, "role": string, "detail": string } ],
  "systems": [ { "name": string, "valence": "b"|"r"|"mixed"|"n", "intensity": 1|2|3, "note": string } ]
}
Contraintes :
- valence : b = bénéfique, r = à surveiller, mixed = effet mixte, n = neutre.
- formula : formule chimique avec indices Unicode (ex: "C₇H₈N₄O₂", "C₆H₈O₆") ; "—" si non pertinent.
- abundance : quantité lisible avec unité (ex: "≈ 228 mg", "présent", "traces").
- 5 à 8 molecules représentatives (inclure les composés bioactifs marquants et au moins un point de vigilance si pertinent), 3 à 5 systems.
- macros cohérentes : lip+gluc+fib+prot+eau ≤ 100.
- Réponds UNIQUEMENT par l'objet JSON.
PROMPT
)

# ── slugify (équivalent de enrich.ts#slugify) ────────────────────────────────
slugify() {
  iconv -f UTF-8 -t ASCII//TRANSLIT 2>/dev/null <<<"$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//' \
    | cut -c1-48
}

# ── Transformation JSON nommé → spec positionnel (équivalent de toSpec) ───────
# $1 = id unique, stdin = JSON brut du modèle. Émet le spec compact sur stdout.
to_spec() {
  local id="$1"
  jq -c --arg id "$id" '
    def num(v): (v | if type=="string" then (gsub(",";".") | tonumber? // 0)
                     elif type=="number" then . else 0 end);
    def clamp(v;lo;hi): (if v<lo then lo elif v>hi then hi else v end);
    def s(v;d): (if (v|type)=="string" and (v|gsub("^\\s+|\\s+$";"")|length)>0 then (v|gsub("^\\s+|\\s+$";"")) else d end);
    def famv(v): (v as $x | if (["lipides","glucides","fibres","proteines","micro","bioactifs"]|index($x)) then $x else "bioactifs" end);
    def val(v):  (v as $x | if (["b","r","mixed","n"]|index($x)) then $x else "n" end);
    def unit(v): (v as $x | if (["mg","µg"]|index($x)) then $x else "mg" end);

    (.macros // {}) as $m
    | clamp(num($m.lip);0;100)  as $lip
    | clamp(num($m.gluc);0;100) as $gluc
    | clamp(num($m.fib);0;100)  as $fib
    | clamp(num($m.prot);0;100) as $prot
    | clamp(num($m.eau);0;100)  as $eau
    | {
        id: $id,
        name: s(.name; "Aliment"),
        cat: s(.cat; "Aliment"),
        score: clamp((num(.score) | round);0;100),
        kcal: ([0, (num(.kcal)|round)] | max),
        tagline: s(.tagline; "Aliment ajouté via enrichissement IA."),
        lip: $lip, gluc: $gluc, fib: $fib, prot: $prot, eau: $eau,
        sat:    clamp(num(.sat);0;(if $lip>0 then $lip else 100 end)),
        mono:   clamp(num(.mono);0;(if $lip>0 then $lip else 100 end)),
        poly:   clamp(num(.poly);0;(if $lip>0 then $lip else 100 end)),
        sucres: clamp(num(.sucres);0;(if $gluc>0 then $gluc else 100 end)),
        amidon: clamp(num(.amidon);0;(if $gluc>0 then $gluc else 100 end)),
        micros: [ (.micros // [])[]
                  | select(. and (s(.name;"")|length>0))
                  | [ s(.name;""), num(.val), unit(.unit), clamp(num(.pct);0;1000) ] ] | .[0:8],
        molecules: [ (.molecules // [])[]
                  | select(. and (s(.name;"")|length>0))
                  | [ s(.name;""), s(.formula;"—"), famv(.fam), val(.valence),
                      s(.abundance;"présent"), s(.role;""), s(.detail; s(.role;"")) ] ] | .[0:10],
        systems: [ (.systems // [])[]
                  | select(. and (s(.name;"")|length>0))
                  | [ s(.name;""), val(.valence), clamp((num(.intensity)|round);1;3), s(.note;"") ] ] | .[0:6],
        generated: true
      }
    | if (.molecules | length) == 0 then error("aucune molécule") else . end
  '
}

# ── Appel OpenRouter avec retries (gère 429 / 5xx) ───────────────────────────
call_openrouter() {
  local query="$1" attempt=1 http body
  local payload
  payload=$(jq -n --arg model "$MODEL" --arg sys "$SYSTEM_PROMPT" --arg q "$query" '
    { model: $model, temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: $sys },
        { role: "user",   content: ("Aliment : « " + $q + " ». Donne sa composition moléculaire au format JSON demandé.") }
      ] }')

  while (( attempt <= MAX_RETRIES )); do
    body=$(curl -sS -w $'\n%{http_code}' "$ENDPOINT" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -H "HTTP-Referer: https://moleculor.local" \
      -H "X-Title: Moleculor" \
      -d "$payload" 2>/dev/null) || { sleep $((attempt*2)); ((++attempt)); continue; }

    http="${body##*$'\n'}"
    body="${body%$'\n'*}"

    case "$http" in
      200) printf '%s' "$body"; return 0 ;;
      401) echo "  ✗ Clé refusée (401)." >&2; return 2 ;;
      402) echo "  ✗ Crédit insuffisant (402)." >&2; return 2 ;;
      404) echo "  ✗ Modèle « $MODEL » introuvable (404)." >&2; return 2 ;;
      429|5*) echo "  … HTTP $http, nouvel essai ($attempt/$MAX_RETRIES)…" >&2
              sleep $((attempt*3)); ((++attempt)) ;;
      *)   echo "  ✗ HTTP $http" >&2; return 1 ;;
    esac
  done
  echo "  ✗ Échec après $MAX_RETRIES tentatives." >&2
  return 1
}

# ── Boucle principale ────────────────────────────────────────────────────────
mapfile -t ITEMS < <(read_items "$ITEMS_FILE")
total=${#ITEMS[@]}
echo "→ $total aliments à traiter (modèle : $MODEL)"
echo "  Cache : $CACHE_DIR   Sortie : $OUT"
echo

done_n=0; skip_n=0; fail_n=0; i=0
declare -A SEEN_IDS=()

for name in "${ITEMS[@]}"; do
  ((++i))
  base="$(slugify "$name")"; [[ -z "$base" ]] && base="aliment"
  # id unique (contre le cache déjà présent ET la session courante)
  id="$base"; n=2
  while [[ -e "$CACHE_DIR/$id.json" && -z "${SEEN_IDS[$id]:-}" ]] || [[ -n "${SEEN_IDS[$id]:-}" && "${SEEN_IDS[$id]}" != "$name" ]]; do
    id="$base-$n"; ((++n))
  done
  SEEN_IDS[$id]="$name"

  if [[ -s "$CACHE_DIR/$id.json" ]]; then
    printf '[%3d/%3d] ✓ %-28s (cache)\n' "$i" "$total" "$name"
    ((++skip_n)); continue
  fi

  printf '[%3d/%3d] … %-28s' "$i" "$total" "$name"
  if ! raw=$(call_openrouter "$name"); then
    echo " ✗"; ((++fail_n)); sleep "$SLEEP_BETWEEN"; continue
  fi

  content=$(jq -r '.choices[0].message.content // empty' <<<"$raw" 2>/dev/null || true)
  if [[ -z "$content" ]]; then
    echo " ✗ (réponse vide)"; ((++fail_n)); sleep "$SLEEP_BETWEEN"; continue
  fi
  # extractJson : enlève d'éventuelles fences ```json … ```
  content=$(sed -E 's/^```[a-zA-Z]*[[:space:]]*//; s/```[[:space:]]*$//' <<<"$content")

  if spec=$(to_spec "$id" <<<"$content" 2>/dev/null) && [[ -n "$spec" ]]; then
    printf '%s' "$spec" > "$CACHE_DIR/$id.json"
    echo " ✓"; ((++done_n))
  else
    echo " ✗ (JSON non conforme)"; ((++fail_n))
  fi
  sleep "$SLEEP_BETWEEN"
done

# ── Assemblage du fichier d'import ───────────────────────────────────────────
echo
shopt -s nullglob
specs=("$CACHE_DIR"/*.json)
shopt -u nullglob

if [[ ${#specs[@]} -eq 0 ]]; then
  echo "✗ Aucune fiche générée — rien à assembler."
  echo "  Vérifie la clé (-k), le modèle (-m) et tes crédits OpenRouter."
  echo "  Échecs : $fail_n"
  exit 1
fi

echo "→ Assemblage de $OUT…"
jq -s '{
  app: "Moleculor",
  type: "foods-export",
  version: 1,
  exportedAt: (now | todateiso8601),
  count: length,
  foods: .
}' "${specs[@]}" > "$OUT"

count=$(jq '.count' "$OUT")
echo
echo "✓ Terminé : $count fiches dans $OUT"
echo "  Générées cette session : $done_n   En cache : $skip_n   Échecs : $fail_n"
echo
echo "  Import : ouvre l'app → Paramètres → Importer des aliments → $OUT"
