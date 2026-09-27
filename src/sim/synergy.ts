import { SYNERGIES, UNIT_BY_ID, type SynergyDef, type SynergyId } from './data';

export interface SynergyState {
  def: SynergyDef;
  /** Distinct units counting toward it. */
  count: number;
  /** Number of thresholds reached (0 = inactive). */
  level: number;
}

/** Synergies count each distinct unit once, however many copies are on the board. */
export function computeSynergies(defIds: Iterable<string>): SynergyState[] {
  const unique = new Set(defIds);
  const counts = new Map<SynergyId, number>();
  for (const id of unique) {
    const def = UNIT_BY_ID[id];
    counts.set(def.faction, (counts.get(def.faction) ?? 0) + 1);
    counts.set(def.role, (counts.get(def.role) ?? 0) + 1);
  }
  const states: SynergyState[] = [];
  for (const def of SYNERGIES) {
    const count = counts.get(def.id) ?? 0;
    if (count === 0) continue;
    const level = def.thresholds.filter((t) => count >= t).length;
    states.push({ def, count, level });
  }
  // Active first (highest level), then closest to the next threshold.
  return states.sort((a, b) => b.level - a.level || b.count - a.count || a.def.name.localeCompare(b.def.name));
}

export function synergyLevel(states: SynergyState[], id: SynergyId): number {
  return states.find((s) => s.def.id === id)?.level ?? 0;
}
