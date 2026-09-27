// Static game data: units, synergies and tuning numbers.
// All names and designs are original (see docs/art-prompts.md).

export type FactionId = 'sun' | 'tide' | 'wild';
export type RoleId = 'guardian' | 'striker' | 'marksman' | 'mystic';
export type SynergyId = FactionId | RoleId;
export type Tier = 1 | 2 | 3 | 4 | 5;
export type Star = 1 | 2 | 3;

export type AbilityKind = 'strike' | 'nova' | 'heal' | 'volley' | 'fortify';

export interface AbilityDef {
  name: string;
  kind: AbilityKind;
  /** Damage or healing at 1 star, before ability-power bonuses. */
  power: number;
  /** nova: tiles around the centre (Chebyshev distance). */
  radius?: number;
  /** nova: centred on the caster or on its target. */
  center?: 'self' | 'target';
  /** volley: number of enemies hit. */
  count?: number;
  /** Seconds of stun applied to each enemy hit. */
  stun?: number;
  /** Health restored to the caster when the ability fires. */
  selfHeal?: number;
  text: string;
}

export interface UnitDef {
  id: string;
  name: string;
  faction: FactionId;
  role: RoleId;
  tier: Tier;
  hp: number;
  atk: number;
  /** Attacks per second. */
  atkSpeed: number;
  /** Attack range in tiles (Chebyshev distance, so 1 = adjacent incl. diagonals). */
  range: number;
  armor: number;
  /** Mana needed to cast. */
  mana: number;
  ability: AbilityDef;
  legendary?: boolean;
}

export const UNITS: UnitDef[] = [
  // ── Sunforged Dominion ──
  { id: 'warden', name: 'Bastion Warden', faction: 'sun', role: 'guardian', tier: 1, hp: 650, atk: 45, atkSpeed: 0.7, range: 1, armor: 35, mana: 90,
    ability: { name: 'Sanctified Wall', kind: 'fortify', power: 280, text: 'Restores {p} health to itself.' } },
  { id: 'lumen', name: 'Lumen Archer', faction: 'sun', role: 'marksman', tier: 1, hp: 420, atk: 55, atkSpeed: 0.8, range: 4, armor: 10, mana: 60,
    ability: { name: 'Prism Shot', kind: 'strike', power: 200, text: 'Fires a prism arrow dealing {p} damage to its target.' } },
  { id: 'dawnblade', name: 'Dawnblade Duelist', faction: 'sun', role: 'striker', tier: 2, hp: 560, atk: 65, atkSpeed: 0.85, range: 1, armor: 20, mana: 70,
    ability: { name: 'Dawn Cleave', kind: 'nova', power: 180, radius: 1, center: 'target', text: 'Cleaves its target and nearby enemies for {p} damage.' } },
  { id: 'priestess', name: 'Choir Priestess', faction: 'sun', role: 'mystic', tier: 3, hp: 560, atk: 40, atkSpeed: 0.65, range: 3, armor: 15, mana: 80,
    ability: { name: 'Hymn of Dawn', kind: 'heal', power: 350, text: 'Heals the most injured ally for {p}.' } },
  { id: 'lancer', name: 'Solar Lancer', faction: 'sun', role: 'striker', tier: 4, hp: 800, atk: 85, atkSpeed: 0.8, range: 1, armor: 30, mana: 70,
    ability: { name: 'Sunspear', kind: 'strike', power: 450, stun: 1, text: 'Impales its target for {p} damage and stuns it for 1s.' } },
  { id: 'colossus', name: 'The Radiant Colossus', faction: 'sun', role: 'guardian', tier: 5, hp: 1300, atk: 90, atkSpeed: 0.6, range: 1, armor: 50, mana: 100, legendary: true,
    ability: { name: 'Solar Flare', kind: 'nova', power: 380, radius: 2, center: 'self', stun: 1.5, text: 'Erupts, dealing {p} damage to enemies within 2 tiles and stunning them for 1.5s.' } },

  // ── Tidebound Covenant ──
  { id: 'brute', name: 'Barnacle Brute', faction: 'tide', role: 'guardian', tier: 1, hp: 700, atk: 40, atkSpeed: 0.65, range: 1, armor: 30, mana: 80,
    ability: { name: 'Clamp', kind: 'strike', power: 150, stun: 1.2, text: 'Crushes its target for {p} damage and stuns it for 1.2s.' } },
  { id: 'deadeye', name: 'Harpoon Deadeye', faction: 'tide', role: 'marksman', tier: 1, hp: 400, atk: 60, atkSpeed: 0.7, range: 4, armor: 5, mana: 70,
    ability: { name: 'Harpoon', kind: 'strike', power: 240, stun: 0.5, text: 'Harpoons its target for {p} damage and a short stun.' } },
  { id: 'corsair', name: 'Riptide Corsair', faction: 'tide', role: 'striker', tier: 2, hp: 520, atk: 70, atkSpeed: 1.0, range: 1, armor: 15, mana: 60,
    ability: { name: 'Undertow', kind: 'strike', power: 280, text: 'Slashes its target for {p} damage.' } },
  { id: 'siren', name: 'Abyssal Siren', faction: 'tide', role: 'mystic', tier: 3, hp: 520, atk: 45, atkSpeed: 0.7, range: 3, armor: 10, mana: 75,
    ability: { name: "Siren's Call", kind: 'nova', power: 260, radius: 1, center: 'target', stun: 0.8, text: 'Deals {p} damage around its target and stuns those enemies for 0.8s.' } },
  { id: 'gunner', name: 'Maelstrom Gunner', faction: 'tide', role: 'marksman', tier: 4, hp: 650, atk: 80, atkSpeed: 0.9, range: 4, armor: 15, mana: 80,
    ability: { name: 'Maelstrom Barrage', kind: 'volley', power: 220, count: 4, text: 'Fires at 4 enemies for {p} damage each.' } },
  { id: 'admiral', name: 'Drowned Admiral', faction: 'tide', role: 'mystic', tier: 5, hp: 1100, atk: 75, atkSpeed: 0.7, range: 2, armor: 35, mana: 90, legendary: true,
    ability: { name: "Kraken's Grasp", kind: 'volley', power: 320, count: 6, stun: 1, text: 'Tentacles strike 6 enemies for {p} damage and stun them for 1s.' } },

  // ── Wildroot Clans ──
  { id: 'mossback', name: 'Mossback Guardian', faction: 'wild', role: 'guardian', tier: 1, hp: 720, atk: 42, atkSpeed: 0.65, range: 1, armor: 25, mana: 90,
    ability: { name: 'Regrowth', kind: 'fortify', power: 300, text: 'Restores {p} health to itself.' } },
  { id: 'thornfang', name: 'Thornfang Stalker', faction: 'wild', role: 'striker', tier: 1, hp: 480, atk: 55, atkSpeed: 0.95, range: 1, armor: 15, mana: 60,
    ability: { name: 'Pounce', kind: 'strike', power: 200, text: 'Mauls its target for {p} damage.' } },
  { id: 'huntress', name: 'Antlered Huntress', faction: 'wild', role: 'marksman', tier: 2, hp: 480, atk: 62, atkSpeed: 0.8, range: 4, armor: 10, mana: 70,
    ability: { name: 'Javelin Storm', kind: 'volley', power: 150, count: 3, text: 'Hurls javelins at 3 enemies for {p} damage each.' } },
  { id: 'shaman', name: 'Sporecaller Shaman', faction: 'wild', role: 'mystic', tier: 3, hp: 540, atk: 42, atkSpeed: 0.7, range: 3, armor: 10, mana: 80,
    ability: { name: 'Spore Burst', kind: 'nova', power: 230, radius: 1, center: 'target', text: 'Bursts spores around its target for {p} damage.' } },
  { id: 'druid', name: 'Moonfang Druid', faction: 'wild', role: 'mystic', tier: 4, hp: 700, atk: 55, atkSpeed: 0.75, range: 3, armor: 20, mana: 85,
    ability: { name: 'Moonwell', kind: 'heal', power: 500, text: 'Heals the most injured ally for {p}.' } },
  { id: 'heartwood', name: 'Elder Heartwood', faction: 'wild', role: 'guardian', tier: 5, hp: 1400, atk: 80, atkSpeed: 0.6, range: 1, armor: 45, mana: 100, legendary: true,
    ability: { name: 'Ancient Roots', kind: 'nova', power: 250, radius: 2, center: 'self', stun: 1.5, selfHeal: 400, text: 'Roots enemies within 2 tiles for {p} damage and a 1.5s stun, and heals itself.' } },
];

export const UNIT_BY_ID: Record<string, UnitDef> = Object.fromEntries(UNITS.map((u) => [u.id, u]));

export interface SynergyDef {
  id: SynergyId;
  name: string;
  kind: 'faction' | 'role';
  icon: string;
  color: string;
  thresholds: number[];
  /** One line per threshold. */
  bonus: string[];
  summary: string;
}

export const SYNERGIES: SynergyDef[] = [
  { id: 'sun', name: 'Sunforged', kind: 'faction', icon: '☀', color: '#f2c14e', thresholds: [2, 4, 6],
    summary: 'Sunforged units regenerate health every second.', bonus: ['2% max health / sec', '4% max health / sec', '7% max health / sec'] },
  { id: 'tide', name: 'Tidebound', kind: 'faction', icon: '🌊', color: '#22b8c7', thresholds: [2, 4, 6],
    summary: 'Tidebound units gain extra mana on every attack.', bonus: ['+8 mana per attack', '+16 mana per attack', '+30 mana per attack'] },
  { id: 'wild', name: 'Wildroot', kind: 'faction', icon: '🌿', color: '#6fa84a', thresholds: [2, 4, 6],
    summary: 'Wildroot units gain bonus max health.', bonus: ['+15% max health', '+30% max health', '+55% max health'] },
  { id: 'guardian', name: 'Guardian', kind: 'role', icon: '🛡', color: '#9aa7b8', thresholds: [2, 4],
    summary: 'All allies gain armor.', bonus: ['+20 armor', '+45 armor'] },
  { id: 'striker', name: 'Striker', kind: 'role', icon: '⚔', color: '#e0664f', thresholds: [2, 4],
    summary: 'Strikers deal bonus attack damage.', bonus: ['+25% attack damage', '+60% attack damage'] },
  { id: 'marksman', name: 'Marksman', kind: 'role', icon: '🏹', color: '#c9a14a', thresholds: [2, 4],
    summary: 'Marksmen attack faster.', bonus: ['+30% attack speed', '+70% attack speed'] },
  { id: 'mystic', name: 'Mystic', kind: 'role', icon: '✦', color: '#a67cf0', thresholds: [2, 4],
    summary: "All allies' abilities are stronger.", bonus: ['+25% ability power', '+60% ability power'] },
];

export const SYNERGY_BY_ID = Object.fromEntries(SYNERGIES.map((s) => [s.id, s])) as Record<SynergyId, SynergyDef>;

export const FACTION_COLORS: Record<FactionId, { primary: string; secondary: string; glow: string }> = {
  sun: { primary: '#f4efe3', secondary: '#d4a62a', glow: '#ffb347' },
  tide: { primary: '#1f4f6e', secondary: '#b08d57', glow: '#39e0f0' },
  wild: { primary: '#5e8a3a', secondary: '#7a5230', glow: '#ffb52e' },
};

// ── Tuning ──
export const BOARD_W = 7;
/** Rows per player half. */
export const HALF_H = 4;
export const BOARD_SLOTS = BOARD_W * HALF_H;
export const BENCH_SIZE = 8;
export const SHOP_SIZE = 5;
export const START_HP = 100;
export const REROLL_COST = 2;
export const XP_COST = 4;
export const XP_PER_BUY = 4;
export const XP_PER_ROUND = 2;
export const MAX_LEVEL = 10;
export const MAX_INTEREST = 5;
export const PLAYER_COUNT = 8;
/** XP needed to go from level N to N+1 (index = current level). */
export const XP_TO_NEXT = [0, 2, 2, 6, 10, 20, 36, 56, 80, 100, Infinity];
/** Copies of each unit in the shared pool, by tier. */
export const POOL_SIZE: Record<Tier, number> = { 1: 22, 2: 18, 3: 14, 4: 10, 5: 8 };
/** Shop odds (%) by player level, for tiers 1–5. */
export const SHOP_ODDS: number[][] = [
  [],
  [100, 0, 0, 0, 0],
  [70, 30, 0, 0, 0],
  [60, 35, 5, 0, 0],
  [50, 35, 15, 0, 0],
  [40, 35, 23, 2, 0],
  [33, 30, 30, 7, 0],
  [25, 30, 35, 9, 1],
  [20, 25, 35, 16, 4],
  [15, 20, 30, 25, 10],
  [10, 15, 30, 30, 15],
];
export const STAR_STAT_MULT: Record<Star, number> = { 1: 1, 2: 1.8, 3: 3.24 };
export const STAR_ABILITY_MULT: Record<Star, number> = { 1: 1, 2: 1.75, 3: 3 };

export function baseIncome(round: number): number {
  return Math.min(5, round + 2);
}

export function streakBonus(streak: number): number {
  const n = Math.abs(streak);
  if (n >= 6) return 3;
  if (n >= 4) return 2;
  if (n >= 2) return 1;
  return 0;
}

/** Health lost by the loser of a round, before per-unit damage. */
export function roundDamage(round: number): number {
  return Math.min(1 + Math.floor(round / 4), 8);
}

/** Gold returned when selling a unit. */
export function sellValue(def: UnitDef, star: Star): number {
  return def.tier * 3 ** (star - 1);
}

export function abilityText(def: UnitDef, star: Star = 1): string {
  return def.ability.text.replace('{p}', String(Math.round(def.ability.power * STAR_ABILITY_MULT[star])));
}
