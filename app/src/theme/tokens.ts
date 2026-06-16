/* Design tokens — single source of truth, transcribed from the handoff README's
   "Design Tokens" section. No invented palette: every value is from the spec. */

export const colors = {
  appBg: '#f4f2ea',
  surface: '#ffffff',
  cardBorder: '#ece7dc',
  controlBorder: '#e7e1d4',

  ink: '#211d17', // primary
  ink2: '#6b6357', // secondary
  ink3: '#a39a8b', // tertiary / mono labels
  inkSoft: '#8a8275', // notes
  sheetText: '#3a352d',

  chipBg: '#ece7dc', // category pill
  track: '#f0ebe0', // progress bar track
  modalScrim: 'rgba(33,29,23,0.32)',

  // valence
  benefic: '#2f7d5b',
  watch: '#c0633f',
  mixed: 'oklch(0.70 0.11 72)',
  neutral: '#8a8275',

  // compare accents
  compareA: '#b98a52',
  compareB: '#6b8e9e',

  // misc neutrals used by the prototype
  chevron: '#cfc7b7',
  chevronTree: '#bdb4a4',
  ringTrack: '#e9e4d8',
  donutCenter: '#ffffff',
  intensityOff: '#e3ddcf',
  separator: '#f0ebe0',
  absorbChipBg: '#eef4ef',
} as const;

export const font = {
  serif: "'Newsreader', Georgia, serif",
  sans: "'IBM Plex Sans', system-ui, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
} as const;

export const radius = {
  card: 24,
  cardSm: 18,
  row: 14,
  pill: 100,
  sheet: 28,
} as const;

export const shadow = {
  card: '0 6px 20px rgba(33,29,23,0.04)',
  sheet: '0 -10px 40px rgba(33,29,23,0.18)',
  control: '0 1px 2px rgba(33,29,23,0.04)',
} as const;
