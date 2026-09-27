# Art Generation Prompts

> **Status:** Style C (Collectible Figurine) was selected. The resulting art direction lives in `docs/art/type-c/`. The prompts below are kept for generating new units, such as the three tier-4 units that don't have concept sheets yet.

Prompts for generating concept art and 3D-ready references for the game's first 3 character factions (6 units each, matching `src/sim/data.ts`) and 3 boards. The target is high-fidelity Unity (URP) graphics that stay readable on a phone screen.

There are **3 art styles** (A, B, C). Each one can be applied to every faction and every board, so you can generate the same unit or board in all three styles and compare them side by side before committing to one look for the whole game. Each faction keeps its own color palette and design motifs in every style, so players can tell factions apart at a glance.

All names, characters and settings here are original. Do not add references to Dota, Valve or any other existing franchise.

---

## How to use these

Prompts are built from interchangeable pieces:

- **Character:** `[Style X character block]` + `[character prompt]`, optionally + `[turnaround suffix]`
- **Board:** `[Style X board block]` + `[board layout block]` + `[board theme prompt]`
- **Negative prompt:** `[shared negative]` + `[Style X negative additions]`, if the tool supports one

Steps:

1. **Compare styles first:** generate the same few test pieces in all three styles, for example the tier-1 tank from each faction plus one board. That is 12 images. Compare them on your phone before generating everything.
2. **Concept image:** paste the combined prompt into an image generator (Midjourney, GPT Image, Flux, etc.).
3. **Turnaround:** add the turnaround suffix to get front, side and back views. 3D generators and artists both need these.
4. **3D model:** feed the front view (or the turnaround) into an image-to-3D tool (Meshy, Tripo, Rodin/Hyper3D) or give it to a 3D artist, using the Unity specs at the bottom of this file.
5. **Readability check:** shrink each concept to about 80 px tall. That is roughly the size of a unit on a phone. If you can no longer tell its role (tank, archer, caster), simplify the silhouette.

Optional Midjourney parameters: `--ar 1:1 --style raw --v 7` (single view) or `--ar 16:9` (turnaround). Adding `--sref` with a reference image you like keeps a style consistent across all units.

---

## Art styles

### Style A: Painted Heroic

A bold, hand-painted look, as if a fantasy illustration were brought to life in 3D. It is chunky and readable, with visible brush-stroke texture and exaggerated heroic proportions. This is the safest pick for phones: strong silhouettes, and it hides low polygon counts well.

**Character block:**
```
Stylized high-fidelity 3D game character for a premium mobile strategy game, hand-painted textures with visible painterly brush strokes and baked color gradients, crisp material separation (polished metal, worn leather, heavy cloth, skin, gemstones), chunky readable silhouette with exaggerated heroic proportions (large hands, feet, shoulders and weapons, about 1:5 head-to-body ratio), bold primary shapes with small secondary detail, saturated but harmonious colors, soft studio three-point lighting with a warm rim light, full body, centered, neutral mid-grey seamless background, A-pose, front view, orthographic camera, game-ready asset, Unity URP render quality
```

**Board block:**
```
Art style: hand-painted stylized 3D, visible painterly brush strokes on every surface, bold simplified shapes, saturated harmonious colors, soft painted light and shadow gradients, warm rim lighting, storybook fantasy illustration brought to life in 3D.
```

**Negative additions:** `photorealistic, gritty realism, plastic toy look, flat vector art`

### Style B: Grounded Dark Fantasy

A semi-realistic, cinematic look: realistic proportions, detailed physically based (PBR) materials such as scratched steel, worn fabric and wet surfaces, and moody, contrasty lighting. It feels the most premium and "console-like". It is the hardest to keep readable on a small screen, so it depends on strong faction colors and glowing accents.

**Character block:**
```
Semi-realistic high-fidelity 3D game character for a premium mobile strategy game, detailed physically based materials (scratched forged steel, worn stitched leather, heavy woven fabric, realistic skin with subtle pores, cut gemstones), realistic heroic proportions (about 1:7 head-to-body ratio) with a slightly oversized weapon and armor for readability, strong clear silhouette, glowing emissive accents in the faction color, cinematic studio lighting with a strong cool rim light and soft key light, full body, centered, dark neutral grey seamless background, A-pose, front view, orthographic camera, game-ready asset, Unity URP high quality render
```

**Board block:**
```
Art style: semi-realistic dark fantasy 3D, detailed physically based materials with realistic wear, weathering and grime, grounded realistic proportions, moody cinematic lighting with strong contrast, volumetric light shafts and atmospheric haze in the background, glowing emissive accents, premium console-quality fantasy environment.
```

**Negative additions:** `cartoon, chibi, cel shading, oversized heads, toy-like, flat colors`

### Style C: Collectible Figurine

Premium designer-toy figurines: big heads, small bodies, soft rounded shapes, and clean sculpted materials such as glossy painted vinyl, matte ceramic and polished metal. Boards look like handcrafted tabletop playsets. This is the most readable and charming style on a phone, and the most distinctive against other auto battlers.

**Character block:**
```
Stylized high-fidelity 3D collectible figurine character for a premium mobile strategy game, designer vinyl toy aesthetic, cute but heroic chibi proportions (about 1:2.5 head-to-body ratio, big expressive head, compact body, oversized weapon), soft rounded sculpted shapes, clean smooth materials (glossy painted vinyl, matte ceramic, polished enamel metal, soft fabric), simple clear color blocking, very readable silhouette, soft diffused studio lighting with gentle ambient occlusion and a soft rim light, full body, standing on a small round display base, centered, light neutral grey seamless background, A-pose, front view, orthographic camera, game-ready asset, Unity URP render quality
```

**Board block:**
```
Art style: handcrafted miniature tabletop playset, looks like a premium collectible toy diorama, soft rounded sculpted shapes, clean smooth materials (painted resin, matte ceramic, glossy enamel, felt), simple clear color blocking, soft diffused lighting with gentle ambient occlusion, subtle tilt-shift miniature depth of field in the background.
```

**Negative additions:** `photorealistic, gritty, grimy, realistic proportions, horror, sharp noisy detail`

---

## Shared prompt pieces

**Turnaround suffix (add this at the end for 3D reference):**
```
, character turnaround sheet, front view, side view and back view side by side, same A-pose in every view, consistent proportions, flat even lighting
```

**Shared negative prompt (for characters):**
```
text, watermark, logo, background scenery, cropped limbs, dynamic action pose, motion blur, extra fingers, fused limbs, weapon clipping through body, low detail, blurry, noisy textures
```

---

## Character Set 1: Sunforged Dominion

**Theme:** a holy order of solar knights and priests.
**Palette:** ivory, white marble and polished gold, with sun-orange glow accents.
**Motifs:** sunburst halos, radiant stained glass, engraved plate armor, flowing tabards.

**1. Bastion Warden (tank, tier 1)**
```
Sunforged Dominion faction. A towering armored knight in heavy ivory plate armor with gold filigree trim, holding an oversized tower shield shaped like a cathedral door with a glowing sunburst emblem, a narrow visor slit glowing warm orange, a white and gold tabard, broad armored shoulders, a short flanged mace at the hip, color palette ivory, gold, sun-orange
```

**2. Dawnblade Duelist (melee damage, tier 2)**
```
Sunforged Dominion faction. A lithe, elegant fencer in light gilded armor with a single ornate sunburst pauldron and a flowing half-cape, wielding a curved sunsteel saber whose edge glows molten orange, a long braid, confident stance, a white leather bodice with gold stitching, color palette ivory, gold, sun-orange
```

**3. Lumen Archer (ranged, tier 1)**
```
Sunforged Dominion faction. A hooded archer with a longbow carved from white wood and set with a glowing prism crystal at the grip, a quiver of arrows made of solidified light, light scale armor over cream robes, a thin golden halo ring floating behind the head, color palette ivory, gold, pale yellow light
```

**4. Choir Priestess (support caster, tier 3)**
```
Sunforged Dominion faction. A serene priestess in layered white and gold robes with stained-glass panels in the skirt, holding a hanging censer that emits golden light, an open hymnal book floating beside her with glowing pages, a large sunburst halo disc behind her head, color palette ivory, gold, warm amber glow
```

**4b. Solar Lancer (melee damage, tier 4)**
```
Sunforged Dominion faction. A tall cavalry-style knight on foot in sleek gilded plate armor with a crested sunburst helm, wielding a long lance whose tip is a spear of solid sunlight, a flowing white cape with gold trim, a round gilded buckler on the off arm, noble and fierce, color palette ivory, gold, blazing sun-orange light
```

**5. The Radiant Colossus (legendary, tier 5)**
```
Sunforged Dominion faction. A massive animated statue giant made of cracked white marble and gold plating, a blazing molten sun core visible in its open chest, light leaking through cracks across the body, a heavy stone cape, a crown of golden rays, wielding a huge stone greatsword with a gold edge, imposing and monumental, color palette white marble, gold, blazing orange-white light
```

---

## Character Set 2: Tidebound Covenant

**Theme:** drowned sailors and deep-sea creatures risen from the abyss.
**Palette:** deep teal, abyssal navy, violet and tarnished brass, with bioluminescent cyan accents.
**Motifs:** barnacles, coral growth, kelp, anglerfish lures, diving helmets, anchor chains.

**1. Barnacle Brute (tank, tier 1)**
```
Tidebound Covenant faction. A hulking sailor encased in barnacle-crusted crab-shell armor, one arm transformed into a giant armored crab claw, a heavy rusted anchor chain wrapped around the torso, a tattered navy sash, small glowing cyan eyes under a shell helmet, coral growing on the shoulders, color palette deep teal, navy, rusted brass, cyan glow
```

**2. Riptide Corsair (melee assassin, tier 2)**
```
Tidebound Covenant faction. A sleek eel-like humanoid pirate with smooth dark skin and glowing cyan stripes, dual curved cutlasses, a tattered long navy coat with brass buttons, fin-like crests on the head and forearms, a lean agile build, color palette abyssal navy, teal, violet, cyan bioluminescence
```

**3. Harpoon Deadeye (ranged, tier 1)**
```
Tidebound Covenant faction. A fishfolk hunter wearing an old brass diving helmet with a round glowing porthole visor, carrying a large brass harpoon cannon with coiled rope, a rubberized diving suit patched with kelp, air tanks on the back, color palette tarnished brass, teal, navy, cyan glow
```

**4. Abyssal Siren (caster, tier 3)**
```
Tidebound Covenant faction. An ethereal sorceress with a translucent jellyfish-bell hood and long trailing glowing tendrils in place of a lower robe, floating slightly above the ground, orbs of swirling water hovering around her hands, pearl and coral jewelry, eerie beautiful face, color palette violet, teal, pale pink, cyan bioluminescence
```

**4b. Maelstrom Gunner (ranged, tier 4)**
```
Tidebound Covenant faction. A broad-shouldered storm-sailor with a swirling whirlpool tattoo, carrying a massive multi-barreled brass cannon wrapped in kelp with glowing cyan water swirling in the barrels, a tattered captain's tricorn hat, a bandolier of pearl-like shells, color palette navy, tarnished brass, teal, cyan glow
```

**5. Drowned Admiral (legendary, tier 5)**
```
Tidebound Covenant faction. A towering undead admiral in a waterlogged navy greatcoat with tarnished brass epaulettes, a crown of living coral, kraken tentacles emerging from beneath the coat, one hand holding a ship's wheel as a shield, the other holding a glowing anglerfish lantern, barnacles on the boots, commanding presence, color palette navy, teal, tarnished brass, violet and cyan glow
```

---

## Character Set 3: Wildroot Clans

**Theme:** beastfolk tribes and ancient forest spirits.
**Palette:** moss green, bark brown and bone white, with amber and autumn-orange accents.
**Motifs:** antlers, woven vines, amber resin, bone charms, glowing spores, mushrooms.

**1. Mossback Guardian (tank, tier 1)**
```
Wildroot Clans faction. A huge bear-folk warrior in armor made of thick bark plates bound with vines, moss and small mushrooms growing across the shoulders, a shield carved from a tree-stump cross-section showing growth rings, bone charms on the belt, a calm, sturdy stance, color palette moss green, bark brown, bone white, amber accents
```

**2. Thornfang Stalker (melee damage, tier 1)**
```
Wildroot Clans faction. A lean lynx-folk hunter with tufted ears and spotted fur, forearms wrapped in thorned vines ending in sharp bone claws, a light leather harness with feathers and amber beads, a crouched predatory stance, color palette tawny fur, moss green, bone white, amber
```

**3. Antlered Huntress (ranged, tier 2)**
```
Wildroot Clans faction. A tall stag-folk huntress with large branching antlers decorated with hanging charms, carrying a bundle of stone-tipped javelins and an atlatl launcher, a fur-trimmed leather cloak, face paint in amber stripes, color palette bark brown, moss green, autumn orange, amber
```

**4. Sporecaller Shaman (caster, tier 3)**
```
Wildroot Clans faction. A small wise toad shaman wearing a wide red-capped mushroom as a hat, holding a gnarled staff topped with a cluster of glowing spores, clouds of luminous spores drifting around, a woven grass cloak, strings of amber beads, color palette moss green, mushroom red, amber, soft yellow-green glow
```

**4b. Moonfang Druid (support caster, tier 4)**
```
Wildroot Clans faction. A graceful wolf-folk druid with silver-grey fur, a crescent-moon headdress woven from pale branches, holding a staff topped with a glowing moonstone, a cloak of moss and night-blue leaves, a small pool of silver light swirling at the feet, color palette silver, moss green, night blue, pale moonlight glow
```

**5. Elder Heartwood (legendary, tier 5)**
```
Wildroot Clans faction. A massive ancient walking tree spirit with an owl-like face formed in the bark, glowing amber eyes, a deer skull mask on the brow, branch antlers with autumn leaves, root-like legs, holding a lantern filled with glowing amber sap, fireflies circling, majestic and ancient, color palette bark brown, moss green, autumn orange, amber glow
```

---

## Star upgrade variants (optional)

In the game, merging three copies of a unit upgrades it to 2-star, and merging three 2-star copies makes a 3-star. To generate those versions, run the same character prompt again and add one of these suffixes:

- **2-star:** `, upgraded version of the same character, same silhouette and design, richer materials, added metallic trim and small glowing accents`
- **3-star:** `, ultimate upgraded version of the same character, same silhouette and design, ornate premium materials, strong glowing effects, subtle floating particles, regal and powerful`

In Unity, these are usually the same mesh with swapped materials and effects added on top, so you only need concept art for them, not new models.

---

## Board prompts

Each board prompt is `[Style X board block]` + the **layout and gameplay block** below + the board's theme prompt:

```
High-fidelity 3D game board diorama for a premium mobile auto-battler strategy game, viewed from a fixed 3/4 top-down camera at about 55 degrees, portrait orientation 9:16, a clearly readable grid of square tiles 7 columns wide and 8 rows deep with a visible center line splitting it into two 4-row halves, a bench row of 8 slots along the near edge and another along the far edge, the playable grid is flat, evenly lit and uncluttered, all scenery and decoration pushed to the borders and background, soft baked global illumination, gentle depth of field on the far background only, Unity URP render quality, no characters, no UI, no text
```

**Shared negative prompt (for boards), plus the chosen style's negative additions:**
```
characters, units, UI, text, watermark, clutter on the grid, uneven tiles, harsh shadows across the grid, fisheye distortion, blurry
```

### Board 1: Sunlit Sanctum
```
Theme: a floating marble plaza high above a sea of golden clouds. Grid tiles alternate between polished ivory marble and warm sandstone with faint engraved sun glyphs, thin gold inlay lines between tiles, a golden sunburst mosaic marking the center line. Borders: broken white columns, hanging white and gold banners, braziers with warm flames, small waterfalls pouring off the edges of the island into the clouds. Golden-hour lighting, warm sun from the side, light god rays, color palette ivory, gold, sky blue, peach clouds
```

### Board 2: Drowned Reef
```
Theme: the deck of a giant sunken galleon resting in a shallow moonlit lagoon. Grid tiles are weathered teal-tinted wooden planks and flat coral slabs, clearly separated by thin brass strips, with a line of glowing cyan shells along the center line. Borders: a broken mast, tangled rigging, barnacle-covered cannons, glowing coral and sea anemones, calm shallow water lapping the edges with soft caustic light, anglerfish lanterns on posts. Night lighting with a cool moonlight key light and cyan bioluminescent fill; keep the grid bright enough to read. Color palette deep teal, navy, violet, brass, cyan glow
```

### Board 3: Heartwood Hollow
```
Theme: an arena built on the flat top of a colossal ancient tree stump in a deep forest. Grid tiles are mossy flagstones set into the wood, framed by visible growth rings, with a line of glowing amber resin along the center line. Borders: thick curling roots, giant mushrooms, hanging paper lanterns, carved totem posts with antlers, drifting fireflies and glowing spores, an autumn canopy overhead. Dappled late-afternoon sunlight through the leaves, soft warm haze. Color palette moss green, bark brown, autumn orange, amber glow
```

**Day/night variant suffix (optional, for visual variety between rounds):**
`, same board, same camera, [dawn | dusk | night] lighting variant`

---

## Unity technical specs (for 3D generation tools and artists)

**Characters**
- Topology: clean quads, closed mesh, no floating geometry. Use quad-remesh output if the 3D generator offers it.
- Triangle budget (mobile): tier 1–3 units about 8k–12k tris; legendaries up to 20k.
- Textures: PBR (albedo, normal, and a packed metallic/smoothness/occlusion map). Author at 2048 and ship at 1024 on mobile, with one material per character where possible.
- Rig: Unity Humanoid (Mecanim) for two-legged characters. Mixamo auto-rigging works for these. Non-humanoids (Abyssal Siren tendrils, Drowned Admiral tentacles, Elder Heartwood) need a custom Generic rig with extra bones.
- Scale: 1 Unity unit = 1 board tile. Normal units are about 1 tile tall; legendaries are about 1.5–1.8 tiles tall but stay within their own tile's footprint.
- Required animations: idle, move, attack, cast, hit, death, victory.
- Avoid heavy transparency (the Siren's jellyfish hood, water orbs). Use opaque fake-translucency shaders or dithering, since transparency is expensive on phones.

**Boards**
- Build the grid from modular pieces: tile, tile edge, center-line strip and bench slot, each 1 × 1 Unity unit.
- Whole-scene budget: about 60k–100k tris, with texture atlases of 2048 or less.
- Baked lighting (lightmaps and light probes). Only characters and effects should use real-time lights.
- Tile states (hover, valid placement, invalid placement) are emissive decals or shader parameters, not separate meshes.
- Keep the grid area higher in contrast and lower in detail than the borders, so units always read clearly on top of it.

**Notes for each style**
- **Style A (Painted Heroic):** most of the look lives in the albedo (color) texture, with light normal maps. Use the lower end of the triangle budget; this style is the cheapest to run on phones.
- **Style B (Grounded Dark Fantasy):** needs full PBR maps and good normal maps, so author textures at 2048 and consider shipping 2048 on high-end phones only. Add an emissive map for the faction-colored glow, which keeps units readable against the darker boards. Use the upper end of the triangle budget.
- **Style C (Collectible Figurine):** needs simple textures (mostly flat color plus a smoothness map), so 512–1024 is enough. The look comes from smooth geometry and the lighting, so budget polygons for rounded silhouettes. The round display base in the concepts can become the unit's in-game base, which doubles as a team-color ring.
