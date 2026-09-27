// Game controller: runs the round loop and connects the sim, the 3D board and the HUD.

import { TICK, type Combat } from '../sim/combat';
import { UNIT_BY_ID, sellValue } from '../sim/data';
import { Match, type Loc, type Pairing } from '../sim/match';
import { BoardRenderer } from '../render/scene';
import { HOW_TO_PLAY, Hud, esc } from '../ui/hud';
import { SKINS, type SkinId } from '../ui/skins';

type State = 'menu' | 'prep' | 'combat' | 'result' | 'over';

const PREP_TIME = 30;
const FIRST_PREP_TIME = 25;
const DRAG_THRESHOLD = 8;

interface Press {
  key: string | null;
  x: number;
  y: number;
  pointerId: number;
  dragging: boolean;
  from: Loc | null;
}

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode): settings just won't persist */
  }
}

const haptic = (ms = 10) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* not supported */
  }
};

export class Game {
  private match!: Match;
  private state: State = 'menu';
  private prepLeft = 0;
  private viewing = 0;
  private press: Press | null = null;
  private combat: Combat | null = null;
  private pairing: Pairing | null = null;
  private acc = 0;
  private resultWait = 0;
  private panelTimer = 0;
  private speed = load('ct.speed', 1);
  private skin: SkinId = load<SkinId>('ct.skin', 'painted');
  private last = performance.now();
  readonly renderer: BoardRenderer;
  readonly hud: Hud;

  constructor() {
    const canvas = document.getElementById('board') as HTMLCanvasElement;
    this.renderer = new BoardRenderer(canvas, document.getElementById('overlay')!);
    this.hud = new Hud({
      buy: (slot) => this.buy(slot),
      reroll: () => this.reroll(),
      buyXp: () => this.buyXp(),
      toggleLock: () => {
        if (this.state !== 'prep') return;
        this.match.toggleLock(this.me);
        this.refreshHud();
      },
      ready: () => this.state === 'prep' && this.startCombat(),
      scout: (id) => this.scout(id),
      openSettings: () => this.openSettings(),
    });
    this.hud.onSynergyTap = (id) => this.hud.synergySheet(id, this.match.boardDefIds(this.match.players[this.viewing]));
    this.hud.onLevelTap = () => this.match && this.hud.oddsSheet(this.me.level);
    if (!SKINS[this.skin]) this.skin = 'painted';
    this.applySkin(this.skin);

    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.hud.stage);
    this.resize();
    this.bindPointer(canvas);
    requestAnimationFrame((t) => this.loop(t));
  }

  private get me() {
    return this.match.human;
  }

  private resize() {
    const r = this.hud.stage.getBoundingClientRect();
    this.renderer.resize(r.width, r.height);
  }

  private applySkin(id: SkinId) {
    this.skin = id;
    save('ct.skin', id);
    this.hud.setSkin(id);
    this.renderer.setSkin(id);
  }

  // ── Screens ──

  showMenu() {
    this.state = 'menu';
    const el = this.hud.showScreen(`
      <h1>Crowns<br/>&amp; Tiles</h1>
      <p class="sub">Auto battler prototype · 8 players · portrait</p>
      <button class="btn" id="play">Play vs 7 bots</button>
      <div class="how">${HOW_TO_PLAY}</div>
      <p class="sub">Art style preview</p>
      <div class="seg">${(Object.keys(SKINS) as SkinId[])
        .map((id) => `<button data-skin="${id}" class="${id === this.skin ? 'on' : ''}">${SKINS[id].label}</button>`)
        .join('')}</div>`);
    el.querySelector('#play')!.addEventListener('click', () => this.newMatch());
    el.querySelectorAll<HTMLElement>('[data-skin]').forEach((b) =>
      b.addEventListener('click', () => {
        this.applySkin(b.dataset.skin as SkinId);
        this.showMenu();
      }),
    );
  }

  private newMatch() {
    this.hud.hideScreen();
    this.hud.hideSheet();
    this.match = new Match((Date.now() ^ (Math.random() * 1e9)) >>> 0);
    this.renderer.clearUnits();
    this.match.startRound();
    this.enterPrep();
  }

  private showGameOver() {
    this.state = 'over';
    const p = this.me;
    const won = p.placement === 1;
    const el = this.hud.showScreen(`
      <p class="sub">${won ? 'Victory!' : 'Eliminated'}</p>
      <div class="place">#${p.placement}</div>
      <h1 style="font-size:28px">${won ? 'You are the last one standing' : `You finished ${ordinal(p.placement)}`}</h1>
      <p class="sub">Survived ${this.match.round} rounds · level ${p.level}</p>
      <button class="btn" id="again">Play again</button>
      <button class="btn ghost" id="menu">Main menu</button>`);
    el.querySelector('#again')!.addEventListener('click', () => this.newMatch());
    el.querySelector('#menu')!.addEventListener('click', () => this.showMenu());
  }

  private openSettings() {
    this.hud.settingsSheet(this.skin, this.speed, {
      skin: (id) => {
        this.applySkin(id);
        this.openSettings();
      },
      speed: (s) => {
        this.speed = s;
        save('ct.speed', s);
        this.openSettings();
      },
      restart: () => {
        this.hud.hideSheet();
        this.renderer.clearUnits();
        this.showMenu();
      },
      help: () => this.hud.showSheet(`<h3>How to play</h3>${HOW_TO_PLAY}`),
    });
  }

  // ── Phases ──

  private enterPrep() {
    this.state = 'prep';
    this.prepLeft = this.match.round === 1 ? FIRST_PREP_TIME : PREP_TIME;
    this.viewing = 0;
    this.combat = null;
    this.hud.showCombatPanel(false);
    this.hud.setReadyVisible(true);
    this.hud.setScouting(null);
    this.hud.setShopDim(false);
    this.hud.markReroll();
    this.renderer.showPlayer(this.me);
    this.refreshHud();
    if (this.match.round === 1) this.hud.banner('Round 1<small>Buy units and drag them onto the board</small>', '', 2600);
  }

  private startCombat() {
    this.cancelDrag();
    this.hud.hideSheet();
    this.match.beginCombat();
    this.pairing = this.match.humanPairing() ?? null;
    if (!this.pairing) {
      this.finishRound();
      return;
    }
    this.combat = this.match.createCombat(this.pairing);
    this.state = 'combat';
    this.acc = 0;
    this.resultWait = 0;
    this.viewing = 0;
    this.renderer.startCombat(this.combat);
    this.renderer.showBench(this.me);
    this.hud.setReadyVisible(false);
    this.hud.setScouting(null);
    this.hud.showCombatPanel(true);
    this.refreshHud();
    const opp = this.match.players[this.pairing.b];
    this.hud.banner(`VS ${esc(opp.name)}${this.pairing.ghost ? '<small>Echo of their board</small>' : ''}`, '', 1300);
  }

  private finishRound() {
    this.match.endCombat();
    const p = this.me;
    const res = p.lastResult;
    if (res === 'win') this.hud.banner('VICTORY', 'win', 1800);
    else if (res === 'loss') this.hud.banner(`DEFEAT<small>−${p.lastDamageTaken} health</small>`, 'loss', 1800);
    else if (res === 'draw') this.hud.banner(`DRAW<small>−${p.lastDamageTaken} health</small>`, 'loss', 1800);
    if (res !== 'win') haptic(40);
    this.state = 'result';
    this.resultWait = 2.0;
    this.refreshHud();
  }

  private afterResult() {
    if (!this.me.alive || this.match.phase === 'over') {
      this.renderer.clearUnits();
      this.showGameOver();
      return;
    }
    this.match.startRound();
    this.enterPrep();
  }

  // ── Actions ──

  private buy(slot: number) {
    if (this.state !== 'prep' && this.state !== 'combat' && this.state !== 'result') return;
    if (this.viewing !== 0) return;
    const p = this.me;
    const id = p.shop[slot];
    if (!id) return;
    if (p.gold < UNIT_BY_ID[id].tier) {
      this.hud.toast('Not enough gold');
      this.hud.bumpGold();
      return;
    }
    const merges = this.match.buy(p, slot);
    if (merges === false) {
      this.hud.toast('Bench is full: sell or place a unit');
      return;
    }
    haptic(merges.length ? 25 : 8);
    for (const mg of merges) this.hud.toast(`${UNIT_BY_ID[mg.defId].name} upgraded to ${'★'.repeat(mg.star)}!`);
    this.syncUnits();
    this.refreshHud();
  }

  private reroll() {
    if (this.state === 'menu' || this.state === 'over' || this.viewing !== 0) return;
    if (!this.match.reroll(this.me)) {
      this.hud.toast('Not enough gold');
      this.hud.bumpGold();
      return;
    }
    haptic(6);
    this.hud.markReroll();
    this.refreshHud();
  }

  private buyXp() {
    if (this.state === 'menu' || this.state === 'over' || this.viewing !== 0) return;
    const before = this.me.level;
    if (!this.match.buyXp(this.me)) {
      this.hud.toast(this.me.level >= 10 ? 'Max level' : 'Not enough gold');
      return;
    }
    if (this.me.level > before) {
      haptic(25);
      this.hud.toast(`Level ${this.me.level}! You can field ${this.me.level} units`);
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

  private refreshHud() {
    if (!this.match) return;
    const m = this.match;
    const phase = this.state === 'prep' ? 'PREPARE' : this.state === 'combat' ? 'COMBAT' : this.state === 'result' ? 'RESULT' : '';
    this.hud.setRound(m.round, phase);
    this.hud.renderPlayers(m, { viewing: this.viewing, opponent: this.state === 'prep' ? null : (this.pairing?.b ?? null) });
    this.hud.renderEcon(m, this.me);
    this.hud.renderShop(m, this.me);
    const viewed = m.players[this.viewing];
    this.hud.renderSynergies(this.combat ? this.combat.units.filter((u) => u.side === 0).map((u) => u.def.id) : m.boardDefIds(viewed));
  }

  // ── Pointer: tap to inspect, drag to move / sell ──

  private bindPointer(canvas: HTMLCanvasElement) {
    canvas.addEventListener('pointerdown', (e) => {
      if (this.state === 'menu' || this.state === 'over' || this.press) return;
      const key = this.renderer.pick(e.clientX, e.clientY);
      this.press = { key, x: e.clientX, y: e.clientY, pointerId: e.pointerId, dragging: false, from: key ? this.locOf(key) : null };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      const pr = this.press;
      if (!pr || pr.pointerId !== e.pointerId) return;
      const canDrag = pr.key?.startsWith('u') && pr.from && this.viewing === 0 && (this.state === 'prep' || pr.from.area === 'bench');
      if (!pr.dragging) {
        if (!canDrag || Math.hypot(e.clientX - pr.x, e.clientY - pr.y) < DRAG_THRESHOLD) return;
        pr.dragging = true;
        const u = this.match.getAt(this.me, pr.from!)!;
        this.hud.setSellMode(sellValue(UNIT_BY_ID[u.defId], u.star));
        haptic(5);
      }
      const g = this.renderer.groundPoint(e.clientX, e.clientY);
      if (g) this.renderer.setDragPosition(pr.key!, g);
      const overShop = this.hud.isOverShop(e.clientX, e.clientY);
      this.hud.setSellHover(overShop);
      const target = g && !overShop ? this.renderer.dropTarget(g) : null;
      const valid = !!target && (this.state === 'prep' || target.area === 'bench') && this.canDrop(pr.from!, target);
      this.renderer.highlight(target, valid);
    });
    const end = (e: PointerEvent) => {
      const pr = this.press;
      if (!pr || pr.pointerId !== e.pointerId) return;
      this.press = null;
      if (!pr.dragging) {
        if (pr.key) this.inspect(pr.key);
        return;
      }
      this.renderer.highlight(null);
      this.hud.setSellMode(null);
      const g = this.renderer.groundPoint(e.clientX, e.clientY);
      const from = pr.from!;
      if (e.type === 'pointerup' && this.hud.isOverShop(e.clientX, e.clientY)) {
        const gold = this.match.sell(this.me, from);
        if (gold !== false) {
          haptic(12);
          this.hud.toast(`Sold for ${gold} gold`);
        }
      } else if (e.type === 'pointerup' && g) {
        const target = this.renderer.dropTarget(g);
        if (target && !this.match.move(this.me, from, target) && target.area === 'board') {
          if (this.state !== 'prep') this.hud.toast('Board is locked during combat');
          else this.hud.toast(`Unit limit ${this.me.level}: buy XP to field more`);
        } else if (target) haptic(6);
      }
      this.syncAfterDrag();
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  }

  private canDrop(from: Loc, to: Loc) {
    if (from.area === 'bench' && to.area === 'board' && !this.match.getAt(this.me, to)) {
      return this.match.boardCount(this.me) < this.me.level;
    }
    return true;
  }

  /** Refresh the scene after a drag: prep redraws board and bench; during combat only the bench. */
  private syncAfterDrag() {
    this.syncUnits();
    this.refreshHud();
  }

  private syncUnits() {
    if (this.state === 'prep') this.renderer.showPlayer(this.viewing === 0 ? this.me : this.match.players[this.viewing]);
    else this.renderer.showBench(this.me);
  }

  private cancelDrag() {
    if (!this.press) return;
    this.press = null;
    this.renderer.highlight(null);
    this.hud.setSellMode(null);
    this.syncUnits();
  }

  private locOf(key: string): Loc | null {
    if (!key.startsWith('u') || this.viewing !== 0) return null;
    const uid = Number(key.slice(1));
    const bi = this.me.board.findIndex((u) => u?.uid === uid);
    if (bi !== -1) return { area: 'board', index: bi };
    const ni = this.me.bench.findIndex((u) => u?.uid === uid);
    if (ni !== -1) return { area: 'bench', index: ni };
    return null;
  }

  private inspect(key: string) {
    const info = this.renderer.unitDefAt(key);
    if (!info) return;
    if (key.startsWith('c') && this.combat) {
      const u = this.combat.units[Number(key.slice(1))];
      this.hud.unitSheet(u.def, u.star, { hp: u.hp, maxHp: u.maxHp });
      return;
    }
    const loc = this.locOf(key);
    const canSell = !!loc && (this.state === 'prep' || loc.area === 'bench');
    const el = this.hud.unitSheet(info.def, info.star, { sellFor: canSell ? sellValue(info.def, info.star) : undefined });
    el.querySelector('#sheet-sell')?.addEventListener('click', () => {
      if (loc && this.match.sell(this.me, loc) !== false) {
        haptic(12);
        this.hud.hideSheet();
        this.syncUnits();
        this.refreshHud();
      }
    });
  }

  // ── Main loop ──

  private loop(now: number) {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;

    if (this.state === 'prep') {
      this.prepLeft -= dt;
      this.hud.setTimer(this.prepLeft);
      if (this.prepLeft <= 0 && !this.press) this.startCombat();
    } else if (this.state === 'combat' && this.combat) {
      this.acc += dt * this.speed;
      while (this.acc >= TICK && !this.combat.done) {
        this.renderer.combatEvents(this.combat.step());
        this.acc -= TICK;
      }
      this.renderer.updateCombat(this.combat.done ? 0 : this.acc / TICK);
      this.hud.setTimer(null);
      this.panelTimer -= dt;
      if (this.panelTimer <= 0) {
        this.panelTimer = 0.25;
        const opp = this.match.players[this.pairing!.b];
        this.hud.renderCombatPanel(this.combat, opp.name, this.pairing!.ghost);
      }
      if (this.combat.done) {
        this.resultWait += dt;
        if (this.resultWait > 0.9) this.finishRound();
      }
    } else if (this.state === 'result') {
      this.resultWait -= dt;
      if (this.resultWait <= 0) this.afterResult();
    }

    this.renderer.frame(dt);
    requestAnimationFrame((t) => this.loop(t));
  }
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
