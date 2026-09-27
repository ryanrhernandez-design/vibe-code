// Inline SVG icons. Faction and role marks are the art package's Vector_Marks
// (06_Handoff/Vector_Marks); the UI glyphs follow the same 4px round stroke style.

import type { FactionId, RoleId } from '../sim/data';

const wrap = (body: string, cls = '') =>
  `<svg class="ico ${cls}" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;

export const FACTION_MARK: Record<FactionId, string> = {
  sun: wrap('<circle cx="32" cy="32" r="11"/><path d="M32 4v10m0 36v10M4 32h10m36 0h10M12 12l7 7m26 26l7 7M12 52l7-7m26-26l7-7"/>'),
  tide: wrap('<path d="M11 41C0 17 19 8 24 16c2-12 14-12 16 0 8-8 26 5 13 25L39 54H25Z"/><path d="M32 14v37M18 22l10 29m18-29L36 51M10 34l14 17m30-17L40 51"/>'),
  wild: wrap('<path d="M50 9C19 8 8 20 12 38c4 17 28 21 37 3 4-9 2-22 1-32Z"/><path d="M14 55 44 20M29 39V25m0 14h14"/>'),
};

/** Our role synergies mapped onto the package's role marks. */
export const ROLE_MARK: Record<RoleId, string> = {
  guardian: wrap('<path d="m32 6 21 8v18c0 13-13 22-21 27C24 54 11 45 11 32V14Z"/>'),
  striker: wrap('<path d="M43 6 57 8 36 35 28 27Z M19 27l18 18M25 39 12 53M8 49l8 8"/>'),
  marksman: wrap('<path d="M14 8Q58 32 14 56L28 32Z M6 32h47m-9-8 9 8-9 8"/>'),
  mystic: wrap('<path d="M16 57 40 22 M34 6l4 8 9-1-4 8 5 8-10-1-6 7-1-10-8-4 9-5Z"/>'),
};

export const ICON = {
  heart: `<svg class="ico" viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M32 56 9 33C1 25 3 12 14 9c7-2 13 1 18 8 5-7 11-10 18-8 11 3 13 16 5 24Z"/></svg>`,
  coin: `<svg class="ico coin" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="#E2B652" stroke="#8C6420" stroke-width="4"/><circle cx="32" cy="32" r="16" fill="none" stroke="#B3842F" stroke-width="3.5"/><path d="M24 22q8-6 16 0" stroke="#FFF1C4" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>`,
  xp: wrap('<path d="M16 30 32 16l16 14M16 48l16-14 16 14"/>'),
  reroll: wrap('<path d="M50 24a20 20 0 0 0-35-5M14 40a20 20 0 0 0 35 5"/><path d="M13 8v12h12M51 56V44H39"/>'),
  lock: wrap('<rect x="14" y="28" width="36" height="26" rx="5"/><path d="M22 28v-8a10 10 0 0 1 20 0v8"/>'),
  unlock: wrap('<rect x="14" y="28" width="36" height="26" rx="5"/><path d="M22 28v-8a10 10 0 0 1 19-4"/>'),
  gear: wrap('<circle cx="32" cy="32" r="8"/><path d="M32 6v8m0 36v8M6 32h8m36 0h8M13 13l6 6m26 26 6 6M13 51l6-6m26-26 6-6"/>'),
  close: wrap('<path d="M16 16l32 32M48 16 16 48"/>'),
  back: wrap('<path d="M40 12 20 32l20 20"/>'),
  next: wrap('<path d="M24 12l20 20-20 20"/>'),
  home: wrap('<path d="M10 30 32 10l22 20M16 26v28h12V40h8v14h12V26"/>'),
  cards: wrap('<rect x="16" y="10" width="32" height="44" rx="5"/><path d="M10 18v32a5 5 0 0 0 5 5h25"/>'),
  profile: wrap('<circle cx="32" cy="22" r="10"/><path d="M12 54c2-12 10-18 20-18s18 6 20 18"/>'),
  crown: wrap('<path d="M10 46 14 18l12 14 6-18 6 18 12-14 4 28Z M12 54h40"/>'),
  check: wrap('<path d="M14 34l12 12 24-26"/>'),
  cross: wrap('<path d="M18 18l28 28M46 18 18 46"/>'),
  swords: wrap('<path d="M10 10l30 30M54 10 24 40M36 44l8 8M20 44l-8 8M40 36l8-8M24 36l-8-8"/>'),
  search: wrap('<circle cx="28" cy="28" r="16"/><path d="M40 40l14 14"/>'),
  star: `<svg class="ico" viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="m32 5 8 17 19 2-14 13 4 19-17-10-17 10 4-19L5 24l19-2Z"/></svg>`,
  starEmpty: `<svg class="ico" viewBox="0 0 64 64" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" d="m32 5 8 17 19 2-14 13 4 19-17-10-17 10 4-19L5 24l19-2Z"/></svg>`,
  sword: wrap('<path d="M46 8h10v10L28 46l-10-10Z M16 38l10 10M20 44 10 54"/>'),
  speed: wrap('<path d="M8 20h18M8 32h26M8 44h18M44 14l12 18-12 18"/>'),
  range: wrap('<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="10"/><circle cx="32" cy="32" r="1.5"/>'),
  mana: wrap('<path d="M32 8C22 22 16 30 16 38a16 16 0 0 0 32 0c0-8-6-16-16-30Z"/>'),
  armor: wrap('<path d="m32 6 21 8v18c0 13-13 22-21 27C24 54 11 45 11 32V14Z"/><path d="M32 18v30"/>'),
  play: wrap('<path d="M24 14l24 18-24 18Z"/>'),
  target: wrap('<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="12"/><path d="M32 4v12m0 32v12M4 32h12m32 0h12"/>'),
  bench: wrap('<rect x="8" y="22" width="48" height="12" rx="4"/><path d="M14 34v16m36-16v16"/>'),
  sell: wrap('<circle cx="32" cy="32" r="22"/><path d="M40 24c-2-3-5-4-8-4-5 0-8 3-8 6 0 8 16 4 16 12 0 3-3 6-8 6-3 0-7-1-9-4M32 14v6m0 24v6"/>'),
};
