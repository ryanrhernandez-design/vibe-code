// Match rules: 8 players, shared unit pool, shop, economy, merging, pairings and damage.

import {
  BENCH_SIZE, BOARD_SLOTS, BOARD_W, HALF_H, MAX_INTEREST, MAX_LEVEL, PLAYER_COUNT, POOL_SIZE,
  REROLL_COST, SHOP_ODDS, SHOP_SIZE, START_HP, UNITS, UNIT_BY_ID, XP_COST, XP_PER_BUY, XP_PER_ROUND,
  XP_TO_NEXT, baseIncome, roundDamage, sellValue, streakBonus, type Star, type Tier,
} from './data';
import { Combat, type CombatResult, type CombatUnitSpec } from './combat';
import { Rng } from './rng';
import { runBotTurn } from './bot';

export interface UnitInstance {
  uid: number;
  defId: string;
  star: Star;
}

/** Where a unit sits: on the board (index = row * 7 + col, row 0 = front) or the bench. */
export type Loc = { area: 'board'; index: number } | { area: 'bench'; index: number };

export interface Player {
  id: number;
  name: string;
  isHuman: boolean;
  hp: number;
  gold: number;
  level: number;
  xp: number;
  /** Positive = win streak, negative = loss streak. */
  streak: number;
  board: (UnitInstance | null)[];
  bench: (UnitInstance | null)[];
  shop: (string | null)[];
  shopLocked: boolean;
  alive: boolean;
  /** Final placement (1–8) once eliminated or the match ends. */
  placement: number;
  lastOpponent: number;
  lastResult: 'win' | 'loss' | 'draw' | null;
  lastDamageTaken: number;
  /** Per-bot personality, 0..1. */
  greed: number;
}

export interface Pairing {
  a: number;
  /** Opponent player id. When `ghost` is true it's a copy of that board and the owner is unaffected. */
  b: number;
  ghost: boolean;
  seed: number;
  result?: CombatResult;
}

export type Phase = 'prep' | 'combat' | 'over';

export interface MergeInfo {
  defId: string;
  star: Star;
}

const BOT_NAMES = ['Aurelia', 'Brine', 'Thistle', 'Marrow', 'Cinder', 'Gale', 'Quill', 'Juniper', 'Onyx'];

export class Match {
  readonly players: Player[] = [];
  readonly rng: Rng;
  round = 0;
  phase: Phase = 'prep';
  pairings: Pairing[] = [];
  /** Remaining copies of each unit in the shared pool. */
  readonly pool = new Map<string, number>();
  private nextUid = 1;

  /** `autoplayHuman` lets the bot brain play the human seat (used by tests and demo mode). */
  constructor(seed: number, humanName = 'You', readonly autoplayHuman = false) {
    this.rng = new Rng(seed);
    for (const u of UNITS) this.pool.set(u.id, POOL_SIZE[u.tier]);
    const names = this.rng.shuffle([...BOT_NAMES]);
    for (let i = 0; i < PLAYER_COUNT; i++) {
      this.players.push({
        id: i,
        name: i === 0 ? humanName : names[i - 1],
        isHuman: i === 0,
        hp: START_HP,
        gold: 0,
        level: 1,
        xp: 0,
        streak: 0,
        board: new Array(BOARD_SLOTS).fill(null),
        bench: new Array(BENCH_SIZE).fill(null),
        shop: new Array(SHOP_SIZE).fill(null),
        shopLocked: false,
        alive: true,
        placement: 0,
        lastOpponent: -1,
        lastResult: null,
        lastDamageTaken: 0,
        greed: 0.2 + this.rng.next() * 0.8,
      });
    }
  }

  get human(): Player {
    return this.players[0];
  }

  alivePlayers(): Player[] {
    return this.players.filter((p) => p.alive);
  }

  // ── Round flow ──

  /** Start the next preparation phase: income, XP, fresh shops, bot turns. */
  startRound() {
    this.round++;
    this.phase = 'prep';
    for (const p of this.alivePlayers()) {
      const interest = Math.min(MAX_INTEREST, Math.floor(p.gold / 10));
      const winBonus = p.lastResult === 'win' ? 1 : 0;
      p.gold += baseIncome(this.round) + interest + streakBonus(p.streak) + winBonus;
      if (this.round > 1) this.addXp(p, XP_PER_ROUND);
      if (p.shopLocked) p.shopLocked = false;
      else this.refreshShop(p);
    }
    for (const p of this.alivePlayers()) {
      if (!p.isHuman || this.autoplayHuman) runBotTurn(this, p);
    }
  }

  /** Gold the player will earn from interest next round (for the UI preview). */
  interestPreview(p: Player): number {
    return Math.min(MAX_INTEREST, Math.floor(p.gold / 10));
  }

  /** End preparation: tidy boards, pair everyone up and resolve all fights headless. */
  beginCombat(): Pairing[] {
    this.phase = 'combat';
    const alive = this.alivePlayers();
    for (const p of alive) this.enforceUnitCap(p);

    const order = this.rng.shuffle(alive.map((p) => p.id));
    // Avoid an immediate rematch when there's an easy swap.
    for (let i = 0; i + 1 < order.length; i += 2) {
      if (this.players[order[i]].lastOpponent === order[i + 1] && i + 2 < order.length) {
        [order[i + 1], order[i + 2]] = [order[i + 2], order[i + 1]];
      }
    }
    const pairings: Pairing[] = [];
    for (let i = 0; i + 1 < order.length; i += 2) {
      pairings.push({ a: order[i], b: order[i + 1], ghost: false, seed: this.rng.fork() });
    }
    if (order.length % 2 === 1) {
      const lone = order[order.length - 1];
      const others = order.filter((id) => id !== lone);
      pairings.push({ a: lone, b: this.rng.pick(others), ghost: true, seed: this.rng.fork() });
    }
    // The human always fights from the bottom half (side 0).
    for (const pr of pairings) if (pr.b === 0 && !pr.ghost) [pr.a, pr.b] = [pr.b, pr.a];
    for (const pr of pairings) pr.result = this.createCombat(pr).runToEnd();
    this.pairings = pairings;
    return pairings;
  }

  /** Build the combat for a pairing. Deterministic: calling it twice gives the same fight. */
  createCombat(pr: Pairing): Combat {
    return new Combat([this.combatSpecs(this.players[pr.a], 0), this.combatSpecs(this.players[pr.b], 1)], pr.seed);
  }

  /** The pairing that involves the human (as a real fighter). */
  humanPairing(): Pairing | undefined {
    return this.pairings.find((pr) => pr.a === 0);
  }

  /** Apply the results of beginCombat(): damage, streaks, eliminations. */
  endCombat() {
    for (const pr of this.pairings) {
      const res = pr.result!;
      this.applyResult(this.players[pr.a], this.players[pr.b], res, 0);
      if (!pr.ghost) this.applyResult(this.players[pr.b], this.players[pr.a], res, 1);
    }
    const dead = this.players.filter((p) => p.alive && p.hp <= 0);
    // Players knocked out in the same round are ranked by remaining health.
    dead.sort((a, b) => a.hp - b.hp);
    let place = this.alivePlayers().length;
    for (const p of dead) {
      p.alive = false;
      p.placement = place--;
      this.returnToPool(p);
    }
    const alive = this.alivePlayers();
    if (alive.length <= 1) {
      for (const p of alive) p.placement = 1;
      this.phase = 'over';
    }
  }

  private applyResult(self: Player, opp: Player, res: CombatResult, side: 0 | 1) {
    self.lastOpponent = opp.id;
    self.lastDamageTaken = 0;
    const won = res.winner === side;
    const lost = res.winner === (side === 0 ? 1 : 0) || res.winner === -1;
    if (won) {
      self.lastResult = 'win';
      self.streak = self.streak > 0 ? self.streak + 1 : 1;
      return;
    }
    self.lastResult = res.winner === -1 ? 'draw' : 'loss';
    if (lost) {
      const enemySurvivors = res.survivors[side === 0 ? 1 : 0];
      const dmg = roundDamage(this.round) + enemySurvivors.reduce((s, u) => s + u.star, 0);
      self.hp = Math.max(0, self.hp - dmg);
      self.lastDamageTaken = dmg;
      self.streak = self.streak < 0 ? self.streak - 1 : -1;
    }
  }

  combatSpecs(p: Player, side: 0 | 1): CombatUnitSpec[] {
    const specs: CombatUnitSpec[] = [];
    p.board.forEach((u, i) => {
      if (!u) return;
      const col = i % BOARD_W;
      const row = Math.floor(i / BOARD_W);
      // Side 0 is the bottom half (front row nearest the centre); side 1 is mirrored on top.
      const x = side === 0 ? col : BOARD_W - 1 - col;
      const y = side === 0 ? HALF_H - 1 - row : HALF_H + row;
      specs.push({ defId: u.defId, star: u.star, x, y });
    });
    return specs;
  }

  // ── Player actions (all return false when not allowed) ──

  buy(p: Player, slot: number): MergeInfo[] | false {
    const defId = p.shop[slot];
    if (!defId || this.phase === 'over') return false;
    const def = UNIT_BY_ID[defId];
    if (p.gold < def.tier) return false;
    const benchIdx = p.bench.indexOf(null);
    if (benchIdx === -1 && !this.wouldMerge(p, defId)) return false;
    p.gold -= def.tier;
    p.shop[slot] = null;
    const unit: UnitInstance = { uid: this.nextUid++, defId, star: 1 };
    if (benchIdx !== -1) p.bench[benchIdx] = unit;
    else p.bench.push(unit); // temporary 9th slot, merged away immediately below
    const merges = this.resolveMerges(p);
    p.bench.length = BENCH_SIZE;
    return merges;
  }

  /** True if buying one more copy would complete a 2★ (or chain into 3★). */
  wouldMerge(p: Player, defId: string): boolean {
    return this.ownedCopies(p, defId, 1) >= 2;
  }

  ownedCopies(p: Player, defId: string, star: Star): number {
    return this.allUnits(p).filter((u) => u.defId === defId && u.star === star).length;
  }

  sell(p: Player, loc: Loc): number | false {
    const unit = this.getAt(p, loc);
    if (!unit) return false;
    if (loc.area === 'board' && this.phase !== 'prep') return false;
    const def = UNIT_BY_ID[unit.defId];
    const value = sellValue(def, unit.star);
    p.gold += value;
    this.setAt(p, loc, null);
    this.pool.set(unit.defId, this.pool.get(unit.defId)! + 3 ** (unit.star - 1));
    return value;
  }

  /** Move or swap a unit. Board moves are only allowed during preparation. */
  move(p: Player, from: Loc, to: Loc): boolean {
    if (from.area === to.area && from.index === to.index) return false;
    if ((from.area === 'board' || to.area === 'board') && this.phase !== 'prep') return false;
    const a = this.getAt(p, from);
    if (!a) return false;
    const b = this.getAt(p, to);
    // Moving a bench unit onto an empty board tile must respect the unit cap.
    if (from.area === 'bench' && to.area === 'board' && !b && this.boardCount(p) >= p.level) return false;
    this.setAt(p, to, a);
    this.setAt(p, from, b);
    return true;
  }

  reroll(p: Player): boolean {
    if (p.gold < REROLL_COST || this.phase === 'over') return false;
    p.gold -= REROLL_COST;
    this.refreshShop(p);
    p.shopLocked = false;
    return true;
  }

  buyXp(p: Player): boolean {
    if (p.gold < XP_COST || p.level >= MAX_LEVEL || this.phase === 'over') return false;
    p.gold -= XP_COST;
    this.addXp(p, XP_PER_BUY);
    return true;
  }

  toggleLock(p: Player) {
    p.shopLocked = !p.shopLocked;
  }

  // ── Helpers ──

  getAt(p: Player, loc: Loc): UnitInstance | null {
    return (loc.area === 'board' ? p.board : p.bench)[loc.index] ?? null;
  }

  setAt(p: Player, loc: Loc, u: UnitInstance | null) {
    (loc.area === 'board' ? p.board : p.bench)[loc.index] = u;
  }

  allUnits(p: Player): UnitInstance[] {
    return [...p.board, ...p.bench].filter((u): u is UnitInstance => !!u);
  }

  boardCount(p: Player): number {
    return p.board.filter(Boolean).length;
  }

  boardDefIds(p: Player): string[] {
    return p.board.filter((u): u is UnitInstance => !!u).map((u) => u.defId);
  }

  xpToNext(p: Player): number {
    return XP_TO_NEXT[p.level];
  }

  private addXp(p: Player, amount: number) {
    if (p.level >= MAX_LEVEL) return;
    p.xp += amount;
    while (p.level < MAX_LEVEL && p.xp >= XP_TO_NEXT[p.level]) {
      p.xp -= XP_TO_NEXT[p.level];
      p.level++;
    }
    if (p.level >= MAX_LEVEL) p.xp = 0;
  }

  refreshShop(p: Player) {
    // Return unbought shop units to the pool before rolling new ones.
    for (const id of p.shop) if (id) this.pool.set(id, this.pool.get(id)! + 1);
    for (let i = 0; i < SHOP_SIZE; i++) p.shop[i] = this.rollUnit(p.level);
  }

  private rollUnit(level: number): string | null {
    const odds = SHOP_ODDS[level];
    let roll = this.rng.next() * 100;
    let tier: Tier = 1;
    for (let t = 0; t < 5; t++) {
      if (roll < odds[t]) {
        tier = (t + 1) as Tier;
        break;
      }
      roll -= odds[t];
    }
    // Fall back to lower tiers if a tier's pool is empty.
    for (let t = tier; t >= 1; t--) {
      const candidates = UNITS.filter((u) => u.tier === t && this.pool.get(u.id)! > 0);
      const total = candidates.reduce((s, u) => s + this.pool.get(u.id)!, 0);
      if (total === 0) continue;
      let r = this.rng.int(total);
      for (const u of candidates) {
        r -= this.pool.get(u.id)!;
        if (r < 0) {
          this.pool.set(u.id, this.pool.get(u.id)! - 1);
          return u.id;
        }
      }
    }
    return null;
  }

  /** Merge any 3 identical units (same unit, same star) into one of the next star, repeatedly. */
  private resolveMerges(p: Player): MergeInfo[] {
    const merges: MergeInfo[] = [];
    let found = true;
    while (found) {
      found = false;
      const locs: { loc: Loc; u: UnitInstance }[] = [];
      p.board.forEach((u, index) => u && locs.push({ loc: { area: 'board', index }, u }));
      p.bench.forEach((u, index) => u && locs.push({ loc: { area: 'bench', index }, u }));
      const groups = new Map<string, { loc: Loc; u: UnitInstance }[]>();
      for (const e of locs) {
        if (e.u.star >= 3) continue;
        const key = `${e.u.defId}:${e.u.star}`;
        groups.set(key, [...(groups.get(key) ?? []), e]);
      }
      for (const group of groups.values()) {
        if (group.length < 3) continue;
        const [keep, ...rest] = group.slice(0, 3); // board copies come first, so a board unit is kept
        keep.u.star = (keep.u.star + 1) as Star;
        for (const r of rest) this.setAt(p, r.loc, null);
        // A merged unit that landed in the overflow bench slot moves into a free slot.
        if (keep.loc.area === 'bench' && keep.loc.index >= BENCH_SIZE) {
          this.setAt(p, keep.loc, null);
          p.bench[p.bench.indexOf(null)] = keep.u;
        }
        merges.push({ defId: keep.u.defId, star: keep.u.star });
        found = true;
        break;
      }
    }
    return merges;
  }

  /** Before combat: pull extra units off the board, and auto-fill empty slots from the bench. */
  enforceUnitCap(p: Player) {
    const value = (u: UnitInstance) => UNIT_BY_ID[u.defId].tier * 3 ** (u.star - 1);
    while (this.boardCount(p) > p.level) {
      let worst = -1;
      p.board.forEach((u, i) => {
        if (u && (worst === -1 || value(u) < value(p.board[worst]!))) worst = i;
      });
      const unit = p.board[worst]!;
      p.board[worst] = null;
      const free = p.bench.indexOf(null);
      if (free !== -1) p.bench[free] = unit;
      else {
        p.gold += sellValue(UNIT_BY_ID[unit.defId], unit.star);
        this.pool.set(unit.defId, this.pool.get(unit.defId)! + 3 ** (unit.star - 1));
      }
    }
    while (this.boardCount(p) < p.level) {
      const benchUnits = p.bench.map((u, i) => ({ u, i })).filter((e) => e.u) as { u: UnitInstance; i: number }[];
      if (!benchUnits.length) break;
      benchUnits.sort((a, b) => value(b.u) - value(a.u));
      const { u, i } = benchUnits[0];
      const slot = preferredSlot(p, UNIT_BY_ID[u.defId].range > 1);
      if (slot === -1) break;
      p.board[slot] = u;
      p.bench[i] = null;
    }
  }

  private returnToPool(p: Player) {
    for (const u of this.allUnits(p)) this.pool.set(u.defId, this.pool.get(u.defId)! + 3 ** (u.star - 1));
    for (const id of p.shop) if (id) this.pool.set(id, this.pool.get(id)! + 1);
    p.board.fill(null);
    p.bench.fill(null);
    p.shop.fill(null);
  }
}

/** Free board slot for a unit: melee fill the front rows, ranged the back rows, centre columns first. */
export function preferredSlot(p: Player, ranged: boolean): number {
  const rows = ranged ? [3, 2, 1, 0] : [0, 1, 2, 3];
  const cols = [3, 2, 4, 1, 5, 0, 6];
  for (const r of rows) for (const c of cols) if (!p.board[r * BOARD_W + c]) return r * BOARD_W + c;
  return -1;
}
