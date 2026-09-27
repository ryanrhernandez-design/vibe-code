// Procedural "collectible figurine" units, following the Type C art direction:
// ~2.5-head proportions, matte ceramic/vinyl bodies with small polished trims, a low round
// faction base, and one signature silhouette per unit (shield, claw, mushroom hat, ...).
// These stand in for real models built from the concept sheets in the art package.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FACTION_COLORS, type Star, type UnitDef } from '../sim/data';
import { TEAM } from '../ui/theme';

export interface UnitModel {
  root: THREE.Group;
  /** The figure (rotates to face targets); the base stays put. */
  figure: THREE.Group;
  /** Materials that flash red when hit; each remembers its resting emissive. */
  flashMats: THREE.MeshStandardMaterial[];
  /** Orbiting particles on 3-star units (spun by the renderer). */
  particles: THREE.Group | null;
  ring: THREE.Mesh;
  height: number;
}

const SKIN = '#F2D2B6';

// Shared geometry (materials are per unit so they can flash independently).
const G = {
  sphere: new THREE.SphereGeometry(1, 24, 18),
  hemi: new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 24),
  cone: new THREE.ConeGeometry(1, 1, 18),
  capsule: new THREE.CapsuleGeometry(1, 1, 6, 14),
  rbox: new RoundedBoxGeometry(1, 1, 1, 3, 0.18),
  torus: new THREE.TorusGeometry(1, 0.12, 10, 32),
  thinTorus: new THREE.TorusGeometry(1, 0.05, 8, 40),
  arc: new THREE.TorusGeometry(1, 0.06, 8, 24, Math.PI * 0.75),
  halfArc: new THREE.TorusGeometry(1, 0.05, 8, 24, Math.PI),
  bell: new THREE.LatheGeometry(
    [[0.02, 0], [1, 0], [0.96, 0.25], [0.78, 0.6], [0.55, 0.9], [0.4, 1]].map(([x, y]) => new THREE.Vector2(x, y)),
    28,
  ),
  ring: new THREE.RingGeometry(0.4, 0.47, 40),
};

type V3 = [number, number, number];

class Kit {
  readonly group = new THREE.Group();
  readonly flash: THREE.MeshStandardMaterial[] = [];
  private cache = new Map<string, THREE.MeshStandardMaterial>();

  constructor(private readonly star: Star) {}

  private mat(key: string, make: () => THREE.MeshStandardMaterial, flash = true) {
    let m = this.cache.get(key);
    if (!m) {
      m = make();
      m.userData.baseEmissive = m.emissive.clone();
      m.userData.baseIntensity = m.emissiveIntensity;
      this.cache.set(key, m);
      if (flash) this.flash.push(m);
    }
    return m;
  }

  /** Matte ceramic / painted vinyl. */
  vinyl(color: string) {
    return this.mat(`v${color}`, () => new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0 }));
  }
  /** Sculpted cloth, fur, bark and moss. */
  soft(color: string) {
    return this.mat(`s${color}`, () => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0 }));
  }
  /** Polished trim. Upgrades add a warm emissive seam (2★) and a glow (3★). */
  metal(color: string) {
    const glow = [0, 0, 0.18, 0.4][this.star];
    return this.mat(`m${color}`, () =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.85, emissive: color, emissiveIntensity: glow }),
    );
  }
  /** Opaque magical focal points (visors, cores, orbs). Never flashed. */
  glow(color: string, intensity = 1.4) {
    const boost = [1, 1, 1.25, 1.6][this.star];
    return this.mat(
      `g${color}${intensity}`,
      () => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity * boost, roughness: 0.3 }),
      false,
    );
  }

  add(geo: THREE.BufferGeometry, mat: THREE.Material, pos: V3, scale: V3 | number = 1, rot: V3 = [0, 0, 0], parent: THREE.Object3D = this.group) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    if (typeof scale === 'number') m.scale.setScalar(scale);
    else m.scale.set(...scale);
    m.rotation.set(...rot);
    m.castShadow = true;
    parent.add(m);
    return m;
  }

  // ── Reusable body parts ──

  /** Chunky armored torso with legs, arms and shoulder caps. */
  stocky(body: string, trim: string, opts: { wide?: number; arms?: string } = {}) {
    const w = opts.wide ?? 1;
    this.add(G.rbox, this.vinyl(body), [0, 0.4, 0], [0.46 * w, 0.36, 0.32]);
    this.add(G.cyl, this.metal(trim), [0, 0.27, 0], [0.25 * w, 0.05, 0.18]);
    for (const s of [-1, 1]) {
      this.add(G.capsule, this.vinyl(body), [s * 0.12, 0.12, 0], [0.08, 0.1, 0.08]);
      this.add(G.capsule, this.vinyl(opts.arms ?? body), [s * 0.29 * w, 0.36, 0.02], [0.075, 0.12, 0.075], [0, 0, s * 0.25]);
      this.add(G.sphere, this.metal(trim), [s * 0.26 * w, 0.54, 0], [0.11, 0.09, 0.11]);
    }
  }

  /** Slim, agile torso. */
  slim(body: string, trim: string, limbs = body) {
    this.add(G.capsule, this.vinyl(body), [0, 0.4, 0], [0.16, 0.16, 0.13]);
    this.add(G.cyl, this.metal(trim), [0, 0.3, 0], [0.17, 0.035, 0.14]);
    for (const s of [-1, 1]) {
      this.add(G.capsule, this.vinyl(limbs), [s * 0.08, 0.13, 0], [0.06, 0.1, 0.06]);
      this.add(G.capsule, this.vinyl(limbs), [s * 0.21, 0.4, 0.02], [0.055, 0.11, 0.055], [0, 0, s * 0.3]);
    }
  }

  /** Bell-shaped robe (casters, priestesses, coats). */
  robe(color: string, trim: string, height = 0.55, radius = 0.27) {
    this.add(G.bell, this.soft(color), [0, 0, 0], [radius, height, radius]);
    this.add(G.thinTorus, this.metal(trim), [0, 0.03, 0], [radius * 0.98, radius * 0.98, 0.5], [Math.PI / 2, 0, 0]);
    for (const s of [-1, 1]) this.add(G.capsule, this.soft(color), [s * 0.17, 0.42, 0.03], [0.055, 0.1, 0.055], [0, 0, s * 0.45]);
  }

  /** Big toy head: a skin sphere with simple eyes. */
  head(y: number, r: number, color = SKIN, eyes = '#3A2A20') {
    this.add(G.sphere, this.vinyl(color), [0, y, 0], r);
    for (const s of [-1, 1]) this.add(G.sphere, this.vinyl(eyes), [s * r * 0.36, y + r * 0.05, r * 0.88], r * 0.13);
  }
}

// ── Per-unit builds ──

type Build = (k: Kit, c: { main: string; trim: string; glow: string }) => void;

const BUILDS: Record<string, Build> = {
  // Sunforged Dominion: ivory ceramic, polished gold, sun rays.
  warden(k, c) {
    k.stocky(c.main, c.trim, { wide: 1.15 });
    k.add(G.rbox, k.vinyl(c.main), [0, 0.35, 0.17], [0.2, 0.34, 0.03]); // tabard
    k.add(G.sphere, k.vinyl(c.main), [0, 0.76, 0], 0.22); // helmet
    k.add(G.rbox, k.glow('#FF9A3C', 1.8), [0, 0.76, 0.2], [0.2, 0.05, 0.05]); // visor slit
    for (let i = 0; i < 7; i++) {
      const a = (i / 6) * Math.PI - Math.PI;
      k.add(G.cone, k.metal(c.trim), [Math.cos(a) * 0.2, 0.9 + Math.sin(-a) * 0.14, -0.02], [0.035, 0.13, 0.035], [0, 0, a + Math.PI / 2]);
    }
    const shield = new THREE.Group();
    shield.position.set(-0.36, 0.42, 0.14);
    shield.rotation.y = 0.35;
    k.group.add(shield);
    k.add(G.rbox, k.vinyl(c.main), [0, 0, 0], [0.34, 0.52, 0.06], [0, 0, 0], shield);
    k.add(G.rbox, k.metal(c.trim), [0, 0, -0.005], [0.38, 0.56, 0.05], [0, 0, 0], shield);
    k.add(G.cyl, k.metal(c.trim), [0, 0.02, 0.04], [0.09, 0.03, 0.09], [Math.PI / 2, 0, 0], shield);
    for (let i = 0; i < 8; i++) k.add(G.rbox, k.metal(c.trim), [0, 0.02, 0.035], [0.015, 0.36, 0.01], [0, 0, (i / 8) * Math.PI], shield);
    k.add(G.cyl, k.soft('#6A4930'), [0.34, 0.3, 0.12], [0.025, 0.28, 0.025], [0.4, 0, 0]);
    k.add(G.sphere, k.metal(c.trim), [0.34, 0.2, 0.22], 0.08);
  },
  lumen(k, c) {
    k.robe(c.main, c.trim, 0.5, 0.24);
    k.head(0.66, 0.17);
    k.add(G.hemi, k.soft(c.main), [0, 0.68, -0.02], [0.19, 0.22, 0.19], [-0.25, 0, 0]); // hood
    k.add(G.thinTorus, k.metal(c.trim), [0, 0.74, -0.14], 0.2); // halo ring
    k.add(G.halfArc, k.vinyl('#FBF3E6'), [-0.3, 0.45, 0.06], [0.1, 0.36, 0.2], [0, Math.PI / 2, Math.PI / 2]); // bow
    k.add(G.sphere, k.glow(c.glow), [-0.3, 0.45, 0.1], 0.04);
    k.add(G.cyl, k.soft('#8A6A48'), [0.1, 0.5, -0.18], [0.05, 0.3, 0.05], [0.3, 0, -0.3]); // quiver
    for (const dx of [-0.02, 0.02]) k.add(G.cyl, k.glow('#FFE3A1', 1.2), [0.14 + dx, 0.68, -0.22], [0.008, 0.14, 0.008], [0.3, 0, -0.3]);
  },
  dawnblade(k, c) {
    k.slim(c.main, c.trim);
    k.head(0.72, 0.18);
    k.add(G.sphere, k.soft('#E7C47A'), [0, 0.78, -0.03], [0.19, 0.16, 0.18]); // hair
    k.add(G.capsule, k.soft('#E7C47A'), [0, 0.52, -0.18], [0.04, 0.16, 0.04], [0.3, 0, 0]); // braid
    k.add(G.sphere, k.metal(c.trim), [0.2, 0.52, 0], [0.1, 0.08, 0.1]); // single pauldron
    for (let i = 0; i < 4; i++) k.add(G.cone, k.metal(c.trim), [0.22 + i * 0.03, 0.6, -0.02], [0.02, 0.08, 0.02], [0, 0, -0.5 + i * 0.25]);
    k.add(G.rbox, k.soft('#FFFFFF'), [-0.06, 0.4, -0.13], [0.26, 0.3, 0.02], [0.15, 0, 0]); // half-cape
    k.add(G.arc, k.glow(c.glow, 1.1), [0.36, 0.5, 0.1], [0.28, 0.28, 0.4], [0, -0.3, 2.3]); // curved saber
  },
  priestess(k, c) {
    k.robe(c.main, c.trim, 0.56, 0.28);
    for (const [x, col] of [[-0.12, '#4E7FC4'], [0, '#E6B24A'], [0.12, '#4E7FC4']] as const) {
      k.add(G.rbox, k.vinyl(col), [x, 0.14, 0.25], [0.07, 0.18, 0.02], [-0.25, 0, 0]); // stained-glass panels
    }
    k.head(0.72, 0.17);
    k.add(G.sphere, k.soft('#F6EEDC'), [0, 0.76, -0.05], [0.19, 0.2, 0.17]); // hair
    k.add(G.cyl, k.metal(c.trim), [0, 0.8, -0.16], [0.26, 0.015, 0.26], [Math.PI / 2, 0, 0]); // halo disc
    k.add(G.rbox, k.vinyl('#FFFFFF'), [0.3, 0.6, 0.1], [0.16, 0.02, 0.12], [0.5, 0, 0.2]); // floating hymnal
    k.add(G.sphere, k.metal(c.trim), [-0.26, 0.26, 0.12], 0.06); // censer
    k.add(G.sphere, k.glow('#FFD580', 1), [-0.26, 0.26, 0.12], 0.035);
  },
  lancer(k, c) {
    k.stocky(c.main, c.trim, { wide: 0.95 });
    k.add(G.sphere, k.metal(c.trim), [0, 0.76, 0], 0.2); // gilded helm
    k.add(G.rbox, k.metal(c.trim), [0, 0.95, -0.02], [0.04, 0.16, 0.26]); // crest
    k.add(G.rbox, k.glow('#FF9A3C', 1.6), [0, 0.76, 0.18], [0.14, 0.04, 0.04]);
    k.add(G.cyl, k.vinyl(c.main), [0.3, 0.55, 0.1], [0.025, 0.9, 0.025], [0.25, 0, -0.1]); // lance shaft
    k.add(G.cone, k.glow(c.glow, 1.8), [0.34, 1.0, 0.21], [0.06, 0.22, 0.06], [0.25, 0, -0.1]); // sunlight tip
    k.add(G.cyl, k.metal(c.trim), [-0.3, 0.4, 0.1], [0.14, 0.03, 0.14], [Math.PI / 2, 0, 0.3]); // buckler
  },
  colossus(k, c) {
    k.add(G.rbox, k.vinyl(c.main), [0, 0.42, 0], [0.62, 0.5, 0.42]);
    k.add(G.cyl, k.glow('#FFB347', 2), [0, 0.46, 0.18], [0.11, 0.08, 0.11], [Math.PI / 2, 0, 0]); // sun core
    k.add(G.thinTorus, k.metal(c.trim), [0, 0.46, 0.21], 0.13);
    for (const s of [-1, 1]) {
      k.add(G.rbox, k.vinyl(c.main), [s * 0.14, 0.1, 0], [0.18, 0.2, 0.2]);
      k.add(G.rbox, k.vinyl(c.main), [s * 0.4, 0.42, 0.02], [0.16, 0.34, 0.18]);
      k.add(G.sphere, k.metal(c.trim), [s * 0.36, 0.66, 0], [0.14, 0.1, 0.14]);
    }
    k.add(G.rbox, k.vinyl('#D9CDB6'), [0, 0.42, -0.24], [0.5, 0.5, 0.05]); // stone cape
    k.add(G.rbox, k.vinyl(c.main), [0, 0.8, 0], [0.24, 0.22, 0.22]); // head
    k.add(G.rbox, k.glow('#FF9A3C', 1.6), [0, 0.8, 0.11], [0.16, 0.04, 0.02]);
    for (let i = 0; i < 5; i++) {
      const a = (i / 4) * Math.PI;
      k.add(G.cone, k.metal(c.trim), [Math.cos(a) * 0.14, 0.94 + Math.sin(a) * 0.08, 0], [0.035, 0.14, 0.035], [0, 0, a - Math.PI / 2]);
    }
    k.add(G.rbox, k.vinyl(c.main), [0.55, 0.55, 0.12], [0.1, 0.8, 0.04], [0, 0, -0.15]); // greatsword
    k.add(G.rbox, k.metal(c.trim), [0.55, 0.55, 0.12], [0.13, 0.82, 0.02], [0, 0, -0.15]);
  },

  // Tidebound Covenant: teal enamel shell, navy coats, satin brass, opaque cyan glass.
  brute(k, c) {
    k.stocky('#2E4E6E', c.trim, { wide: 1.2, arms: '#1E3450' });
    k.head(0.72, 0.19, '#9AA3AE', '#65DCE7');
    for (const s of [-1, 1]) k.add(G.sphere, k.glow('#65DCE7', 1.6), [s * 0.07, 0.74, 0.17], 0.035);
    k.add(G.sphere, k.vinyl('#F4F1EA'), [0, 0.6, 0.12], [0.17, 0.13, 0.12]); // beard
    k.add(G.hemi, k.vinyl(c.main), [0, 0.76, 0], [0.26, 0.2, 0.26]); // shell helmet
    for (const s of [-1, 1]) k.add(G.cone, k.vinyl('#E4704A'), [s * 0.2, 0.9, -0.02], [0.03, 0.12, 0.03], [0, 0, -s * 0.5]); // coral
    const claw = new THREE.Group();
    claw.position.set(0.42, 0.36, 0.1);
    k.group.add(claw);
    k.add(G.sphere, k.vinyl('#E0673A'), [0, 0.06, 0], [0.17, 0.13, 0.15], [0, 0, 0.3], claw);
    k.add(G.sphere, k.vinyl('#E0673A'), [0.03, -0.1, 0.02], [0.13, 0.08, 0.13], [0, 0, -0.3], claw);
    k.add(G.torus, k.metal(c.trim), [0, 0.14, -0.02], [0.1, 0.1, 0.4], [Math.PI / 2, 0, 0], claw);
    k.add(G.torus, k.metal(c.trim), [0, 0.4, 0.17], [0.06, 0.06, 0.5]); // chain link
  },
  deadeye(k, c) {
    k.stocky(c.main, c.trim, { wide: 0.95 });
    k.add(G.sphere, k.metal(c.trim), [0, 0.76, 0], 0.22); // brass diving helmet
    k.add(G.cyl, k.glow('#65DCE7', 1.3), [0, 0.76, 0.19], [0.1, 0.05, 0.1], [Math.PI / 2, 0, 0]); // porthole
    k.add(G.thinTorus, k.metal(c.trim), [0, 0.76, 0.22], 0.11);
    for (const s of [-1, 1]) k.add(G.capsule, k.metal('#8C9BA3'), [s * 0.09, 0.44, -0.2], [0.06, 0.14, 0.06]); // air tanks
    k.add(G.cyl, k.metal(c.trim), [0.3, 0.42, 0.2], [0.06, 0.5, 0.06], [Math.PI / 2, 0, 0]); // harpoon cannon
    k.add(G.cone, k.vinyl('#DADFE3'), [0.3, 0.42, 0.52], [0.05, 0.12, 0.05], [Math.PI / 2, 0, 0]);
    k.add(G.torus, k.soft('#C9A77A'), [0.3, 0.42, 0.08], [0.07, 0.07, 0.6]); // coiled rope
  },
  corsair(k, c) {
    k.slim('#1F3550', c.trim, '#1F3550');
    k.add(G.rbox, k.soft('#182B44'), [0, 0.34, -0.02], [0.36, 0.34, 0.26]); // short coat
    for (const y of [0.3, 0.4]) k.add(G.sphere, k.metal(c.trim), [0.06, y, 0.13], 0.02);
    k.add(G.sphere, k.vinyl('#27466B'), [0, 0.72, 0.02], [0.17, 0.2, 0.19]); // eel head
    for (const s of [-1, 1]) k.add(G.sphere, k.glow('#65DCE7', 1.4), [s * 0.07, 0.74, 0.16], 0.03);
    k.add(G.rbox, k.vinyl(c.main), [0, 0.9, -0.04], [0.03, 0.18, 0.26], [0.3, 0, 0]); // fin crest
    for (const s of [-1, 1]) {
      k.add(G.arc, k.metal('#D7E3EA'), [s * 0.3, 0.42, 0.12], [0.22, 0.22, 0.4], [0, 0, s > 0 ? 2.4 : 0.1]); // cutlasses
      k.add(G.thinTorus, k.glow('#65DCE7', 1), [s * 0.2, 0.42, 0.02], [0.06, 0.06, 0.4], [0, 0, 0]); // cyan stripes
    }
  },
  siren(k) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      k.add(G.capsule, k.vinyl(i % 2 ? '#8FD0CF' : '#B7A2E6'), [Math.cos(a) * 0.16, 0.2, Math.sin(a) * 0.16], [0.06, 0.16, 0.06], [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]);
    }
    k.add(G.sphere, k.soft('#3E4F9C'), [0, 0.42, 0], [0.19, 0.2, 0.16]); // bodice
    k.head(0.66, 0.16);
    k.add(G.sphere, k.soft('#4FB6B4'), [0, 0.63, -0.06], [0.2, 0.22, 0.16]); // hair
    k.add(G.hemi, k.vinyl('#C4B2F0'), [0, 0.72, 0], [0.27, 0.22, 0.27]); // jellyfish bell hood
    k.add(G.sphere, k.vinyl('#F6F1FF'), [0, 0.9, 0.12], 0.05); // pearl
    for (const s of [-1, 1]) k.add(G.sphere, k.glow('#DDF6FF', 0.7), [s * 0.33, 0.48, 0.1], 0.08); // water orbs
  },
  gunner(k, c) {
    k.stocky('#1E3450', c.trim, { wide: 1.1 });
    k.head(0.72, 0.18);
    k.add(G.sphere, k.soft('#5B6B7A'), [0, 0.64, 0.1], [0.14, 0.08, 0.1]); // storm beard
    k.add(G.cone, k.soft('#1B2A3C'), [0, 0.9, 0], [0.26, 0.12, 0.2]); // tricorn
    const gun = new THREE.Group();
    gun.position.set(0.22, 0.62, 0.05);
    k.group.add(gun);
    for (const [dx, dy] of [[0, 0.06], [-0.06, -0.04], [0.06, -0.04]]) {
      k.add(G.cyl, k.metal(c.trim), [dx, dy, 0.12], [0.05, 0.5, 0.05], [Math.PI / 2, 0, 0], gun);
      k.add(G.sphere, k.glow('#65DCE7', 1.8), [dx, dy, 0.37], 0.035, [0, 0, 0], gun);
    }
    k.add(G.torus, k.soft('#4A7A3E'), [0, 0, 0.1], [0.12, 0.12, 0.5], [0, 0, 0], gun); // kelp wrap
  },
  admiral(k, c) {
    k.robe('#1B2F48', c.trim, 0.58, 0.3); // greatcoat
    for (let i = 0; i < 5; i++) {
      const a = -0.6 + i * 0.3;
      k.add(G.capsule, k.vinyl('#3F9E97'), [Math.sin(a) * 0.3, 0.06, 0.2 + Math.cos(a) * 0.05], [0.05, 0.1, 0.05], [1.2, a, 0]); // tentacles
    }
    for (const s of [-1, 1]) k.add(G.cyl, k.metal(c.trim), [s * 0.2, 0.55, 0], [0.08, 0.03, 0.08]); // epaulettes
    k.head(0.74, 0.19, '#5FA89C', '#65DCE7');
    for (const s of [-1, 1]) k.add(G.sphere, k.glow('#65DCE7', 1.6), [s * 0.07, 0.76, 0.17], 0.035);
    for (let i = 0; i < 4; i++) k.add(G.capsule, k.vinyl('#4C9489'), [-0.07 + i * 0.045, 0.6, 0.14], [0.022, 0.07, 0.022]); // face tentacles
    for (let i = 0; i < 5; i++) k.add(G.cone, k.vinyl('#E4704A'), [-0.12 + i * 0.06, 0.95, 0], [0.025, 0.12, 0.025], [0, 0, -0.4 + i * 0.2]); // coral crown
    const wheel = new THREE.Group();
    wheel.position.set(-0.36, 0.42, 0.12);
    wheel.rotation.y = 0.4;
    k.group.add(wheel);
    k.add(G.torus, k.soft('#6B4B34'), [0, 0, 0], [0.18, 0.18, 0.5], [0, 0, 0], wheel);
    for (let i = 0; i < 4; i++) k.add(G.rbox, k.soft('#6B4B34'), [0, 0, 0], [0.03, 0.42, 0.03], [0, 0, (i / 4) * Math.PI], wheel);
    k.add(G.cyl, k.metal(c.trim), [0, 0, 0], [0.05, 0.05, 0.05], [Math.PI / 2, 0, 0], wheel);
    k.add(G.cyl, k.metal(c.trim), [0.34, 0.52, 0.12], [0.012, 0.16, 0.012]); // lantern stalk
    k.add(G.sphere, k.glow('#FFD27A', 1.8), [0.34, 0.42, 0.14], 0.07); // anglerfish lantern
  },

  // Wildroot Clans: sculpted bark and fur, soft moss, bone ceramic, amber resin.
  mossback(k, c) {
    k.add(G.sphere, k.soft('#7A5236'), [0, 0.38, 0], [0.3, 0.32, 0.25]); // bear body
    for (const s of [-1, 1]) {
      k.add(G.capsule, k.soft('#6A4630'), [s * 0.14, 0.1, 0.02], [0.09, 0.08, 0.09]);
      k.add(G.capsule, k.soft('#6A4630'), [s * 0.34, 0.34, 0.04], [0.08, 0.12, 0.08], [0, 0, s * 0.2]);
      k.add(G.rbox, k.soft(c.trim), [s * 0.28, 0.56, 0], [0.2, 0.1, 0.22]); // bark shoulder plates
      k.add(G.sphere, k.soft('#7FA05A'), [s * 0.28, 0.63, 0], [0.1, 0.05, 0.1]); // moss
      k.add(G.sphere, k.soft('#7A5236'), [s * 0.15, 0.93, 0], 0.06); // round ears
    }
    k.add(G.hemi, k.vinyl('#E07A3A'), [0.3, 0.66, 0.02], 0.06); // mushroom cap
    k.add(G.sphere, k.soft('#7A5236'), [0, 0.76, 0.02], 0.2); // bear head
    k.add(G.sphere, k.vinyl('#D9B48A'), [0, 0.72, 0.17], [0.09, 0.07, 0.06]); // muzzle
    k.add(G.sphere, k.vinyl('#2B1D16'), [0, 0.74, 0.22], 0.025);
    for (const s of [-1, 1]) k.add(G.sphere, k.vinyl('#1E140F'), [s * 0.08, 0.8, 0.17], 0.028);
    k.add(G.rbox, k.soft(c.main), [0, 0.32, 0.24], [0.16, 0.24, 0.02]); // green tabard
    k.add(G.sphere, k.glow(c.glow, 0.6), [0, 0.36, 0.26], 0.035);
    k.add(G.cyl, k.soft('#9C6B45'), [-0.4, 0.38, 0.14], [0.2, 0.06, 0.2], [Math.PI / 2, 0, 0.3]); // stump shield
    k.add(G.cyl, k.vinyl('#E2C394'), [-0.4, 0.38, 0.172], [0.17, 0.01, 0.17], [Math.PI / 2, 0, 0.3]);
    for (const r of [0.06, 0.11]) k.add(G.thinTorus, k.soft('#B88A5C'), [-0.4, 0.38, 0.18], [r, r, 0.3], [0, 0.3, 0]);
  },
  thornfang(k, c) {
    k.slim('#C8914F', c.trim);
    k.add(G.rbox, k.soft(c.main), [0, 0.3, 0.1], [0.14, 0.2, 0.02]); // moss harness
    k.head(0.72, 0.18, '#D19A58', '#E0A43A');
    k.add(G.sphere, k.vinyl('#F4E8D2'), [0, 0.63, 0.1], [0.16, 0.08, 0.1]); // cheek ruff
    for (const s of [-1, 1]) {
      k.add(G.cone, k.soft('#C8914F'), [s * 0.12, 0.9, 0], [0.06, 0.14, 0.04], [0, 0, -s * 0.25]); // tufted ears
      k.add(G.cone, k.soft('#3A2A20'), [s * 0.14, 0.99, 0], [0.015, 0.06, 0.015], [0, 0, -s * 0.25]);
      for (let i = 0; i < 3; i++) k.add(G.cone, k.vinyl('#F1E6CF'), [s * 0.26 + (i - 1) * 0.03, 0.22, 0.08], [0.02, 0.12, 0.02], [0.3, 0, s * 0.2]); // bone claws
      k.add(G.torus, k.soft(c.main), [s * 0.24, 0.36, 0.03], [0.06, 0.06, 0.5], [Math.PI / 2, 0, 0]); // thorn vines
    }
  },
  huntress(k, c) {
    k.slim('#9C6B45', c.trim);
    k.add(G.rbox, k.soft(c.main), [0, 0.42, -0.14], [0.32, 0.36, 0.03], [0.1, 0, 0]); // moss cape
    k.head(0.72, 0.17, '#B98556');
    k.add(G.sphere, k.vinyl('#F0DFC4'), [0, 0.67, 0.13], [0.08, 0.06, 0.06]); // doe muzzle
    for (const s of [-1, 1]) {
      k.add(G.cyl, k.soft('#6A4630'), [s * 0.12, 0.98, 0], [0.018, 0.22, 0.018], [0, 0, -s * 0.5]); // antlers
      k.add(G.cyl, k.soft('#6A4630'), [s * 0.2, 1.02, 0], [0.014, 0.12, 0.014], [0, 0, -s * 1.1]);
      k.add(G.sphere, k.glow(c.glow, 0.8), [s * 0.24, 1.06, 0], 0.025); // amber charms
    }
    for (const dx of [-0.03, 0, 0.03]) {
      k.add(G.cyl, k.soft('#8A6A48'), [0.26 + dx, 0.5, 0.04], [0.012, 0.62, 0.012], [0.1, 0, -0.1]); // javelins
      k.add(G.cone, k.vinyl('#8C9199'), [0.29 + dx, 0.83, 0.07], [0.022, 0.07, 0.022], [0.1, 0, -0.1]);
    }
  },
  shaman(k, c) {
    k.add(G.cone, k.soft(c.main), [0, 0.22, 0], [0.28, 0.44, 0.26]); // grass cloak
    k.add(G.sphere, k.vinyl('#D9803B'), [0, 0.52, 0.02], [0.22, 0.17, 0.2]); // wide toad head
    for (const s of [-1, 1]) {
      k.add(G.sphere, k.vinyl('#F4C542'), [s * 0.1, 0.62, 0.13], 0.05);
      k.add(G.sphere, k.vinyl('#1E140F'), [s * 0.1, 0.62, 0.175], 0.02);
      k.add(G.sphere, k.vinyl('#D9803B'), [s * 0.12, 0.08, 0.12], [0.07, 0.04, 0.08]); // toes
    }
    k.add(G.hemi, k.vinyl('#C8453A'), [0, 0.68, 0], [0.34, 0.2, 0.34]); // red mushroom cap
    k.add(G.cyl, k.vinyl('#F4E8D2'), [0, 0.68, 0], [0.3, 0.02, 0.3]);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      k.add(G.sphere, k.vinyl('#F4E8D2'), [Math.cos(a) * 0.19, 0.8, Math.sin(a) * 0.19], [0.045, 0.02, 0.045]);
    }
    k.add(G.cyl, k.soft(c.trim), [-0.3, 0.42, 0.06], [0.025, 0.8, 0.025], [0, 0, 0.08]); // gnarled staff
    for (const [dx, dy] of [[0, 0], [0.05, 0.05], [-0.05, 0.04]]) k.add(G.sphere, k.glow('#C9F25A', 1.6), [-0.33 + dx, 0.86 + dy, 0.06], 0.045);
  },
  druid(k, c) {
    k.robe('#2C3E5C', c.trim, 0.52, 0.26); // night-blue cloak
    k.add(G.rbox, k.soft(c.main), [0, 0.42, 0.18], [0.2, 0.22, 0.03]); // moss mantle
    k.head(0.72, 0.18, '#B8BEC6');
    k.add(G.cone, k.vinyl('#CDD2D8'), [0, 0.68, 0.19], [0.06, 0.12, 0.05], [Math.PI / 2, 0, 0]); // wolf snout
    for (const s of [-1, 1]) k.add(G.cone, k.soft('#A6ADB6'), [s * 0.11, 0.9, 0], [0.05, 0.12, 0.04], [0, 0, -s * 0.2]);
    k.add(G.halfArc, k.vinyl('#EEF1F4'), [0, 0.92, -0.04], [0.16, 0.16, 0.4], [0, 0, 0]); // crescent headdress
    k.add(G.cyl, k.soft(c.trim), [0.3, 0.45, 0.06], [0.022, 0.84, 0.022]); // staff
    k.add(G.sphere, k.glow('#CFE6FF', 1.5), [0.3, 0.9, 0.06], 0.07); // moonstone
  },
  heartwood(k, c) {
    k.add(G.cyl, k.soft(c.trim), [0, 0.4, 0], [0.3, 0.72, 0.28]); // trunk body
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      k.add(G.capsule, k.soft('#654330'), [Math.cos(a) * 0.3, 0.06, Math.sin(a) * 0.3], [0.06, 0.12, 0.06], [Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2]); // root feet
    }
    for (const s of [-1, 1]) {
      k.add(G.thinTorus, k.soft('#5A3B28'), [s * 0.11, 0.62, 0.27], 0.075); // owl eye rims
      k.add(G.sphere, k.glow('#FFB02E', 1.8), [s * 0.11, 0.62, 0.26], 0.06);
      k.add(G.cyl, k.soft('#654330'), [s * 0.18, 0.96, 0], [0.03, 0.34, 0.03], [0, 0, -s * 0.5]); // branch antlers
      for (let j = 0; j < 3; j++) k.add(G.sphere, k.soft(j % 2 ? '#D86A2C' : '#E8A23A'), [s * (0.26 + j * 0.04), 1.06 + j * 0.03, (j - 1) * 0.05], 0.05);
    }
    k.add(G.cone, k.vinyl('#E0B05A'), [0, 0.54, 0.3], [0.035, 0.07, 0.035], [Math.PI, 0, 0]); // beak
    k.add(G.sphere, k.vinyl('#F1E6CF'), [0, 0.76, 0.24], [0.1, 0.05, 0.05]); // deer-skull brow charm
    k.add(G.sphere, k.soft('#7FA05A'), [0, 0.78, 0], [0.3, 0.06, 0.28]); // moss crown
    k.add(G.capsule, k.soft(c.trim), [0.38, 0.42, 0.06], [0.07, 0.16, 0.07], [0, 0, 0.4]); // branch arm
    k.add(G.sphere, k.glow('#FFB02E', 1.8), [0.46, 0.24, 0.1], 0.08); // amber sap lantern
    k.add(G.thinTorus, k.metal('#C89B46'), [0.46, 0.24, 0.1], [0.085, 0.085, 0.5], [Math.PI / 2, 0, 0]);
  },
};

function base(k: Kit, def: UnitDef) {
  const c = FACTION_COLORS[def.faction];
  const rim = def.faction === 'wild' ? '#76503A' : def.faction === 'tide' ? '#B38B50' : '#C89B46';
  const top = def.faction === 'sun' ? '#EFE4D0' : def.faction === 'tide' ? '#2A777B' : '#56734B';
  const plinth = new THREE.Group();
  k.add(G.cyl, k.vinyl(top), [0, 0.035, 0], [0.33, 0.07, 0.33], [0, 0, 0], plinth);
  k.add(G.torus, k.metal(rim), [0, 0.06, 0], [0.33, 0.33, 0.4], [Math.PI / 2, 0, 0], plinth);
  k.add(G.cyl, k.glow(c.glow, 0.5), [0, 0.072, 0.3], [0.035, 0.01, 0.035], [0, 0, 0], plinth); // faction inlay
  return plinth;
}

export function buildUnitModel(def: UnitDef, star: Star, ally: boolean): UnitModel {
  const kit = new Kit(star);
  const root = new THREE.Group();
  const figure = new THREE.Group();
  const plinth = base(kit, def);
  // Everything built so far is the base; the figure stands on it.
  root.add(kit.group);
  kit.group.add(plinth);
  const body = new Kit(star);
  const c = FACTION_COLORS[def.faction];
  (BUILDS[def.id] ?? BUILDS.warden)(body, { main: c.primary, trim: c.secondary, glow: c.glow });
  body.group.position.y = 0.07;
  figure.add(body.group);
  root.add(figure);

  // Legendaries stand larger; star upgrades change materials and effects, never scale.
  const scale = (def.legendary ? 1.3 : 1 + def.tier * 0.03) * 1.12;
  figure.scale.setScalar(scale);
  kit.group.scale.setScalar(Math.min(scale, 1.15));

  let particles: THREE.Group | null = null;
  if (star === 3) {
    particles = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: c.glow });
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(G.sphere, mat);
      const a = (i / 6) * Math.PI * 2;
      p.position.set(Math.cos(a) * 0.42, 0.3 + (i % 3) * 0.22, Math.sin(a) * 0.42);
      p.scale.setScalar(0.03);
      particles.add(p);
    }
    figure.add(particles);
  }

  const ring = new THREE.Mesh(
    G.ring,
    new THREE.MeshBasicMaterial({ color: ally ? TEAM.ally : TEAM.enemy, transparent: true, opacity: 0.9, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.006;
  root.add(ring);

  return { root, figure, flashMats: [...kit.flash, ...body.flash], particles, ring, height: 1.05 * scale };
}
