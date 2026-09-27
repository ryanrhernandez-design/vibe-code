# Crowns & Tiles (working title)

A phone-first auto battler in the spirit of Dota Underlords: 8 players, a shared unit shop, 3-copy merging, faction and role synergies, and automatic fights. Playable in a phone browser in portrait, one-handed.

## Play locally

```bash
npm install
npm run dev        # open the printed URL; use the "Network" URL to play on your phone (same Wi-Fi)
```

Other scripts: `npm test` (sim tests), `npm run typecheck`, `npm run build` (static site in `dist/`).

## How it's built

| Folder | What it does |
|---|---|
| `src/sim/` | The rules, with no graphics: unit data, deterministic combat, shop, economy, merging, pairings and bots. The same code can run on a server later. |
| `src/render/` | Three.js board: camera fitted to portrait screens, procedural placeholder unit models, combat playback, effects, touch picking. |
| `src/ui/` | DOM HUD and front end following the Type C UI proposal, theme tokens, icons, art registry, local settings and history. |
| `src/game/` | Controller: round loop, drag-and-drop, sell zone, scouting, sheets. |

Combat is deterministic: the same seed and boards always give the same fight, so every fight is resolved instantly (headless) and your own fight is replayed on screen.

## Current content

- 18 units in 3 factions (Sunforged Dominion, Tidebound Covenant, Wildroot Clans), tiers 1–5
- 7 synergies: 3 factions (2/4/6) and 4 roles (2/4)
- Art direction: **Type C, Collectible Figurine** (see `docs/art/type-c/`): porcelain UI, portraits cropped from the concept sheets, toy figurines on round bases, 3 arenas (Sunlit Sanctum, Drowned Reef, Heartwood Hollow)
- Home, Collection (codex with search and filters), Profile (local match history), Practice mode (no prep timer), and a results screen

Board units are procedural figurines built to the art guide; real models are a separate production pass. `tools/extract_art.py` rebuilds the UI art in `src/assets/` from the Type C package.

## Docs

- `docs/art-prompts.md`: art generation prompts (3 styles × 3 factions × 6 units, plus 3 boards)
- `docs/ui-design-brief.md`: UI handoff brief (Underlords teardown and phone UI patterns)
- `docs/art/type-c/`: the selected Type C art direction, UI proposal, tokens and vector marks
