// Match HUD: renders match state into the portrait layout and forwards taps to the controller.
// Layout and components follow the Type C Comprehensive UI Proposal.

import {
  FACTION_COLORS, SHOP_ODDS, SYNERGY_BY_ID, UNITS, UNIT_BY_ID, REROLL_COST, XP_COST, STAR_ABILITY_MULT,
  abilityText, STAR_STAT_MULT, type Star, type SynergyId, type UnitDef,
} from '../sim/data';
import type { Combat } from '../sim/combat';
import type { Match, Player } from '../sim/match';
import { computeSynergies } from '../sim/synergy';
import { bust, portrait, boardArt } from './art';
import { FACTION_MARK, ICON, ROLE_MARK } from './icons';
import { BOARDS, FACTION_PALETTE, TIER_COLORS, type BoardId } from './theme';

export interface HudActions {
  buy(slot: number): void;
  reroll(): void;
  buyXp(): void;
  toggleLock(): void;
  ready(): void;
  scout(playerId: number): void;
  menu(): void;
  synergy(id: SynergyId): void;
  odds(): void;
}

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function synMark(id: SynergyId) {
  return id === 'sun' || id === 'tide' || id === 'wild' ? FACTION_MARK[id] : ROLE_MARK[id];
}

/** Portrait <img>; units without art fall back to their faction colour. */
export function unitImg(defId: string, kind: 'bust' | 'full', alt = '') {
  const src = kind === 'bust' ? bust(defId) : portrait(defId);
  const fallback = FACTION_PALETTE[UNIT_BY_ID[defId].faction].main;
  return src
    ? `<img src="${src}" alt="${esc(alt)}" loading="lazy" draggable="false" />`
    : `<img alt="${esc(alt)}" style="background:${fallback}" />`;
}

export function starRow(star: number) {
  return `<div class="starrow" aria-label="${star} star${star > 1 ? 's' : ''}">${[1, 2, 3]
    .map((i) => (i <= star ? ICON.star : `<span class="dim">${ICON.starEmpty}</span>`))
    .join('')}</div>`;
}

const shortName = (def: UnitDef) => def.name.replace(/^The /, '');

export class Hud {
  readonly stage = $('stage');
  readonly dock = $('dock');
  readonly benchEl = $('bench');
  private bannerTimer = 0;
  private toastTimer = 0;
  private lastHp = new Map<number, number>();

  constructor(actions: HudActions) {
    $('btn-menu').innerHTML = ICON.gear;
    $('hp-icon').innerHTML = ICON.heart;
    $('gold-icon').innerHTML = ICON.coin;
    $('sell-icon').innerHTML = ICON.sell;
    $('btn-reroll').innerHTML = `${ICON.reroll}<small>${ICON.coin}${REROLL_COST}</small>`;
    $('btn-xp').innerHTML = `${ICON.xp}<small>${ICON.coin}${XP_COST}</small>`;
    $('btn-ready').innerHTML = `Ready ${ICON.play}`;

    $('cards').addEventListener('click', (e) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('.card[data-slot]');
      if (card) actions.buy(Number(card.dataset.slot));
    });
    $('btn-reroll').addEventListener('click', () => actions.reroll());
    $('btn-xp').addEventListener('click', () => actions.buyXp());
    $('btn-lock').addEventListener('click', () => actions.toggleLock());
    $('btn-ready').addEventListener('click', () => actions.ready());
    $('btn-menu').addEventListener('click', () => actions.menu());
    $('btn-level').addEventListener('click', () => actions.odds());
    $('scout-back').addEventListener('click', () => actions.scout(0));
    $('players').addEventListener('click', (e) => {
      const chip = (e.target as HTMLElement).closest<HTMLElement>('.pchip');
      if (chip) actions.scout(Number(chip.dataset.id));
    });
    $('synergies').addEventListener('click', (e) => {
      const chip = (e.target as HTMLElement).closest<HTMLElement>('.syn');
      if (chip) actions.synergy(chip.dataset.id as SynergyId);
    });
    $('sheet-backdrop').addEventListener('click', () => this.hideSheet());
    $('sheet').addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-close]')) this.hideSheet();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.sheetOpen) this.hideSheet();
    });
  }

  setBoardArt(id: BoardId) {
    const art = $('stage-art');
    art.style.backgroundImage = `url("${boardArt(id)}")`;
    art.style.setProperty('--stage-tint', BOARDS[id].tint);
  }

  // ── Header ──
  setRound(round: number, phase: string) {
    $('round-label').textContent = `Round ${round}`;
    $('phase-label').textContent = phase;
  }

  setTimer(seconds: number | null) {
    const el = $('timer');
    if (seconds === null) {
      el.textContent = '';
      el.classList.remove('warn');
      return;
    }
    const s = Math.max(0, Math.ceil(seconds));
    el.textContent = `0:${String(s).padStart(2, '0')}`;
    el.classList.toggle('warn', s <= 5);
  }

  // ── Player strip ──
  renderPlayers(m: Match, opts: { viewing: number; opponent: number | null; avatars: string[] }) {
    const sorted = [...m.players].sort((a, b) => {
      if (a.alive !== b.alive) return a.alive ? -1 : 1;
      if (!a.alive) return a.placement - b.placement;
      return b.hp - a.hp || a.id - b.id;
    });
    $('players').innerHTML = sorted
      .map((p) => {
        const cls = ['pchip', p.isHuman && 'me', !p.alive && 'dead', p.id === opts.opponent && 'opp', p.id === opts.viewing && p.id !== 0 && 'viewing']
          .filter(Boolean)
          .join(' ');
        const streak = Math.abs(p.streak) >= 2 ? `<span class="streak ${p.streak > 0 ? 'win' : 'loss'}">${Math.abs(p.streak)}</span>` : '';
        const status = p.alive ? `${p.hp} health` : `eliminated, ${p.placement}th`;
        return `<button class="${cls}" data-id="${p.id}" aria-label="${esc(p.name)}, ${status}${p.id === opts.opponent ? ', current opponent' : ''}">
          ${streak}${unitImg(opts.avatars[p.id], 'bust')}<span class="php">${p.alive ? p.hp : '#' + p.placement}</span></button>`;
      })
      .join('');
    for (const p of m.players) {
      const prev = this.lastHp.get(p.id);
      if (prev !== undefined && p.hp < prev) {
        document.querySelector(`.pchip[data-id="${p.id}"]`)?.classList.add('hit');
        if (p.isHuman) this.pulse($('hp').parentElement!, 'hit');
      }
      this.lastHp.set(p.id, p.hp);
    }
    $('hp').textContent = String(m.human.hp);
  }

  resetHpMemory() {
    this.lastHp.clear();
  }

  // ── Economy + shop ──
  renderEcon(m: Match, p: Player) {
    $('gold').textContent = String(p.gold);
    $('interest').textContent = `+${m.interestPreview(p)}`;
    $('level').textContent = String(p.level);
    const need = m.xpToNext(p);
    $('xpfill').style.width = Number.isFinite(need) ? `${(p.xp / need) * 100}%` : '100%';
    const cap = $('cap');
    cap.textContent = `${m.boardCount(p)}/${p.level}`;
    cap.classList.toggle('over', m.boardCount(p) > p.level);
    $('btn-xp').classList.toggle('disabled', p.gold < XP_COST || !Number.isFinite(need));
    $('btn-reroll').classList.toggle('disabled', p.gold < REROLL_COST);
    const lock = $('btn-lock');
    lock.classList.toggle('on', p.shopLocked);
    lock.innerHTML = `${p.shopLocked ? ICON.lock : ICON.unlock}<small>${p.shopLocked ? 'Locked' : 'Lock'}</small>`;
    lock.setAttribute('aria-pressed', String(p.shopLocked));
  }

  renderShop(m: Match, p: Player, deal = false) {
    $('cards').innerHTML = p.shop
      .map((id, slot) => {
        if (!id) return `<div class="card empty" aria-label="Sold"></div>`;
        const def = UNIT_BY_ID[id];
        const merge = m.wouldMerge(p, id);
        const nextStar = merge && m.ownedCopies(p, id, 2) >= 2 ? 3 : 2;
        const cls = ['card', merge && 'merge-ready', p.gold < def.tier && 'poor'].filter(Boolean).join(' ');
        return `<button class="${cls}" data-slot="${slot}" style="--tier:${TIER_COLORS[def.tier]};--fac:${SYNERGY_BY_ID[def.faction].color};${deal ? `animation-delay:${slot * 30}ms` : 'animation:none'}"
            aria-label="Buy ${esc(def.name)}, tier ${def.tier}, ${def.tier} gold${merge ? `, completes ${nextStar} star` : ''}">
          <div class="art">${unitImg(id, 'bust')}
            <div class="marks"><span>${FACTION_MARK[def.faction]}</span><span class="role">${ROLE_MARK[def.role]}</span></div>
            ${merge ? `<span class="merge">Merge ${'★'.repeat(nextStar)}</span>` : ''}
            <span class="cost">${ICON.coin}${def.tier}</span></div>
          <div class="name">${esc(shortName(def))}</div>
          <div class="stripe">TIER ${def.tier}</div></button>`;
      })
      .join('');
  }

  renderBench(p: Player, opts: { readonly: boolean; dragging: number | null }) {
    this.benchEl.innerHTML = p.bench
      .map((u, i) => {
        if (!u) return `<div class="bslot" data-index="${i}" aria-label="Empty bench slot"></div>`;
        const def = UNIT_BY_ID[u.defId];
        const cls = ['bslot', 'filled', opts.readonly && 'readonly', opts.dragging === u.uid && 'dragging'].filter(Boolean).join(' ');
        return `<div class="${cls}" data-index="${i}" data-uid="${u.uid}" role="button" tabindex="0" style="--tier:${TIER_COLORS[def.tier]}"
            aria-label="${esc(def.name)}, ${u.star} star, bench slot ${i + 1}">
          <span class="tier"></span>${unitImg(u.defId, 'bust')}<span class="stars">${'★'.repeat(u.star)}</span></div>`;
      })
      .join('');
  }

  benchSlotAt(x: number, y: number): number | null {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('.bslot');
    return el && this.benchEl.contains(el) ? Number(el.dataset.index) : null;
  }

  markBenchTarget(index: number | null) {
    this.benchEl.querySelectorAll('.bslot.target').forEach((e) => e.classList.remove('target'));
    if (index !== null) this.benchEl.querySelector(`.bslot[data-index="${index}"]`)?.classList.add('target');
  }

  setShopDim(dim: boolean) {
    this.dock.classList.toggle('dim', dim);
  }

  setSellMode(value: number | null) {
    this.dock.classList.toggle('sell-mode', value !== null);
    if (value !== null) $('sell-value').textContent = `${value} gold`;
    else this.dock.classList.remove('hover');
  }

  setSellHover(on: boolean) {
    this.dock.classList.toggle('hover', on);
  }

  isOverShop(x: number, y: number) {
    if (this.dock.hidden) return false;
    const r = this.dock.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  // ── Synergy strip ──
  renderSynergies(defIds: string[]) {
    $('synergies').innerHTML = computeSynergies(defIds)
      .map((s) => {
        const next = s.def.thresholds.find((t) => t > s.count);
        const count = next ? `${s.count}/${next}` : `${s.count} · max`;
        return `<button class="syn ${s.level ? 'on' : ''} l${s.level}" data-id="${s.def.id}" style="--syn:${s.def.color}"
            aria-label="${s.def.name}: ${next ? `${s.count} of ${next}` : `${s.count}, maximum bonus`}${s.level ? ', active' : ''}">
          <span class="mark">${synMark(s.def.id)}</span>${s.def.name} <b>${count}</b></button>`;
      })
      .join('');
  }

  // ── Stage overlays ──
  setReadyVisible(v: boolean) {
    $('btn-ready').hidden = !v;
  }

  setScouting(name: string | null) {
    $('scout-banner').hidden = name === null;
    if (name) $('scout-name').textContent = name;
  }

  banner(html: string, cls: string, ms: number) {
    const el = $('banner');
    el.className = `banner ${cls}`;
    el.innerHTML = html;
    el.hidden = false;
    clearTimeout(this.bannerTimer);
    this.bannerTimer = window.setTimeout(() => (el.hidden = true), ms);
  }

  toast(msg: string) {
    const el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => (el.hidden = true), 1800);
  }

  pulse(el: HTMLElement, cls: string) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  bumpGold() {
    this.pulse($('gold').parentElement!, 'bump');
  }

  // ── Combat dock ──
  setDock(mode: 'shop' | 'combat') {
    this.dock.hidden = mode !== 'shop';
    $('combat-dock').hidden = mode !== 'combat';
  }

  renderCombat(c: Combat, round: number, opponent: string, ghost: boolean) {
    const mine = c.units.filter((u) => u.side === 0).sort((a, b) => b.damageDealt - a.damageDealt).slice(0, 4);
    const total = Math.max(1, c.units.filter((u) => u.side === 0).reduce((s, u) => s + u.damageDealt, 0));
    const max = Math.max(1, ...mine.map((u) => u.damageDealt));
    $('combat-dock').innerHTML =
      `<h4>${ICON.swords} ${c.done ? 'Battle over' : 'Battle in progress'}</h4>
       <p class="sub">Round ${round} · vs ${esc(opponent)}${ghost ? ' (echo of their board)' : ''} · Damage contribution</p>` +
      mine
        .map(
          (u) => `<div class="meter" style="--fac:${FACTION_COLORS[u.def.faction].secondary}">
          ${unitImg(u.def.id, 'bust')}<span class="mname">${esc(shortName(u.def))}</span>
          <span class="mbar"><i style="width:${(u.damageDealt / max) * 100}%"></i></span>
          <span class="mnum">${Math.round((u.damageDealt / total) * 100)}%</span></div>`,
        )
        .join('');
  }

  // ── Sheets ──
  showSheet(html: string): HTMLElement {
    const el = $('sheet');
    el.innerHTML = `<div class="handle"></div><button class="close" data-close aria-label="Close">${ICON.close}</button>${html}`;
    el.hidden = false;
    $('sheet-backdrop').hidden = false;
    el.scrollTop = 0;
    (el.querySelector('.close') as HTMLElement).focus({ preventScroll: true });
    return el;
  }

  hideSheet() {
    $('sheet').hidden = true;
    $('sheet-backdrop').hidden = true;
    this.onSheetClose?.();
  }

  onSheetClose?: () => void;

  get sheetOpen() {
    return !$('sheet').hidden;
  }

  /** Unit inspect sheet: portrait, stats, ability, synergies and a next-star preview. */
  unitSheet(def: UnitDef, star: Star, opts: { sellFor?: number; move?: 'toBoard' | 'toBench'; hp?: number; maxHp?: number } = {}) {
    const m = STAR_STAT_MULT[star];
    const hp = opts.maxHp ? `${Math.round(opts.hp ?? 0)}/${opts.maxHp}` : String(Math.round(def.hp * m));
    const stats: [string, string, string][] = [
      [ICON.heart, 'Health', hp],
      [ICON.sword, 'Attack', String(Math.round(def.atk * m))],
      [ICON.speed, 'Speed', `${def.atkSpeed}/s`],
      [ICON.range, 'Range', String(def.range)],
      [ICON.armor, 'Armor', String(def.armor)],
      [ICON.mana, 'Mana', String(def.mana)],
    ];
    const fac = SYNERGY_BY_ID[def.faction];
    const role = SYNERGY_BY_ID[def.role];
    const next = star < 3 ? ((star + 1) as Star) : null;
    const preview = next
      ? `<div class="preview">${ICON.star}<div><b>Next star preview (${'★'.repeat(next)})</b><br/><span class="muted">
          ${Math.round(def.hp * STAR_STAT_MULT[next])} health · ${Math.round(def.atk * STAR_STAT_MULT[next])} attack ·
          ability ${Math.round(def.ability.power * STAR_ABILITY_MULT[next])}. Merge 3 copies to upgrade.</span></div></div>`
      : `<div class="preview">${ICON.crown}<div><b>Maximum star level</b><br/><span class="muted">This figurine is fully upgraded.</span></div></div>`;
    const actions = [
      opts.move === 'toBoard' && `<button class="btn secondary" id="sheet-move">${ICON.target} Place on board</button>`,
      opts.move === 'toBench' && `<button class="btn secondary" id="sheet-move">${ICON.bench} Move to bench</button>`,
      opts.sellFor !== undefined && `<button class="btn danger" id="sheet-sell">Sell for ${opts.sellFor} ${ICON.coin}</button>`,
    ].filter(Boolean);
    return this.showSheet(`
      <h2>${esc(def.name)}</h2>
      <div class="tagline"><span style="color:${fac.color}">${FACTION_MARK[def.faction]}</span>${FACTION_PALETTE[def.faction].name.split(' ')[0]} · ${role.name}
        · <span style="color:${TIER_COLORS[def.tier]};font-weight:700">Tier ${def.tier}</span>${def.legendary ? ' · Legendary' : ''}</div>
      <div class="inspect-hero">${unitImg(def.id, 'full', def.name)}
        <div>${starRow(star)}<div class="stats">${stats.map(([i, k, v]) => `<div class="stat"><small>${i}${k}</small><b>${v}</b></div>`).join('')}</div></div>
      </div>
      <h3>Ability</h3>
      <div class="ability" style="--fac:${FACTION_COLORS[def.faction].secondary}"><span class="aicon">${ROLE_MARK[def.role]}</span>
        <div><b>${esc(def.ability.name)}</b><p class="muted">${esc(abilityText(def, star))}</p></div></div>
      <h3>Synergies</h3>
      <div class="chips">
        <button class="chip" data-syn="${fac.id}" style="--syn:${fac.color}"><span class="mark">${FACTION_MARK[def.faction]}</span>${fac.name}</button>
        <button class="chip" data-syn="${role.id}" style="--syn:${role.color}"><span class="mark">${ROLE_MARK[def.role]}</span>${role.name}</button>
      </div>
      <h3>Upgrade</h3>${preview}
      ${actions.length ? `<div class="sheet-actions">${actions.join('')}</div>` : ''}`);
  }

  synergySheet(id: SynergyId, fielded: string[], owned: string[]) {
    const def = SYNERGY_BY_ID[id];
    const field = new Set(fielded);
    const own = new Set(owned);
    const count = computeSynergies(fielded).find((s) => s.def.id === id)?.count ?? 0;
    const next = def.thresholds.find((t) => t > count);
    const units = UNITS.filter((u) => u.faction === id || u.role === id).sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
    return this.showSheet(`
      <h2>${def.name}</h2>
      <div class="tagline"><span style="color:${def.color}">${synMark(id)}</span>${def.kind === 'faction' ? 'Faction' : 'Role'} ·
        <b>${count} fielded</b>${next ? ` · next bonus at ${next}` : count ? ' · maximum reached' : ''}</div>
      <p>${def.summary}</p>
      <ul class="thresholds" style="--syn:${def.color}">
        ${def.thresholds.map((t, i) => `<li class="${count >= t ? 'on' : ''}"><b>${t}</b><span>${def.bonus[i]}</span><span class="state">${count >= t ? 'Active' : `${t - count} more`}</span></li>`).join('')}
      </ul>
      <h3>Qualifying units</h3>
      <div class="unit-grid">${units
        .map((u) => {
          const state = field.has(u.id) ? 'fielded' : own.has(u.id) ? 'owned' : 'absent';
          const label = state === 'fielded' ? 'On board' : state === 'owned' ? 'On bench' : 'Not owned';
          return `<button class="unit-tile ${state}" data-unit="${u.id}" style="--tier:${TIER_COLORS[u.tier]}">${unitImg(u.id, 'bust', u.name)}${esc(shortName(u))}<span class="lbl">${label}</span></button>`;
        })
        .join('')}</div>`);
  }

  oddsSheet(level: number) {
    const rows = SHOP_ODDS.slice(1)
      .map((o, i) => `<tr class="${i + 1 === level ? 'cur' : ''}"><td>Lv ${i + 1}</td>${o.map((v) => `<td>${v ? v + '%' : '–'}</td>`).join('')}</tr>`)
      .join('');
    this.showSheet(`<h2>Shop odds</h2><p class="muted">Chance of each cost tier appearing in a shop slot at each level. Buy XP to level up and field more units.</p>
      <table class="odds-table"><tr><th></th>${[1, 2, 3, 4, 5].map((t) => `<th style="color:${TIER_COLORS[t]}">Tier ${t}</th>`).join('')}</tr>${rows}</table>`);
  }
}
