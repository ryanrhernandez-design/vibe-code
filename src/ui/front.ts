// Front end: Home, Collection (codex) and Profile tabs, settings, and the results screen.
// Progress is hidden until a progression system exists (per the UI proposal).

import { SYNERGIES, UNITS, UNIT_BY_ID, type FactionId, type Star } from '../sim/data';
import { HERO_ART, boardArt, hasConceptArt } from './art';
import { Hud, esc, synMark, unitImg } from './hud';
import { FACTION_MARK, ICON, ROLE_MARK } from './icons';
import { store, type MatchRecord, type Settings } from './store';
import { BOARDS, BOARD_IDS, TIER_COLORS, type BoardId } from './theme';

export type Tab = 'home' | 'collection' | 'profile';

const $ = (id: string) => document.getElementById(id)!;

export const HOW_TO_PLAY = `<ol class="how">
  <li><b>Buy</b> figurines by tapping shop cards. They land on your bench.</li>
  <li><b>Place</b> them by dragging from the bench onto your half of the board, or tap a unit and choose <i>Place on board</i>. Your level is how many can fight.</li>
  <li><b>Merge</b>: three copies of a figurine become ★★, and three ★★ become ★★★.</li>
  <li><b>Synergies</b>: field different units of a faction or role for team bonuses (the strip under the board).</li>
  <li>Fights are <b>automatic</b>. Losing costs health; the last collector standing wins.</li>
  <li>Save gold for <b>interest</b> (+1 per 10 held), or spend it to level up and reroll.</li>
</ol>`;

export interface FrontActions {
  play(practice: boolean): void;
  settingsChanged(s: Settings): void;
}

function ordinalSuffix(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export class Front {
  private tab: Tab = 'home';
  private filter: FactionId | 'all' = 'all';
  private query = '';

  constructor(private readonly hud: Hud, private readonly actions: FrontActions) {
    $('tabs').innerHTML = (
      [
        ['home', ICON.home, 'Home'],
        ['collection', ICON.cards, 'Collection'],
        ['profile', ICON.profile, 'Profile'],
      ] as const
    )
      .map(([id, icon, label]) => `<button data-tab="${id}" aria-label="${label}">${icon}<span>${label}</span></button>`)
      .join('');
    $('tabs').addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-tab]');
      if (b) this.show(b.dataset.tab as Tab);
    });
    $('front-page').addEventListener('click', (e) => this.onClick(e));
    $('front-page').addEventListener('input', (e) => this.onInput(e));
    // Taps inside sheets (synergy chips, unit tiles) open the related sheet.
    $('sheet').addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const syn = t.closest<HTMLElement>('[data-syn]');
      const unit = t.closest<HTMLElement>('[data-unit]');
      if (syn && !this.inMatch()) this.hud.synergySheet(syn.dataset.syn as never, [], []);
      if (unit && !this.inMatch()) this.hud.unitSheet(UNIT_BY_ID[unit.dataset.unit!], 1);
    });
  }

  private inMatch() {
    return !$('match').hidden;
  }

  show(tab: Tab = this.tab) {
    this.tab = tab;
    $('front').hidden = false;
    $('match').hidden = true;
    $('screen').hidden = true;
    document.querySelectorAll<HTMLElement>('#tabs [data-tab]').forEach((b) => {
      b.classList.toggle('on', b.dataset.tab === tab);
      b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false');
    });
    const page = $('front-page');
    page.innerHTML = tab === 'home' ? this.home() : tab === 'collection' ? this.collection() : this.profile();
    page.scrollTop = 0;
  }

  // ── Home ──
  private home() {
    const p = store.profile;
    return `
      <div class="home-top">
        ${unitImg(p.avatar, 'bust').replace('<img', '<img class="avatar"')}
        <div class="who"><b>${esc(p.name)}</b><small>Collector</small></div>
        <button class="icon-btn" data-act="settings" aria-label="Settings">${ICON.gear}</button>
      </div>
      <div class="home-head"><h1>Your next great lineup.</h1><p>Collect. Build. Battle.</p></div>
      <div class="home-hero"><img src="${HERO_ART}" alt="Mossback Guardian figurine" />
        <div class="caption">Mossback Guardian<small>WILDROOT CLANS</small></div>
      </div>
      <div class="mode-card">${ICON.swords}<div><b>Standard</b><small>8 players · you vs 7 bots · 15–25 min</small></div></div>
      <div class="stack">
        <button class="btn primary big block" data-act="play">Play ${ICON.next}</button>
        <button class="btn secondary block" data-act="practice">${ICON.target} Practice <span class="muted" style="font:400 13px var(--font-ui)">· no prep timer</span></button>
        <button class="btn secondary block" data-act="how">How to play</button>
      </div>`;
  }

  // ── Collection ──
  private collection() {
    const filters: [FactionId | 'all', string, string][] = [
      ['all', '', 'All'],
      ['sun', FACTION_MARK.sun, 'Sun'],
      ['tide', FACTION_MARK.tide, 'Tide'],
      ['wild', FACTION_MARK.wild, 'Root'],
    ];
    return `
      <div class="page-title"><h1>Collection</h1></div>
      <label class="search">${ICON.search}<input id="codex-search" type="search" placeholder="Search figurines" value="${esc(this.query)}" aria-label="Search figurines" /></label>
      <div class="filters" role="group" aria-label="Filter by faction">${filters
        .map(([id, icon, label]) => `<button data-filter="${id}" class="${this.filter === id ? 'on' : ''}" aria-pressed="${this.filter === id}">${icon}${label}</button>`)
        .join('')}</div>
      <div id="codex">${this.codexCards()}</div>
      <h2 class="section-h">Synergies</h2>
      <div class="syn-list">${SYNERGIES.map(
        (s) => `<button class="syn-row" data-syn="${s.id}" style="--syn:${s.color}"><span class="mark">${synMark(s.id)}</span>
          <div><b>${s.name}</b> <span class="muted">(${s.thresholds.join(' / ')})</span><small>${s.summary}</small></div></button>`,
      ).join('')}</div>`;
  }

  private codexCards() {
    const q = this.query.trim().toLowerCase();
    const units = UNITS.filter((u) => (this.filter === 'all' || u.faction === this.filter) && (!q || u.name.toLowerCase().includes(q)))
      .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
    if (!units.length) return `<div class="empty-note">No figurines match “${esc(this.query)}”.<br/><button class="btn secondary" data-act="reset-search" style="margin-top:10px">Reset search</button></div>`;
    return `<div class="codex">${units
      .map(
        (u) => `<button class="ccard" data-unit="${u.id}" aria-label="${esc(u.name)}, tier ${u.tier}">
        ${unitImg(u.id, 'full', u.name)}<span class="tierb" style="--tier:${TIER_COLORS[u.tier]}">${u.tier}</span>
        <div class="meta"><small>${FACTION_MARK[u.faction]}${ROLE_MARK[u.role]}${esc(SYNERGIES.find((s) => s.id === u.role)!.name)}</small><b>${esc(u.name)}</b></div></button>`,
      )
      .join('')}</div>`;
  }

  // ── Profile ──
  private profile() {
    const h = store.history;
    const played = h.length;
    const wins = h.filter((r) => r.placement === 1).length;
    const top4 = h.filter((r) => r.placement <= 4).length;
    const avg = played ? (h.reduce((s, r) => s + r.placement, 0) / played).toFixed(1) : '–';
    const dist = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => h.filter((r) => r.placement === n).length);
    const maxD = Math.max(1, ...dist);
    const avatars = UNITS.filter((u) => hasConceptArt(u.id));
    return `
      <div class="page-title"><h1>Profile</h1></div>
      <div class="panel">
        <div class="profile-head">${unitImg(store.profile.avatar, 'bust').replace('<img', '<img class="avatar"')}
          <label style="flex:1"><span class="muted" style="font-size:12px">Display name</span>
          <input id="profile-name" maxlength="16" value="${esc(store.profile.name)}" autocomplete="off" /></label></div>
        <div class="avatar-pick" role="group" aria-label="Choose avatar">${avatars
          .map((u) => `<button data-avatar="${u.id}" class="${u.id === store.profile.avatar ? 'on' : ''}" aria-label="${esc(u.name)}">${unitImg(u.id, 'bust')}</button>`)
          .join('')}</div>
      </div>
      <h2 class="section-h">Summary</h2>
      <div class="panel kpis">
        <div class="kpi"><b>${played}</b><small>Matches</small></div>
        <div class="kpi"><b>${wins}</b><small>Wins</small></div>
        <div class="kpi"><b>${played ? Math.round((top4 / played) * 100) + '%' : '–'}</b><small>Top 4</small></div>
      </div>
      <h2 class="section-h">Placements <span class="muted" style="font:400 13px var(--font-ui)">· average ${avg}</span></h2>
      <div class="panel"><div class="dist">${dist.map((d, i) => `<div><span>${d || ''}</span><i style="height:${(d / maxD) * 70}px"></i>${i + 1}${ordinalSuffix(i + 1)}</div>`).join('')}</div></div>
      <h2 class="section-h">Recent matches</h2>
      ${h.length ? `<div class="panel history">${h.slice(0, 10).map((r) => this.historyRow(r)).join('')}</div>` : `<div class="panel empty-note">No matches yet. Play one from Home.</div>`}`;
  }

  private historyRow(r: MatchRecord) {
    const d = new Date(r.date);
    return `<div class="hrow"><span class="place-badge ${r.placement <= 3 ? 'top' : ''}">${r.placement}</span>
      <div><b>${r.placement}${ordinalSuffix(r.placement)} place</b><br/><span class="muted">${d.toLocaleDateString()} · ${r.rounds} rounds</span></div>
      <div class="lineup">${r.lineup.slice(0, 4).map((u) => unitImg(u.defId, 'bust')).join('')}</div></div>`;
  }

  private onClick(e: Event) {
    const t = e.target as HTMLElement;
    const act = t.closest<HTMLElement>('[data-act]')?.dataset.act;
    if (act === 'play') this.actions.play(false);
    else if (act === 'practice') this.actions.play(true);
    else if (act === 'how') this.hud.showSheet(`<h2>How to play</h2>${HOW_TO_PLAY}`);
    else if (act === 'settings') this.settings();
    else if (act === 'reset-search') {
      this.query = '';
      this.show('collection');
    }
    const filter = t.closest<HTMLElement>('[data-filter]')?.dataset.filter;
    if (filter) {
      this.filter = filter as FactionId | 'all';
      this.show('collection');
    }
    const unit = t.closest<HTMLElement>('[data-unit]')?.dataset.unit;
    if (unit) this.hud.unitSheet(UNIT_BY_ID[unit], 1);
    const syn = t.closest<HTMLElement>('[data-syn]')?.dataset.syn;
    if (syn) this.hud.synergySheet(syn as never, [], []);
    const avatar = t.closest<HTMLElement>('[data-avatar]')?.dataset.avatar;
    if (avatar) {
      store.profile.avatar = avatar;
      store.saveProfile();
      this.show('profile');
    }
  }

  private onInput(e: Event) {
    const t = e.target as HTMLInputElement;
    if (t.id === 'codex-search') {
      this.query = t.value;
      document.getElementById('codex')!.innerHTML = this.codexCards();
    } else if (t.id === 'profile-name') {
      store.profile.name = t.value.trim() || 'Player';
      store.saveProfile();
    }
  }

  // ── Settings ──
  settings(inMatch?: { leave(): void }) {
    const s = store.settings;
    const seg = (key: string, options: [string, string][], current: string) =>
      `<div class="seg" role="group">${options.map(([v, label]) => `<button data-set="${key}" data-val="${v}" class="${v === current ? 'on' : ''}" aria-pressed="${v === current}">${label}</button>`).join('')}</div>`;
    const sheet = this.hud.showSheet(`<div id="settings-body">
      <h2>Settings</h2>
      <div class="setting"><span class="label">Arena</span><p>Which board you play on. Random picks one each match.</p>
        ${seg('board', [['random', 'Random'], ...BOARD_IDS.map((id) => [id, BOARDS[id].name.split(' ')[1]] as [string, string])], s.board)}</div>
      <div class="setting"><span class="label">Combat speed</span><p>How fast fights play back. The result is the same.</p>
        ${seg('speed', [['1', '1×'], ['2', '2×']], String(s.speed))}</div>
      <div class="setting"><span class="label">Reduce motion</span><p>Removes bobbing, particles and sliding animations.</p>
        ${seg('reduceMotion', [['false', 'Off'], ['true', 'On']], String(s.reduceMotion))}</div>
      <div class="setting"><span class="label">Haptics</span><p>Short vibrations on buy, merge and drop (Android browsers only).</p>
        ${seg('haptics', [['true', 'On'], ['false', 'Off']], String(s.haptics))}</div>
      <div class="stack" style="margin-top:14px">
        <button class="btn secondary block" data-act2="how">How to play</button>
        <button class="btn secondary block" data-act2="defaults">Restore defaults</button>
        ${inMatch ? `<button class="btn danger block" data-act2="leave">Leave match</button>` : ''}
      </div></div>`);
    // Listen on the freshly rendered body, not the shared sheet container, so handlers never pile up.
    sheet.querySelector('#settings-body')!.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const b = t.closest<HTMLElement>('[data-set]');
      if (b) {
        const key = b.dataset.set as keyof Settings;
        const v = b.dataset.val!;
        (s as unknown as Record<string, unknown>)[key] = key === 'speed' ? Number(v) : key === 'board' ? v : v === 'true';
        store.saveSettings();
        this.actions.settingsChanged(s);
        this.settings(inMatch);
      }
      const a = t.closest<HTMLElement>('[data-act2]')?.dataset.act2;
      if (a === 'how') this.hud.showSheet(`<h2>How to play</h2>${HOW_TO_PLAY}`);
      if (a === 'defaults') {
        store.resetSettings();
        this.actions.settingsChanged(store.settings);
        this.settings(inMatch);
      }
      if (a === 'leave' && inMatch) {
        this.hud.showSheet(`<h2>Leave match?</h2><p>You will be eliminated and placed at your current position. Bots keep playing without you.</p>
          <div class="sheet-actions"><button class="btn secondary" data-close>Stay</button><button class="btn danger" id="confirm-leave">Leave</button></div>`)
          .querySelector('#confirm-leave')!
          .addEventListener('click', () => {
            this.hud.hideSheet();
            inMatch.leave();
          });
      }
    });
  }

  // ── Results ──
  results(opts: {
    placement: number;
    rounds: ('win' | 'loss' | 'draw')[];
    lineup: { defId: string; star: Star }[];
    damage: [string, number][];
    board: BoardId;
    onAgain(): void;
    onHome(): void;
  }) {
    const won = opts.placement === 1;
    const top = opts.lineup.slice(0, 3);
    const order = top.length === 3 ? [top[1], top[0], top[2]] : top;
    const maxDmg = Math.max(1, ...opts.damage.map((d) => d[1]));
    const el = $('screen');
    el.innerHTML = `
      <div class="result-hero" style="background-image:url('${boardArt(opts.board)}')">
        <div class="kicker">${won ? 'Victory' : 'Match over'}</div>
        <div class="place">${opts.placement}<sup>${ordinalSuffix(opts.placement)}</sup></div>
        <div class="place-sub">Place</div>
        <p>${won ? 'A lineup worth remembering.' : opts.placement <= 4 ? 'A strong finish. Your lineup held its ground.' : 'Every collection starts somewhere.'}</p>
        <div class="podium">${order
          .map((u, i) => `<figure class="${order.length === 3 && i === 1 ? 'mid' : ''}">${unitImg(u.defId, 'full', UNIT_BY_ID[u.defId].name)}
            <figcaption>${FACTION_MARK[UNIT_BY_ID[u.defId].faction]} ${'★'.repeat(u.star)}</figcaption></figure>`)
          .join('')}</div>
      </div>
      <div class="result-body">
        <div class="panel"><h2 class="section-h" style="margin-top:0">Round history</h2>
          <div class="rounds">${opts.rounds
            .map((r, i) => `<span class="rdot ${won && i === opts.rounds.length - 1 ? 'crown' : r}" title="Round ${i + 1}: ${r}">${won && i === opts.rounds.length - 1 ? ICON.crown : r === 'win' ? ICON.check : r === 'loss' ? ICON.cross : '='}</span>`)
            .join('')}</div></div>
        <div class="panel"><h2 class="section-h" style="margin-top:0">Damage dealt</h2>
          ${opts.damage
            .slice(0, 5)
            .map(([id, dmg]) => `<div class="meter" style="--fac:var(--teal)">${unitImg(id, 'bust')}<span class="mname">${esc(UNIT_BY_ID[id].name)}</span>
              <span class="mbar"><i style="width:${(dmg / maxDmg) * 100}%"></i></span><span class="mnum">${Math.round(dmg).toLocaleString()}</span></div>`)
            .join('') || '<p class="muted">No damage recorded.</p>'}</div>
        <button class="btn primary big block" id="res-again">Play again ${ICON.next}</button>
        <button class="btn secondary block" id="res-home">${ICON.home} Home</button>
      </div>`;
    el.hidden = false;
    el.scrollTop = 0;
    el.querySelector('#res-again')!.addEventListener('click', opts.onAgain);
    el.querySelector('#res-home')!.addEventListener('click', opts.onHome);
  }
}
