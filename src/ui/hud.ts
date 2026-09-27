// DOM HUD: renders match state into the portrait layout and forwards taps to the controller.

import {
  FACTION_COLORS, SHOP_ODDS, SYNERGY_BY_ID, UNITS, UNIT_BY_ID, REROLL_COST, XP_COST,
  abilityText, STAR_STAT_MULT, type Star, type SynergyId, type UnitDef,
} from '../sim/data';
import type { Combat } from '../sim/combat';
import type { Match, Player } from '../sim/match';
import { computeSynergies } from '../sim/synergy';
import { SKINS, TIER_COLORS, type SkinId } from './skins';

export interface HudActions {
  buy(slot: number): void;
  reroll(): void;
  buyXp(): void;
  toggleLock(): void;
  ready(): void;
  scout(playerId: number): void;
  openSettings(): void;
}

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const ROLE_ICON = { guardian: '🛡', striker: '⚔', marksman: '🏹', mystic: '✦' } as const;
const AVATAR_COLORS = ['#e0664f', '#3f8fe0', '#4caf6a', '#a45ee5', '#f0b429', '#22b8c7', '#d45c9a', '#8a9aa8'];

export function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function facColor(def: UnitDef) {
  return def.faction === 'sun' ? '#c99a2e' : def.faction === 'tide' ? '#1f7f95' : '#4f7f35';
}

export class Hud {
  readonly app = $('app');
  readonly stage = $('stage');
  readonly shopEl = $('shop');
  private bannerTimer = 0;
  private toastTimer = 0;
  private lastHp = new Map<number, number>();
  private syncedRound = -1;

  constructor(actions: HudActions) {
    $('cards').addEventListener('click', (e) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('.card[data-slot]');
      if (card) actions.buy(Number(card.dataset.slot));
    });
    $('btn-reroll').addEventListener('click', () => actions.reroll());
    $('btn-xp').addEventListener('click', () => actions.buyXp());
    $('btn-lock').addEventListener('click', () => actions.toggleLock());
    $('btn-ready').addEventListener('click', () => actions.ready());
    $('btn-settings').addEventListener('click', () => actions.openSettings());
    $('scout-back').addEventListener('click', () => actions.scout(0));
    $('players').addEventListener('click', (e) => {
      const chip = (e.target as HTMLElement).closest<HTMLElement>('.pchip');
      if (chip) actions.scout(Number(chip.dataset.id));
    });
    $('synergies').addEventListener('click', (e) => {
      const chip = (e.target as HTMLElement).closest<HTMLElement>('.syn');
      if (chip) this.onSynergyTap?.(chip.dataset.id as SynergyId);
    });
    $('btn-level').addEventListener('click', () => this.onLevelTap?.());
    $('sheet-backdrop').addEventListener('click', () => this.hideSheet());
  }

  onSynergyTap?: (id: SynergyId) => void;
  onLevelTap?: () => void;

  setSkin(id: SkinId) {
    this.app.dataset.skin = id;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', id === 'toy' ? '#86cff9' : id === 'dark' ? '#0e131c' : '#2a1c12');
  }

  // ── Top bar ──
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
  renderPlayers(m: Match, opts: { viewing: number; opponent: number | null }) {
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
        const streak = Math.abs(p.streak) >= 2 ? `<span class="streak">${p.streak > 0 ? '🔥' : '🧊'}</span>` : '';
        return `<button class="${cls}" data-id="${p.id}" aria-label="${esc(p.name)}, ${p.hp} health">
          ${streak}<span class="avatar" style="--avatar:${AVATAR_COLORS[p.id]}">${p.isHuman ? '★' : esc(p.name[0])}</span>
          <span class="php">${p.alive ? p.hp : '#' + p.placement}</span>
          <span class="pbar"><i style="width:${p.hp}%"></i></span></button>`;
      })
      .join('');
    // Shake chips (and your health) that just lost health.
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
    $('btn-lock').classList.toggle('on', p.shopLocked);
    $('lock-icon').textContent = p.shopLocked ? '🔒' : '🔓';
    const odds = SHOP_ODDS[p.level];
    $('odds').innerHTML = odds
      .map((o, i) => (o > 0 ? `<span style="color:${TIER_COLORS[i + 1]}"><b>${o}%</b></span>` : ''))
      .join('');
  }

  renderShop(m: Match, p: Player) {
    const reroll = this.syncedRound !== m.round;
    this.syncedRound = m.round;
    $('cards').innerHTML = p.shop
      .map((id, slot) => {
        if (!id) return `<div class="card empty"></div>`;
        const def = UNIT_BY_ID[id];
        const merge = m.wouldMerge(p, id);
        const nextStar = merge && m.ownedCopies(p, id, 2) >= 2 ? '★★★' : '★★';
        const cls = ['card', merge && 'merge-ready', p.gold < def.tier && 'poor'].filter(Boolean).join(' ');
        return `<button class="${cls}" data-slot="${slot}" style="--tier:${TIER_COLORS[def.tier]};--fac:${facColor(def)};animation-delay:${reroll ? slot * 40 : 0}ms"
            aria-label="Buy ${esc(def.name)} for ${def.tier} gold">
          <div class="art"><span class="role">${ROLE_ICON[def.role]}</span><span class="fac">${SYNERGY_BY_ID[def.faction].icon}</span>
          ${merge ? `<span class="merge">${nextStar}</span>` : ''}</div>
          <span class="cost"><i class="coin"></i>${def.tier}</span>
          <div class="name">${esc(def.name)}</div></button>`;
      })
      .join('');
  }

  /** Force the deal-in animation on the next render (after a reroll). */
  markReroll() {
    this.syncedRound = -1;
  }

  setShopDim(dim: boolean) {
    this.shopEl.classList.toggle('dim', dim);
  }

  setSellMode(value: number | null) {
    this.shopEl.classList.toggle('sell-mode', value !== null);
    if (value !== null) $('sell-value').textContent = String(value);
    else this.shopEl.classList.remove('hover');
  }

  setSellHover(on: boolean) {
    this.shopEl.classList.toggle('hover', on);
  }

  isOverShop(x: number, y: number) {
    const r = this.shopEl.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top - 8 && y <= r.bottom;
  }

  // ── Synergy rail ──
  renderSynergies(defIds: string[]) {
    const states = computeSynergies(defIds);
    $('synergies').innerHTML = states
      .map((s) => {
        const next = s.def.thresholds.find((t) => t > s.count) ?? s.def.thresholds[s.def.thresholds.length - 1];
        const pips = s.def.thresholds.map((t) => `<i class="${s.count >= t ? 'on' : ''}"></i>`).join('');
        return `<button class="syn l${s.level}" data-id="${s.def.id}" style="--syn:${s.def.color}" aria-label="${s.def.name} ${s.count} of ${next}">
          <span class="sicon">${s.def.icon}</span><span>${s.count}/${next}</span><span class="pips">${pips}</span></button>`;
      })
      .join('');
  }

  // ── Stage overlays ──
  setReadyVisible(v: boolean) {
    $('btn-ready').classList.toggle('hidden', !v);
  }

  setScouting(name: string | null) {
    $('scout-banner').classList.toggle('hidden', name === null);
    if (name) $('scout-name').textContent = name;
  }

  banner(html: string, cls: string, ms: number) {
    const el = $('banner');
    el.className = `banner ${cls}`;
    el.innerHTML = html;
    clearTimeout(this.bannerTimer);
    this.bannerTimer = window.setTimeout(() => el.classList.add('hidden'), ms);
  }

  toast(msg: string) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => el.classList.add('hidden'), 1600);
  }

  pulse(el: HTMLElement, cls: string) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  bumpGold() {
    this.pulse($('gold').parentElement!, 'bump');
  }

  // ── Combat panel ──
  showCombatPanel(on: boolean) {
    this.shopEl.classList.toggle('combat', on);
    $('econ').style.opacity = on ? '0.55' : '';
  }

  renderCombatPanel(c: Combat, opponent: string, ghost: boolean) {
    const mine = c.units.filter((u) => u.side === 0).sort((a, b) => b.damageDealt - a.damageDealt).slice(0, 5);
    const max = Math.max(1, ...mine.map((u) => u.damageDealt));
    $('combat-panel').innerHTML =
      `<h4><span>vs ${esc(opponent)}${ghost ? ' (echo)' : ''}</span><span>Damage</span></h4>` +
      mine
        .map(
          (u) => `<div class="meter" style="--fac:${FACTION_COLORS[u.def.faction].glow}">
          <span>${ROLE_ICON[u.def.role]}</span><span class="mbar"><i style="width:${(u.damageDealt / max) * 100}%"></i></span>
          <span class="mnum">${Math.round(u.damageDealt)}</span></div>`,
        )
        .join('');
  }

  // ── Sheets ──
  showSheet(html: string): HTMLElement {
    const el = $('sheet');
    el.innerHTML = html;
    el.classList.remove('hidden');
    $('sheet-backdrop').classList.remove('hidden');
    el.scrollTop = 0;
    return el;
  }

  hideSheet() {
    $('sheet').classList.add('hidden');
    $('sheet-backdrop').classList.add('hidden');
  }

  get sheetOpen() {
    return !$('sheet').classList.contains('hidden');
  }

  unitSheet(def: UnitDef, star: Star, opts: { sellFor?: number; hp?: number; maxHp?: number }) {
    const m = STAR_STAT_MULT[star];
    const hp = opts.maxHp ? `${Math.round(opts.hp ?? 0)}/${opts.maxHp}` : String(Math.round(def.hp * m));
    const stats: [string, string][] = [
      ['HEALTH', hp],
      ['ATTACK', String(Math.round(def.atk * m))],
      ['SPEED', `${def.atkSpeed}/s`],
      ['RANGE', String(def.range)],
      ['ARMOR', String(def.armor)],
      ['MANA', String(def.mana)],
    ];
    const fac = SYNERGY_BY_ID[def.faction];
    const role = SYNERGY_BY_ID[def.role];
    const el = this.showSheet(`
      <div class="sheet-head">
        <div class="portrait" style="--tier:${TIER_COLORS[def.tier]};--fac:${facColor(def)}">${ROLE_ICON[def.role]}</div>
        <div><h3>${esc(def.name)}</h3>
          <div class="stars">${'★'.repeat(star)}<span class="muted" style="letter-spacing:0">${'☆'.repeat(3 - star)}</span></div>
          <div class="tags">${fac.icon} ${fac.name} · ${role.icon} ${role.name} · <span style="color:${TIER_COLORS[def.tier]}">Tier ${def.tier}</span>${def.legendary ? ' · Legendary' : ''}</div>
        </div>
      </div>
      <div class="stats">${stats.map(([k, v]) => `<div class="stat"><small>${k}</small><b>${v}</b></div>`).join('')}</div>
      <div class="ability"><b>${esc(def.ability.name)}</b><p>${esc(abilityText(def, star))}</p></div>
      ${opts.sellFor !== undefined ? `<button class="btn block danger" id="sheet-sell">Sell for ${opts.sellFor} <i class="coin"></i></button>` : ''}
    `);
    return el;
  }

  synergySheet(id: SynergyId, ownedDefIds: string[]) {
    const def = SYNERGY_BY_ID[id];
    const owned = new Set(ownedDefIds);
    const count = computeSynergies(ownedDefIds).find((s) => s.def.id === id)?.count ?? 0;
    const units = UNITS.filter((u) => u.faction === id || u.role === id).sort((a, b) => a.tier - b.tier);
    this.showSheet(`
      <div class="sheet-head"><div class="portrait" style="--tier:${def.color};--fac:${def.color}">${def.icon}</div>
        <div><h3>${def.name}</h3><div class="tags">${def.kind === 'faction' ? 'Faction' : 'Role'} · ${count} on board</div></div></div>
      <p>${def.summary}</p>
      <ul class="thresholds" style="--syn:${def.color}">
        ${def.thresholds.map((t, i) => `<li class="${count >= t ? 'on' : ''}"><b>${t}</b><span>${def.bonus[i]}</span></li>`).join('')}
      </ul>
      <p class="muted">Units (bold = on your board)</p>
      <div class="unit-list">${units
        .map((u) => `<span class="unit-pill ${owned.has(u.id) ? 'owned' : ''}" style="--tier:${TIER_COLORS[u.tier]}">${esc(u.name)}</span>`)
        .join('')}</div>`);
  }

  oddsSheet(level: number) {
    const rows = SHOP_ODDS.slice(1)
      .map((o, i) => `<tr class="${i + 1 === level ? 'cur' : ''}"><td>Lv ${i + 1}</td>${o.map((v) => `<td>${v ? v + '%' : '–'}</td>`).join('')}</tr>`)
      .join('');
    this.showSheet(`<h3>Shop odds</h3><p class="muted">Chance of each tier appearing in a shop slot, by level. Buy XP to level up and fit more units on the board.</p>
      <table class="odds-table"><tr><th></th>${[1, 2, 3, 4, 5].map((t) => `<th style="color:${TIER_COLORS[t]}">T${t}</th>`).join('')}</tr>${rows}</table>`);
  }

  settingsSheet(skin: SkinId, speed: number, handlers: { skin(id: SkinId): void; speed(s: number): void; restart(): void; help(): void }) {
    const el = this.showSheet(`<h3>Settings</h3>
      <p class="muted">Art style preview</p>
      <div class="seg">${(Object.keys(SKINS) as SkinId[]).map((id) => `<button data-skin="${id}" class="${id === skin ? 'on' : ''}">${SKINS[id].label}</button>`).join('')}</div>
      <p class="muted">Combat speed</p>
      <div class="seg two">${[1, 2].map((s) => `<button data-speed="${s}" class="${s === speed ? 'on' : ''}">${s}×</button>`).join('')}</div>
      <button class="btn block ghost" id="set-help">How to play</button>
      <button class="btn block danger" id="set-restart">Leave match</button>`);
    el.querySelectorAll<HTMLElement>('[data-skin]').forEach((b) => b.addEventListener('click', () => handlers.skin(b.dataset.skin as SkinId)));
    el.querySelectorAll<HTMLElement>('[data-speed]').forEach((b) => b.addEventListener('click', () => handlers.speed(Number(b.dataset.speed))));
    el.querySelector('#set-restart')!.addEventListener('click', handlers.restart);
    el.querySelector('#set-help')!.addEventListener('click', handlers.help);
  }

  // ── Full screens ──
  showScreen(html: string): HTMLElement {
    const el = $('screen');
    el.innerHTML = html;
    return el;
  }

  hideScreen() {
    $('screen').innerHTML = '';
  }
}

export const HOW_TO_PLAY = `<ul>
  <li><b>Buy</b> units by tapping shop cards. They land on your bench.</li>
  <li><b>Drag</b> units from the bench onto your half of the board. Your level is how many can fight.</li>
  <li><b>Three copies</b> of a unit merge into a stronger ★★ unit (and three ★★ into ★★★).</li>
  <li><b>Synergies</b>: field different units of the same faction or role for team bonuses (left side).</li>
  <li>Fights are <b>automatic</b>. Losing costs health. Last player standing wins.</li>
  <li>Save gold for <b>interest</b> (+1 per 10 held), or spend it to level up and reroll.</li>
</ul>`;

