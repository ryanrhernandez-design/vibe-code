// Type C "Collectible Figurine" theme, from the art package's theme_tokens.json and
// Art_Direction_Guide.md. Presentation only: nothing here changes game rules.

export const TOKENS = {
  canvas: '#F7F0E4',
  surface: '#FFF9EF',
  surfaceRecessed: '#E8D9BF',
  ink: '#30271F',
  mutedInk: '#665746',
  border: '#C4AD87',
  gold: '#C89B46',
  goldDark: '#745018',
  teal: '#22666D',
  danger: '#A83C38',
  success: '#356647',
  xp: '#315E91',
  focus: '#174F7A',
};

/** Cost-tier colors (always shown with the tier number). */
export const TIER_COLORS: Record<number, string> = {
  1: '#77746C',
  2: '#3D7751',
  3: '#356CB0',
  4: '#8754A2',
  5: '#BA862C',
};

/** Faction palettes: [main, trim, accent, deep]. */
export const FACTION_PALETTE = {
  sun: { name: 'Sunforged Dominion', short: 'Sun', main: '#F5EAD2', trim: '#C89B46', accent: '#F49A38', deep: '#6A4930' },
  tide: { name: 'Tidebound Covenant', short: 'Tide', main: '#2A777B', trim: '#B38B50', accent: '#65DCE7', deep: '#183747' },
  wild: { name: 'Wildroot Clans', short: 'Root', main: '#56734B', trim: '#76503A', accent: '#D89B3C', deep: '#EEE0BC' },
} as const;

/** Team and selection rings under figurines (kept separate from faction color). */
export const TEAM = { ally: '#2FA7B0', enemy: '#D9534A', select: '#E7B74B' };

export type BoardId = 'sanctum' | 'reef' | 'heartwood';

export interface BoardTheme {
  id: BoardId;
  name: string;
  tileA: string;
  tileB: string;
  /** Blended into the opponent's half so the two halves read apart. */
  enemyTint: string;
  /** Colour showing through the thin gaps between tiles. */
  joint: string;
  seam: string;
  plinth: string;
  plinthTrim: string;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  sunColor: string;
  sunIntensity: number;
  exposure: number;
  /** CSS behind the 3D board, layered over the blurred arena concept. */
  tint: string;
}

export const BOARDS: Record<BoardId, BoardTheme> = {
  sanctum: {
    id: 'sanctum', name: 'Sunlit Sanctum',
    tileA: '#F4EBDC', tileB: '#E6D5B8', enemyTint: '#E9C9A8', joint: '#C89B46', seam: '#E0B04E',
    plinth: '#EFE4D0', plinthTrim: '#C89B46',
    hemiSky: '#FFF4E2', hemiGround: '#B99A76', hemiIntensity: 1.5, sunColor: '#FFE7C2', sunIntensity: 2.3, exposure: 1.0,
    tint: 'linear-gradient(180deg, rgba(255,226,196,0.35), rgba(247,240,228,0.15))',
  },
  reef: {
    id: 'reef', name: 'Drowned Reef',
    tileA: '#7FAFAA', tileB: '#6A9D99', enemyTint: '#5C7F93', joint: '#B38B50', seam: '#65DCE7',
    plinth: '#6B4B34', plinthTrim: '#B38B50',
    hemiSky: '#D6ECF2', hemiGround: '#183747', hemiIntensity: 1.35, sunColor: '#E3F1FF', sunIntensity: 2.2, exposure: 1.0,
    tint: 'linear-gradient(180deg, rgba(24,55,71,0.35), rgba(24,55,71,0.1))',
  },
  heartwood: {
    id: 'heartwood', name: 'Heartwood Hollow',
    tileA: '#D8CBA9', tileB: '#C9BB96', enemyTint: '#C7A57E', joint: '#6F8A4E', seam: '#E8A23A',
    plinth: '#76503A', plinthTrim: '#D89B3C',
    hemiSky: '#FFEBC9', hemiGround: '#5A4030', hemiIntensity: 1.45, sunColor: '#FFD9A0', sunIntensity: 2.3, exposure: 1.0,
    tint: 'linear-gradient(180deg, rgba(255,196,120,0.3), rgba(247,240,228,0.1))',
  },
};

export const BOARD_IDS = Object.keys(BOARDS) as BoardId[];

export const MOTION = { press: 100, panel: 200, purchase: 220, reroll: 180, merge: 600, levelUp: 550 };
