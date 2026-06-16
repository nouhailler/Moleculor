/* Domain model for Moleculor. The schema mirrors the design handoff's
   foodData.js so a real nutrition source (Ciqual/ANSES, USDA FoodData Central)
   can later be mapped onto the same shapes — see data/repository.ts. */

export type Valence = 'b' | 'r' | 'mixed' | 'n';

export type FamilyKey =
  | 'lipides'
  | 'glucides'
  | 'fibres'
  | 'proteines'
  | 'micro'
  | 'bioactifs';

export interface Family {
  label: string;
  /** oklch color string, used directly in CSS. */
  color: string;
}

/** Parsed, scalable quantity. Either a number+unit or a qualitative string. */
export interface Qty {
  n?: number;
  unit?: string;
  approx?: boolean;
  qual?: string;
}

/** Drives dynamic status recomputation as the analysed portion changes. */
export type Dyn =
  | { type: 'sucres'; base: number }
  | { type: 'sat'; base: number }
  | { type: 'micro'; basePct: number };

/** Shared shape for anything that can open the detail sheet. */
export interface Info {
  name: string;
  formula: string;
  fam: string;
  family: string;
  valence: Valence;
  qty: Qty;
  pct?: number;
  abundance?: string;
  role?: string;
  detail?: string;
  dyn?: Dyn;
}

export interface Molecule extends Info {
  id?: string;
  abundance: string;
  role: string;
  detail: string;
}

export interface Micro {
  name: string;
  val: number;
  unit: string;
  pct: number;
}

export interface SystemEntry {
  name: string;
  valence: Valence;
  intensity: number; // 1..3
  note: string;
}

export interface TreeNode {
  id: string;
  label: string;
  fam: string;
  qty: Qty | null;
  children: TreeNode[];
  info: Info;
  mol?: string;
}

export interface TimelinePhase {
  phase: string;
  time: string;
  note: string;
  absorb: string[];
}

export interface BenefitRisk {
  title: string;
  text: string;
  fam: string;
}

export interface Macros {
  lip: number;
  gluc: number;
  fib: number;
  prot: number;
  autres: number;
  eau: number;
}

export interface Food {
  id: string;
  name: string;
  cat: string;
  score: number; // 0..100
  kcal: number; // per 100 g
  tagline: string;
  portion: string;
  macros: Macros;
  sat: number;
  mono: number;
  poly: number;
  sucres: number;
  amidon: number;
  micros: Micro[];
  molecules: Molecule[];
  systems: SystemEntry[];
  tree: TreeNode[];
  timeline: TimelinePhase[];
  benefits: BenefitRisk[];
  risks: BenefitRisk[];
}

export interface FoodDB {
  families: Record<string, Family>;
  foods: Record<string, Food>;
  order: string[];
}
