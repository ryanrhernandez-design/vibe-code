import { describe, expect, it } from 'vitest';
import { Combat, type CombatUnitSpec } from './combat';
import { SHOP_ODDS, UNITS, XP_TO_NEXT } from './data';
import { Match } from './match';
import { Rng } from './rng';
import { computeSynergies } from './synergy';

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    expect([a.next(), a.next(), a.int(100)]).toEqual([b.next(), b.next(), b.int(100)]);
  });
});

describe('data', () => {
  it('shop odds add up to 100 at every level', () => {
    for (let lvl = 1; lvl <= 10; lvl++) expect(SHOP_ODDS[lvl].reduce((s, n) => s + n, 0)).toBe(100);
  });
  it('has 6 units per faction and unique ids', () => {
    expect(new Set(UNITS.map((u) => u.id)).size).toBe(UNITS.length);
    for (const f of ['sun', 'tide', 'wild']) expect(UNITS.filter((u) => u.faction === f)).toHaveLength(6);
  });
  it('has an XP requirement for every level below the cap', () => {
    for (let lvl = 1; lvl < 10; lvl++) expect(XP_TO_NEXT[lvl]).toBeGreaterThan(0);
  });
});

describe('synergies', () => {
  it('counts distinct units only', () => {
    const s = computeSynergies(['warden', 'warden', 'lumen']);
    expect(s.find((x) => x.def.id === 'sun')).toMatchObject({ count: 2, level: 1 });
    expect(s.find((x) => x.def.id === 'guardian')).toMatchObject({ count: 1, level: 0 });
  });
});

describe('combat', () => {
  const sides = (): [CombatUnitSpec[], CombatUnitSpec[]] => [
      [
        { defId: 'warden', star: 1 as const, x: 3, y: 3 },
        { defId: 'lumen', star: 1 as const, x: 3, y: 0 },
      ],
      [
        { defId: 'brute', star: 1 as const, x: 3, y: 4 },
        { defId: 'deadeye', star: 1 as const, x: 2, y: 7 },
      ],
  ];

  it('is deterministic for the same seed', () => {
    const a = new Combat(sides(), 7).runToEnd();
    const b = new Combat(sides(), 7).runToEnd();
    expect(a.winner).toBe(b.winner);
    expect(a.time).toBeCloseTo(b.time);
    expect(a.survivors[0].map((u) => u.hp)).toEqual(b.survivors[0].map((u) => u.hp));
  });

  it('a 2-star unit beats a 1-star copy of itself', () => {
    const res = new Combat(
      [[{ defId: 'thornfang', star: 2, x: 3, y: 3 }], [{ defId: 'thornfang', star: 1, x: 3, y: 4 }]],
      1,
    ).runToEnd();
    expect(res.winner).toBe(0);
  });

  it('ends with a winner when one side is empty', () => {
    const res = new Combat([[{ defId: 'warden', star: 1, x: 0, y: 0 }], []], 1).runToEnd();
    expect(res.winner).toBe(0);
    expect(res.time).toBe(0);
  });
});

describe('match', () => {
  it('merges three copies into a 2-star unit', () => {
    const m = new Match(1);
    m.startRound();
    const p = m.human;
    p.gold = 10;
    p.shop = ['warden', 'warden', 'warden', null, null];
    m.buy(p, 0);
    m.buy(p, 1);
    const merges = m.buy(p, 2);
    expect(merges).toEqual([{ defId: 'warden', star: 2 }]);
    expect(m.allUnits(p).filter((u) => u.defId === 'warden')).toEqual([expect.objectContaining({ star: 2 })]);
    expect(p.gold).toBe(7);
  });

  it('allows buying into a merge with a full bench', () => {
    const m = new Match(2);
    m.startRound();
    const p = m.human;
    p.gold = 50;
    const ids = ['lumen', 'lumen', 'mossback', 'warden', 'brute', 'deadeye', 'thornfang', 'huntress'];
    p.bench = ids.map((defId, i) => ({ uid: 1000 + i, defId, star: i === 2 ? 2 : 1 }));
    p.shop = ['lumen', 'thornfang', null, null, null];
    expect(m.buy(p, 1)).toBe(false);
    expect(m.buy(p, 0)).toEqual([{ defId: 'lumen', star: 2 }]);
    expect(p.bench).toHaveLength(8);
  });

  it('refunds gold when selling and respects the unit cap', () => {
    const m = new Match(3);
    m.startRound();
    const p = m.human;
    p.gold = 0;
    p.bench[0] = { uid: 500, defId: 'lancer', star: 1 };
    p.bench[1] = { uid: 501, defId: 'warden', star: 1 };
    expect(m.move(p, { area: 'bench', index: 0 }, { area: 'board', index: 3 })).toBe(true);
    expect(m.move(p, { area: 'bench', index: 1 }, { area: 'board', index: 4 })).toBe(false); // level 1 → cap 1
    expect(m.sell(p, { area: 'board', index: 3 })).toBe(4);
    expect(p.gold).toBe(4);
  });

  it('plays a full 8-bot match to a single winner', () => {
    const m = new Match(12345, 'Bot', true);
    let rounds = 0;
    while (m.phase !== 'over' && rounds < 80) {
      m.startRound();
      m.beginCombat();
      m.endCombat();
      rounds++;
    }
    expect(m.phase).toBe('over');
    const placements = m.players.map((p) => p.placement).sort((a, b) => a - b);
    expect(placements).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(rounds).toBeGreaterThan(8);
    expect(m.players.some((p) => p.level >= 6)).toBe(true);
    expect(m.players.some((p) => m.allUnits(p).some((u) => u.star >= 2)) || m.players.every((p) => !p.alive || p.placement === 1)).toBe(true);
  });

  it('replaying a pairing gives the same result as the headless run', () => {
    const m = new Match(99, 'Bot', true);
    for (let i = 0; i < 6; i++) {
      m.startRound();
      m.beginCombat();
      for (const pr of m.pairings) expect(m.createCombat(pr).runToEnd().winner).toBe(pr.result!.winner);
      m.endCombat();
    }
  });
});

describe('pairings', () => {
  it('always seats the human on the bottom side (side 0) of their fight', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const m = new Match(seed, 'You', true);
      m.startRound();
      m.beginCombat();
      const pr = m.humanPairing();
      expect(pr?.a).toBe(0);
      expect(m.pairings.filter((p) => p.a === 0 || (p.b === 0 && !p.ghost))).toHaveLength(1);
    }
  });
});
