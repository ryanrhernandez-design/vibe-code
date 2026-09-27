// Deterministic, tick-based auto-combat. No rendering here: the renderer replays the
// events this produces, and the server (later) can run the exact same code headless.

import {
  BOARD_W, HALF_H, STAR_ABILITY_MULT, STAR_STAT_MULT, UNIT_BY_ID,
  type AbilityKind, type Star, type UnitDef,
} from './data';
import { Rng } from './rng';
import { computeSynergies, synergyLevel } from './synergy';

export const TICK = 0.05;
export const COMBAT_TIME_LIMIT = 40;
export const BOARD_H = HALF_H * 2;
const MOVE_TIME = 0.45;
const BASE_MANA_PER_ATTACK = 10;

export interface CombatUnitSpec {
  defId: string;
  star: Star;
  /** World tile: x 0..6, y 0..7 (side 0 owns rows 0–3, side 1 rows 4–7). */
  x: number;
  y: number;
}

export type CombatEvent =
  | { type: 'move'; id: number; fx: number; fy: number; tx: number; ty: number; dur: number }
  | { type: 'attack'; id: number; target: number; ranged: boolean }
  | { type: 'damage'; id: number; src: number; amount: number; ability: boolean }
  | { type: 'heal'; id: number; amount: number }
  | { type: 'cast'; id: number; kind: AbilityKind; targets: number[]; x: number; y: number; radius: number }
  | { type: 'stun'; id: number; dur: number }
  | { type: 'death'; id: number };

export class CUnit {
  alive = true;
  hp: number;
  mana = 0;
  targetId = -1;
  attackTimer: number;
  stunnedUntil = 0;
  /** While moving, x/y already hold the destination tile. */
  moveFromX: number;
  moveFromY: number;
  moveElapsed = 0;
  moveDur = 0;
  damageDealt = 0;

  constructor(
    readonly id: number,
    readonly def: UnitDef,
    readonly star: Star,
    readonly side: 0 | 1,
    public x: number,
    public y: number,
    readonly maxHp: number,
    readonly atk: number,
    readonly atkSpeed: number,
    readonly armor: number,
    readonly abilityPower: number,
    readonly regenPct: number,
    readonly manaPerAttack: number,
  ) {
    this.hp = maxHp;
    this.moveFromX = x;
    this.moveFromY = y;
    this.attackTimer = 0.3 + (id % 4) * 0.08;
  }

  get moving(): boolean {
    return this.moveElapsed < this.moveDur;
  }
}

export interface CombatResult {
  /** 0 or 1, or -1 for a draw (time out or mutual wipe). */
  winner: 0 | 1 | -1;
  survivors: [CUnit[], CUnit[]];
  time: number;
}

const dist = (ax: number, ay: number, bx: number, by: number) => Math.max(Math.abs(ax - bx), Math.abs(ay - by));

const NEIGHBORS = [
  [0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1],
] as const;

export class Combat {
  readonly units: CUnit[] = [];
  time = 0;
  done = false;
  result: CombatResult | null = null;
  private readonly occ: number[] = new Array(BOARD_W * BOARD_H).fill(-1);
  private readonly rng: Rng;

  constructor(sides: [CombatUnitSpec[], CombatUnitSpec[]], seed: number) {
    this.rng = new Rng(seed);
    sides.forEach((specs, sideIdx) => {
      const side = sideIdx as 0 | 1;
      const syn = computeSynergies(specs.map((s) => s.defId));
      const lv = (id: Parameters<typeof synergyLevel>[1]) => synergyLevel(syn, id);
      for (const spec of specs) {
        const def = UNIT_BY_ID[spec.defId];
        const m = STAR_STAT_MULT[spec.star];
        let hp = def.hp * m;
        if (def.faction === 'wild') hp *= [1, 1.15, 1.3, 1.55][lv('wild')];
        let atk = def.atk * m;
        if (def.role === 'striker') atk *= [1, 1.25, 1.6][lv('striker')];
        let atkSpeed = def.atkSpeed;
        if (def.role === 'marksman') atkSpeed *= [1, 1.3, 1.7][lv('marksman')];
        const armor = def.armor + [0, 20, 45][lv('guardian')];
        const ap = STAR_ABILITY_MULT[spec.star] * [1, 1.25, 1.6][lv('mystic')];
        const regen = def.faction === 'sun' ? [0, 0.02, 0.04, 0.07][lv('sun')] : 0;
        const manaPerAttack = BASE_MANA_PER_ATTACK + (def.faction === 'tide' ? [0, 8, 16, 30][lv('tide')] : 0);
        const u = new CUnit(this.units.length, def, spec.star, side, spec.x, spec.y,
          Math.round(hp), atk, atkSpeed, armor, ap, regen, manaPerAttack);
        this.units.push(u);
        this.occ[this.idx(u.x, u.y)] = u.id;
      }
    });
    this.checkEnd();
  }

  /** Advance one tick; returns the events that happened during it. */
  step(): CombatEvent[] {
    const events: CombatEvent[] = [];
    if (this.done) return events;
    this.time += TICK;

    for (const u of this.units) {
      if (!u.alive) continue;
      if (u.regenPct > 0 && u.hp < u.maxHp) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * u.regenPct * TICK);
      if (u.moving) {
        u.moveElapsed += TICK;
        continue;
      }
      u.attackTimer = Math.max(0, u.attackTimer - TICK);
      if (this.time < u.stunnedUntil) continue;

      let target = this.units[u.targetId];
      if (!target || !target.alive) {
        target = this.findTarget(u)!;
        if (!target) continue;
        u.targetId = target.id;
      }

      if (dist(u.x, u.y, target.x, target.y) <= u.def.range) {
        if (u.def.mana > 0 && u.mana >= u.def.mana) {
          this.cast(u, target, events);
          u.mana = 0;
          u.attackTimer = Math.max(u.attackTimer, 0.4);
        } else if (u.attackTimer <= 0) {
          events.push({ type: 'attack', id: u.id, target: target.id, ranged: u.def.range > 1 });
          u.mana += u.manaPerAttack;
          this.damage(u, target, u.atk, false, events);
          u.attackTimer = 1 / u.atkSpeed;
        }
      } else {
        this.stepToward(u, target, events);
      }
    }
    this.checkEnd();
    return events;
  }

  runToEnd(): CombatResult {
    while (!this.done) this.step();
    return this.result!;
  }

  private idx(x: number, y: number) {
    return y * BOARD_W + x;
  }

  private findTarget(u: CUnit): CUnit | undefined {
    let best: CUnit | undefined;
    let bestD = Infinity;
    for (const o of this.units) {
      if (!o.alive || o.side === u.side) continue;
      const d = dist(u.x, u.y, o.x, o.y);
      if (d < bestD) {
        best = o;
        bestD = d;
      }
    }
    return best;
  }

  /** Breadth-first search to the nearest free tile in range of the target; take one step. */
  private stepToward(u: CUnit, target: CUnit, events: CombatEvent[]) {
    const start = this.idx(u.x, u.y);
    const prev = new Map<number, number>([[start, -1]]);
    const queue = [start];
    let goal = -1;
    while (queue.length) {
      const cur = queue.shift()!;
      const cx = cur % BOARD_W;
      const cy = Math.floor(cur / BOARD_W);
      if (cur !== start && dist(cx, cy, target.x, target.y) <= u.def.range) {
        goal = cur;
        break;
      }
      for (const [dx, dy] of NEIGHBORS) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= BOARD_W || ny >= BOARD_H) continue;
        const n = this.idx(nx, ny);
        if (prev.has(n) || this.occ[n] !== -1) continue;
        prev.set(n, cur);
        queue.push(n);
      }
    }
    if (goal === -1) return; // boxed in: wait for the way to clear
    let stepIdx = goal;
    while (prev.get(stepIdx) !== start) stepIdx = prev.get(stepIdx)!;
    const tx = stepIdx % BOARD_W;
    const ty = Math.floor(stepIdx / BOARD_W);
    this.occ[start] = -1;
    this.occ[stepIdx] = u.id;
    u.moveFromX = u.x;
    u.moveFromY = u.y;
    u.x = tx;
    u.y = ty;
    u.moveElapsed = 0;
    u.moveDur = MOVE_TIME;
    events.push({ type: 'move', id: u.id, fx: u.moveFromX, fy: u.moveFromY, tx, ty, dur: MOVE_TIME });
  }

  private cast(u: CUnit, target: CUnit, events: CombatEvent[]) {
    const ab = u.def.ability;
    const power = ab.power * u.abilityPower;
    const hit: CUnit[] = [];
    let cx = target.x;
    let cy = target.y;
    let radius = 0;
    switch (ab.kind) {
      case 'strike':
        hit.push(target);
        break;
      case 'nova': {
        const c = ab.center === 'self' ? u : target;
        cx = c.x;
        cy = c.y;
        radius = ab.radius ?? 1;
        for (const o of this.units) {
          if (o.alive && o.side !== u.side && dist(o.x, o.y, cx, cy) <= radius) hit.push(o);
        }
        break;
      }
      case 'volley': {
        const enemies = this.units.filter((o) => o.alive && o.side !== u.side);
        hit.push(...this.rng.shuffle(enemies).slice(0, ab.count ?? 1));
        break;
      }
      case 'heal': {
        const ally = this.units
          .filter((o) => o.alive && o.side === u.side)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.id - b.id)[0];
        cx = ally.x;
        cy = ally.y;
        events.push({ type: 'cast', id: u.id, kind: ab.kind, targets: [ally.id], x: cx, y: cy, radius });
        this.heal(ally, power, events);
        return;
      }
      case 'fortify':
        cx = u.x;
        cy = u.y;
        events.push({ type: 'cast', id: u.id, kind: ab.kind, targets: [u.id], x: cx, y: cy, radius });
        this.heal(u, power, events);
        return;
    }
    events.push({ type: 'cast', id: u.id, kind: ab.kind, targets: hit.map((h) => h.id), x: cx, y: cy, radius });
    for (const h of hit) {
      if (ab.stun && h.alive) {
        h.stunnedUntil = Math.max(h.stunnedUntil, this.time + ab.stun);
        events.push({ type: 'stun', id: h.id, dur: ab.stun });
      }
      this.damage(u, h, power, true, events);
    }
    if (ab.selfHeal) this.heal(u, ab.selfHeal * u.abilityPower, events);
  }

  private damage(src: CUnit, t: CUnit, raw: number, ability: boolean, events: CombatEvent[]) {
    if (!t.alive) return;
    // Attacks are reduced by armor; abilities ignore it.
    const amount = Math.max(1, Math.round(ability ? raw : (raw * 100) / (100 + t.armor)));
    t.hp -= amount;
    t.mana += Math.min(10, amount * 0.05);
    events.push({ type: 'damage', id: t.id, src: src.id, amount, ability });
    src.damageDealt += amount;
    if (t.hp <= 0) {
      t.hp = 0;
      t.alive = false;
      this.occ[this.idx(t.x, t.y)] = -1;
      events.push({ type: 'death', id: t.id });
    }
  }

  private heal(t: CUnit, raw: number, events: CombatEvent[]) {
    const amount = Math.round(Math.min(raw, t.maxHp - t.hp));
    t.hp += amount;
    events.push({ type: 'heal', id: t.id, amount });
  }

  private checkEnd() {
    const alive0 = this.units.filter((u) => u.alive && u.side === 0);
    const alive1 = this.units.filter((u) => u.alive && u.side === 1);
    let winner: 0 | 1 | -1 | null = null;
    if (alive0.length === 0 && alive1.length === 0) winner = -1;
    else if (alive1.length === 0) winner = 0;
    else if (alive0.length === 0) winner = 1;
    else if (this.time >= COMBAT_TIME_LIMIT) winner = -1;
    if (winner === null) return;
    this.done = true;
    this.result = { winner, survivors: [alive0, alive1], time: this.time };
  }
}
