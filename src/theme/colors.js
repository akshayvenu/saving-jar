/**
 * Design tokens shared by tailwind.config.js and TS code.
 * Soft neo-brutalism: warm grey canvas, off-white blocks, near-black ink,
 * one loud orange for emphasis and hatched textures for "fill".
 */
const ink = { DEFAULT: '#121212', muted: '#5E5E68', soft: '#777781', faint: '#A9A9A6' };

const surface = { DEFAULT: '#E8E7E2', card: '#FBFBF8', sunken: '#DCDBD5', line: '#D3D3D1' };

/** Brand orange: tags, active states, highlights. */
const brand = { DEFAULT: '#F04E23', dark: '#C93A14', soft: '#FCD9CC' };

/** Jar / basket fills. Keys are persisted, so only the values may change. */
const jar = {
  peach: '#F7A27F',
  slate: '#D3D3D1',
  mint: '#A9DBA0',
  lavender: '#C9C1F4',
  butter: '#F4D97A',
  sky: '#9DCAFF',
  rose: '#F5AFC2',
  sage: '#C2D3A6',
};

/** Stronger fills for selected pills. */
const accent = { blue: '#9DCAFF', pink: '#F5AFC2' };

const danger = '#D63A2F';
const success = '#2F8540';

module.exports = { ink, surface, brand, jar, accent, danger, success };
