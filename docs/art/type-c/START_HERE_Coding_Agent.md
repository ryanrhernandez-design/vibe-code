# Handoff to the game coding agent

The user selected Type C, Collectible Figurine, from the original three art options. Implement its visual language without changing game rules in response to decorative images.

## Read in this order
1. Original_Design_Brief.md for the source requirements.
2. ../05_Direction/Art_Direction_Guide.md for the selected theme.
3. assets.json and theme_tokens.json for stable IDs and proposed values.
4. ../03_Boards/board_topology.svg and board_topology.json for exact geometry.
5. The concept PNGs for materials, shapes and personalities.

## Keep these distinctions explicit
- Cost tier (1-5), unit role, faction and star upgrade (1-3) are different attributes.
- The source roster contains no tier-4 unit; do not invent one from a UI mockup.
- Legendary is retained as the source label, not a newly specified synergy role.
- Concept art may show incorrect tiles, extra decoration, approximate views or placeholder UI values.
- No rendered text or numbers in the UI material study are authoritative game data.
- Models, rigs, textures and animations are NOT included. Use concepts as art references.
- Do not slice a turnaround sheet into a gameplay sprite without a separate asset-production pass.

## Visual integration goals
Keep the board visible while shopping. Keep frames thin around dense controls. Use sun/shell/leaf faction icons with color, tier numbers with tier colors, and explicit star counts. Support subdued VFX, reduced motion and clear selection rings. Preserve stable IDs when associating future models and portraits with these concepts.

## Required follow-through by the implementation team
Choose one renderer and confirm import conventions. Reconcile each sheet into a single coherent model. Confirm equipment handedness, profile angle and occluded attachments. Produce actual texture maps and animations. Validate device performance, touch behavior and accessibility in the running game. This art package makes none of those runtime claims.

## UI follow-on
Read ../07_Comprehensive_UI/Comprehensive_UI_Proposal.md and screen_specifications.json. The visual mockups contain illustrative data discrepancies; the written specification and roster metadata govern data. The HTML is a design demonstrator, not game code.
