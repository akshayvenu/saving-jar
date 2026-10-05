import createIconSet from '@expo/vector-icons/createIconSet';

import glyphMap from './icon-glyphs.json';

/**
 * Material Community Icons, backed by a subset font holding only the glyphs this app uses
 * (~6 KB instead of the full ~1.3 MB font). Glyphs and metrics are identical to the full set.
 * After using a new icon name, run `npm run icons` to regenerate the subset.
 */
export const Icon = createIconSet(
  glyphMap,
  'material-community-subset',
  require('../../../assets/fonts/material-community-subset.ttf')
);

export type IconName = keyof typeof glyphMap;
