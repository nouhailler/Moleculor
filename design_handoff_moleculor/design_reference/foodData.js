/* Moleculor — base de composition moléculaire (valeurs ~ /100 g, sources nutritionnelles publiques) */
(function () {
  // ── Familles moléculaires : clé → libellé + couleur (oklch éditorial, chroma constante) ──
  var FAMILIES = {
    lipides:   { label: 'Lipides',            color: 'oklch(0.74 0.10 80)'  },
    glucides:  { label: 'Glucides',           color: 'oklch(0.72 0.12 62)'  },
    fibres:    { label: 'Fibres',             color: 'oklch(0.64 0.08 132)' },
    proteines: { label: 'Protéines',          color: 'oklch(0.58 0.11 32)'  },
    micro:     { label: 'Micronutriments',    color: 'oklch(0.60 0.07 248)' },
    bioactifs: { label: 'Composés bioactifs', color: 'oklch(0.56 0.11 330)' }
  };

  // molecule shorthand: [name, formula, famKey, valence(b|r|n), abundance, role, detail?]
  // micro shorthand:    [name, val, unit, pct]
  // system shorthand:   [name, valence(b|r|mixed|n), intensity(1..3), note]
  function parseAb(str) {
    if (str == null) return { qual: '' };
    var m = String(str).match(/(\d+(?:[.,]\d+)?)\s*(g|mg|µg|kcal)/);
    if (!m) return { qual: String(str) };
    return { n: parseFloat(m[1].replace(',', '.')), unit: m[2], approx: /≈|<|~/.test(str) };
  }
  function mol(a) {
    return { name: a[0], formula: a[1], fam: a[2], family: FAMILIES[a[2]].label,
             valence: a[3], abundance: a[4], qty: parseAb(a[4]), role: a[5], detail: a[6] || a[5] };
  }

  function genTimeline(f) {
    var ab = f.molecules.filter(function (m) { return m.valence === 'b'; }).slice(0, 3).map(function (m) { return m.name; });
    return [
      { phase: 'Bouche',              time: '0–1 min',     note: 'Mastication, libération des arômes ; l’amylase salivaire amorce l’hydrolyse de l’amidon.', absorb: [] },
      { phase: 'Estomac',             time: '30 min–3 h',  note: 'Acidification (pH ~2), dénaturation des protéines et émulsification initiale des lipides.', absorb: [] },
      { phase: 'Intestin grêle',      time: '3–6 h',       note: 'Absorption principale : acides gras via micelles, acides aminés, minéraux et composés bioactifs.', absorb: ab },
      { phase: 'Côlon',               time: '6–24 h',      note: 'Fermentation des fibres par le microbiote → acides gras à chaîne courte (butyrate). Polyphénols résiduels métabolisés.', absorb: [] },
      { phase: 'Foie & circulation',  time: '> 24 h',      note: 'Métabolisation hépatique et distribution systémique des nutriments absorbés.', absorb: [] }
    ];
  }

  var CAT_INFO = {
    lip:  { f: '—', v: 'n', r: 'Source d’énergie concentrée (9 kcal/g), constituants des membranes cellulaires et vecteurs des vitamines liposolubles A, D, E et K.' },
    sat:  { f: '—', v: 'mixed', r: 'Acides gras saturés. À limiter en excès (effet sur le cholestérol LDL), mais l’impact varie selon le type — l’acide stéarique du cacao reste par exemple neutre.' },
    mono: { f: '—', v: 'b', r: 'Acides gras mono-insaturés (oméga-9). Favorisent un profil lipidique sain et la sensibilité à l’insuline.' },
    poly: { f: '—', v: 'b', r: 'Acides gras poly-insaturés, dont les oméga-3 et oméga-6 essentiels. Constituants membranaires et précurseurs de molécules anti-inflammatoires.' },
    lipx: { f: '—', v: 'n', r: 'Acides gras spécifiques identifiés dans cet aliment.' },
    glu:  { f: '—', v: 'n', r: 'Principale source d’énergie de l’organisme (4 kcal/g). Regroupe sucres, amidon et fibres.' },
    suc:  { f: '—', v: 'r', r: 'Sucres simples (glucose, fructose, saccharose). Apport rapide d’énergie mais élèvent la glycémie — à modérer.' },
    ami:  { f: '(C₆H₁₀O₅)ₙ', v: 'n', r: 'Glucide complexe digéré progressivement en glucose. La fraction d’amidon résistant nourrit le microbiote.' },
    fib:  { f: '—', v: 'b', r: 'Fibres non digérées par l’intestin grêle : transit, satiété et fermentation par le microbiote en acides gras à chaîne courte (butyrate).' },
    pro:  { f: '—', v: 'b', r: 'Chaînes d’acides aminés assurant construction et réparation des tissus, enzymes, hormones et défenses immunitaires.' },
    mic:  { f: '—', v: 'b', r: 'Vitamines et minéraux nécessaires en petites quantités au bon fonctionnement métabolique.' },
    bio:  { f: '—', v: 'b', r: 'Molécules non nutritives aux effets physiologiques marqués (antioxydants, polyphénols, alcaloïdes…).' }
  };
  var MICRO_INFO = {
    'Magnésium': { f: 'Mg', v: 'b', r: 'Cofacteur de plus de 300 enzymes : fonction neuromusculaire, synthèse d’ATP et régulation du rythme cardiaque.' },
    'Fer': { f: 'Fe', v: 'b', r: 'Transport de l’oxygène (hémoglobine) et métabolisme énergétique. Sous forme non héminique, moins bien absorbé que le fer animal.' },
    'Cuivre': { f: 'Cu', v: 'b', r: 'Cofacteur d’enzymes antioxydantes et de l’hématopoïèse ; intervient dans le métabolisme du fer.' },
    'Manganèse': { f: 'Mn', v: 'b', r: 'Cofacteur d’enzymes antioxydantes et du métabolisme osseux et glucidique.' },
    'Potassium': { f: 'K', v: 'b', r: 'Équilibre hydro-sodé, contraction musculaire et régulation de la pression artérielle.' },
    'Phosphore': { f: 'P', v: 'b', r: 'Minéralisation osseuse et dentaire ; composant de l’ADN et de l’ATP.' },
    'Zinc': { f: 'Zn', v: 'b', r: 'Immunité, cicatrisation, synthèse protéique et fertilité.' },
    'Calcium': { f: 'Ca', v: 'b', r: 'Minéralisation osseuse et dentaire, contraction musculaire et signalisation cellulaire.' },
    'Sélénium': { f: 'Se', v: 'b', r: 'Cofacteur d’enzymes antioxydantes (glutathion peroxydase) et fonction thyroïdienne.' },
    'Silice': { f: 'Si', v: 'b', r: 'Soutient le tissu conjonctif, la peau et la minéralisation osseuse.' },
    'Vitamine E': { f: 'C₂₉H₅₀O₂', v: 'b', r: 'Antioxydant liposoluble protégeant les membranes cellulaires du stress oxydatif.' },
    'Vitamine C': { f: 'C₆H₈O₆', v: 'b', r: 'Antioxydant hydrosoluble, cofacteur de la synthèse du collagène ; favorise l’absorption du fer végétal.' },
    'Vitamine K': { f: 'C₃₁H₄₆O₂', v: 'b', r: 'Coagulation sanguine et fixation du calcium sur la matrice osseuse.' },
    'Vitamine B6': { f: 'C₈H₁₁NO₃', v: 'b', r: 'Métabolisme des acides aminés et synthèse des neurotransmetteurs.' },
    'Vitamine B12': { f: 'C₆₃H₈₈CoN₁₄O₁₄P', v: 'b', r: 'Formation des globules rouges et fonction neurologique (souvent enrichie dans les produits végétaux).' },
    'Folates': { f: 'C₁₉H₁₉N₇O₆', v: 'b', r: 'Synthèse de l’ADN et division cellulaire ; particulièrement importants pendant la grossesse.' },
    'Vitamine A': { f: 'C₄₀H₅₆', v: 'b', r: 'Vision, immunité et santé de la peau (apporté ici via le β-carotène, précurseur).' }
  };

  var FA_DB = {
    'Acide palmitique':    { f: 'C₁₆H₃₂O₂', cat: 'sat',  v: 'mixed', share: 0.55, r: 'Acide gras saturé le plus répandu. En excès, tend à élever le cholestérol LDL.' },
    'Acide stéarique':     { f: 'C₁₈H₃₆O₂', cat: 'sat',  v: 'n',     share: 0.45, r: 'Acide gras saturé à effet neutre sur le cholestérol ; partiellement converti en acide oléique par le foie.' },
    'Acide oléique':       { f: 'C₁₈H₃₄O₂', cat: 'mono', v: 'b',     share: 1.0,  r: 'Acide gras mono-insaturé (oméga-9) cardio-protecteur, améliore le profil lipidique.' },
    'Acide linoléique':    { f: 'C₁₈H₃₂O₂', cat: 'poly', v: 'b',     share: 0.8,  r: 'Acide gras essentiel oméga-6, constituant des membranes et précurseur de médiateurs.' },
    'Acide α-linolénique': { f: 'C₁₈H₃₀O₂', cat: 'poly', v: 'b',     share: 0.2,  r: 'Acide gras essentiel oméga-3 (ALA), précurseur des EPA/DHA, anti-inflammatoire.' }
  };
  var AA_LIST = ['Leucine', 'Lysine', 'Valine', 'Phénylalanine', 'Thréonine', 'Tryptophane'];
  var AA_DB = {
    'Leucine':       { f: 'C₆H₁₃NO₂',   share: 0.082, r: 'Acide aminé essentiel ramifié (BCAA) ; déclencheur clé de la synthèse protéique musculaire.' },
    'Lysine':        { f: 'C₆H₁₄N₂O₂',  share: 0.064, r: 'Acide aminé essentiel ; synthèse du collagène et absorption du calcium.' },
    'Valine':        { f: 'C₅H₁₁NO₂',   share: 0.055, r: 'Acide aminé essentiel ramifié (BCAA) ; énergie et réparation musculaire.' },
    'Phénylalanine': { f: 'C₉H₁₁NO₂',   share: 0.05,  r: 'Acide aminé essentiel ; précurseur de la tyrosine et des catécholamines (dopamine, noradrénaline).' },
    'Thréonine':     { f: 'C₄H₉NO₃',    share: 0.042, r: 'Acide aminé essentiel ; structure des protéines, fonction immunitaire et digestive.' },
    'Tryptophane':   { f: 'C₁₁H₁₂N₂O₂', share: 0.012, r: 'Acide aminé essentiel ; précurseur de la sérotonine et de la mélatonine.' }
  };

  function buildTree(f) {
    var byFam = {};
    f.molecules.forEach(function (x) { (byFam[x.fam] = byFam[x.fam] || []).push(x); });
    function qNum(n, unit, approx) { return { n: n, unit: unit || 'g', approx: !!approx }; }
    function catNode(id, label, fam, grams, children, dyn) {
      var ci = CAT_INFO[id] || { f: '—', v: 'n', r: '' };
      var qty = grams != null ? qNum(grams, 'g') : { qual: 'présent' };
      var info = { name: label, formula: ci.f, fam: fam, family: FAMILIES[fam].label, valence: ci.v, qty: qty, detail: ci.r };
      if (dyn) info.dyn = dyn;
      return { id: id, label: label, fam: fam, qty: grams != null ? qty : null, children: children || [], info: info };
    }
    function molLeaf(x) { return { id: 'm:' + x.name, label: x.name, fam: x.fam, qty: x.qty, mol: x.name, children: [], info: x }; }
    function microLeaf(mi) {
      var key = mi.name.replace(/\s*\(.*\)\s*/, '').trim();
      var mInfo = MICRO_INFO[key] || MICRO_INFO[mi.name] || { f: '—', v: 'b', r: 'Micronutriment essentiel au bon fonctionnement de l’organisme.' };
      var qty = qNum(mi.val, mi.unit);
      return { id: 'mi:' + mi.name, label: mi.name, fam: 'micro', qty: qty, children: [],
        info: { name: mi.name, formula: mInfo.f, fam: 'micro', family: 'Micronutriments', valence: mInfo.v, qty: qty, pct: mi.pct, detail: mInfo.r, dyn: { type: 'micro', basePct: mi.pct } } };
    }
    function faLeaf(name, grams) {
      var d = FA_DB[name];
      var ex = (byFam.lipides || []).filter(function (m) { return m.name === name; })[0];
      var qty = (ex && ex.qty && ex.qty.n != null) ? ex.qty : qNum(grams, 'g', true);
      return { id: 'fa:' + name, label: name, fam: 'lipides', qty: qty, children: [],
        info: { name: name, formula: ex ? ex.formula : d.f, fam: 'lipides', family: 'Acides gras', valence: ex ? ex.valence : d.v, qty: qty, detail: ex ? ex.detail : d.r } };
    }
    function aaLeaf(name, grams) {
      var d = AA_DB[name];
      var qty = qNum(grams, 'g', true);
      return { id: 'aa:' + name, label: name, fam: 'proteines', qty: qty, children: [],
        info: { name: name, formula: d.f, fam: 'proteines', family: 'Acides aminés', valence: 'b', qty: qty, detail: d.r } };
    }

    var tree = [];
    if (f.macros.lip) {
      var lipChildren = [];
      [['sat', 'Acides gras saturés', f.sat], ['mono', 'Mono-insaturés (AGMI)', f.mono], ['poly', 'Poly-insaturés (AGPI)', f.poly]].forEach(function (su) {
        var fas = [];
        Object.keys(FA_DB).forEach(function (nm) { if (FA_DB[nm].cat === su[0]) { var g = +(su[2] * FA_DB[nm].share).toFixed(1); if (g >= 0.1) fas.push(faLeaf(nm, g)); } });
        lipChildren.push(catNode(su[0], su[1], 'lipides', su[2], fas, su[0] === 'sat' ? { type: 'sat', base: f.sat } : null));
      });
      (byFam.lipides || []).forEach(function (m) { if (!FA_DB[m.name]) lipChildren.push(molLeaf(m)); });
      tree.push(catNode('lip', 'Lipides', 'lipides', f.macros.lip, lipChildren));
    }
    if (f.macros.gluc) tree.push(catNode('glu', 'Glucides', 'glucides', f.macros.gluc, [
      catNode('suc', 'Sucres', 'glucides', f.sucres, [], { type: 'sucres', base: f.sucres }),
      catNode('ami', 'Amidon', 'glucides', f.amidon)
    ]));
    if (f.macros.fib) tree.push(catNode('fib', 'Fibres alimentaires', 'fibres', f.macros.fib, (byFam.fibres || []).map(molLeaf)));
    if (f.macros.prot) {
      var proChildren = [];
      (byFam.proteines || []).forEach(function (m) { if (!/^Prot[ée]ines/.test(m.name)) proChildren.push(molLeaf(m)); });
      if (f.macros.prot >= 1) AA_LIST.forEach(function (nm) { proChildren.push(aaLeaf(nm, +(f.macros.prot * AA_DB[nm].share).toFixed(2))); });
      tree.push(catNode('pro', 'Protéines', 'proteines', f.macros.prot, proChildren));
    }
    var micros = (f.micros || []).map(microLeaf);
    if (micros.length) tree.push(catNode('mic', 'Micronutriments', 'micro', null, micros));
    var bio = (byFam.bioactifs || []).map(molLeaf);
    if (bio.length) tree.push(catNode('bio', 'Composés bioactifs', 'bioactifs', null, bio));
    return tree;
  }

  function makeFood(s) {
    var f = {
      id: s.id, name: s.name, cat: s.cat, score: s.score, kcal: s.kcal, tagline: s.tagline,
      portion: s.portion || '100 g',
      macros: { lip: s.lip, gluc: s.gluc, fib: s.fib, prot: s.prot,
                autres: Math.max(0, +(100 - s.lip - s.gluc - s.fib - s.prot - (s.eau || 0)).toFixed(1)), eau: s.eau || 0 },
      sat: s.sat || 0, mono: s.mono || 0, poly: s.poly || 0, sucres: s.sucres || 0, amidon: s.amidon || 0,
      micros: (s.micros || []).map(function (a) { return { name: a[0], val: a[1], unit: a[2], pct: a[3] }; }),
      molecules: (s.molecules || []).map(function (a, i) { var x = mol(a); x.id = s.id + '-' + i; return x; }),
      systems: (s.systems || []).map(function (a) { return { name: a[0], valence: a[1], intensity: a[2], note: a[3] }; })
    };
    f.tree = buildTree(f);
    f.timeline = s.timeline || genTimeline(f);
    f.benefits = f.molecules.filter(function (m) { return m.valence === 'b'; }).map(function (m) {
      return { title: m.name, text: m.role, fam: m.fam };
    });
    f.risks = f.molecules.filter(function (m) { return m.valence === 'r'; }).map(function (m) {
      return { title: m.name, text: m.role, fam: m.fam };
    });
    return f;
  }

  // ───────────────────────── ALIMENTS ─────────────────────────
  var SPECS = [
    {
      id: 'chocolat-noir', name: 'Chocolat noir 85 %', cat: 'Cacao', score: 74, kcal: 599,
      tagline: 'Dense en polyphénols protecteurs, à doser pour ses calories.',
      lip: 43, gluc: 35, fib: 11, prot: 7.8, eau: 1.5, sat: 24, mono: 13, poly: 1.3, sucres: 14, amidon: 10,
      micros: [['Magnésium', 228, 'mg', 61], ['Fer', 11.9, 'mg', 85], ['Cuivre', 1.8, 'mg', 200],
               ['Manganèse', 1.9, 'mg', 96], ['Potassium', 715, 'mg', 36], ['Phosphore', 308, 'mg', 44], ['Zinc', 3.3, 'mg', 33]],
      molecules: [
        ['Théobromine', 'C₇H₈N₄O₂', 'bioactifs', 'b', '≈ 800 mg', 'Alcaloïde méthylxanthine : vasodilatateur doux, stimulant cardiaque léger et diurétique.',
         'Principal alcaloïde du cacao. Demi-vie longue (~7 h), elle relaxe les muscles lisses bronchiques et vasculaires et stimule modérément le système nerveux central sans l’intensité de la caféine.'],
        ['Épicatéchine', 'C₁₅H₁₄O₆', 'bioactifs', 'b', '≈ 70 mg', 'Flavanol antioxydant : améliore la fonction endothéliale et la sensibilité à l’insuline.',
         'Flavan-3-ol majeur responsable des bénéfices cardiovasculaires du cacao. Stimule la production de monoxyde d’azote (NO) endothélial → vasodilatation et baisse de la pression artérielle.'],
        ['Caféine', 'C₈H₁₀N₄O₂', 'bioactifs', 'b', '≈ 80 mg', 'Stimulant du système nerveux central, antagoniste de l’adénosine.',
         'Présente en quantité modérée (≈ 1/4 d’un espresso pour 100 g). Augmente la vigilance ; effet additif avec la théobromine.'],
        ['Acide stéarique', 'C₁₈H₃₆O₂', 'lipides', 'n', '≈ 12 g', 'Acide gras saturé à effet neutre sur le cholestérol LDL.',
         'Contrairement aux autres saturés, l’acide stéarique est en partie converti en acide oléique par le foie et n’élève pas significativement le LDL.'],
        ['Acide oléique', 'C₁₈H₃₄O₂', 'lipides', 'b', '≈ 13 g', 'Acide gras mono-insaturé (oméga-9) cardio-protecteur.',
         'Améliore le profil lipidique et la sensibilité à l’insuline ; constituant majeur du beurre de cacao.'],
        ['Procyanidines (tanins)', 'C₃₀H₂₆O₁₂', 'bioactifs', 'r', '≈ 90 mg', 'Polyphénols astringents qui peuvent inhiber l’absorption du fer non héminique et du calcium.',
         'Antioxydants puissants, mais leur astringence et leur affinité pour les protéines/minéraux réduisent la biodisponibilité du fer végétal consommé au même repas.'],
        ['Magnésium', 'Mg', 'micro', 'b', '228 mg', 'Cofacteur de 300+ enzymes : fonction neuromusculaire, synthèse d’ATP.',
         'Le chocolat noir est l’une des sources alimentaires les plus denses en magnésium, impliqué dans la relaxation musculaire et la régulation du rythme cardiaque.'],
        ['Phényléthylamine', 'C₈H₁₁N', 'bioactifs', 'b', 'traces', 'Neuromodulateur associé à l’élévation de l’humeur.',
         'Amine biogène libérant dopamine et noradrénaline ; largement métabolisée par la MAO, son effet systémique reste limité.']
      ],
      systems: [
        ['Système cardiovasculaire', 'b', 3, 'Les flavanols (épicatéchine) augmentent le NO endothélial → vasodilatation et baisse de la pression artérielle.'],
        ['Système nerveux', 'b', 2, 'Théobromine, caféine et phényléthylamine accroissent la vigilance et l’humeur.'],
        ['Système digestif', 'mixed', 2, 'Les fibres nourrissent le microbiote (prébiotique) ; les tanins sont astringents et chélatent une partie du fer.'],
        ['Métabolisme', 'r', 2, 'Densité calorique élevée et sucres ajoutés : charge glycémique notable en cas d’excès.'],
        ['Muscles & squelette', 'b', 2, 'Magnésium et phosphore soutiennent la contraction musculaire et la minéralisation osseuse.']
      ],
      timeline: [
        { phase: 'Bouche', time: '0–1 min', note: 'Le beurre de cacao fond à ~34 °C et libère les arômes ; les tanins créent l’astringence perçue.', absorb: [] },
        { phase: 'Estomac', time: '30 min–2 h', note: 'Émulsification des lipides, dénaturation des protéines ; la théobromine entame son absorption.', absorb: ['Théobromine'] },
        { phase: 'Intestin grêle', time: '2–6 h', note: 'Absorption des acides gras via micelles ; l’épicatéchine et le magnésium passent la barrière intestinale (fer freiné par les tanins).', absorb: ['Épicatéchine', 'Magnésium', 'Acide oléique'] },
        { phase: 'Côlon', time: '6–24 h', note: 'Fermentation des fibres → butyrate ; les procyanidines non absorbées modulent le microbiote (effet prébiotique).', absorb: [] },
        { phase: 'Foie & circulation', time: '> 24 h', note: 'Métabolites d’épicatéchine en circulation → effet vasculaire prolongé ; théobromine éliminée lentement (demi-vie ~7 h).', absorb: [] }
      ]
    },
    {
      id: 'puree-amande', name: "Purée d'amande", cat: 'Oléagineux', score: 78, kcal: 614,
      tagline: 'Riche en acides gras mono-insaturés, vitamine E et magnésium.',
      lip: 56, gluc: 7, fib: 12, prot: 21, eau: 2, sat: 4.5, mono: 36, poly: 14, sucres: 4, amidon: 0.7,
      micros: [['Vitamine E', 25, 'mg', 167], ['Magnésium', 270, 'mg', 72], ['Calcium', 269, 'mg', 34], ['Manganèse', 2.2, 'mg', 96], ['Potassium', 733, 'mg', 37]],
      molecules: [
        ['Acide oléique', 'C₁₈H₃₄O₂', 'lipides', 'b', '≈ 36 g', 'Acide gras mono-insaturé majoritaire, cardio-protecteur.'],
        ['α-Tocophérol (Vit. E)', 'C₂₉H₅₀O₂', 'bioactifs', 'b', '25 mg', 'Antioxydant liposoluble protégeant les membranes cellulaires du stress oxydatif.'],
        ['Magnésium', 'Mg', 'micro', 'b', '270 mg', 'Cofacteur enzymatique, fonction neuromusculaire et glycémique.'],
        ['Acide phytique', 'C₆H₁₈O₂₄P₆', 'bioactifs', 'r', 'présent', 'Antinutriment chélatant fer, zinc et calcium ; réduit leur absorption.'],
        ['Protéines végétales', '—', 'proteines', 'b', '21 g', 'Apport protéique riche en arginine, soutien de la fonction vasculaire.']
      ],
      systems: [
        ['Système cardiovasculaire', 'b', 3, 'AGMI et vitamine E améliorent le profil lipidique et protègent l’endothélium.'],
        ['Métabolisme', 'b', 2, 'Index glycémique bas ; les lipides et fibres ralentissent l’absorption du glucose.'],
        ['Système digestif', 'b', 2, 'Fibres prébiotiques ; l’acide phytique limite l’absorption de certains minéraux.'],
        ['Muscles & squelette', 'b', 2, 'Calcium et magnésium soutiennent l’os et la fonction musculaire.']
      ]
    },
    {
      id: 'puree-sesame', name: 'Purée de sésame', cat: 'Oléagineux', score: 76, kcal: 595,
      tagline: 'Source dense de calcium végétal, cuivre et lignanes.',
      lip: 54, gluc: 12, fib: 9, prot: 17, eau: 3, sat: 7.5, mono: 20, poly: 23, sucres: 0.5, amidon: 9,
      micros: [['Calcium', 426, 'mg', 53], ['Cuivre', 1.6, 'mg', 178], ['Phosphore', 732, 'mg', 105], ['Fer', 8.9, 'mg', 64], ['Zinc', 4.6, 'mg', 46]],
      molecules: [
        ['Sésamine', 'C₂₀H₁₈O₆', 'bioactifs', 'b', 'présent', 'Lignane antioxydante qui soutient le métabolisme lipidique hépatique.'],
        ['Acide linoléique', 'C₁₈H₃₂O₂', 'lipides', 'b', '≈ 23 g', 'Acide gras essentiel oméga-6, constituant des membranes.'],
        ['Calcium', 'Ca', 'micro', 'b', '426 mg', 'Minéralisation osseuse et signalisation cellulaire.'],
        ['Acide oxalique', 'C₂H₂O₄', 'bioactifs', 'r', 'présent', 'Chélateur qui réduit la biodisponibilité du calcium et favorise les oxalates.'],
        ['Cuivre', 'Cu', 'micro', 'b', '1,6 mg', 'Cofacteur d’enzymes antioxydantes et de l’hématopoïèse.']
      ],
      systems: [
        ['Muscles & squelette', 'b', 3, 'Calcium et phosphore élevés soutiennent la densité osseuse.'],
        ['Système cardiovasculaire', 'b', 2, 'AGPI et lignanes favorisent un profil lipidique sain.'],
        ['Système sanguin', 'b', 2, 'Fer et cuivre participent à l’hématopoïèse.'],
        ['Système digestif', 'mixed', 1, 'Fibres bénéfiques ; oxalates limitant l’absorption minérale.']
      ]
    },
    {
      id: 'lait-soja', name: 'Lait de soja', cat: 'Boisson végétale', score: 68, kcal: 54,
      tagline: 'Protéines complètes et isoflavones, faible densité calorique.',
      lip: 1.8, gluc: 6, fib: 0.6, prot: 3.3, eau: 88, sat: 0.2, mono: 0.4, poly: 1, sucres: 3.5, amidon: 1,
      micros: [['Calcium (enrichi)', 120, 'mg', 15], ['Potassium', 118, 'mg', 6], ['Magnésium', 25, 'mg', 7], ['Vitamine B12 (enrichie)', 1.1, 'µg', 44]],
      molecules: [
        ['Génistéine (isoflavone)', 'C₁₅H₁₀O₅', 'bioactifs', 'b', 'présent', 'Phyto-œstrogène antioxydant, module les récepteurs œstrogéniques.'],
        ['Lécithine', 'variable', 'lipides', 'b', 'présent', 'Phospholipide émulsifiant, source de choline.'],
        ['Protéines de soja', '—', 'proteines', 'b', '3,3 g', 'Protéine complète apportant tous les acides aminés essentiels.'],
        ['Inhibiteurs de trypsine', '—', 'bioactifs', 'r', 'traces', 'Antinutriments largement inactivés par la cuisson, peuvent gêner la digestion protéique.']
      ],
      systems: [
        ['Système cardiovasculaire', 'b', 2, 'Protéines de soja et isoflavones associées à une baisse du LDL.'],
        ['Système hormonal', 'mixed', 2, 'Les isoflavones interagissent avec les récepteurs œstrogéniques (effet modulateur).'],
        ['Muscles & squelette', 'b', 2, 'Calcium enrichi et protéines complètes.'],
        ['Métabolisme', 'b', 1, 'Faible densité calorique, index glycémique bas.']
      ]
    },
    {
      id: 'betterave', name: 'Betterave', cat: 'Légume racine', score: 71, kcal: 43,
      tagline: 'Nitrates et bétalaïnes : soutien vasculaire et antioxydant.',
      lip: 0.2, gluc: 8, fib: 2.8, prot: 1.6, eau: 88, sat: 0, mono: 0, poly: 0.1, sucres: 7, amidon: 0.5,
      micros: [['Potassium', 325, 'mg', 16], ['Folates (B9)', 109, 'µg', 27], ['Manganèse', 0.33, 'mg', 14], ['Fer', 0.8, 'mg', 6]],
      molecules: [
        ['Nitrates', 'NO₃⁻', 'bioactifs', 'b', '≈ 250 mg', 'Convertis en NO → vasodilatation, baisse de la pression artérielle, performance.'],
        ['Bétanine (bétalaïne)', 'C₂₄H₂₆N₂O₁₃', 'bioactifs', 'b', 'présent', 'Pigment rouge antioxydant et anti-inflammatoire.'],
        ['Bétaïne', 'C₅H₁₁NO₂', 'bioactifs', 'b', 'présent', 'Donneur de méthyle qui aide à réguler l’homocystéine.'],
        ['Folates (B9)', 'C₁₉H₁₉N₇O₆', 'micro', 'b', '109 µg', 'Essentiels à la synthèse de l’ADN et à la division cellulaire.'],
        ['Oxalates', 'C₂O₄²⁻', 'bioactifs', 'r', 'modéré', 'Peuvent favoriser les calculs rénaux chez les sujets sensibles.']
      ],
      systems: [
        ['Système cardiovasculaire', 'b', 3, 'Les nitrates → NO abaissent la pression artérielle et améliorent l’oxygénation.'],
        ['Système nerveux', 'b', 1, 'L’amélioration du flux sanguin cérébral soutient la cognition.'],
        ['Système digestif', 'b', 2, 'Fibres prébiotiques favorisant le microbiote.'],
        ['Système rénal', 'r', 1, 'Charge en oxalates à surveiller en cas d’antécédents de calculs.']
      ]
    },
    {
      id: 'tomate', name: 'Tomate', cat: 'Légume-fruit', score: 80, kcal: 18,
      tagline: 'Lycopène et vitamine C, très faible densité calorique.',
      lip: 0.2, gluc: 2.7, fib: 1.2, prot: 0.9, eau: 95, sat: 0, mono: 0, poly: 0.1, sucres: 2.6, amidon: 0,
      micros: [['Vitamine C', 14, 'mg', 17], ['Potassium', 237, 'mg', 12], ['Folates (B9)', 15, 'µg', 4], ['Vitamine K', 8, 'µg', 7]],
      molecules: [
        ['Lycopène', 'C₄₀H₅₆', 'bioactifs', 'b', '≈ 3 mg', 'Caroténoïde antioxydant ; mieux absorbé cuit et avec un corps gras. Associé à la protection prostatique et cardiovasculaire.'],
        ['Vitamine C', 'C₆H₈O₆', 'micro', 'b', '14 mg', 'Antioxydant hydrosoluble, cofacteur de la synthèse du collagène, favorise l’absorption du fer.'],
        ['β-Carotène', 'C₄₀H₅₆', 'bioactifs', 'b', 'présent', 'Précurseur de la vitamine A, antioxydant.'],
        ['Acide citrique', 'C₆H₈O₇', 'bioactifs', 'n', 'présent', 'Acide organique donnant la saveur acidulée ; chélateur léger.']
      ],
      systems: [
        ['Système cardiovasculaire', 'b', 2, 'Le lycopène réduit l’oxydation du LDL.'],
        ['Peau & tissus', 'b', 2, 'Vitamine C et caroténoïdes soutiennent collagène et protection UV.'],
        ['Système immunitaire', 'b', 2, 'Vitamine C et antioxydants renforcent les défenses.'],
        ['Système digestif', 'b', 1, 'Fibres douces et bonne hydratation.']
      ]
    },
    // ───────── aliments consultables (profils compacts) ─────────
    cmp('radis', 'Radis', 'Légume racine', 65, 16, 0.1, 3.4, 1.6, 0.7, 95,
        [['Vitamine C', 15, 'mg', 18], ['Potassium', 233, 'mg', 12], ['Folates (B9)', 25, 'µg', 6]],
        [['Glucosinolates', 'variable', 'bioactifs', 'b', 'présent', 'Précurseurs d’isothiocyanates aux propriétés détoxifiantes et anti-inflammatoires.'],
         ['Vitamine C', 'C₆H₈O₆', 'micro', 'b', '15 mg', 'Antioxydant et soutien immunitaire.'],
         ['Anthocyanes', 'variable', 'bioactifs', 'b', 'présent', 'Pigments antioxydants de la peau colorée.']],
        [['Système digestif', 'b', 2, 'Fibres et composés soufrés stimulent la digestion.'],
         ['Système immunitaire', 'b', 1, 'Vitamine C.'],
         ['Métabolisme', 'b', 1, 'Très peu calorique, riche en eau.']]),
    cmp('concombre', 'Concombre', 'Légume-fruit', 60, 15, 0.1, 3.6, 0.5, 0.7, 95,
        [['Potassium', 147, 'mg', 7], ['Vitamine K', 16, 'µg', 13], ['Vitamine C', 2.8, 'mg', 3]],
        [['Cucurbitacines', 'variable', 'bioactifs', 'b', 'traces', 'Composés amers aux propriétés anti-inflammatoires.'],
         ['Vitamine K', 'C₃₁H₄₆O₂', 'micro', 'b', '16 µg', 'Coagulation et métabolisme osseux.'],
         ['Silice', 'SiO₂', 'micro', 'b', 'présent', 'Soutient le tissu conjonctif et la peau.']],
        [['Hydratation', 'b', 3, '95 % d’eau : excellent apport hydrique.'],
         ['Système digestif', 'b', 1, 'Fibres douces.'],
         ['Métabolisme', 'b', 1, 'Très faible densité calorique.']]),
    cmp('courgette', 'Courgette', 'Légume-fruit', 64, 17, 0.3, 3.1, 1, 1.2, 94,
        [['Potassium', 261, 'mg', 13], ['Vitamine C', 18, 'mg', 21], ['Vitamine B6', 0.16, 'mg', 12]],
        [['Lutéine', 'C₄₀H₅₆O₂', 'bioactifs', 'b', 'présent', 'Caroténoïde protecteur de la rétine.'],
         ['Vitamine C', 'C₆H₈O₆', 'micro', 'b', '18 mg', 'Antioxydant.'],
         ['Potassium', 'K', 'micro', 'b', '261 mg', 'Régulation de la pression artérielle.']],
        [['Système cardiovasculaire', 'b', 2, 'Potassium et faible sodium.'],
         ['Yeux', 'b', 1, 'Lutéine protectrice.'],
         ['Métabolisme', 'b', 1, 'Peu calorique.']]),
    cmp('poivron', 'Poivron rouge', 'Légume-fruit', 78, 31, 0.3, 6, 2.1, 1, 92,
        [['Vitamine C', 128, 'mg', 160], ['Vitamine B6', 0.29, 'mg', 22], ['Folates (B9)', 46, 'µg', 12]],
        [['Capsanthine', 'C₄₀H₅₆O₃', 'bioactifs', 'b', 'présent', 'Caroténoïde rouge antioxydant.'],
         ['Vitamine C', 'C₆H₈O₆', 'micro', 'b', '128 mg', 'Très riche : couvre largement les besoins quotidiens, favorise l’absorption du fer.'],
         ['Quercétine', 'C₁₅H₁₀O₇', 'bioactifs', 'b', 'présent', 'Flavonoïde anti-inflammatoire.']],
        [['Système immunitaire', 'b', 3, 'Teneur en vitamine C exceptionnelle.'],
         ['Peau & tissus', 'b', 2, 'Synthèse du collagène.'],
         ['Système cardiovasculaire', 'b', 1, 'Antioxydants protecteurs.']]),
    cmp('aubergine', 'Aubergine', 'Légume-fruit', 66, 25, 0.2, 6, 3, 1, 92,
        [['Potassium', 229, 'mg', 11], ['Manganèse', 0.23, 'mg', 10], ['Folates (B9)', 22, 'µg', 6]],
        [['Nasunine', 'variable', 'bioactifs', 'b', 'présent', 'Anthocyane de la peau, antioxydant protégeant les lipides membranaires.'],
         ['Acide chlorogénique', 'C₁₆H₁₈O₉', 'bioactifs', 'b', 'présent', 'Polyphénol antioxydant et hypoglycémiant.'],
         ['Fibres', '—', 'fibres', 'b', '3 g', 'Satiété et microbiote.']],
        [['Système cardiovasculaire', 'b', 2, 'Polyphénols réduisant l’oxydation du LDL.'],
         ['Métabolisme', 'b', 2, 'Fibres et acide chlorogénique modèrent la glycémie.'],
         ['Système digestif', 'b', 1, 'Apport en fibres.']]),
    cmp('fenouil', 'Fenouil', 'Légume', 67, 31, 0.2, 7, 3.1, 1.2, 90,
        [['Potassium', 414, 'mg', 21], ['Vitamine C', 12, 'mg', 14], ['Folates (B9)', 27, 'µg', 7]],
        [['Anéthol', 'C₁₀H₁₂O', 'bioactifs', 'b', 'présent', 'Composé aromatique anti-spasmodique et carminatif.'],
         ['Vitamine C', 'C₆H₈O₆', 'micro', 'b', '12 mg', 'Antioxydant.'],
         ['Potassium', 'K', 'micro', 'b', '414 mg', 'Équilibre hydrosodé.']],
        [['Système digestif', 'b', 3, 'L’anéthol soulage ballonnements et spasmes.'],
         ['Système cardiovasculaire', 'b', 1, 'Potassium élevé.'],
         ['Système immunitaire', 'b', 1, 'Vitamine C.']]),
    cmp('melon', 'Melon', 'Fruit', 69, 34, 0.2, 8, 0.9, 0.8, 90,
        [['Vitamine C', 37, 'mg', 46], ['Potassium', 267, 'mg', 13], ['Vitamine A (β-carotène)', 169, 'µg', 21]],
        [['β-Carotène', 'C₄₀H₅₆', 'bioactifs', 'b', 'présent', 'Précurseur de vitamine A, antioxydant.'],
         ['Vitamine C', 'C₆H₈O₆', 'micro', 'b', '37 mg', 'Soutien immunitaire et collagène.'],
         ['Potassium', 'K', 'micro', 'b', '267 mg', 'Régulation tensionnelle.']],
        [['Hydratation', 'b', 2, '90 % d’eau, rafraîchissant.'],
         ['Système immunitaire', 'b', 2, 'Vitamines C et A.'],
         ['Métabolisme', 'r', 1, 'Sucres assez présents pour un fruit.']]),
    cmp('pasteque', 'Pastèque', 'Fruit', 67, 30, 0.2, 7.6, 0.4, 0.6, 91,
        [['Vitamine C', 8, 'mg', 10], ['Potassium', 112, 'mg', 6], ['Vitamine A (β-carotène)', 28, 'µg', 4]],
        [['Lycopène', 'C₄₀H₅₆', 'bioactifs', 'b', '≈ 4,5 mg', 'Caroténoïde antioxydant, plus concentré que dans la tomate crue.'],
         ['Citrulline', 'C₆H₁₃N₃O₃', 'bioactifs', 'b', 'présent', 'Acide aminé précurseur d’arginine → NO, soutien vasculaire.'],
         ['Vitamine C', 'C₆H₈O₆', 'micro', 'b', '8 mg', 'Antioxydant.']],
        [['Hydratation', 'b', 3, '91 % d’eau.'],
         ['Système cardiovasculaire', 'b', 2, 'La citrulline soutient la vasodilatation.'],
         ['Métabolisme', 'r', 1, 'Index glycémique élevé.']]),
    cmp('mais', 'Maïs', 'Céréale', 70, 86, 1.2, 19, 2.7, 3.3, 73,
        [['Potassium', 270, 'mg', 14], ['Folates (B9)', 42, 'µg', 11], ['Magnésium', 37, 'mg', 10]],
        [['Lutéine & zéaxanthine', 'C₄₀H₅₆O₂', 'bioactifs', 'b', 'présent', 'Caroténoïdes maculaires protégeant la rétine.'],
         ['Amidon', '(C₆H₁₀O₅)ₙ', 'glucides', 'n', '≈ 16 g', 'Glucide complexe, source d’énergie.'],
         ['Acide férulique', 'C₁₀H₁₀O₄', 'bioactifs', 'b', 'présent', 'Polyphénol antioxydant abondant dans le maïs.']],
        [['Yeux', 'b', 2, 'Lutéine et zéaxanthine protectrices de la macula.'],
         ['Métabolisme', 'mixed', 2, 'Énergie via l’amidon ; index glycémique modéré.'],
         ['Système digestif', 'b', 1, 'Fibres insolubles.']]),
    cmp('petit-pois', 'Petit pois', 'Légumineuse', 75, 81, 0.4, 14, 5.7, 5.4, 79,
        [['Vitamine C', 40, 'mg', 50], ['Vitamine K', 25, 'µg', 21], ['Fer', 1.5, 'mg', 11], ['Folates (B9)', 65, 'µg', 16]],
        [['Protéines végétales', '—', 'proteines', 'b', '5,4 g', 'Bon apport protéique pour un légume, riche en lysine.'],
         ['Fibres', '—', 'fibres', 'b', '5,7 g', 'Satiété et soutien du microbiote.'],
         ['Vitamine C', 'C₆H₈O₆', 'micro', 'b', '40 mg', 'Favorise l’absorption du fer végétal présent.']],
        [['Métabolisme', 'b', 2, 'Protéines et fibres ralentissent la glycémie.'],
         ['Système digestif', 'b', 2, 'Fibres prébiotiques.'],
         ['Système sanguin', 'b', 1, 'Fer + vitamine C synergiques.']]),
    cmp('pomme-de-terre', 'Pomme de terre', 'Légume racine', 66, 77, 0.1, 17, 2.2, 2, 79,
        [['Potassium', 425, 'mg', 21], ['Vitamine C', 19, 'mg', 24], ['Vitamine B6', 0.3, 'mg', 23]],
        [['Amidon', '(C₆H₁₀O₅)ₙ', 'glucides', 'n', '≈ 15 g', 'Source d’énergie ; l’amidon résistant (refroidi) nourrit le microbiote.'],
         ['Vitamine C', 'C₆H₈O₆', 'micro', 'b', '19 mg', 'Antioxydant (réduit par la cuisson).'],
         ['Solanine', 'C₄₅H₇₃NO₁₅', 'bioactifs', 'r', 'traces', 'Glyco-alcaloïde toxique concentré dans les parties vertes et germées — à éviter.']],
        [['Métabolisme', 'mixed', 2, 'Énergie rapide ; index glycémique élevé selon la cuisson.'],
         ['Système cardiovasculaire', 'b', 1, 'Potassium élevé.'],
         ['Système digestif', 'b', 1, 'Amidon résistant prébiotique si refroidie.']]),
    cmp('haricot', 'Haricot vert', 'Légume', 68, 31, 0.1, 7, 2.7, 1.8, 90,
        [['Vitamine K', 43, 'µg', 36], ['Vitamine C', 12, 'mg', 15], ['Folates (B9)', 33, 'µg', 8]],
        [['Vitamine K', 'C₃₁H₄₆O₂', 'micro', 'b', '43 µg', 'Coagulation et santé osseuse.'],
         ['Flavonols', 'variable', 'bioactifs', 'b', 'présent', 'Antioxydants protecteurs.'],
         ['Fibres', '—', 'fibres', 'b', '2,7 g', 'Satiété et transit.']],
        [['Muscles & squelette', 'b', 2, 'Vitamine K pour la minéralisation.'],
         ['Système digestif', 'b', 1, 'Fibres douces.'],
         ['Métabolisme', 'b', 1, 'Peu calorique.']]),
    cmp('salade', 'Salade (laitue)', 'Feuille', 62, 15, 0.2, 2.9, 1.3, 1.4, 95,
        [['Vitamine K', 126, 'µg', 105], ['Folates (B9)', 38, 'µg', 10], ['Vitamine A (β-carotène)', 370, 'µg', 46]],
        [['Vitamine K', 'C₃₁H₄₆O₂', 'micro', 'b', '126 µg', 'Couvre les besoins quotidiens : coagulation et os.'],
         ['Lutéine', 'C₄₀H₅₆O₂', 'bioactifs', 'b', 'présent', 'Caroténoïde protecteur de la rétine.'],
         ['Folates (B9)', 'C₁₉H₁₉N₇O₆', 'micro', 'b', '38 µg', 'Synthèse de l’ADN.']],
        [['Muscles & squelette', 'b', 2, 'Vitamine K abondante.'],
         ['Yeux', 'b', 1, 'Lutéine.'],
         ['Hydratation', 'b', 1, '95 % d’eau.']]),
    cmp('pain-levain-epeautre', "Pain au levain d'épeautre", 'Céréale', 72, 246, 1.7, 48, 6, 9, 35,
        [['Magnésium', 60, 'mg', 16], ['Fer', 2.5, 'mg', 18], ['Zinc', 1.5, 'mg', 15], ['Sélénium', 25, 'µg', 45]],
        [['Amidon', '(C₆H₁₀O₅)ₙ', 'glucides', 'n', '≈ 42 g', 'Glucide complexe ; la fermentation au levain abaisse l’index glycémique.'],
         ['Gliadine (gluten)', '—', 'proteines', 'r', 'présent', 'Protéine du gluten : à éviter en cas de maladie cœliaque ou de sensibilité.'],
         ['Acide phytique', 'C₆H₁₈O₂₄P₆', 'bioactifs', 'r', 'réduit', 'Le levain dégrade en partie les phytates, améliorant l’absorption des minéraux.']],
        [['Métabolisme', 'b', 2, 'La fermentation au levain abaisse la charge glycémique.'],
         ['Système digestif', 'b', 2, 'Le levain pré-digère partiellement le gluten et les FODMAP.'],
         ['Système sanguin', 'b', 1, 'Fer et sélénium mieux absorbés grâce au levain.']]),
    cmp('tournesol', 'Graines de tournesol', 'Oléagineux', 77, 584, 51, 20, 8.6, 21, 4.7,
        [['Vitamine E', 35, 'mg', 234], ['Magnésium', 325, 'mg', 87], ['Sélénium', 53, 'µg', 96], ['Cuivre', 1.8, 'mg', 200]],
        [['α-Tocophérol (Vit. E)', 'C₂₉H₅₀O₂', 'bioactifs', 'b', '35 mg', 'Antioxydant liposoluble majeur protégeant les membranes.'],
         ['Acide linoléique', 'C₁₈H₃₂O₂', 'lipides', 'b', '≈ 23 g', 'Acide gras essentiel oméga-6.'],
         ['Phytostérols', 'variable', 'bioactifs', 'b', 'présent', 'Réduisent l’absorption du cholestérol alimentaire.']],
        [['Système cardiovasculaire', 'b', 2, 'Vitamine E et phytostérols protègent l’endothélium.'],
         ['Muscles & squelette', 'b', 2, 'Magnésium très élevé.'],
         ['Système immunitaire', 'b', 2, 'Sélénium antioxydant.'],
         ['Métabolisme', 'r', 1, 'Très calorique, à consommer en petites portions.']])
  ];

  // compact helper: positional args → spec object
  function cmp(id, name, cat, score, kcal, lip, gluc, fib, prot, eau, micros, molecules, systems) {
    return { id: id, name: name, cat: cat, score: score, kcal: kcal, lip: lip, gluc: gluc, fib: fib, prot: prot, eau: eau,
             sat: +(lip * 0.18).toFixed(1), mono: +(lip * 0.4).toFixed(1), poly: +(lip * 0.35).toFixed(1),
             sucres: +(gluc * 0.45).toFixed(1), amidon: +(gluc * 0.5).toFixed(1),
             micros: micros, molecules: molecules, systems: systems,
             tagline: '' };
  }

  var foods = {}, order = [];
  SPECS.forEach(function (s) { var f = makeFood(s); foods[f.id] = f; order.push(f.id); });

  window.FOOD_DB = { families: FAMILIES, foods: foods, order: order };
})();
