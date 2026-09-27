# Type C - Collectible Figurine

Art direction package v1.0 | September 26, 2026

## Direction and authority

### Selected direction

Type C - Collectible Figurine is the user-selected visual direction. Treat the supplied four-panel Type C sheet as the approved style anchor. The 20 new images extend this choice into a complete initial roster and environment set; they are proposed designs for review, not individually approved production assets.

### Scope

This package covers theme, character appearance, environments, materials, star-upgrade appearance and a preliminary UI skin. Gameplay rules, economy, unit ability values, network behavior and game implementation remain with the coding agent. Names, roles and cost tiers are retained from the supplied design brief.

### What is actually delivered

15 character sheets with front/side/rear concept views, 3 arena concept images, 1 nine-figure upgrade sheet, 1 UI material study, the original selected reference, this illustrated guide, editable specifications, exact generation prompts, reusable theme tokens, core vector marks, an exact board topology reference and an offline gallery.

### Production boundary

Raster concepts are not meshes, rigs, UVs, texture maps, cutout sprites or animations. View angles and ornaments can vary between generated panels. Modelers must reconcile them into a single coherent design before creating production geometry. The board SVG is authoritative for tile counts; environment images are authoritative only for visual atmosphere and materials.

## The collectible design language

### Proportion

Aim for about 2.5 heads of body height, with deliberate exceptions for species. Faces, helmets and signature equipment dominate. Most of the silhouette should be legible as a solid black shape; small engraving is a close-up reward, never the primary identifier.

### Shape hierarchy

Use three levels: one strong primary silhouette, two or three role-defining secondary forms, then restrained trim. Tanks have broad shoulders and shields/claws. Ranged units have a clear directional weapon. Casters have a dome, halo, staff or floating focal prop. Legendary units add presence through mass and a unique focal feature, not unlimited decorative detail.

### Material hierarchy

Contrast matte body surfaces with small polished regions. Ivory ceramic and painted vinyl carry large forms; metal trim occupies edges and attachments. Moss, bark, cloth and fur should read as sculpted masses rather than individual fibers. Use opaque pearlescent treatments for magical water and jellyfish surfaces.

### Lighting

Warm broad key, soft fill, gentle contact shadows and a controlled rim. Faces must remain readable on all three boards. Avoid blown-out gold highlights and large pure-white glows. Character highlights should be clearer than environment highlights.

### Emotional tone

Charming, collectible and capable. Friendly creature faces coexist with formidable weapons. Drowned and undead motifs stay theatrical and toy-like, without gore or realistic decay. Avoid infant proportions, generic emoji faces and gritty texture noise.

## Faction system

### Sunforged Dominion

Palette: #F5EAD2, #C89B46, #F49A38, #6A4930. Motifs: solar rays, cathedral arches, ivory enamel, polished warm gold. Materials: Ivory ceramic armor, polished gold trim, sculpted cream fabric, opaque amber gems. Keep the main faction color readable in a small portrait and retain a consistent family of base trims.

### Tidebound Covenant

Palette: #183747, #2A777B, #B38B50, #65DCE7. Motifs: shell plates, coral, rope, portholes, nautical curves. Materials: Teal enamel shell, matte navy coat, satin brass, opaque cyan glass. Keep the main faction color readable in a small portrait and retain a consistent family of base trims.

### Wildroot Clans

Palette: #56734B, #76503A, #EEE0BC, #D89B3C. Motifs: rounded bark, leaves, antlers, amber, mushrooms. Materials: Matte sculpted bark and fur, soft moss shapes, smooth bone ceramic, amber resin. Keep the main faction color readable in a small portrait and retain a consistent family of base trims.

### Marks and identification

Use sun, shell and leaf as the canonical small faction glyphs. The generated nautical artwork sometimes uses a trident or compass emblem; these may remain decorative, but the UI faction identifier is the shell. Faction palette, unit cost-tier stripe and star count are separate visual channels. Never use gold trim alone to imply cost or power.

### Shared base

Use one low round base family with faction-specific surface inlays and a separate team/selection ring. The ornate presentation bases in the concepts are display references; for combat, reduce their height and keep decoration inside the tile footprint. Do not rotate faction emblems independently of the character model.

## Board design rules

### Geometry

The intended board contains 7 columns by 8 rows, divided horizontally into two 4-row halves. Each bench contains 8 slots. The SVG and JSON topology in this package encode those counts exactly. Generated art may contain extra or missing tile seams, misplaced center motifs or too few sockets.

### Visual hierarchy

Tiles are the calmest surfaces. Keep all columns, mushrooms, coral, lanterns and scenic props outside the playable grid. The central divider should read as a thin horizontal seam, not an impassable trench or a vertical lane. Prefer an unobstructed near edge.

### Camera

Use a fixed three-quarter overhead art direction near 55 degrees, then validate actual framing in the game. The images are perspective concepts, not camera-calibrated renders. Board borders may be cropped before the playable area is reduced. Provide enough padding for tall units without hiding upper rows.

### Palette balance

Sunlit Sanctum: warm ivory play surface, peach clouds, muted gold joints. Drowned Reef: desaturated teal play surface, navy water border, restrained cyan details. Heartwood Hollow: muted moss and warm stone play surface, bark borders and amber accents. Faction identity cannot depend on blending into its home board.

### Assembly vocabulary

Separate visual modules: tile, edge, corner, center seam, bench socket, outer plinth and themed border prop set. Keep decorative sockets distinct from the interactive bench UI; the UI owner decides which scenic bench elements remain visible to avoid duplication.

## Star upgrades and effect language

### 1 star

The complete base design with clean materials and the unit's normal magical focal point. Do not intentionally make the base unit look unfinished. One visible star badge remains the unambiguous indicator.

### 2 stars

Keep the same mesh proportions and footprint. Increase selected trim richness, add small emissive seams and use two star badges. The upgrade should still read with bloom disabled; badge count carries meaning when color changes are subtle.

### 3 stars

Add localized glow and a few faction particles: sun sparks, cyan droplets or amber leaves. Maintain the same equipment, head proportions and base size. Three badges identify the state. Avoid persistent full-body aura clouds that hide units behind it.

### Motion character

Tanks have grounded weight with short anticipations. Melee units use crisp compact arcs. Ranged units exaggerate wind-up and release. Casters gather energy around a single prop before release. Victory should feel like a collectible coming to life; defeat can be a gentle collapse or deactivation, not dismemberment.

### Required animation references

Idle, move, attack, cast, hit, death and victory remain the requested animation set. This package specifies their visual intent; no animation clips are included. Exact event timing and ability behavior must be provided by the game owner.

## Production handoff and review

### Recommended delivery contract

For each future model: editable source scene, engine-neutral exported model, named materials, texture maps, separate held props, base mesh, attachment sockets and seven animation clips as applicable. The coding agent must confirm actual file format, axes, units, rig and texture packing before production export.

### Budget status

The original 8k-12k triangle character targets and 20k legendary ceiling are preliminary. No renderer or device profiling has been performed here. Allocate geometry to silhouette and major rounded bevels first; bake small trim. Do not interpret a concept render as evidence of mobile performance.

### Readability review

Review the eventual character at roughly 80 pixels tall, in grayscale and against all three boards. Confirm role silhouette, face or visor, main weapon and faction accent remain distinguishable. These are acceptance checks for the implementation, not completed runtime tests.

### Source precedence

1. Explicit user decisions. 2. Exact rules and topology in the original brief. 3. Written theme specifications and tokens. 4. Selected Type C reference for visual language. 5. New concept sheets for individual design details. When raster art conflicts with exact geometry or data, use the written specification.

### Outstanding visual approvals

Only Type C overall has been selected. Individual character sheets, all arena expansions, exact UI tokens and the comprehensive UI proposal still require creative review. Do not mistake proposed artwork for approved gameplay changes.

## Character and environment catalog

### Bastion Warden

Asset ID: `bastion_warden`

Image: `02_Characters/sunforged/bastion_warden_turnaround.png`

Broad ivory armored knight. Narrow orange visor, sunburst crown-like helmet, oversized cathedral-door shield with gold sun emblem, short flanged mace, white-gold tabard. Match the approved top-left character closely.

Review note: Shield and mace must stay on the same anatomical arms in every view; armor seams and tabard length must agree.

Faction: Sunforged Dominion. Source role: Tank. Source cost tier: 1. Signature silhouette: Shield rectangle and sun-crowned helmet.

### Dawnblade Duelist

Asset ID: `dawnblade_duelist`

Image: `02_Characters/sunforged/dawnblade_duelist_turnaround.png`

Elegant adult female fencer translated to compact heroic toy proportions. One ornate sunburst pauldron, white leather tunic, light gilded armor, flowing short half-cape and long braid. Curved sunsteel saber with warm orange edge. Practical covered costume, confident expression.

Review note: Keep saber curve, braid anchoring and single shoulder plate consistent; cape stays clear of saber arm.

Faction: Sunforged Dominion. Source role: Melee. Source cost tier: 2. Signature silhouette: Sweeping saber, asymmetric shoulder and braid.

### Lumen Archer

Asset ID: `lumen_archer`

Image: `02_Characters/sunforged/lumen_archer_turnaround.png`

Hooded archer in cream robes and ivory scale vest. Oversized white-wood longbow with amber prism grip, quiver of light arrows, thin floating gold halo ring behind head. Calm expressive eyes, compact toy proportions.

Review note: Halo is a separate effect or mounted element; bow and quiver must not merge into the body.

Faction: Sunforged Dominion. Source role: Ranged. Source cost tier: 2. Signature silhouette: Tall crescent bow, hood and halo ring.

### Choir Priestess

Asset ID: `choir_priestess`

Image: `02_Characters/sunforged/choir_priestess_turnaround.png`

Serene adult priestess in layered white-gold robes, simplified jewel-color stained-glass skirt panels. Small hanging golden censer, floating open hymnal beside her, sunburst halo disc behind head, warm kind face. Toy sculptural rounded folds.

Review note: Book and censer remain separate props; chain simplified into readable links, no text on book pages.

Faction: Sunforged Dominion. Source role: Support caster. Source cost tier: 3. Signature silhouette: Bell-shaped robe, disc halo and floating book.

### The Radiant Colossus

Asset ID: `radiant_colossus`

Image: `02_Characters/sunforged/radiant_colossus_turnaround.png`

Massive compact animated marble statue giant. Rounded cracked ivory marble plating edged with gold, open chest holding an opaque blazing amber sun core, short stone cape, gold ray crown, oversized stone greatsword with gold edge. Heavy toy proportions and monumental personality.

Review note: Cracks are painted grooves, not fragile separated pieces; core and sword are distinct emissive/material regions.

Faction: Sunforged Dominion. Source role: Legendary. Source cost tier: 5. Signature silhouette: Blocky giant, chest sun and broad stone sword.

### Barnacle Brute

Asset ID: `barnacle_brute`

Image: `02_Characters/tidebound/barnacle_brute_turnaround.png`

Hulking dwarf-like sailor toy in rounded teal crab-shell armor. Broad white beard, glowing cyan eyes under shell helmet, coral shoulders, navy sash and brass belt, rope and anchor chains. One arm giant orange-red crab claw, other a navy glove. Match approved top-right character closely.

Review note: Claw stays on the same anatomical arm in every view; coral is chunky sculpted decoration, not tiny spikes.

Faction: Tidebound Covenant. Source role: Tank. Source cost tier: 1. Signature silhouette: Huge orange crab claw, shell helmet and white beard.

### Riptide Corsair

Asset ID: `riptide_corsair`

Image: `02_Characters/tidebound/riptide_corsair_turnaround.png`

Sleek eel-like humanoid pirate with dark navy smooth skin and cyan stripes, fin-like head crest and forearms, dual curved cutlasses, short tattered navy coat with brass buttons. Cunning expressive face, compact nimble toy silhouette, no horror.

Review note: Maintain two separate blades and fin placement; coat tails stay above the base.

Faction: Tidebound Covenant. Source role: Melee assassin. Source cost tier: 2. Signature silhouette: Twin curved blades, fin crest and short coat.

### Harpoon Deadeye

Asset ID: `harpoon_deadeye`

Image: `02_Characters/tidebound/harpoon_deadeye_turnaround.png`

Compact fishfolk hunter in large rounded brass diving helmet with cyan porthole visor. Teal rubberized sculpted diving suit with kelp patches, small twin air tanks on back. Oversized brass harpoon cannon with coiled rope, fully visible barrel.

Review note: Air tanks and hose routing must be consistent; harpoon is a separate prop and aimed away from torso.

Faction: Tidebound Covenant. Source role: Ranged. Source cost tier: 2. Signature silhouette: Round porthole helmet and horizontal harpoon cannon.

### Abyssal Siren

Asset ID: `abyssal_siren`

Image: `02_Characters/tidebound/abyssal_siren_turnaround.png`

Beautiful friendly mysterious sorceress with a rounded violet jellyfish-bell hood, expressive adult face, long soft teal-violet sculpted tendrils replacing lower robe. Floating slightly above a small base. Opaque pearl-like water orbs near hands, pearl and coral jewelry, cyan luminous accents.

Review note: Use opaque pearlescent surfaces, no realistic transparency; simplify visible main tendrils to a manageable set.

Faction: Tidebound Covenant. Source role: Caster. Source cost tier: 3. Signature silhouette: Jellyfish dome and flowing tendril bell.

### Drowned Admiral

Asset ID: `drowned_admiral`

Image: `02_Characters/tidebound/drowned_admiral_turnaround.png`

Imposing toy undead sea admiral, dignified rather than gruesome. Rounded navy greatcoat, brass epaulettes, living coral crown, expressive glowing cyan eyes. Chunky kraken tentacles emerge beneath coat. Ship-wheel shield in one hand and anglerfish lantern in other.

Review note: Wheel has robust thick spokes; lantern and shield separate props; tentacles cannot obscure face or both arms.

Faction: Tidebound Covenant. Source role: Legendary. Source cost tier: 5. Signature silhouette: Coral crown, ship wheel and tentacle coat.

### Mossback Guardian

Asset ID: `mossback_guardian`

Image: `02_Characters/wildroot/mossback_guardian_turnaround.png`

Huge friendly brown bear-folk toy with large dark eyes and small round ears. Thick rounded bark plate armor bound by vines, soft moss and little mushrooms at shoulders, tree-stump round shield showing growth rings, ivory bone charms, green tabard with amber leaf motif. Match approved bottom-left character closely.

Review note: Retain warm brown muzzle and shield growth rings; mushroom shapes are large enough to read.

Faction: Wildroot Clans. Source role: Tank. Source cost tier: 1. Signature silhouette: Round ears, broad bark shoulders and stump shield.

### Thornfang Stalker

Asset ID: `thornfang_stalker`

Image: `02_Characters/wildroot/thornfang_stalker_turnaround.png`

Lean lynx-folk hunter toy, adult heroic proportions with oversized expressive head, tufted ears, tawny spotted fur. Light moss-green leather harness, feather and amber bead accents, forearms bound in rounded thorn vines ending in prominent bone claws. Neutral standing pose, agile personality.

Review note: Keep paired claw count consistent; paws and bone claws remain visually separated.

Faction: Wildroot Clans. Source role: Melee. Source cost tier: 2. Signature silhouette: Tufted ears, cheek ruff and paired claw gauntlets.

### Antlered Huntress

Asset ID: `antlered_huntress`

Image: `02_Characters/wildroot/antlered_huntress_turnaround.png`

Tall within chibi style stag-folk huntress, expressive doe face, branching rounded antlers with a few amber charms. Fur-trimmed moss leather cape, amber face stripes. Bundle of stone tipped javelins and short atlatl launcher. Warm brown, moss green, orange and amber.

Review note: Do not replace javelins with a bow; antler branching and charm locations need to agree across views.

Faction: Wildroot Clans. Source role: Ranged. Source cost tier: 2. Signature silhouette: Branching antlers and slender javelin bundle.

### Sporecaller Shaman

Asset ID: `sporecaller_shaman`

Image: `02_Characters/wildroot/sporecaller_shaman_turnaround.png`

Small wise toad shaman toy with expressive golden eyes, large rounded red mushroom-cap hat, woven grass cloak and strings of amber beads. Gnarled staff topped with glowing yellow-green spores. A few luminous spore motes, rounded approachable face.

Review note: Keep hat wide but readable, toes separated, staff independently modeled; particles not baked into texture.

Faction: Wildroot Clans. Source role: Caster. Source cost tier: 3. Signature silhouette: Red mushroom cap, round toad face and spore staff.

### Elder Heartwood

Asset ID: `elder_heartwood`

Image: `02_Characters/wildroot/elder_heartwood_turnaround.png`

Ancient compact walking tree spirit toy, wise owl-like face formed in rounded bark, glowing amber eyes, small stylized deer skull mask on brow, branch antlers with autumn leaves, broad root feet. Lantern filled with glowing amber sap, a few fireflies. Majestic and friendly, not horror.

Review note: Skull brow charm must not hide eyes; branches thick and leaves grouped; separate lantern from root fingers.

Faction: Wildroot Clans. Source role: Legendary. Source cost tier: 5. Signature silhouette: Owl face, branch crown and root feet.

### Sunlit Sanctum

Asset ID: `sunlit_sanctum`

Image: `03_Boards/sunlit_sanctum_concept.png`

Floating ivory marble plaza above peach and golden clouds. Warm sandstone alternating with ivory tiles, thin gold tile joints, subtle sunburst at center, ivory-gold columns and hanging banners on borders, warm braziers, small waterfalls spilling over the floating island. Morning-golden light. Match the approved board style closely.

Review note: Ivory flat tiles / gold separators / peach cloud surround

### Drowned Reef

Asset ID: `drowned_reef`

Image: `03_Boards/drowned_reef_concept.png`

Deck of a giant sunken galleon in a shallow moonlit lagoon, rendered as a luxurious toy playset. Flat teal weathered wood and coral-slab tiles, thin brass tile joints, cyan shell center stripe. Borders only: rounded broken mast, thick rigging, tiny barnacled cannon props, chunky coral and anemones, sculpted dark-blue water, brass anglerfish lanterns. Cool moonlight with soft cyan accents; bright readable play surface, opaque stylized water.

Review note: Desaturated teal flat tiles / brass separators / navy water surround

### Heartwood Hollow

Asset ID: `heartwood_hollow`

Image: `03_Boards/heartwood_hollow_concept.png`

Arena on a colossal rounded tree stump within a miniature forest. Flat mossy stone tiles embedded in wood, amber resin center stripe. Borders only: curling thick roots, rounded giant mushrooms, amber lanterns, stylized antler totems, a few glowing spores, autumn leaf canopy pushed to background. Warm afternoon light, soft moss, sculpted bark and resin materials.

Review note: Muted moss flat tiles / bark separators / amber forest surround

### Star upgrade treatments

Asset ID: `star_upgrade_treatments`

Image: `04_UI_and_Upgrades/star_upgrade_treatments.png`

Three faction tanks, each across three star appearances. Same body and equipment; only trims, material and effect intensity change.

Review note: Stars are progression markers, not shop cost tiers. No silhouette or scale increase.

### Collectible UI theme

Asset ID: `ui_theme`

Image: `04_UI_and_Upgrades/collectible_ui_theme.png`

Illustrative prep HUD, shop cards and material treatments for the selected collectible theme.

Review note: Visual styling only. Mockup layout/text is illustrative; gameplay values and exact responsive layout belong to the coding agent.
