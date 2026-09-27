# UI Design Brief (handoff for the UI design agent)

This brief is for the agent designing the game's UI. It covers what the game is, the constraints already decided, a teardown of the Dota Underlords UI (our base reference), the best phone game UI patterns to borrow, and a proposed layout and interaction model to start from.

Where this brief says **"Verify"**, the detail comes from memory of the game rather than a source checked while writing this. Confirm it against screenshots before relying on it. Good screenshot libraries are listed under [Sources and reference libraries](#sources-and-reference-libraries).

---

## 1. The game in one paragraph

An original auto battler in the style of Dota Underlords, **designed for phones first**. Eight players each draft units from a shared, randomized 5-unit shop, place them on their half of a grid board, and watch them fight other players' boards automatically. Buying 3 copies of a unit merges them into a 2-star version, and 3 of those into a 3-star. Units belong to factions and roles that grant bonuses (synergies) when enough are fielded together. Players manage gold (with interest on savings), buy XP to raise their level (which allows more units on the board), and lose health when they lose a round. Last player standing wins.

## 2. Decisions already made (constraints)

| Area | Decision |
|---|---|
| Platform | Phones first; must also work on tablets. First build is a web version (TypeScript + Three.js/Babylon.js) running in a phone browser. It may be ported to Unity later, so the design must be implementable in both HTML/CSS and Unity UI Toolkit. |
| Orientation | **Portrait**, playable one-handed. |
| Board | 7 columns × 8 rows total: 4 rows per player, opponent at the top, you at the bottom. Fixed 3/4 top-down camera at about 55°; no free camera rotation or zoom. |
| Bench | 8 slots below the board. |
| Shop | 5 units per roll. |
| Factions | Sunforged Dominion (ivory/gold/sun-orange), Tidebound Covenant (teal/navy/cyan), Wildroot Clans (moss green/bark brown/amber). More will come. |
| Unit roles | Tank, melee, ranged, caster, support/assassin, legendary. **Assumption to confirm with the game designer:** each unit has 1 faction and 1 role, and both count toward synergies (as Underlords units had 2+ "alliances"). |
| Unit tiers | 5 cost tiers (1–5 gold). |
| Art styles | 3 candidate styles are still being evaluated (see `docs/art-prompts.md`): A Painted Heroic, B Grounded Dark Fantasy, C Collectible Figurine. **The UI layout must be style-neutral**, with a swappable visual skin per art style. |
| IP | Everything original. No Dota or Valve names, icons, layouts copied pixel for pixel, or fonts. Borrow structure and ideas, not assets. |

### Baseline game numbers (from Underlords, to use as placeholders)

| Rule | Underlords value | Source |
|---|---|---|
| Starting health | 100 | Underlords wiki |
| Shop size | 5 units | Underlords wiki |
| Reroll cost | 2 gold | Underlords wiki |
| Buy XP | 5 gold for 5 XP | Underlords wiki |
| Interest | +1 gold per 10 gold held at end of preparation | Underlords wiki |
| Interest cap | 5 gold (Verify) | Memory |
| Bench size | 8 | Underlords wiki |
| Shop lock | Yes, keeps the current roll for one round | Underlords wiki |
| Max level | 10 (Verify) | Memory |

The UI must display all of these, so design space for: gold, interest preview, level, XP progress, unit cap (units on board / max), win or loss streak, health, round number, phase and timer.

---

## 3. Dota Underlords UI teardown (base reference)

Underlords (Valve, 2019; updates stopped in 2021) shipped the **same UI on PC and phones**, in **landscape**. It was widely considered one of the cleanest auto battler UIs for surfacing key information quickly, but its mobile-first shop was criticized on PC for covering the board. Valve later added a "PC UI" option with a smaller shop so players could see their board while buying.

### 3.1 In-match HUD layout (landscape)

Verify exact positions against screenshots; the structure below is the part that matters.

| Region | What it shows | Notes |
|---|---|---|
| **Top center** | Round number, phase (preparation or combat), countdown timer | Always visible. The timer is the main source of pressure in the game. |
| **Right edge** | Player list / scoreboard: 8 players with avatar, health, and indicators such as streaks | Sorted by health. Tapping a player lets you look at ("scout") their board. |
| **Left edge** | Alliances (synergy) tracker: one row per active alliance, icon plus pips showing progress toward each threshold (e.g. 2 / 4 / 6) | Active tiers are highlighted, inactive ones dimmed. Tap or hover for the bonus details. |
| **Center** | The board, with your bench of 8 slots along the near edge | Units show health bar, mana bar and star level above them. |
| **Bottom** | Shop (5 unit cards), reroll, buy XP, lock toggle, gold, level and XP bar | In the mobile UI the shop slid up as **large tiles that covered much of the board**. This was the most-cited complaint. |
| **Items** | Item inventory panel; drag an item onto a unit to equip it | Items come from computer-controlled rounds and item-pick rounds. |
| **Underlord** | The commander unit chosen during the match, with its own abilities and talent picks | Adds a hero-picker screen and talent-choice modal. |

### 3.2 Shop card anatomy

- Unit portrait art filling most of the card.
- Name and cost.
- Tier shown by card border color. Underlords used gray → green → blue → purple → gold for tiers 1–5 (Verify exact colors).
- Alliance (synergy) icons on the card.
- Highlight on cards that would complete a merge when bought (Verify; TFT definitely does this with an animated hint).

### 3.3 Other screens

- **Unit inspect panel:** stats, ability description, alliances, equipped items.
- **Round result:** damage dealt to the losing player is shown, and health drops on the player list.
- **Post-match:** placement (1st–8th) and a scoreboard overview. Later patches added final boards, items and alliances to the post-game screen.
- **Combat stats:** damage-per-unit meters after a fight.
- **Front end:** play modes (standard, duos/"Knockout"), a single-player campaign map ("City Crawl"), a battle pass, profile and ranks.

### 3.4 What Underlords did well (keep)

1. **Information density without clutter.** Health, gold, level, timer, synergies and opponents were all visible at a glance, and players praised it for surfacing key information fast.
2. **Consistent color coding.** Tier colors carried through shop cards, units and tooltips.
3. **Synergy pips.** Seeing "3 of 4" at a glance, with the next threshold visible, drives decisions.
4. **Direct manipulation.** Drag units between bench and board; drag items onto units.
5. **Clean, bold, readable visuals:** thick outlines and large icons that worked on small screens.
6. **One-tap scouting** of other players' boards from the player list.

### 3.5 What Underlords did poorly (fix)

1. **The shop covered the board.** On mobile the large shop tiles hid the board you were building. **Our layout must never hide the board while shopping.**
2. **Landscape needs two hands.** Fine for tablets, awkward on phones. We are portrait and one-handed.
3. **Small secondary text.** Synergy details, item descriptions and ability text needed extra taps and were small on phones.
4. **Hidden odds.** Players couldn't easily see the chance of each tier appearing at their level. TFT later showed these odds in the shop, and players value it.
5. **Item management friction.** Items lived in a separate panel; matching items to units took several taps.
6. **Steep onboarding.** The screen is dense for new players; there was little step-by-step introduction of HUD elements.
7. **One UI for all devices.** Mobile sizing looked oversized on PC and vice versa. We are phone-first, but plan responsive breakpoints (see section 6.7).

---

## 4. Best phone game UI patterns to borrow

| Game | Why it's relevant | Borrow |
|---|---|---|
| **Clash Mini** (Supercell, portrait auto battler; shut down before global launch) | The closest genre reference: an auto battler designed for **portrait, one-handed** play | Board in the middle, shop cards at the bottom in thumb reach, short rounds, merging shown directly on the cards. Study any gameplay video you can find. |
| **Clash Royale** (Supercell) | The benchmark for portrait, one-handed competitive play | Card hand along the bottom; a large, always-visible resource bar (elixir); bottom tab navigation in menus; chunky, bold buttons and fonts; tap a card to inspect it. |
| **Marvel Snap** (Second Dinner) | The best recent example of a clean portrait UI | Interactive elements kept in the **bottom half** of the screen; the cards dominate the visual hierarchy while the UI recedes (dark "glass" panels with light, hologram-like buttons); **long-press to inspect**; fast, satisfying animations; very little text. |
| **Teamfight Tactics mobile** (Riot) | The most refined auto battler UI in active development | Shop shows gold, streak and **tier odds** for your level; **animated hint on shop cards** that would complete a merge; **drag a unit onto the shop to sell it**, with the shop showing the sell price. |
| **Hearthstone** and **Legends of Runeterra** | Tactile card play on phones | Card "lift" and scale on touch; clear drop-zone highlights; big, readable number badges for cost and stats. |
| **Brawl Stars** (Supercell) | Front-end menus and rewards | Bottom navigation bar, a big central Play button, clear reward and progression flows, bold typography. |
| **Royal Match** (Dream Games) | Polish, feedback and "juice" | Snappy transitions, satisfying reward animations, consistent button feedback. Useful for the merge and level-up moments. |
| **Super Auto Pets** | A simple auto battler UI | Plain-language descriptions and minimal chrome; proof the genre can be approachable. |

### Phone UI principles to follow

1. **Thumb zone.** Anything tapped often (shop, reroll, buy XP, bench) goes in the **bottom third** of the screen. The top of the screen is for information only (timer, health, opponents).
2. **Touch targets** at least **44 × 44 pt** (Apple Human Interface Guidelines) / **48 × 48 dp** (Android Material Design), with at least 8 pt between targets.
3. **Safe areas.** Respect the notch or camera cutout, rounded corners and the home indicator. Put nothing tappable within about 34 pt of the bottom edge on iPhones with no home button.
4. **Readable text.** Body text at least 12 pt, key numbers (gold, health, timer) 16–24 pt and bold. No text should ever be the only way to understand game state.
5. **Never color alone.** Tiers, factions and synergy states need color plus shape, icon or number (colorblind players, glare, small screens).
6. **Tap to act, long-press to inspect, drag to move.** Long-press around 350 ms opens details; a drag starts after roughly 8–10 pt of movement, so taps aren't misread as drags.
7. **Show consequences before commitment.** Previews such as "buying this completes a ★★", "selling gives 3 gold" and "interest next round +4".
8. **Progressive disclosure.** Keep the main screen lean; details open in a bottom sheet (a panel sliding up from the bottom, dismissed by swiping down or tapping outside), not a full-screen modal.
9. **Motion.** UI transitions 150–250 ms; celebratory moments (merge, level up, win) 400–800 ms and never blocking input. Respect a "reduce motion" setting.
10. **Haptics** on buy, merge, drop onto a valid tile, level up and round loss (short, distinct patterns; with a toggle).
11. **Performance.** A steady 60 fps. Keep effects on the UI layer cheap, especially on older Android phones.
12. **Interruptions.** Handle app switching and calls gracefully. If the player leaves, a bot plays their turn and a clear "Reconnected" state appears on return.

---

## 5. Proposed in-match layout (portrait, to start from)

Reference frame: **390 × 844 pt** (a typical modern iPhone). Heights are approximate and should be tuned in mockups.

```
┌───────────────────────────────────┐
│          status bar / notch       │  ~47 pt safe area
├───────────────────────────────────┤
│ ⚙  Round 7 · PREP  ⏱ 0:18   ❤ 72  │  Top bar           ~52 pt
├───────────────────────────────────┤
│ [P1❤90][P2❤84][YOU❤72]...[P8❤20]  │  Player strip      ~48 pt  (tap = scout)
├───────────────────────────────────┤
│ ◈                                 │
│ ◈   · · · · · · ·   opponent      │
│ ◈   · · · · · · ·   half (combat  │  Board 7×8         ~380 pt
│ ◈   · · · · · · ·   only)         │  (synergy rail ◈ overlays
│     ─ ─ ─ center line ─ ─ ─       │   the left margin,
│     · · · · · · ·                 │   collapsible)
│     · · · · · · ·   your half     │
│     · · · · · · ·                 │
│     · · · · · · ·                 │
├───────────────────────────────────┤
│ [ ][ ][ ][ ][ ][ ][ ][ ]   🎒      │  Bench 8 + item tray  ~60 pt
├───────────────────────────────────┤
│ 💰23 (+2)  Lv5 ▓▓▓░ 6/5  ⬆XP  🔄 🔒 │  Economy bar       ~52 pt
├───────────────────────────────────┤
│ ┌───┐┌───┐┌───┐┌───┐┌───┐         │
│ │ 1 ││ 2 ││ 3 ││ 1 ││ 4 │         │  Shop 5 cards      ~130 pt
│ └───┘└───┘└───┘└───┘└───┘         │
├───────────────────────────────────┤
│          home indicator           │  ~34 pt safe area
└───────────────────────────────────┘
```

That totals about 800 pt, within 844, so **the shop, bench and whole board are visible at once**. This fixes Underlords' biggest problem.

### Region details

- **Top bar:** settings, round number, phase label (PREP / COMBAT / LOOT), a timer that turns red and pulses in the last 5 seconds, and your health.
- **Player strip:** 8 compact chips showing avatar and health, sorted by health, with you highlighted. Also a streak flame icon, and an "up next" marker on the opponent you'll face. Tap a chip to scout that board; a banner "Viewing: <name> · Back" appears and the shop dims. Eliminated players gray out and move to the end.
- **Board:** your half is interactive during prep. Tiles highlight on drag: valid tiles glow, full tiles show a swap indicator. The unit cap (e.g. 6/5) turns red and shakes if you exceed it, and the "extra" units get a warning badge.
- **Synergy rail:** a vertical column of chips over the board's left margin, sorted active first. Each chip shows the icon, count/threshold (e.g. 3/4) and pips; active ones are full color, inactive dimmed. Tap a chip to open a bottom sheet with the full bonus text for every threshold and the units that count toward it; units not yet owned are shown dimmed. Collapsible to icons only.
- **Bench:** 8 slots of at least 44 pt. When full, the slots flash if you try to buy.
- **Item tray (🎒):** opens a small horizontal tray above the bench. Drag an item onto a unit; valid targets glow. A tray badge shows the number of unequipped items.
- **Economy bar:** gold, with next round's interest preview in parentheses; level, XP bar and unit cap; Buy XP button with cost; reroll with cost; lock toggle. Buttons that can't be afforded are grayed with the cost shown in red.
- **Shop:** 5 cards. **Tap to buy** (not drag), because it's faster one-handed. Each card shows art, name, cost badge, tier-colored frame with a tier shape or number, and faction and role icons. A card that completes a merge glows and shows a ★★ or ★★★ badge before you buy. Long-press opens the inspect sheet. The tier odds for your level sit in a thin row above the cards or in a popover on the level indicator.
- **Selling:** while you drag a unit, the shop area turns into a sell zone reading "Sell for X 💰".
- **During combat:** the shop and economy bar collapse into a **combat panel**: damage meters per unit, opponent name, and round result. The board stays visible.

### Key interaction flows to design

1. **Buy → merge:** tap card → unit flies to the bench → if it's the 3rd copy, the three copies fly together with a merge burst and a star-up badge, plus haptics.
2. **Place:** drag bench → board, board → board (swap), board → bench.
3. **Sell:** drag onto the shop area.
4. **Inspect:** long-press any unit (board, bench, shop, opponent) → bottom sheet with stats, ability, synergies, items and star upgrade preview.
5. **Scout:** tap player chip → view their board → Back.
6. **Items:** open tray → drag item onto unit; long-press item for details; plus combining items if the game has item recipes.
7. **Round flow:** prep timer → board transitions to combat (opponent half fills in) → fight → result banner and damage number flying to the loser's health → back to prep.
8. **Loot / choice rounds:** a modal "pick 1 of 3" (items, or a commander such as Underlords' Underlord) with large cards and a timer.
9. **Elimination and victory:** placement screen (1st–8th), the final board, and rewards.
10. **Disconnect and reconnect.**

---

## 6. Screens and deliverables requested from the UI agent

### 6.1 Screen list

Front end:
1. Splash / loading (with tips)
2. Home: big Play button, bottom navigation (Home, Collection, Pass/Progress, Profile, Settings)
3. Mode select (Standard, Quick/Turbo, Practice vs bots)
4. Matchmaking / lobby (8 player slots filling in, cancel)
5. Collection / codex: all units by faction and role, synergy reference, unit detail
6. Profile and ranks
7. Settings: graphics quality, audio, haptics, reduce motion, colorblind mode, text size, language
8. First-time tutorial overlay (step-by-step coach marks introducing one HUD region at a time)

In match:
9. Prep phase HUD (the layout above)
10. Combat phase HUD (combat panel)
11. Scouting another player's board
12. Unit inspect sheet
13. Synergy details sheet
14. Item tray and item detail
15. Loot / "pick 1 of 3" modal
16. Round result states (win / loss / draw)
17. Eliminated screen and victory / placement screen
18. Post-match summary: placement, final board, synergies, damage stats, rewards
19. Pause / leave-match confirmation; reconnecting state

### 6.2 Components

Buttons (primary, secondary, icon, disabled, cost button), shop card (all tier variants plus merge-ready, unaffordable, locked, sold-out), unit health/mana/star overlay, bench slot (empty, filled, drop target), board tile states (normal, valid drop, invalid, swap, over-cap), synergy chip (inactive, partially active, active per tier), player chip (normal, you, next opponent, eliminated, streak), timer (normal, warning), gold/XP/health counters with change animations, bottom sheet, modal, toast, coach mark, tab bar.

### 6.3 Style tokens (layout stays the same, skin swaps per art style)

Define one set of design tokens (colors, type scale, spacing, corner radius, border style, shadows, motion) and three skins:

| Art style | Suggested UI skin |
|---|---|
| A: Painted Heroic | Warm parchment and painted-metal frames, gold trims, hand-lettered display font plus a clean sans-serif for numbers |
| B: Grounded Dark Fantasy | Dark glass and forged-metal panels, thin engraved borders, faction-color emissive highlights, restrained serif display font |
| C: Collectible Figurine | Rounded "toy plastic" panels with soft bevels, bright candy colors, chunky rounded display font |

Shared across all skins:
- **Tier colors:** 1 gray, 2 green, 3 blue, 4 purple, 5 gold, **always paired with a tier number or pip count**.
- **Faction colors:** Sunforged gold, Tidebound cyan/teal, Wildroot green/amber, **always paired with a faction icon**.
- **Semantic colors:** gold (currency), red (health loss, danger, unaffordable), green (valid, gains), blue (XP).

### 6.4 Motion spec

Durations and easing for: buy (card to bench), merge, drop, invalid-drop bounce, reroll (cards flip), level up, gold gain, health loss, timer warning, phase transitions, bottom sheet open and close.

### 6.5 Accessibility

Colorblind modes (protanopia, deuteranopia, tritanopia); text size setting (100–130%) without breaking layout; reduce motion; haptics toggle; minimum contrast ratio 4.5:1 for text; no information carried by color alone.

### 6.6 Output format

- Wireframes at 390 × 844 pt for every screen and state listed above, then high-fidelity mockups for at least the prep HUD, combat HUD, shop card set and inspect sheet in **each of the 3 skins**.
- The components as a documented library with states.
- An interaction and motion spec (a table is fine).
- Preferably, **HTML/CSS mockups** that can be opened on a phone and reused directly by the web build, rather than static images only.

### 6.7 Responsive targets

- Small phone: 360 × 740 (Android) and 375 × 667 (iPhone SE). Everything must still fit; shrink the board and cards before hiding anything.
- Standard phone: 390 × 844.
- Large phone: 430 × 932.
- Tablet portrait (about 768 × 1024): the board can grow; consider moving the synergy rail and player strip to the sides.
- Landscape: not required for launch, but do not design anything that makes it impossible later.

---

## 7. Open questions for the game designer (flag, don't block)

1. Does each unit have exactly 1 faction and 1 role, or more?
2. Are there items, and do items combine into recipes?
3. Is there a commander unit (like Underlords' Underlord), and does it take a board slot?
4. Match length target: rounds of about 20–30 seconds prep, matches of about 15–20 minutes?
5. Is duos mode planned (affects player strip and scouting)?
6. Monetization (cosmetics, battle pass) affects front-end navigation, but it can be placeholder for now.

---

## Sources and reference libraries

- Underlords rules (shop, reroll 2 gold, 5 XP for 5 gold, interest, bench 8, shop lock): [Dota Underlords Wiki – How to play](https://dotaunderlords.fandom.com/wiki/How_to_play_guide_for_Dota_Underlords), [Shop](https://dotaunderlords.fandom.com/wiki/Shop), [Gold](https://dotaunderlords.fandom.com/wiki/Gold), [Digital Trends overview](https://www.digitaltrends.com/gaming/what-is-dota-underlords-valve-auto-chess/), [Wikipedia](https://en.wikipedia.org/wiki/Dota_Underlords)
- Underlords mobile vs PC UI criticism and the later PC UI option: [Inven Global](https://www.invenglobal.com/articles/8439/valve-has-changed-dota-underlords-ui-to-look-less-like-a-mobile-port), [Medium – "What's wrong with UI of Dota Underlords mobile?"](https://medium.com/@pekarskiy/whats-wrong-with-ui-of-dota-underlords-mobile-2f6164abe50b), [Hardcore Droid review](https://www.hardcoredroid.com/dota-underlords-mobile-review/), [Steam discussion](https://steamcommunity.com/app/1046930/discussions/0/1637536330463407644/)
- **Screenshot libraries (use these to verify layouts):** [Game UI Database – Dota Underlords (Mobile)](https://www.gameuidatabase.com/gameData.php?id=550), [Interface In Game – Dota Underlords](https://interfaceingame.com/games/dota-underlords/), [Interface In Game – TFT Mobile](https://interfaceingame.com/games/teamfight-tactics-mobile/), [Game UI Database – Mobile controls](https://www.gameuidatabase.com/index.php?scrn=147)
- TFT shop features (odds, streak, merge hint, drag to sell): [Zach Roberson – TFT UI Design](https://zacharyrobes.com/teamfight-tactics-ui-design), [esports.gg – TFT UI tools](https://esports.gg/guides/teamfight-tactics/tft-tip-tuesday-how-to-utilize-the-ui-tools/)
- Marvel Snap UI: [ArtStation – "SNAPPY U.I."](https://www.artstation.com/artwork/GemNDd), [UX case study](https://bootcamp.uxdesign.cc/marvels-snap-ui-ux-case-study-9f727d8f3875)
- Clash Royale portrait UX: [The Rookies – Clash Royale UX breakdown](https://www.therookies.co/blog/education/game-design-ux-best-practices-detailed-breakdown-of-clash-royale)
- Touch target sizes: Apple Human Interface Guidelines (44 pt) and Google Material Design (48 dp).
