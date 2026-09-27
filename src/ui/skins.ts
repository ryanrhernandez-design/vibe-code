// The three candidate art styles from docs/art-prompts.md, as swappable visual skins.
// The layout never changes between skins; only colors, materials and fonts do.

export type SkinId = 'painted' | 'dark' | 'toy';

export interface SceneSkin {
  id: SkinId;
  label: string;
  tagline: string;
  tileA: string;
  tileB: string;
  /** Tint applied to the opponent's half. */
  enemyTint: string;
  frame: string;
  centerLine: string;
  benchSlot: string;
  pillar: string;
  pillarGlow: string;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  sunColor: string;
  sunIntensity: number;
  /** Material feel for unit bodies. */
  roughness: number;
  metalness: number;
  exposure: number;
}

export const SKINS: Record<SkinId, SceneSkin> = {
  painted: {
    id: 'painted', label: 'A · Painted Heroic', tagline: 'Hand-painted, warm and bold',
    tileA: '#d8c39a', tileB: '#bfa577', enemyTint: '#c7a88a', frame: '#6b4526', centerLine: '#ffcf6b', benchSlot: '#8a5d34',
    pillar: '#e9dcc0', pillarGlow: '#ffb347',
    hemiSky: '#fff1d6', hemiGround: '#5a3b24', hemiIntensity: 1.5, sunColor: '#ffe2b0', sunIntensity: 2.2,
    roughness: 0.75, metalness: 0.15, exposure: 1.05,
  },
  dark: {
    id: 'dark', label: 'B · Grounded Dark Fantasy', tagline: 'Moody, metallic, cinematic',
    tileA: '#3a4352', tileB: '#2c3440', enemyTint: '#43333a', frame: '#1a1f28', centerLine: '#39e0f0', benchSlot: '#252c37',
    pillar: '#4a5363', pillarGlow: '#39e0f0',
    hemiSky: '#9fb8d8', hemiGround: '#141820', hemiIntensity: 1.0, sunColor: '#c8d8ff', sunIntensity: 2.6,
    roughness: 0.45, metalness: 0.45, exposure: 1.0,
  },
  toy: {
    id: 'toy', label: 'C · Collectible Figurine', tagline: 'Glossy tabletop toys',
    tileA: '#fbf1d8', tileB: '#f2dcae', enemyTint: '#f6d2c4', frame: '#e56b6f', centerLine: '#ffffff', benchSlot: '#f7b267',
    pillar: '#ffffff', pillarGlow: '#ffd166',
    hemiSky: '#ffffff', hemiGround: '#b8d8f0', hemiIntensity: 1.8, sunColor: '#ffffff', sunIntensity: 2.0,
    roughness: 0.3, metalness: 0.05, exposure: 1.1,
  },
};

export const TIER_COLORS: Record<number, string> = {
  1: '#9aa3ad',
  2: '#4caf6a',
  3: '#3f8fe0',
  4: '#a45ee5',
  5: '#f0b429',
};

export const TEAM_COLORS = { ally: '#5ec8ff', enemy: '#ff6b6b' };
