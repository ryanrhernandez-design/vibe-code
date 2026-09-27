# Type C - Comprehensive UI Proposal

Version 1.0 | September 26, 2026

Premium collectible materials, calm interface hierarchy, phone-first decisions.

## Design proposal

### The direction

A premium collectible cabinet brought to life: tactile characters, calm porcelain controls, champagne accents and deep teal actions. Reserve ornate gold for the figurines and major celebrations. The interface should frame the collection and reveal decisions quickly.

### Preserved requirements

Portrait and phone-first; fixed 7x8 board; eight bench slots; five shop cards; entire board visible while shopping; accessible inspection; direct manipulation; scouting; explicit economy and phase information. This is a Type C proposal only; there is no work on the rejected A/B skins.

### Deliberate proposals

Use four bottom tabs and move Settings to a utility button. Use a 2x4 bench on narrow phones. Replace an eight-chip tiny player strip with a compact current-opponent summary and a roster drawer. These are design proposals that change the source layout, not silent implementation requirements.

### Scope boundary

The offline gallery is a design demonstrator, not a game. All sample health, gold, ranks, unit totals, ability labels, synergy thresholds and damage values are illustrative. The original game data and coding agent supply the final values.

## Navigation and information hierarchy

### Front end

Home leads to mode selection and matchmaking. Collection leads to unit and synergy detail. Progress is a reserved destination; hide it until progression is specified. Profile leads to match history and summary. Settings is reachable from Home and the match menu.

### During matches

The board is the center of attention. Phase/time and health occupy the top band. Current-opponent context and a roster control come next. Synergies, bench, economy and shop form the lower decision area. No marketing panels, offers or meta-navigation appear in a live match.

### Detail surfaces

Unit, synergy and item information use bottom sheets with a visible Close control; long-press is an optional shortcut, not the only route. Larger text uses a full-height sheet with internal scrolling. Restore focus and selection after dismissal.

### Shopping versus placement

Shopping always leaves the whole board visible. Placement can invoke a temporary placement-focus panel when projected tiles are too small to touch reliably. This panel shows the player half enlarged and replaces the shop only while placing, then restores the complete shopping view.

## Responsive layout and touch targets

### 390 x 844 reference

Budget 47 top + 34 bottom safe-area pixels as an example, leaving 763. Within that: header 44, opponent summary 44, board 278, synergy strip 28, bench 100, economy/actions 64, shop 105. These sum to 763. Internal padding is included. Actual safe areas must come from the device, not hard-coded constants.

### Small phone policy

At 375 x 667 and 360 x 740, use compact decoration, no optional chrome, and the same 2x4 bench. The full-board shopping view remains visible but some projected tiles cannot meet a 44-pixel target. Use tap-select plus enlarged placement focus, or a drag lens with valid-cell snapping. Do not claim every tile is a full-size touch target in the overview.

### Bench and shop

Four slots across, two rows: each slot has ample horizontal width and at least 44 CSS pixels of touch height. At 390 wide with 12-pixel margins and four 6-pixel gaps, five shop cards have 68.4 pixels each. Show short names, costs and key marks; full names and ability text belong in inspect. Increased text size uses compact card labels and full accessible names, never unreadably shrunken text.

### Larger layouts

At 430 x 932 expand the board and card artwork first. Tablet portrait can move roster and synergy detail into side panels; a one-row bench is allowed only when all targets and spacing fit. Landscape is not a launch requirement. All layouts must tolerate browser chrome and dynamic viewport changes.

### Interaction target policy

Aim for 48 CSS pixels for frequent controls, with a 44-pixel floor in dense phone layouts. CSS pixels are a web design target, not a claim of identical native pt/dp sizing. Tiny status pips are not independently interactive. Provide a larger grouped control for roster and synergy detail.

## Component system

### Shop card

Portrait, short name, cost badge, tier stripe plus tier number, faction and role icons. Star-upgrade preview is a separate badge. States: available, unaffordable, merge-ready, locked, sold-out and pressed. Never disable inspection because purchase is unaffordable.

### Board and bench

Empty/occupied slots, selected unit, valid target, invalid target, swap preview, over-cap badge, selected item target. Validity combines color with shape and text; a check marks a valid drop, crossed outline marks invalid. Stable slot geometry prevents finger targets from moving during an action.

### Player and synergy chips

Current player, next opponent, streak and eliminated states. Synergy chips show name/icon and count/threshold, with pips supplementing text. A collapsed state still exposes active count. Roster opens into eight accessible rows, not eight tiny independent portrait targets.

### Buttons and sheets

Primary teal, secondary porcelain, destructive outlined red. Cost buttons keep cost visible in disabled states. Bottom sheets have a handle, title, Close, scroll body and optional sticky action. Dialogs trap focus; dismissing returns focus to the origin. Toasts never cover the shop or drag destination.

## Interaction and state contract

### Buy and merge

Tap purchases once. Show pending feedback and suppress duplicate activation until the authoritative result arrives. Animate the accepted unit to its actual destination; after a merge, show the star result and release visual clutter quickly. Failed purchase preserves the card and explains why.

### Drag and sell

Press/drag threshold is proposed at 8-10 CSS pixels; long-press inspection near 350 ms is tunable. Valid cells highlight and a swap preview names the outcome. While dragging, the shop becomes a sell area showing the actual sell value. Releasing elsewhere cancels. Tap-based select/place/sell is always available.

### Timers and conflicts

Timers remain visible with detail sheets open. At preparation end cancel unfinished drags and reflect the accepted server state; do not visually commit a move the game rejected. Lock is explicit and reversible. Loot timeout follows the game-defined fallback, displayed clearly.

### Full bench and over-cap

If a purchase would legally merge despite a full bench, reflect the game rule rather than blocking generically. Otherwise explain Bench full. An over-cap state shows explicit count and affected units. Any auto-return or auto-sell behavior must come from the game rules, not this UI proposal.

### Interruptions

Reconnection must restore phase, timer, health, board and pending choices from the game state. The source suggests bot takeover, but its policy remains a game-design decision. The interface reports what actually happened; it does not promise that a bot made an action without confirmation.

## Motion, accessibility and finish

### Motion rhythm

Press: 100 ms. Panel: 200 ms. Buy: 220 ms. Reroll: 180 ms. Merge: about 600 ms. Level-up: about 550 ms. Result: about 450 ms. Motion should not block input or delay the next legal action. Avoid screen shake by default; use small local responses.

### Reduced motion

Remove camera movement, flying cards, oscillation and persistent particles. Replace with immediate state changes or brief opacity transitions. Display star counts and textual outcomes independently of animation. Haptics are optional enhancement and must have a toggle.

### Contrast and text

Use dark espresso on warm light surfaces and white on deep teal actions. Target at least 4.5:1 for ordinary text and 3:1 for meaningful non-text boundaries. Gold decoration is not body text. Validate final composited states, including disabled controls, against the actual background.

### Access without gestures

All long-press and drag actions need tap alternatives. Keep keyboard focus visible in the web build. Provide accessible names, logical focus order, status announcements and grouped live updates rather than announcing every damage tick. Text-size scaling must enlarge detail content without hiding its Close action.

### Final polish

Protect portrait crops, keep card baselines aligned, use tabular numerals for changing counters, and preserve control positions as values change. Rich lighting lives in the scene; interface surfaces use restrained shadows and thin edges. Avoid full-screen gold flashes.

## Conditional features and verification

### Conditional modules

Items, recipes, commanders, Quick/Turbo, ranked rewards, progression, battle pass and paid cosmetics remain conditional. Design slots exist where requested, but none is authorized as a new game mechanic. Hide absent modules cleanly rather than shipping inert navigation.

### Visual mockup corrections

Generated presentation images contain illustrative discrepancies: extra bench/opponent slots, invented example names or abilities, wrong costs, decorative faction symbols and sample dates. These images are mood/layout studies only. The screen specifications, exact roster and HTML design demonstrator govern counts and naming.

### Implementation acceptance

Verify 56 board cells, 8 bench slots and 5 shop cards; complete phone match flow; board visibility while shopping; small-screen placement assistance; 130% text detail sheets; color-independent states; reduced motion; reconnect and stale-input behavior. These are proposed implementation checks, not completed game tests.

### Approval focus

Review the visual direction, the four-tab navigation, the two-row bench, the compact opponent summary and the placement-focus accommodation. The remaining gameplay questions are still owned by the other agent. This package does not change them.

## Complete screen coverage

### 01. Splash / loading

A small faction-neutral collectible plinth and a single progress indicator. Show useful loading state, then a short gameplay tip; avoid mandatory cinematic delays.

**Required states:** Loading; ready; offline; asset retry.

**Actions:** Retry connection; continue to Home when ready.

### 02. Home

One hero figurine, one dominant Play action, mode summary and a quiet Practice link. Bottom navigation: Home, Collection, Progress, Profile. Settings moves to a clearly labeled top utility button.

**Required states:** First visit; returning player; offline; optional progress unavailable.

**Actions:** Play; select mode; browse collection; settings.

### 03. Mode select

Large tactile cards for Standard and Practice. Quick/Turbo is a conditional card shown only when its rules exist. Explain expected duration using approved game data.

**Required states:** Available; selected; unavailable; offline restriction.

**Actions:** Choose mode; confirm; back.

### 04. Matchmaking / lobby

Eight stable player slots, clear searching status, connection feedback and a visible cancel control. Do not invent a countdown until the server supplies one.

**Required states:** Searching; filling; ready; canceled; connection lost.

**Actions:** Cancel before commitment; reconnect if interrupted.

### 05. Collection / codex

A premium figurine catalog: two-column cards, search, faction and role filters, sorting by cost or name. Each card displays exact source name, cost tier and faction/role marks. Codex membership does not imply ownership or paid unlocks.

**Required states:** All units; filtered; search empty; unit detail; synergy reference.

**Actions:** Filter; inspect; reset search.

### 06. Profile and ranks

Avatar, display name, match history and placement distribution. Rank is a reserved module, shown only if the ranked system exists. No invented rank rewards.

**Required states:** New profile; populated history; rank unavailable; history unavailable.

**Actions:** View match summary; edit supported profile fields.

### 07. Settings

Grouped controls for graphics, audio, haptics, reduce motion, color assistance, text size and language. Each setting gets a plain explanation. Unsupported haptics are omitted or clearly unavailable.

**Required states:** Default; changed; unavailable capability; restore defaults.

**Actions:** Adjust; preview; restore defaults.

### 08. First-time tutorial

One instruction at a time over the real board, starting with buying, then placing, merging and reading a synergy. Focus one region without hiding relevant targets. Practice tutorial may pause; live matches must not.

**Required states:** Buy step; place step; merge step; synergy step; skipped; completed.

**Actions:** Do the action; next; skip; replay from Settings.

### 09. Preparation HUD

Board-first layout with visible five-card shop, all eight bench slots, gold/interest, level/XP, unit cap, reroll and lock. Thin faction chips sit below the board. Keep controls anchored between phases.

**Required states:** Normal; unaffordable; merge-ready; full bench; over-cap; locked shop; last five seconds.

**Actions:** Buy; reroll; buy XP; lock; place; sell; inspect; scout.

### 10. Combat HUD

Preserve board position. Replace the shopping dock with compact damage contribution bars and opponent context. Read-only bench remains available. No false pause or active purchase controls if combat shopping is disabled.

**Required states:** Fighting; round ending; win; loss; draw; spectating.

**Actions:** Inspect units; expand combat stats; inspect opponents.

### 11. Scouting

Same camera framing and unit scale as the player board. A persistent Viewing banner and reachable Return button prevent accidental self-board actions. The shop is visible but dimmed and inactive in this proposed flow.

**Required states:** Opponent selected; eliminated board; next opponent; return to own board.

**Actions:** Choose player; inspect; return.

### 12. Unit inspect sheet

A dismissible porcelain bottom sheet with full name, faction, role, cost tier, explicit star count, portrait, stats and ability. Synergies and equipment follow. The next-star preview is informational, not an upgrade purchase.

**Required states:** Owned; shop; opponent; upgrade preview; no equipment system.

**Actions:** Close; switch details tab; preview star state.

### 13. Synergy details

Current count and next threshold lead. Show each threshold and its exact bonus from game data, plus qualifying unit portraits. Distinguish owned, fielded and not owned by labels and shapes.

**Required states:** Inactive; partial; active; maximum; unit absent.

**Actions:** Inspect a qualifying unit; close.

### 14. Item tray and detail

Conditional module. A small item-count button opens a horizontal tray; tap-select then tap a unit is an alternative to dragging. Detail sheet states allowed targets and consequences. Recipes appear only if confirmed.

**Required states:** Empty; item selected; valid target; invalid target; equipped; recipes disabled.

**Actions:** Inspect; equip; cancel target selection.

### 15. Loot / pick one of three

Three clear choices with inspect access, timer and a selected preview. Use explicit Confirm for a timed irreversible choice. On timeout display the actual game-resolved selection. Commander choice remains conditional.

**Required states:** Choosing; inspecting; selection pending; confirmed; timed out.

**Actions:** Inspect; select; confirm.

### 16. Round result

Short nonblocking result banner, player damage explanation and clear health change. Keep the board readable and reveal the next phase without a dismissal requirement.

**Required states:** Win; loss; draw; damage pending; next prep.

**Actions:** Expand breakdown; continue naturally.

### 17. Eliminated / victory

Placement and outcome take priority, followed by a final-lineup preview. Eliminated players can spectate or return home; victory celebrates with restrained faction particles. Do not claim rewards unless supplied.

**Required states:** Eliminated; winner; waiting for final standings.

**Actions:** Spectate; summary; home.

### 18. Post-match summary

Placement, final board, synergies, round history and damage statistics. Show all final boards with stable player labels. Play Again is the primary action; Home is secondary. Rewards section is conditional.

**Required states:** Winner; other placements; data pending; full summary; replay unavailable.

**Actions:** Play Again; inspect final boards; home.

### 19. Leave / reconnect

A leave confirmation must explain the real consequence. Online matches continue; the UI never promises pause. Reconnect uses a quiet persistent status banner and clearly restores the current round and health on return.

**Required states:** Leave confirmation; reconnecting; restored; timed out; match ended while away.

**Actions:** Stay; leave; retry; view final summary.
