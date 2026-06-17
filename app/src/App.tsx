/* Moleculor — app shell. Holds the global state (the prototype's grouped
   useState) and wires screens + overlays together. */

import { useState } from 'react';
import type { Info, SystemEntry } from './data/types';
import { useFoodDB } from './hooks/useFoodDB';
import { loadSettings, saveSettings, settingsReady, type OpenRouterSettings } from './data/settings';
import { generateFoodSpec, generateFoodSpecFromFacts } from './data/enrich';
import { fetchOffProduct, isValidBarcode, offLabel } from './data/openfoodfacts';
import { Header } from './components/Header';
import { TabBar, type Tab } from './components/TabBar';
import { CompositionScreen } from './screens/CompositionScreen';
import { TreeScreen } from './screens/TreeScreen';
import { BodyScreen } from './screens/BodyScreen';
import { CompareScreen } from './screens/CompareScreen';
import { MoleculeSheet } from './overlays/MoleculeSheet';
import { SystemSheet } from './overlays/SystemSheet';
import { SearchOverlay } from './overlays/SearchOverlay';
import { SettingsSheet } from './overlays/SettingsSheet';
import { BarcodeScanner } from './components/BarcodeScanner';
import { GenerationBadge, type GenJob } from './components/GenerationBadge';

const PORTION_MIN = 10;
const PORTION_MAX = 500;
const PORTION_STEP = 10;

export default function App() {
  const { db, addFood, importSpecs, generatedSpecs } = useFoodDB();

  const [tab, setTab] = useState<Tab>('compo');
  const [foodId, setFoodId] = useState('chocolat-noir');
  const [compareB, setCompareB] = useState('puree-amande');
  const [searchOpen, setSearchOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  // Which target the search overlay fills: the main food (A) or the compare food (B).
  const [searchMode, setSearchMode] = useState<'main' | 'compareB'>('main');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<OpenRouterSettings>(loadSettings);
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<Info | null>(null);
  const [sysOpen, setSysOpen] = useState<SystemEntry | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [portion, setPortion] = useState(100);
  const [genJob, setGenJob] = useState<GenJob | null>(null);

  const food = db.foods[foodId];
  const factor = portion / 100;

  const closeOverlays = () => {
    setDetail(null);
    setSysOpen(null);
  };
  const goTab = (t: Tab) => {
    setTab(t);
    closeOverlays();
  };
  const openDetail = (info: Info) => {
    setDetail(info);
    setSysOpen(null);
  };
  const openSystem = (s: SystemEntry) => {
    setSysOpen(s);
    setDetail(null);
  };
  const toggleNode = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));
  const pickFood = (id: string) => {
    setFoodId(id);
    setSearchOpen(false);
    setQuery('');
    setTab('compo');
    setExpanded({});
    closeOverlays();
  };

  const openSearch = (mode: 'main' | 'compareB') => {
    setSearchMode(mode);
    setQuery('');
    setSearchOpen(true);
  };
  const closeSearch = () => {
    setSearchOpen(false);
    setQuery('');
    setSearchMode('main');
  };
  const pickFromSearch = (id: string) => {
    if (searchMode === 'compareB') {
      setCompareB(id);
      closeSearch();
    } else {
      pickFood(id);
    }
  };

  const saveSettingsAndClose = (s: OpenRouterSettings) => {
    setSettings(s);
    saveSettings(s);
    setSettingsOpen(false);
  };

  /** Kick off generation in the background: close the search so the user keeps
      navigating, track progress in a floating badge. On success the freshly
      filled food sheet is opened automatically (Composition), unless it was
      generated from the Compare search — then it slots straight into B. */
  const startGenerate = (q: string, target: 'main' | 'compareB' = 'main') => {
    const job: GenJob = { id: Date.now(), query: q, startedAt: Date.now(), status: 'running' };
    setGenJob(job);
    closeSearch();
    generateFoodSpec(q, settings, db.order)
      .then((spec) => {
        addFood(spec);
        if (target === 'compareB') setCompareB(spec.id);
        else pickFood(spec.id); // open the newly created sheet, filled by the AI
        setGenJob({ ...job, status: 'done', finishedAt: Date.now(), foodId: spec.id, foodName: spec.name });
      })
      .catch((e) => {
        setGenJob({ ...job, status: 'error', finishedAt: Date.now(), error: e instanceof Error ? e.message : 'La génération a échoué.' });
      });
  };

  /** Barcode scanned: fetch the real label data from Open Food Facts, then let
      the IA derive the Moleculor layer (OFF macros win). Re-uses the generation
      badge for progress, and short-circuits if the product is already imported. */
  const startScanned = (code: string, target: 'main' | 'compareB' = 'main') => {
    setScanOpen(false);
    if (!isValidBarcode(code)) {
      setGenJob({ id: Date.now(), query: code, startedAt: Date.now(), status: 'error', finishedAt: Date.now(), error: 'Code-barres non valide.' });
      return;
    }
    // Already imported? open it instead of paying for a new generation.
    const known = generatedSpecs.find((s) => s.barcode === code);
    if (known) {
      if (target === 'compareB') setCompareB(known.id);
      else pickFood(known.id);
      return;
    }
    const job: GenJob = { id: Date.now(), query: code, startedAt: Date.now(), status: 'running' };
    setGenJob(job);
    fetchOffProduct(code)
      .then((facts) => {
        if (!facts || !facts.name) throw new Error(`Produit ${code} introuvable sur Open Food Facts.`);
        setGenJob({ ...job, query: offLabel(facts) });
        return generateFoodSpecFromFacts(facts, settings, db.order);
      })
      .then((spec) => {
        addFood(spec);
        if (target === 'compareB') setCompareB(spec.id);
        else pickFood(spec.id);
        setGenJob({ ...job, query: spec.name, status: 'done', finishedAt: Date.now(), foodId: spec.id, foodName: spec.name });
      })
      .catch((e) => {
        setGenJob({ ...job, status: 'error', finishedAt: Date.now(), error: e instanceof Error ? e.message : "L'import a échoué." });
      });
  };

  /** Scan entry point from the search overlay: needs an OpenRouter key for the
      interpretive layer — otherwise route the user to settings. */
  const onScanRequest = () => {
    if (!settingsReady(settings)) {
      closeSearch();
      setSettingsOpen(true);
      return;
    }
    setScanOpen(true);
  };

  return (
    <div className="device">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Header
          foodName={food.name}
          foodCat={food.cat}
          portion={portion}
          onOpenSearch={() => openSearch('main')}
          onOpenSettings={() => setSettingsOpen(true)}
          onPortionInc={() => setPortion((p) => Math.min(PORTION_MAX, p + PORTION_STEP))}
          onPortionDec={() => setPortion((p) => Math.max(PORTION_MIN, p - PORTION_STEP))}
        />

        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 16px 26px' }}>
          {tab === 'compo' && (
            <CompositionScreen food={food} factor={factor} families={db.families} onOpenDetail={openDetail} onGoTree={() => goTab('tree')} />
          )}
          {tab === 'tree' && (
            <TreeScreen food={food} factor={factor} families={db.families} expanded={expanded} onToggle={toggleNode} onOpenDetail={openDetail} />
          )}
          {tab === 'body' && (
            <BodyScreen food={food} factor={factor} onOpenDetail={openDetail} onOpenSystem={openSystem} />
          )}
          {tab === 'compare' && (
            <CompareScreen food={food} db={db} factor={factor} portion={portion} compareB={compareB} onPickB={setCompareB} onSearch={() => openSearch('compareB')} />
          )}
        </div>

        <TabBar tab={tab} onChange={goTab} />
      </div>

      {detail && (
        <MoleculeSheet info={detail} food={food} factor={factor} portion={portion} families={db.families} onClose={() => setDetail(null)} />
      )}
      {sysOpen && (
        <SystemSheet system={sysOpen} food={food} portion={portion} families={db.families} onClose={() => setSysOpen(null)} onOpenDetail={openDetail} />
      )}
      {searchOpen && (
        <SearchOverlay
          db={db}
          query={query}
          mode={searchMode}
          onQuery={setQuery}
          onClose={closeSearch}
          onPick={pickFromSearch}
          canGenerate={settingsReady(settings)}
          generating={genJob?.status === 'running'}
          onGenerate={(q) => startGenerate(q, searchMode)}
          onScan={onScanRequest}
          onOpenSettings={() => { closeSearch(); setSettingsOpen(true); }}
        />
      )}
      {scanOpen && (
        <BarcodeScanner
          onDetect={(code) => startScanned(code, searchMode)}
          onClose={() => setScanOpen(false)}
        />
      )}
      {settingsOpen && (
        <SettingsSheet
          settings={settings}
          onSave={saveSettingsAndClose}
          onClose={() => setSettingsOpen(false)}
          generatedSpecs={generatedSpecs}
          onImport={importSpecs}
        />
      )}
      {genJob && (
        <GenerationBadge job={genJob} onOpen={pickFood} onDismiss={() => setGenJob(null)} />
      )}
    </div>
  );
}
