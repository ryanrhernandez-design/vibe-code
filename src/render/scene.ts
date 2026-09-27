// Three.js board renderer. It only draws state: the sim decides everything.
// The bench lives in the DOM (a 2×4 panel), so the 3D scene is just the 7×8 arena.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BOARD_W, HALF_H, UNIT_BY_ID, FACTION_COLORS, type Star, type UnitDef } from '../sim/data';
import { TICK, type Combat, type CombatEvent } from '../sim/combat';
import type { Player } from '../sim/match';
import { BOARDS, TEAM, type BoardId, type BoardTheme } from '../ui/theme';
import { buildUnitModel } from './unitModel';

export const tileToWorld = (x: number, y: number) => new THREE.Vector3(x - (BOARD_W - 1) / 2, 0, HALF_H - 0.5 - y);
/** Player-board index (row 0 = front) → world position on the bottom half. */
export const boardIndexToWorld = (i: number) => tileToWorld(i % BOARD_W, HALF_H - 1 - Math.floor(i / BOARD_W));

interface UnitView {
  key: string;
  def: UnitDef;
  star: Star;
  ally: boolean;
  root: THREE.Group;
  figure: THREE.Object3D;
  flashMats: THREE.MeshStandardMaterial[];
  particles: THREE.Group | null;
  ring: THREE.Mesh;
  hpFill: THREE.Sprite;
  manaFill: THREE.Sprite;
  bars: THREE.Group;
  stun: THREE.Mesh;
  home: THREE.Vector3;
  flash: number;
  lunge: number;
  lungeDir: THREE.Vector3;
  stunLeft: number;
  dying: number;
  bobPhase: number;
}

interface Fx {
  obj: THREE.Object3D;
  t: number;
  dur: number;
  update: (k: number) => void;
}

const BAR_W = 0.72;
const RED = new THREE.Color('#ff3b30');
const stunGeo = new THREE.TorusGeometry(0.14, 0.025, 6, 16);
const projectileGeo = new THREE.SphereGeometry(1, 10, 8);
const ringGeo = new THREE.RingGeometry(0.8, 1, 40);

const whiteTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 4;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 4, 4);
  return new THREE.CanvasTexture(c);
})();

const starTextures = new Map<number, THREE.Texture>();
function starTexture(star: number) {
  if (!starTextures.has(star)) {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 40;
    const g = c.getContext('2d')!;
    g.font = 'bold 32px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 7;
    g.strokeStyle = 'rgba(48,39,31,0.85)';
    const text = '★'.repeat(star);
    g.strokeText(text, 64, 22);
    g.fillStyle = '#F2C45A';
    g.fillText(text, 64, 22);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    starTextures.set(star, t);
  }
  return starTextures.get(star)!;
}

function barSprite(color: string, w: number, h: number, anchorLeft: boolean) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: whiteTex, color, depthTest: false, transparent: true }));
  s.scale.set(w, h, 1);
  if (anchorLeft) s.center.set(0, 0.5);
  s.renderOrder = 10;
  return s;
}

export class BoardRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  reduceMotion = false;
  private theme: BoardTheme = BOARDS.sanctum;
  private boardGroup = new THREE.Group();
  private props: THREE.Object3D[] = [];
  private views = new Map<string, UnitView>();
  private fx: Fx[] = [];
  private hemi = new THREE.HemisphereLight();
  private sun = new THREE.DirectionalLight();
  private highlightMesh: THREE.Mesh;
  private selectRing: THREE.Mesh;
  private raycaster = new THREE.Raycaster();
  private ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private width = 1;
  private height = 1;
  private time = 0;
  private combat: Combat | null = null;
  private selectedKey: string | null = null;

  constructor(readonly canvas: HTMLCanvasElement, private readonly overlay: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // A soft studio environment gives the ceramic and gold trims their collectible sheen.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;

    this.sun.position.set(3, 11, 7);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera;
    sc.left = -6;
    sc.right = 6;
    sc.top = 6;
    sc.bottom = -6;
    this.sun.shadow.bias = -0.0015;
    this.sun.shadow.radius = 3;
    this.scene.add(this.hemi, this.sun, this.boardGroup);

    this.highlightMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.9),
      new THREE.MeshBasicMaterial({ color: '#35C28A', transparent: true, opacity: 0.5, depthWrite: false }),
    );
    this.highlightMesh.rotation.x = -Math.PI / 2;
    this.highlightMesh.position.y = 0.012;
    this.highlightMesh.visible = false;
    this.scene.add(this.highlightMesh);

    this.selectRing = new THREE.Mesh(
      new THREE.RingGeometry(0.44, 0.5, 40),
      new THREE.MeshBasicMaterial({ color: TEAM.select, transparent: true, opacity: 0.95, depthWrite: false }),
    );
    this.selectRing.rotation.x = -Math.PI / 2;
    this.selectRing.visible = false;
    this.scene.add(this.selectRing);

    this.setBoard('sanctum');
  }

  setBoard(id: BoardId) {
    this.theme = BOARDS[id];
    const t = this.theme;
    this.hemi.color.set(t.hemiSky);
    this.hemi.groundColor.set(t.hemiGround);
    this.hemi.intensity = t.hemiIntensity;
    this.sun.color.set(t.sunColor);
    this.sun.intensity = t.sunIntensity;
    this.renderer.toneMappingExposure = t.exposure;
    this.buildBoard();
  }

  private buildBoard() {
    this.boardGroup.clear();
    this.props = [];
    const t = this.theme;
    const std = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, ...extra });
    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, shadow = true) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.receiveShadow = true;
      m.castShadow = shadow;
      this.boardGroup.add(m);
      return m;
    };
    const W = BOARD_W;
    const D = HALF_H * 2;

    // Plinth, trim and the joint layer that shows between tiles.
    if (t.id === 'heartwood') {
      add(new THREE.CylinderGeometry(6.2, 6.6, 1.2, 48), std(t.plinth, { roughness: 0.85 }), 0, -0.72, 0);
      add(new THREE.CylinderGeometry(6.21, 6.21, 0.04, 48), std('#C9A67A'), 0, -0.12, 0, false);
      for (const r of [2.5, 4, 5.4]) {
        const ring = add(new THREE.TorusGeometry(r, 0.04, 6, 64), std('#9C7552'), 0, -0.1, 0, false);
        ring.rotation.x = Math.PI / 2;
      }
    } else {
      add(new THREE.BoxGeometry(W + 1.1, 0.6, D + 1.1), std(t.plinth, { roughness: t.id === 'reef' ? 0.8 : 0.45 }), 0, -0.42, 0);
      add(new THREE.BoxGeometry(W + 1.16, 0.08, D + 1.16), std(t.plinthTrim, { metalness: 0.8, roughness: 0.35 }), 0, -0.14, 0);
    }
    add(new THREE.BoxGeometry(W + 0.12, 0.1, D + 0.12), std(t.joint, { metalness: t.id === 'heartwood' ? 0 : 0.7, roughness: 0.4 }), 0, -0.07, 0, false);

    const tileGeo = new THREE.BoxGeometry(0.94, 0.1, 0.94);
    const mats = [t.tileA, t.tileB].map((c) => std(c, { roughness: 0.55 }));
    const enemyMats = [t.tileA, t.tileB].map((c) =>
      std(new THREE.Color(c).lerp(new THREE.Color(t.enemyTint), 0.35).getStyle(), { roughness: 0.55 }),
    );
    for (let y = 0; y < D; y++) {
      for (let x = 0; x < W; x++) {
        const m = (y < HALF_H ? mats : enemyMats)[(x + y) % 2];
        const tile = add(tileGeo, m, 0, -0.02, 0, false);
        tile.position.copy(tileToWorld(x, y)).setY(-0.02);
      }
    }
    // The centre divider reads as a thin seam, not a trench.
    add(new THREE.BoxGeometry(W + 0.1, 0.03, 0.07), new THREE.MeshStandardMaterial({ color: t.seam, emissive: t.seam, emissiveIntensity: 0.6 }), 0, 0.04, 0, false);

    this.buildProps();
  }

  /** Scenic props, kept entirely outside the playable grid. */
  private buildProps() {
    const t = this.theme;
    const std = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
    const glow = (color: string, i = 2) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: i });
    const group = new THREE.Group();
    const put = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, s: number | [number, number, number] = 1) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      if (typeof s === 'number') m.scale.setScalar(s);
      else m.scale.set(...s);
      m.castShadow = true;
      group.add(m);
      return m;
    };
    const ex = BOARD_W / 2 + 0.55;
    const ez = HALF_H + 0.55;
    const corners: [number, number][] = [[-ex, -ez], [ex, -ez], [-ex, ez], [ex, ez]];

    if (t.id === 'sanctum') {
      for (const [x, z] of corners) {
        put(new THREE.CylinderGeometry(0.2, 0.24, 1.2, 16), std('#F3EADB', { roughness: 0.35 }), x, 0.45, z);
        put(new THREE.CylinderGeometry(0.3, 0.26, 0.16, 16), std('#C89B46', { metalness: 0.9, roughness: 0.3 }), x, 1.1, z);
        put(new THREE.ConeGeometry(0.14, 0.34, 12), glow('#FFB347', 2.4), x, 1.34, z);
      }
      for (const x of [-ex, ex]) {
        const banner = put(new THREE.BoxGeometry(0.04, 0.9, 0.5), std('#FBF4E6'), x, 0.6, 0);
        banner.rotation.y = 0;
        put(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 20), std('#C89B46', { metalness: 0.9, roughness: 0.3 }), x + (x > 0 ? -0.03 : 0.03), 0.7, 0, 1).rotation.z = Math.PI / 2;
      }
    } else if (t.id === 'reef') {
      const water = new THREE.Mesh(new THREE.CircleGeometry(8.5, 48), std('#1D4A5E', { roughness: 0.2, metalness: 0.1 }));
      water.rotation.x = -Math.PI / 2;
      water.position.y = -0.5;
      water.receiveShadow = true;
      group.add(water);
      for (const [x, z] of corners) {
        put(new THREE.CylinderGeometry(0.16, 0.18, 1.1, 12), std('#6B4B34', { roughness: 0.85 }), x, 0.35, z);
        put(new THREE.TorusGeometry(0.19, 0.05, 8, 20), std('#C9A77A', { roughness: 0.9 }), x, 0.5, z).rotation.x = Math.PI / 2;
        put(new THREE.SphereGeometry(0.13, 16, 12), glow('#FFD27A', 2), x, 1.0, z);
      }
      const coral = ['#E4704A', '#F29AAE', '#9C7BD6'];
      for (let i = 0; i < 10; i++) {
        const side = i % 2 ? 1 : -1;
        const z = -3.5 + (i >> 1) * 1.7;
        put(new THREE.ConeGeometry(0.1, 0.4, 8), std(coral[i % 3]), side * (ex + 0.1), 0.05, z + 0.3);
        put(new THREE.SphereGeometry(0.1, 10, 8), std(coral[(i + 1) % 3]), side * (ex + 0.05), 0.0, z - 0.2);
      }
    } else {
      const mush = (x: number, z: number, s: number) => {
        put(new THREE.CylinderGeometry(0.08, 0.1, 0.4, 12), std('#F2E6CF'), x, 0.1 * s, z, s);
        put(new THREE.SphereGeometry(0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), std('#E0673A', { roughness: 0.35 }), x, 0.28 * s, z, [s, s * 0.7, s]);
      };
      mush(-ex, -ez + 0.4, 1.3);
      mush(ex, ez - 0.6, 1.1);
      mush(ex + 0.1, -1.2, 0.8);
      mush(-ex - 0.1, 2, 0.9);
      for (const [x, z] of [corners[1], corners[2]]) {
        put(new THREE.CylinderGeometry(0.07, 0.09, 1.1, 10), std('#76503A'), x, 0.45, z);
        put(new THREE.SphereGeometry(0.13, 16, 12), glow('#FFB02E', 2.2), x, 1.0, z);
      }
      for (let i = 0; i < 4; i++) {
        // Roots curl along the stump top, outside the grid.
        const root = put(new THREE.TorusGeometry(0.55, 0.11, 8, 20, Math.PI * 0.9), std('#6A4630', { roughness: 0.85 }), (i % 2 ? 1 : -1) * (ex + 0.2), -0.02, -2.6 + i * 1.6);
        root.rotation.set(-Math.PI / 2, 0, i % 2 ? Math.PI * 0.55 : -Math.PI * 0.45);
      }
    }
    this.boardGroup.add(group);
    this.props.push(group);
  }

  resize(w: number, h: number) {
    this.width = Math.max(1, w);
    this.height = Math.max(1, h);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.fitCamera();
  }

  /** Closest camera distance at which the whole 7×8 grid and unit heads fit on screen. */
  private fitCamera() {
    const aspect = this.width / this.height;
    // ~55° per the art direction: steep enough to see every tile, low enough to read figurine faces.
    const elev = THREE.MathUtils.degToRad(aspect < 0.9 ? 56 : 52);
    const target = new THREE.Vector3(0, 0, 0.1);
    const pts: THREE.Vector3[] = [];
    for (const x of [-(BOARD_W / 2 + 0.15), BOARD_W / 2 + 0.15]) {
      for (const z of [-(HALF_H + 0.15), HALF_H + 0.25]) for (const y of [0, 1.15]) pts.push(new THREE.Vector3(x, y, z));
    }
    const place = (d: number) => {
      this.camera.position.set(target.x, target.y + Math.sin(elev) * d, target.z + Math.cos(elev) * d);
      this.camera.lookAt(target);
      this.camera.updateProjectionMatrix();
      this.camera.updateMatrixWorld();
    };
    this.camera.clearViewOffset();
    let lo = 4;
    let hi = 80;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      place(mid);
      const fits = pts.every((p) => {
        const v = p.clone().project(this.camera);
        return Math.abs(v.x) <= 0.98 && Math.abs(v.y) <= 0.96;
      });
      if (fits) hi = mid;
      else lo = mid;
    }
    place(hi);
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      const v = p.clone().project(this.camera);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    }
    const shift = ((minY + maxY) / 2) * (this.height / 2);
    this.camera.setViewOffset(this.width, this.height, 0, -shift, this.width, this.height);
  }

  // ── Unit views ──

  private addView(key: string, def: UnitDef, star: Star, ally: boolean, pos: THREE.Vector3): UnitView {
    const model = buildUnitModel(def, star, ally);
    const root = model.root;
    root.position.copy(pos);
    model.figure.rotation.y = ally ? Math.PI : 0;

    const bars = new THREE.Group();
    bars.position.y = model.height + 0.24;
    const bg = barSprite('#2A221B', BAR_W + 0.05, 0.14, false);
    const hpFill = barSprite(ally ? '#3FBF6F' : '#E0554B', BAR_W, 0.08, true);
    hpFill.position.set(-BAR_W / 2, 0.02, 0);
    const manaFill = barSprite('#4C8FD6', BAR_W, 0.035, true);
    manaFill.position.set(-BAR_W / 2, -0.045, 0);
    manaFill.scale.x = 0;
    const stars = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTexture(star), depthTest: false, transparent: true }));
    stars.scale.set(0.46, 0.15, 1);
    stars.position.y = 0.17;
    stars.renderOrder = 11;
    bars.add(bg, hpFill, manaFill, stars);
    root.add(bars);

    const stun = new THREE.Mesh(stunGeo, new THREE.MeshBasicMaterial({ color: '#F2C45A' }));
    stun.rotation.x = Math.PI / 2;
    stun.position.y = model.height + 0.05;
    stun.visible = false;
    root.add(stun);

    this.scene.add(root);
    const view: UnitView = {
      key, def, star, ally, root, figure: model.figure, flashMats: model.flashMats, particles: model.particles, ring: model.ring,
      hpFill, manaFill, bars, stun, home: pos.clone(), flash: 0, lunge: 0, lungeDir: new THREE.Vector3(), stunLeft: 0, dying: 0,
      bobPhase: Math.random() * Math.PI * 2,
    };
    this.views.set(key, view);
    return view;
  }

  private removeView(key: string) {
    const v = this.views.get(key);
    if (!v) return;
    this.scene.remove(v.root);
    const mats = new Set<THREE.Material>();
    v.root.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Sprite) {
        const m = o.material as THREE.Material | THREE.Material[];
        (Array.isArray(m) ? m : [m]).forEach((x) => mats.add(x));
      }
    });
    mats.forEach((m) => m.dispose());
    this.views.delete(key);
    if (this.selectedKey === key) this.select(null);
  }

  clearUnits() {
    for (const k of [...this.views.keys()]) this.removeView(k);
    this.combat = null;
  }

  private setBarsVisible(v: UnitView, on: boolean) {
    for (const c of v.bars.children) if (c !== v.bars.children[3]) c.visible = on;
  }

  /** Show a player's board (prep phase, or scouting someone else). */
  showPlayer(p: Player) {
    this.combat = null;
    const seen = new Set<string>();
    p.board.forEach((u, i) => {
      if (!u) return;
      const key = `u${u.uid}`;
      const pos = boardIndexToWorld(i);
      seen.add(key);
      let v = this.views.get(key);
      if (v && v.star !== u.star) {
        this.removeView(key);
        v = undefined;
        this.burst(pos, FACTION_COLORS[UNIT_BY_ID[u.defId].faction].glow, 1.2);
      }
      if (!v) v = this.addView(key, UNIT_BY_ID[u.defId], u.star, true, pos);
      v.home.copy(pos);
      v.root.position.copy(pos);
      // In preparation figurines face the camera like a displayed collection; in combat they turn to fight.
      v.figure.rotation.y = 0.35;
      this.setBarsVisible(v, false);
    });
    for (const k of [...this.views.keys()]) if (!seen.has(k)) this.removeView(k);
  }

  startCombat(combat: Combat) {
    this.clearUnits();
    this.combat = combat;
    for (const u of combat.units) this.addView(`c${u.id}`, u.def, u.star, u.side === 0, tileToWorld(u.x, u.y));
  }

  combatEvents(events: CombatEvent[]) {
    if (!this.combat) return;
    for (const e of events) {
      const v = this.views.get(`c${e.id}`);
      if (!v) continue;
      switch (e.type) {
        case 'attack': {
          const t = this.views.get(`c${e.target}`);
          if (!t) break;
          if (e.ranged) this.projectile(v, t);
          else {
            v.lunge = 1;
            v.lungeDir.copy(t.root.position.clone().sub(v.root.position).setY(0).normalize());
          }
          break;
        }
        case 'damage':
          v.flash = 1;
          this.floatText(v.root.position, `${e.amount}`, e.ability ? 'dmg ability' : v.ally ? 'dmg ally' : 'dmg');
          break;
        case 'heal':
          if (e.amount > 0) {
            this.floatText(v.root.position, `+${e.amount}`, 'heal');
            this.ring(v.root.position, '#6CD68E', 0.6, 0.5);
          }
          break;
        case 'cast': {
          const glow = FACTION_COLORS[v.def.faction].glow;
          if (e.kind === 'nova') this.ring(tileToWorld(e.x, e.y), glow, e.radius + 0.5, 0.55);
          else if (e.kind === 'strike' || e.kind === 'volley') {
            for (const id of e.targets) {
              const t = this.views.get(`c${id}`);
              if (t) this.projectile(v, t, glow, 0.12);
            }
          } else this.ring(v.root.position, glow, 0.7, 0.5);
          if (v.def.legendary) this.floatText(v.root.position, v.def.ability.name, 'cast');
          break;
        }
        case 'stun':
          v.stunLeft = Math.max(v.stunLeft, e.dur);
          break;
        case 'death':
          v.dying = 0.001;
          break;
      }
    }
  }

  /** Sync positions and bars with the sim; `alpha` interpolates between ticks. */
  updateCombat(alpha: number) {
    const c = this.combat;
    if (!c) return;
    for (const u of c.units) {
      const v = this.views.get(`c${u.id}`);
      if (!v) continue;
      if (u.moving) {
        const k = Math.min(1, (u.moveElapsed + alpha * TICK) / u.moveDur);
        v.home.copy(tileToWorld(u.moveFromX, u.moveFromY).lerp(tileToWorld(u.x, u.y), k));
      } else v.home.copy(tileToWorld(u.x, u.y));
      const t = c.units[u.targetId];
      if (t && t.alive && u.alive) {
        const to = tileToWorld(t.x, t.y).sub(v.home);
        if (to.lengthSq() > 0.001) v.figure.rotation.y = Math.atan2(to.x, to.z);
      }
      v.hpFill.scale.x = BAR_W * Math.max(0, u.hp / u.maxHp);
      v.manaFill.scale.x = u.def.mana > 0 ? BAR_W * Math.min(1, u.mana / u.def.mana) : 0;
    }
  }

  // ── Effects ──

  private projectile(from: UnitView, to: UnitView, color = '#FFF1C4', size = 0.07) {
    const m = new THREE.Mesh(projectileGeo, new THREE.MeshBasicMaterial({ color }));
    m.scale.setScalar(size);
    const a = from.root.position.clone().setY(0.6);
    this.scene.add(m);
    this.fx.push({
      obj: m, t: 0, dur: 0.2,
      update: (k) => {
        m.position.lerpVectors(a, to.root.position.clone().setY(0.55), k);
        m.position.y += Math.sin(k * Math.PI) * 0.25;
      },
    });
  }

  private ring(center: THREE.Vector3, color: string, radius: number, dur: number) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
    const m = new THREE.Mesh(ringGeo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.copy(center).setY(0.06);
    this.scene.add(m);
    this.fx.push({
      obj: m, t: 0, dur: this.reduceMotion ? 0.2 : dur,
      update: (k) => {
        m.scale.setScalar(0.2 + k * radius);
        mat.opacity = 0.85 * (1 - k);
      },
    });
  }

  /** Celebration burst for merges. */
  burst(center: THREE.Vector3, color: string, radius = 1) {
    this.ring(center, color, radius, 0.6);
    this.ring(center, '#FFF6DE', radius * 0.6, 0.45);
  }

  private floatText(world: THREE.Vector3, text: string, cls: string) {
    const p = world.clone().setY(1.2).project(this.camera);
    if (p.z > 1) return;
    const el = document.createElement('div');
    el.className = `float ${cls}`;
    el.textContent = text;
    el.style.left = `${((p.x + 1) / 2) * 100}%`;
    el.style.top = `${((1 - p.y) / 2) * 100}%`;
    el.style.setProperty('--dx', `${(Math.random() - 0.5) * 24}px`);
    el.addEventListener('animationend', () => el.remove());
    this.overlay.appendChild(el);
  }

  // ── Picking & dragging ──

  private ray(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    return this.raycaster;
  }

  /** Key of the unit under the pointer (e.g. "u12" or "c3"). */
  pick(clientX: number, clientY: number): string | null {
    const rc = this.ray(clientX, clientY);
    const roots = [...this.views.values()].filter((v) => !v.dying).map((v) => v.root);
    for (const h of rc.intersectObjects(roots, true)) {
      let o: THREE.Object3D | null = h.object;
      while (o && !roots.includes(o as THREE.Group)) o = o.parent;
      if (o) for (const v of this.views.values()) if (v.root === o) return v.key;
    }
    // Forgiving touch: the nearest unit within ~half a tile of the ground point.
    const g = this.groundPoint(clientX, clientY);
    if (!g) return null;
    let best: string | null = null;
    let bestD = 0.6;
    for (const v of this.views.values()) {
      const d = v.root.position.distanceTo(g);
      if (!v.dying && d < bestD) {
        best = v.key;
        bestD = d;
      }
    }
    return best;
  }

  groundPoint(clientX: number, clientY: number): THREE.Vector3 | null {
    const p = new THREE.Vector3();
    return this.ray(clientX, clientY).ray.intersectPlane(this.ground, p) ? p : null;
  }

  /** Board index (own half only) nearest to a ground point. */
  dropTarget(p: THREE.Vector3): number | null {
    const x = Math.round(p.x + (BOARD_W - 1) / 2);
    const y = Math.round(HALF_H - 0.5 - p.z);
    if (x < 0 || x >= BOARD_W || y < 0 || y >= HALF_H) return null;
    return (HALF_H - 1 - y) * BOARD_W + x;
  }

  /** Lift a unit to follow the finger, or put it back (null). */
  dragUnit(key: string, p: THREE.Vector3 | null) {
    const v = this.views.get(key);
    if (!v) return;
    if (p) v.home.set(p.x, 0.35, p.z);
    v.root.visible = true;
  }

  setUnitVisible(key: string, visible: boolean) {
    const v = this.views.get(key);
    if (v) v.root.visible = visible;
  }

  highlight(index: number | null, valid = true) {
    this.highlightMesh.visible = index !== null;
    if (index === null) return;
    const pos = boardIndexToWorld(index);
    this.highlightMesh.position.set(pos.x, 0.035, pos.z);
    (this.highlightMesh.material as THREE.MeshBasicMaterial).color.set(valid ? '#35C28A' : '#D9534A');
  }

  select(key: string | null) {
    this.selectedKey = key;
    this.selectRing.visible = !!key && this.views.has(key);
  }

  /** Client (screen) coordinates of a board slot, used by tests and tutorials. */
  screenOfBoard(index: number): { x: number; y: number } {
    const p = boardIndexToWorld(index).project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height };
  }

  unitDefAt(key: string): { def: UnitDef; star: Star } | null {
    const v = this.views.get(key);
    return v ? { def: v.def, star: v.star } : null;
  }

  // ── Frame ──

  frame(dt: number) {
    this.time += dt;
    for (const v of [...this.views.values()]) {
      if (v.dying > 0) {
        v.dying += dt;
        const k = Math.min(1, v.dying / 0.45);
        v.root.scale.setScalar(1 - k);
        v.root.position.y = -k * 0.3;
        if (k >= 1) this.removeView(v.key);
        continue;
      }
      const bob = this.reduceMotion ? 0 : Math.sin(this.time * 3 + v.bobPhase) * 0.02;
      v.lunge = Math.max(0, v.lunge - dt * 6);
      const lunge = Math.sin(v.lunge * Math.PI) * 0.22;
      v.root.position.set(v.home.x + v.lungeDir.x * lunge, v.home.y, v.home.z + v.lungeDir.z * lunge);
      v.figure.position.y = bob;
      v.flash = Math.max(0, v.flash - dt * 5);
      for (const m of v.flashMats) {
        m.emissive.copy(m.userData.baseEmissive).lerp(RED, v.flash);
        m.emissiveIntensity = Math.max(m.userData.baseIntensity, v.flash * 0.8);
      }
      v.stunLeft = Math.max(0, v.stunLeft - dt);
      v.stun.visible = v.stunLeft > 0;
      v.stun.rotation.z += dt * 6;
      if (v.particles && !this.reduceMotion) v.particles.rotation.y += dt * 1.2;
    }
    if (this.selectedKey) {
      const v = this.views.get(this.selectedKey);
      if (v) this.selectRing.position.set(v.root.position.x, 0.02, v.root.position.z);
      else this.selectRing.visible = false;
    }
    for (const f of [...this.fx]) {
      f.t += dt;
      const k = Math.min(1, f.t / f.dur);
      f.update(k);
      if (k >= 1) {
        this.scene.remove(f.obj);
        if (f.obj instanceof THREE.Mesh) (f.obj.material as THREE.Material).dispose();
        this.fx.splice(this.fx.indexOf(f), 1);
      }
    }
    this.renderer.render(this.scene, this.camera);
  }
}
