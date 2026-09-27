// Game controller: runs the round loop and connects the sim, the 3D board and the HUD.

import { TICK, type Combat } from '../sim/combat';
import { UNITS, UNIT_BY_ID, sellValue, type Star, type SynergyId } from '../sim/data';
import { Match, preferredSlot, type Loc, type Pairing, type UnitInstance } from '../sim/match';
import { BoardRenderer } from '../render/scene';
import { renderPortraits } from '../render/portraits';
import { bust, hasConceptArt, setRenderedPortrait } from '../ui/art';
import { Front } from '../ui/front';
import { Hud, esc } from '../ui/hud';
import { store, type Settings } from '../ui/store';
import { BOARD_IDS, type BoardId } from '../ui/theme';

type State = 'front' | 'prep' | 'combat' | 'result' | 'over';

const PREP_TIME = 30;
const FIRST_PREP_TIME = 25;
const DRAG_THRESHOLD = 9;

interface Drag {
  from: Loc;
  uid: number;
  defId: string;
  star: Star;
  pointerId: number;
  x: number;
  y: number;
  active: boolean;
}

const $ = (id: string) => document.getElementById(id)!;

export class Game {
  private match!: Match;
  private state: State = 'front';
  private practice = false;
  private boardId: BoardId = 'sanctum';
  private avatars: string[] = [];
  private prepLeft = 0;
  private viewing = 0;
  private drag: Drag | null = null;
  private combat: Combat | null = null;
  private pairing: Pairing | null = null;
  private acc = 0;
  private resultWait = 0;
  private panelTimer = 0;
  private rounds: ('win' | 'loss' | 'draw')[] = [];
  private damage = new Map<string, number>();
  private lineup: { defId: string; star: Star }[] = [];
  private last = performance.now();
  readonly renderer: BoardRenderer;
  readonly hud: Hud;
  readonly front: Front;

  constructor() {
    // Figurines without a concept sheet get a rendered portrait so every card has art.
    const missing = UNITS.filter((u) => !hasConceptArt(u.id)).map((u) => u.id);
    for (const [id, p] of Object.entries(renderPortraits(missing))) setRenderedPortrait(id, p.full, p.bust);

    const canvas = $('board') as HTMLCanvasElement;
    this.renderer = new BoardRenderer(canvas, $('overlay'));
    this.hud = new Hud({
      buy: (slot) => this.buy(slot),
      reroll: () => this.reroll(),
      buyXp: () => this.buyXp(),
      toggleLock: () => {
        if (this.state !== 'prep' || this.viewing !== 0) return;
        this.match.toggleLock(this.me);
        this.refreshHud();
      },
      ready: () => this.state === 'prep' && this.startCombat(),
      scout: (id) => this.scout(id),
      menu: () => this.front.settings({ leave: () => this.leaveMatch() }),
      synergy: (id) => this.synergySheet(id),
      odds: () => this.match && this.hud.oddsSheet(this.me.level),
    });
    this.hud.onSheetClose = () => this.renderer.select(null);
    this.front = new Front(this.hud, {
      play: (practice) => this.newMatch(practice),
      settingsChanged: (s) => this.applySettings(s),
    });
    this.applySettings(store.settings);

    new ResizeObserver(() => this.resize()).observe(this.hud.stage);
    this.bindPointer(canvas);
    this.bindSheet();
    requestAnimationFrame((t) => this.loop(t));
  }

  private get me() {
    return this.match.human;
  }

  private resize() {
    const r = this.hud.stage.getBoundingClientRect();
    if (r.width && r.height) this.renderer.resize(r.width, r.height);
  }

  private applySettings(s: Settings) {
    $('app').classList.toggle('reduce-motion', s.reduceMotion);
    this.renderer.reduceMotion = s.reduceMotion;
  }

  private haptic(ms = 10) {
    if (!store.settings.haptics) return;
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* not supported */
    }
  }

  showFront() {
    this.state = 'front';
    this.cancelDrag();
    this.renderer.clearUnits();
    this.front.show('home');
  }

  // ── Match lifecycle ──

  private newMatch(practice: boolean) {
    this.hud.hideSheet();
    this.practice = practice;
    this.match = new Match((Date.now() ^ (Math.random() * 1e9)) >>> 0, store.profile.name);
    const pref = store.settings.board;
    this.boardId = BOARD_IDS.includes(pref as BoardId) ? (pref as BoardId) : BOARD_IDS[Math.floor(Math.random() * BOARD_IDS.length)];
    this.renderer.setBoard(this.boardId);
    this.hud.setBoardArt(this.boardId);
    // Each bot collects a figurine as its avatar.
    const pool = UNITS.filter((u) => hasConceptArt(u.id) && u.id !== store.profile.avatar).map((u) => u.id);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    this.avatars = [store.profile.avatar, ...pool.slice(0, 7)];
    this.rounds = [];
    this.damage.clear();
    this.lineup = [];
    this.hud.resetHpMemory();
    $('front').hidden = true;
    $('screen').hidden = true;
    $('match').hidden = false;
    this.renderer.clearUnits();
    this.match.startRound();
    this.enterPrep();
    requestAnimationFrame(() => this.resize());
  }

  private enterPrep() {
    this.state = 'prep';
    this.prepLeft = this.practice ? Infinity : this.match.round === 1 ? FIRST_PREP_TIME : PREP_TIME;
    this.viewing = 0;
    this.combat = null;
    this.pairing = null;
    this.hud.setDock('shop');
    this.hud.setReadyVisible(true);
    this.hud.setScouting(null);
    this.hud.setShopDim(false);
    this.renderer.showPlayer(this.me);
    this.refreshHud(true);
    if (this.match.round === 1) this.hud.banner('Round 1<small>Tap a card to buy, then drag it onto the board</small>', '', 3000);
  }

  private startCombat() {
    this.cancelDrag();
    this.hud.hideSheet();
    this.match.beginCombat();
    this.pairing = this.match.humanPairing() ?? null;
    this.lineup = this.me.board
      .filter((u): u is UnitInstance => !!u)
      .sort((a, b) => UNIT_BY_ID[b.defId].tier * 3 ** b.star - UNIT_BY_ID[a.defId].tier * 3 ** a.star)
      .map((u) => ({ defId: u.defId, star: u.star }));
    if (!this.pairing) {
      this.finishRound();
      return;
    }
    this.combat = this.match.createCombat(this.pairing);
    this.state = 'combat';
    this.acc = 0;
    this.resultWait = 0;
    this.panelTimer = 0;
    this.viewing = 0;
    this.renderer.startCombat(this.combat);
    this.hud.setReadyVisible(false);
    this.hud.setScouting(null);
    this.hud.setDock('combat');
    this.refreshHud();
    const opp = this.match.players[this.pairing.b];
    this.hud.banner(`VS ${esc(opp.name)}${this.pairing.ghost ? '<small>An echo of their board</small>' : ''}`, '', 1300);
  }

  private finishRound() {
    if (this.combat) {
      for (const u of this.combat.units) if (u.side === 0) this.damage.set(u.def.id, (this.damage.get(u.def.id) ?? 0) + u.damageDealt);
    }
    this.match.endCombat();
    const p = this.me;
    const res = p.lastResult ?? 'draw';
    this.rounds.push(res);
    if (res === 'win') this.hud.banner('Victory', 'win', 1800);
    else if (res === 'loss') this.hud.banner(`Defeat<small>−${p.lastDamageTaken} health</small>`, 'loss', 1800);
    else this.hud.banner(`Draw<small>−${p.lastDamageTaken} health</small>`, 'loss', 1800);
    if (res !== 'win') this.haptic(40);
    this.state = 'result';
    this.resultWait = 2.0;
    this.refreshHud();
  }

  private afterResult() {
    if (!this.me.alive || this.match.phase === 'over') {
      this.endMatch(this.me.placement || 1);
      return;
    }
    this.match.startRound();
    this.enterPrep();
  }

  private leaveMatch() {
    if (!this.match || this.state === 'front' || this.state === 'over') return;
    const placement = this.match.alivePlayers().length;
    this.me.alive = false;
    this.me.placement = placement;
    this.endMatch(placement);
  }

  private endMatch(placement: number) {
    this.state = 'over';
    this.cancelDrag();
    const lineup = this.lineup.length ? this.lineup : [{ defId: store.profile.avatar, star: 1 as Star }];
    store.addMatch({ date: Date.now(), placement, rounds: this.match.round, lineup });
    this.renderer.clearUnits();
    this.front.results({
      placement,
      rounds: this.rounds,
      lineup,
      damage: [...this.damage.entries()].sort((a, b) => b[1] - a[1]),
      board: this.boardId,
      onAgain: () => this.newMatch(this.practice),
      onHome: () => this.showFront(),
    });
  }

  // ── Actions ──

  private buy(slot: number) {
    if (this.state !== 'prep' || this.viewing !== 0) return;
    const p = this.me;
    const id = p.shop[slot];
    if (!id) return;
    if (p.gold < UNIT_BY_ID[id].tier) {
      this.hud.toast(`Not enough gold: ${UNIT_BY_ID[id].name} costs ${UNIT_BY_ID[id].tier}`);
      this.hud.bumpGold();
      return;
    }
    const merges = this.match.buy(p, slot);
    if (merges === false) {
      this.hud.toast('Bench full: sell or place a unit first');
      return;
    }
    this.haptic(merges.length ? 25 : 8);
    for (const mg of merges) this.hud.toast(`${UNIT_BY_ID[mg.defId].name} upgraded to ${'★'.repeat(mg.star)}`);
    this.syncUnits();
    this.refreshHud();
  }

  private reroll() {
    if (this.state !== 'prep' || this.viewing !== 0) return;
    if (!this.match.reroll(this.me)) {
      this.hud.toast('Not enough gold to reroll (2)');
      this.hud.bumpGold();
      return;
    }
    this.haptic(6);
    this.refreshHud(true);
  }

  private buyXp() {
    if (this.state !== 'prep' || this.viewing !== 0) return;
    const before = this.me.level;
    if (!this.match.buyXp(this.me)) {
      this.hud.toast(this.me.level >= 10 ? 'Already at max level' : 'Not enough gold for XP (4)');
      return;
    }
    if (this.me.level > before) {
      this.haptic(25);
      this.hud.toast(`Level ${this.me.level}: you can field ${this.me.level} units`);
    }
    this.refreshHud();
  }

  private scout(id: number) {
    if (this.state !== 'prep') return;
    const target = this.match.players[id];
    if (!target || (!target.alive && id !== 0)) return;
    this.cancelDrag();
    this.viewing = id === this.viewing ? 0 : id;
    const viewed = this.match.players[this.viewing];
    this.renderer.showPlayer(viewed);
    this.hud.setScouting(this.viewing === 0 ? null : viewed.name);
    this.hud.setShopDim(this.viewing !== 0);
    this.refreshHud();
  }

  private synergySheet(id: SynergyId) {
    const viewed = this.match.players[this.viewing];
    const fielded = this.combat ? this.combat.units.filter((u) => u.side === 0).map((u) => u.def.id) : this.match.boardDefIds(viewed);
    const owned = viewed.bench.filter((u): u is UnitInstance => !!u).map((u) => u.defId);
    this.hud.synergySheet(id, fielded, owned);
  }

  private refreshHud(deal = false) {
    if (!this.match) return;
    const m = this.match;
    const phase = this.state === 'prep' ? (this.practice ? 'Practice' : 'Prep') : this.state === 'combat' ? 'Combat' : 'Result';
    this.hud.setRound(m.round, phase);
    this.hud.renderPlayers(m, { viewing: this.viewing, opponent: this.state === 'prep' ? null : (this.pairing?.b ?? null), avatars: this.avatars });
    this.hud.renderEcon(m, this.me);
    this.hud.renderShop(m, this.me, deal);
    const viewed = m.players[this.viewing];
    this.hud.renderBench(viewed, { readonly: this.state !== 'prep' || this.viewing !== 0, dragging: this.drag?.active ? this.drag.uid : null });
    this.hud.renderSynergies(this.combat ? this.combat.units.filter((u) => u.side === 0).map((u) => u.def.id) : m.boardDefIds(viewed));
  }

  private syncUnits() {
    if (this.state === 'prep') this.renderer.showPlayer(this.match.players[this.viewing]);
  }

  // ── Drag and drop: bench (DOM) ⇄ board (3D) ⇄ sell zone, with taps to inspect ──

  private bindPointer(canvas: HTMLCanvasElement) {
    canvas.addEventListener('pointerdown', (e) => {
      if (this.state === 'front' || this.state === 'over' || this.drag) return;
      const key = this.renderer.pick(e.clientX, e.clientY);
      if (!key) return;
      if (key.startsWith('c')) {
        this.inspectCombatUnit(Number(key.slice(1)));
        return;
      }
      const loc = this.locOfUid(Number(key.slice(1)));
      if (!loc || this.viewing !== 0 || this.state !== 'prep') {
        this.inspectKey(key);
        return;
      }
      this.beginPress(e, loc);
    });
    this.hud.benchEl.addEventListener('pointerdown', (e) => {
      const slot = (e.target as HTMLElement).closest<HTMLElement>('.bslot[data-uid]');
      if (!slot || this.drag || this.state === 'front' || this.state === 'over') return;
      const index = Number(slot.dataset.index);
      if (this.state !== 'prep' || this.viewing !== 0) {
        this.inspectBench(index);
        return;
      }
      this.beginPress(e, { area: 'bench', index });
    });
    this.hud.benchEl.addEventListener('keydown', (e) => {
      const slot = (e.target as HTMLElement).closest<HTMLElement>('.bslot[data-uid]');
      if (slot && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        this.inspectBench(Number(slot.dataset.index));
      }
    });
    window.addEventListener('pointermove', (e) => this.onDragMove(e));
    window.addEventListener('pointerup', (e) => this.onDragEnd(e, false));
    window.addEventListener('pointercancel', (e) => this.onDragEnd(e, true));
  }

  private beginPress(e: PointerEvent, from: Loc) {
    const u = this.match.getAt(this.me, from);
    if (!u) return;
    this.drag = { from, uid: u.uid, defId: u.defId, star: u.star, pointerId: e.pointerId, x: e.clientX, y: e.clientY, active: false };
  }

  private onDragMove(e: PointerEvent) {
    const d = this.drag;
    if (!d || d.pointerId !== e.pointerId) return;
    if (!d.active) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < DRAG_THRESHOLD) return;
      d.active = true;
      const ghost = $('drag-ghost');
      ghost.innerHTML = `<img src="${bust(d.defId)}" alt="" />`;
      ghost.hidden = false;
      if (d.from.area === 'board') this.renderer.setUnitVisible(`u${d.uid}`, false);
      else this.hud.benchEl.querySelector(`.bslot[data-index="${d.from.index}"]`)?.classList.add('dragging');
      this.hud.setSellMode(sellValue(UNIT_BY_ID[d.defId], d.star));
      this.haptic(5);
    }
    $('drag-ghost').style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    const target = this.dropTargetAt(e.clientX, e.clientY);
    this.hud.setSellHover(target === 'sell');
    this.hud.markBenchTarget(target && target !== 'sell' && target.area === 'bench' ? target.index : null);
    if (target && target !== 'sell' && target.area === 'board') this.renderer.highlight(target.index, this.canDrop(d.from, target));
    else this.renderer.highlight(null);
  }

  private dropTargetAt(x: number, y: number): Loc | 'sell' | null {
    if (this.hud.isOverShop(x, y)) return 'sell';
    const slot = this.hud.benchSlotAt(x, y);
    if (slot !== null) return { area: 'bench', index: slot };
    const r = this.hud.stage.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
    const g = this.renderer.groundPoint(x, y);
    const idx = g ? this.renderer.dropTarget(g) : null;
    return idx === null ? null : { area: 'board', index: idx };
  }

  private onDragEnd(e: PointerEvent, cancelled: boolean) {
    const d = this.drag;
    if (!d || d.pointerId !== e.pointerId) return;
    if (!d.active) {
      this.drag = null;
      if (!cancelled) {
        if (d.from.area === 'bench') this.inspectBench(d.from.index);
        else this.inspectKey(`u${d.uid}`);
      }
      return;
    }
    const target = cancelled ? null : this.dropTargetAt(e.clientX, e.clientY);
    this.cancelDrag();
    if (target === 'sell') {
      const gold = this.match.sell(this.me, d.from);
      if (gold !== false) {
        this.haptic(12);
        this.hud.toast(`Sold ${UNIT_BY_ID[d.defId].name} for ${gold} gold`);
      }
    } else if (target) {
      if (!this.match.move(this.me, d.from, target)) {
        if (target.area === 'board') this.hud.toast(`Unit limit is ${this.me.level}: buy XP to field more`);
      } else this.haptic(6);
    }
    this.syncUnits();
    this.refreshHud();
  }

  private canDrop(from: Loc, to: Loc) {
    if (from.area === 'bench' && to.area === 'board' && !this.match.getAt(this.me, to)) {
      return this.match.boardCount(this.me) < this.me.level;
    }
    return true;
  }

  /** Abandon any drag in progress (also used when the prep timer runs out). */
  private cancelDrag() {
    const d = this.drag;
    this.drag = null;
    $('drag-ghost').hidden = true;
    this.renderer.highlight(null);
    this.hud.setSellMode(null);
    this.hud.markBenchTarget(null);
    if (d) {
      this.renderer.setUnitVisible(`u${d.uid}`, true);
      this.hud.benchEl.querySelector('.bslot.dragging')?.classList.remove('dragging');
    }
  }

  private locOfUid(uid: number): Loc | null {
    const bi = this.me.board.findIndex((u) => u?.uid === uid);
    if (bi !== -1) return { area: 'board', index: bi };
    const ni = this.me.bench.findIndex((u) => u?.uid === uid);
    if (ni !== -1) return { area: 'bench', index: ni };
    return null;
  }

  // ── Inspect (with tap alternatives to dragging) ──

  private inspectKey(key: string) {
    const info = this.renderer.unitDefAt(key);
    if (!info) return;
    const own = this.viewing === 0 ? this.locOfUid(Number(key.slice(1))) : null;
    this.renderer.select(key);
    this.inspectOwned(info.def.id, info.star, own);
  }

  private inspectBench(index: number) {
    const viewed = this.match.players[this.viewing];
    const u = viewed.bench[index];
    if (!u) return;
    this.inspectOwned(u.defId, u.star, this.viewing === 0 ? { area: 'bench', index } : null);
  }

  private inspectOwned(defId: string, star: Star, loc: Loc | null) {
    const canAct = !!loc && this.state === 'prep';
    const el = this.hud.unitSheet(UNIT_BY_ID[defId], star, {
      sellFor: canAct ? sellValue(UNIT_BY_ID[defId], star) : undefined,
      move: canAct ? (loc!.area === 'bench' ? 'toBoard' : 'toBench') : undefined,
    });
    el.querySelector('#sheet-sell')?.addEventListener('click', () => {
      if (loc && this.match.sell(this.me, loc) !== false) {
        this.haptic(12);
        this.hud.hideSheet();
        this.syncUnits();
        this.refreshHud();
      }
    });
    el.querySelector('#sheet-move')?.addEventListener('click', () => {
      if (!loc) return;
      let ok = false;
      if (loc.area === 'bench') {
        const slot = preferredSlot(this.me, UNIT_BY_ID[defId].range > 1);
        ok = slot !== -1 && this.match.move(this.me, loc, { area: 'board', index: slot });
        if (!ok) this.hud.toast(`Unit limit is ${this.me.level}: buy XP to field more`);
      } else {
        const free = this.me.bench.indexOf(null);
        ok = free !== -1 && this.match.move(this.me, loc, { area: 'bench', index: free });
        if (!ok) this.hud.toast('Bench full: sell a unit first');
      }
      if (ok) {
        this.haptic(6);
        this.hud.hideSheet();
        this.syncUnits();
        this.refreshHud();
      }
    });
  }

  private inspectCombatUnit(id: number) {
    const u = this.combat?.units[id];
    if (!u) return;
    this.renderer.select(`c${id}`);
    this.hud.unitSheet(u.def, u.star, { hp: u.hp, maxHp: u.maxHp });
  }

  /** In-match: synergy chips and unit tiles inside sheets open the related sheet. */
  private bindSheet() {
    $('sheet').addEventListener('click', (e) => {
      if ($('match').hidden || !this.match) return;
      const t = e.target as HTMLElement;
      const syn = t.closest<HTMLElement>('[data-syn]')?.dataset.syn;
      if (syn) this.synergySheet(syn as SynergyId);
      const unit = t.closest<HTMLElement>('[data-unit]')?.dataset.unit;
      if (unit) this.hud.unitSheet(UNIT_BY_ID[unit], 1);
    });
  }

  // ── Main loop ──

  private loop(now: number) {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;

    if (this.state === 'prep') {
      this.prepLeft -= dt;
      this.hud.setTimer(Number.isFinite(this.prepLeft) ? this.prepLeft : null);
      if (this.prepLeft <= 0) this.startCombat();
    } else if (this.state === 'combat' && this.combat) {
      this.acc += dt * store.settings.speed;
      while (this.acc >= TICK && !this.combat.done) {
        this.renderer.combatEvents(this.combat.step());
        this.acc -= TICK;
      }
      this.renderer.updateCombat(this.combat.done ? 0 : this.acc / TICK);
      this.hud.setTimer(null);
      this.panelTimer -= dt;
      if (this.panelTimer <= 0) {
        this.panelTimer = 0.25;
        this.hud.renderCombat(this.combat, this.match.round, this.match.players[this.pairing!.b].name, this.pairing!.ghost);
      }
      if (this.combat.done) {
        this.resultWait += dt;
        if (this.resultWait > 0.9) this.finishRound();
      }
    } else if (this.state === 'result') {
      this.resultWait -= dt;
      if (this.resultWait <= 0) this.afterResult();
    }

    if (!$('match').hidden) this.renderer.frame(dt);
    requestAnimationFrame((t) => this.loop(t));
  }
}
