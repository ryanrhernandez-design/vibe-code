# Type C: Collectible Figurine (selected art direction)

The written specs from the Type C theme package that the game implements. The full package
(15 character turnarounds, 3 arena concepts, UI mockups, PDFs) is about 65 MB and is kept
outside the repo; `tools/extract_art.py` rebuilds `src/assets/` from it.

| File | What it is |
|---|---|
| `START_HERE_Coding_Agent.md` | Handoff rules for implementation |
| `Art_Direction_Guide.md` | Proportions, materials, faction palettes, board rules, star upgrades, per-character notes |
| `Concept_Review_Notes.md` | Known inconsistencies in the concept images |
| `Comprehensive_UI_Proposal.md`, `screen_specifications.json` | Screen-by-screen UI proposal |
| `theme_tokens.json`, `factions.json`, `board_topology.json` | Tokens, palettes and exact board geometry |
| `vector_marks/` | Faction (sun, shell, leaf) and role marks used in the UI |

## How the game uses it

- **UI:** porcelain surfaces, champagne-gold edges, teal primary actions, tier colors and the vector marks (`src/ui/theme.ts`, `src/ui/icons.ts`, `src/styles.css`).
- **Portraits:** the front view of each turnaround sheet, cropped by `tools/extract_art.py` into a full figure and a bust for cards, the bench, inspect sheets and the collection. The 3 tier-4 units (Solar Lancer, Maelstrom Gunner, Moonfang Druid) have no concept sheet yet, so their portraits are rendered from the in-game figurine at startup.
- **Board units:** procedural figurines that follow the guide's proportions, materials and signature silhouettes (`src/render/unitModel.ts`). Following the handoff, turnaround sheets are not sliced into gameplay sprites; real models come from a separate production pass.
- **Arenas:** Sunlit Sanctum, Drowned Reef and Heartwood Hollow as 3D boards with themed props; the concept paintings appear only as a soft backdrop.

## Known differences from the package

- The package describes the original 15-unit roster, with Lumen Archer, Harpoon Deadeye and Thornfang Stalker at tier 2 and no tier-4 units. The game data (owned by the game, per the handoff's precedence rules) has 18 units, puts those three at tier 1, and adds three tier-4 units. Concept art for the tier-4 units is still needed.
- The package's design-only "Progress" tab is hidden, as the proposal specifies, until a progression system exists. Items, commanders and ranked play are not implemented.
