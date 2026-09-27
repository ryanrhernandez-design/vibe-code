// Simple bot brain: build around owned copies and the strongest faction, save for
// interest, level on a curve, and arrange tanks in front and ranged units behind.

import { REROLL_COST, UNIT_BY_ID, XP_COST, type UnitDef } from './data';
import { preferredSlot, type Match, type Player, type UnitInstance } from './match';

/** Level a bot aims for by round. */
function targetLevel(round: number): number {
  if (round <= 2) return 2;
  if (round <= 4) return 4;
  if (round <= 8) return 5;
  if (round <= 12) return 6;
  if (round <= 16) return 7;
  if (round <= 21) return 8;
  return 9;
}

function unitValue(u: UnitInstance): number {
  return UNIT_BY_ID[u.defId].tier * 3 ** (u.star - 1);
}

export function runBotTurn(m: Match, p: Player) {
  // Gold to keep for interest; greedier bots save more once the early game is over.
  const reserve = m.round < 4 ? 0 : Math.min(50, Math.floor((p.greed * 50) / 10) * 10);

  const factionCounts = new Map<string, number>();
  for (const u of m.allUnits(p)) {
    const f = UNIT_BY_ID[u.defId].faction;
    factionCounts.set(f, (factionCounts.get(f) ?? 0) + 1);
  }
  const mainFaction = [...factionCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const score = (def: UnitDef) => {
    const copies = m.ownedCopies(p, def.id, 1) + m.ownedCopies(p, def.id, 2) * 3;
    return copies * 3 + (def.faction === mainFaction ? 2 : 0) + def.tier * 0.8;
  };

  const shopPass = () => {
    const slots = p.shop
      .map((id, slot) => ({ id, slot }))
      .filter((e): e is { id: string; slot: number } => !!e.id)
      .sort((a, b) => score(UNIT_BY_ID[b.id]) - score(UNIT_BY_ID[a.id]));
    for (const { id, slot } of slots) {
      const def = UNIT_BY_ID[id];
      const merges = m.wouldMerge(p, id);
      const affordable = p.gold - def.tier >= reserve || (merges && p.gold >= def.tier);
      if (!affordable) continue;
      if (!merges && score(def) < 2 && m.allUnits(p).length >= p.level + 2) continue;
      if (!m.buy(p, slot)) {
        // Bench full: sell the weakest bench unit that isn't part of a pair, then retry.
        if (!sellWeakest(m, p)) continue;
        m.buy(p, slot);
      }
    }
  };

  shopPass();
  while (p.level < targetLevel(m.round) && p.gold - XP_COST >= reserve && m.buyXp(p)) {
    /* keep leveling */
  }
  // Late game: roll for upgrades with money above the reserve.
  if (m.round >= 8) {
    for (let i = 0; i < 4 && p.gold - REROLL_COST >= reserve + 4; i++) {
      m.reroll(p);
      shopPass();
    }
  }
  arrange(m, p);
}

function sellWeakest(m: Match, p: Player): boolean {
  let worst = -1;
  p.bench.forEach((u, i) => {
    if (!u || m.ownedCopies(p, u.defId, u.star) >= 2) return;
    if (worst === -1 || unitValue(u) < unitValue(p.bench[worst]!)) worst = i;
  });
  if (worst === -1) return false;
  return m.sell(p, { area: 'bench', index: worst }) !== false;
}

/** Put the best units on the board, melee in front and ranged behind. */
export function arrange(m: Match, p: Player) {
  const units = m.allUnits(p).sort((a, b) => unitValue(b) - unitValue(a));
  p.board.fill(null);
  p.bench.fill(null);
  const onBoard = units.slice(0, p.level);
  const benched = units.slice(p.level);
  for (const u of onBoard) {
    const slot = preferredSlot(p, UNIT_BY_ID[u.defId].range > 1);
    p.board[slot] = u;
  }
  benched.forEach((u, i) => {
    if (i < p.bench.length) p.bench[i] = u;
    else m.pool.set(u.defId, m.pool.get(u.defId)! + 3 ** (u.star - 1)); // overflow: discard back to pool
  });
}
