// Three.js board renderer. It only draws state: the sim decides everything.

import * as THREE from 'three';
import { BENCH_SIZE, BOARD_W, HALF_H, UNIT_BY_ID, FACTION_COLORS, type Star, type UnitDef } from '../sim/data';
import { TICK, type Combat, type CombatEvent } from '../sim/combat';
import type { Loc, Player } from '../sim/match';
import { SKINS, type SceneSkin, type SkinId } from '../ui/skins';
import { buildUnitModel } from './unitModel';

const BENCH_Z = 4.85;
const BENCH_STEP = 0.875;

export const tileToWorld = (x: number, y: number) => new THREE.Vector3(x - (BOARD_W - 1) / 2, 0, HALF_H - 0.5 - y);
export const benchToWorld = (i: number) => new THREE.Vector3((i - (BENCH_SIZE - 1) / 2) * BENCH_STEP, 0, BENCH_Z);
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
    g.font = 'bold 34px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 6;
    g.strokeStyle = 'rgba(0,0,0,0.75)';
    const text = '★'.repeat(star);
    g.strokeText(text, 64, 22);
    g.fillStyle = star === 3 ? '#ffd84d' : star === 2 ? '#e8edf5' : '#d9a066';
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
  readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  private skin: SceneSkin = SKINS.painted;
  private boardGroup = new THREE.Group();
  private views = new Map<string, UnitView>();
  private fx: Fx[] = [];
  private hemi = new THREE.HemisphereLight();
  private sun = new THREE.DirectionalLight();
  private highlightMesh: THREE.Mesh;
  private raycaster = new THREE.Raycaster();
  private ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private width = 1;
  private height = 1;
  private time = 0;
  private combat: Combat | null = null;

  constructor(readonly canvas: HTMLCanvasElement, private readonly overlay: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.sun.position.set(4, 11, 7);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera;
    sc.left = -7;
    sc.right = 7;
    sc.top = 8;
    sc.bottom = -8;
    this.sun.shadow.bias = -0.0015;
    this.scene.add(this.hemi, this.sun, this.boardGroup);

    this.highlightMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.92, 0.92),
      new THREE.MeshBasicMaterial({ color: '#7dffb0', transparent: true, opacity: 0.45, depthWrite: false }),
    );
    this.highlightMesh.rotation.x = -Math.PI / 2;
    this.highlightMesh.position.y = 0.012;
    this.highlightMesh.visible = false;
    this.scene.add(this.highlightMesh);

    this.setSkin('painted');
  }

  setSkin(id: SkinId) {
    this.skin = SKINS[id];
    const s = this.skin;
    this.hemi.color.set(s.hemiSky);
    this.hemi.groundColor.set(s.hemiGround);
    this.hemi.intensity = s.hemiIntensity;
    this.sun.color.set(s.sunColor);
    this.sun.intensity = s.sunIntensity;
    this.renderer.toneMappingExposure = s.exposure;
    this.buildBoard();
    // Rebuild unit meshes so materials follow the skin.
    for (const v of [...this.views.values()]) {
      const pos = v.root.position.clone();
      this.removeView(v.key);
      const nv = this.addView(v.key, v.def, v.star, v.ally, pos);
      nv.home.copy(v.home);
    }
  }

  private buildBoard() {
    this.boardGroup.clear();
    const s = this.skin;
    const std = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...extra });

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(BOARD_W + 0.7, 0.5, HALF_H * 2 + 0.7), std(s.frame));
    plinth.position.y = -0.3;
    plinth.receiveShadow = true;
    this.boardGroup.add(plinth);

    const tileGeo = new THREE.BoxGeometry(0.95, 0.12, 0.95);
    const matA = std(s.tileA);
    const matB = std(s.tileB);
    const enemyA = std(new THREE.Color(s.tileA).lerp(new THREE.Color(s.enemyTint), 0.45).getStyle());
    const enemyB = std(new THREE.Color(s.tileB).lerp(new THREE.Color(s.enemyTint), 0.45).getStyle());
    for (let y = 0; y < HALF_H * 2; y++) {
      for (let x = 0; x < BOARD_W; x++) {
        const even = (x + y) % 2 === 0;
        const m = y < HALF_H ? (even ? matA : matB) : even ? enemyA : enemyB;
        const t = new THREE.Mesh(tileGeo, m);
        t.position.copy(tileToWorld(x, y)).setY(-0.06);
        t.receiveShadow = true;
        this.boardGroup.add(t);
      }
    }
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(BOARD_W + 0.3, 0.02, 0.05),
      new THREE.MeshStandardMaterial({ color: s.centerLine, emissive: s.centerLine, emissiveIntensity: 1.2 }),
    );
    line.position.set(0, 0.005, 0);
    this.boardGroup.add(line);

    const bench = new THREE.Mesh(new THREE.BoxGeometry(BOARD_W + 0.5, 0.35, 1.15), std(s.frame));
    bench.position.set(0, -0.23, BENCH_Z);
    bench.receiveShadow = true;
    this.boardGroup.add(bench);
    const slotGeo = new THREE.CylinderGeometry(0.36, 0.38, 0.06, 28);
    const slotMat = std(s.benchSlot);
    for (let i = 0; i < BENCH_SIZE; i++) {
      const slot = new THREE.Mesh(slotGeo, slotMat);
      slot.position.copy(benchToWorld(i)).setY(-0.03);
      slot.receiveShadow = true;
      this.boardGroup.add(slot);
    }

    // Corner pillars with glowing braziers frame the arena.
    const pillarGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.9, 12);
    const orbGeo = new THREE.SphereGeometry(0.13, 14, 10);
    const pillarMat = std(s.pillar);
    const orbMat = new THREE.MeshStandardMaterial({ color: s.pillarGlow, emissive: s.pillarGlow, emissiveIntensity: 2 });
    for (const [px, pz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(px * (BOARD_W / 2 + 0.15), 0.35, pz * (HALF_H + 0.15));
      p.castShadow = true;
      const o = new THREE.Mesh(orbGeo, orbMat);
      o.position.set(p.position.x, 0.9, p.position.z);
      this.boardGroup.add(p, o);
    }
  }

  resize(w: number, h: number) {
    this.width = Math.max(1, w);
    this.height = Math.max(1, h);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.fitCamera();
  }

  /** Find the closest camera distance at which the board, bench and unit heads all fit on screen. */
  private fitCamera() {
    // Portrait screens have spare height, so look down more steeply to make the board bigger.
    const elev = THREE.MathUtils.degToRad(this.width / this.height < 0.9 ? 64 : 54);
    const target = new THREE.Vector3(0, 0, 0.75);
    const pts: THREE.Vector3[] = [];
    for (const x of [-(BOARD_W / 2 + 0.4), BOARD_W / 2 + 0.4]) {
      for (const z of [-(HALF_H + 0.4), BENCH_Z + 0.6]) for (const y of [0, 1.1]) pts.push(new THREE.Vector3(x, y, z));
    }
    const place = (d: number) => {
      this.camera.position.set(target.x, target.y + Math.sin(elev) * d, target.z + Math.cos(elev) * d);
      this.camera.lookAt(target);
      this.camera.updateProjectionMatrix();
      this.camera.updateMatrixWorld();
    };
    let lo = 4;
    let hi = 80;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      place(mid);
      const fits = pts.every((p) => {
        const v = p.clone().project(this.camera);
        return Math.abs(v.x) <= 0.97 && Math.abs(v.y) <= 0.97;
      });
      if (fits) hi = mid;
      else lo = mid;
    }
    place(hi);
    // Centre the content vertically.
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      const v = p.clone().project(this.camera);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    }
    this.camera.clearViewOffset();
    const shift = ((minY + maxY) / 2) * (this.height / 2);
    this.camera.setViewOffset(this.width, this.height, 0, -shift, this.width, this.height);
  }

  // ── Unit views ──

  private addView(key: string, def: UnitDef, star: Star, ally: boolean, pos: THREE.Vector3): UnitView {
    const model = buildUnitModel(def, star, ally, this.skin);
    const root = model.root;
    root.position.copy(pos);
    const figure = root.children[0];
    figure.rotation.y = ally ? Math.PI : 0;

    const bars = new THREE.Group();
    bars.position.y = model.height + 0.28;
    const bg = barSprite('#11151c', BAR_W + 0.04, 0.13, false);
    const hpFill = barSprite(ally ? '#5fe07a' : '#ff5a5a', BAR_W, 0.075, true);
    hpFill.position.set(-BAR_W / 2, 0.018, 0);
    const manaFill = barSprite('#4aa8ff', BAR_W, 0.035, true);
    manaFill.position.set(-BAR_W / 2, -0.045, 0);
    manaFill.scale.x = 0;
    const stars = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTexture(star), depthTest: false, transparent: true }));
    stars.scale.set(0.5, 0.16, 1);
    stars.position.y = 0.16;
    stars.renderOrder = 11;
    bars.add(bg, hpFill, manaFill, stars);
    root.add(bars);

    const stun = new THREE.Mesh(
      stunGeo,
      new THREE.MeshBasicMaterial({ color: '#ffe066' }),
    );
    stun.rotation.x = Math.PI / 2;
    stun.position.y = model.height + 0.05;
    stun.visible = false;
    root.add(stun);

    this.scene.add(root);
    const view: UnitView = {
      key, def, star, ally, root, figure, flashMats: model.flashMats, hpFill, manaFill, bars, stun,
      home: pos.clone(), flash: 0, lunge: 0, lungeDir: new THREE.Vector3(), stunLeft: 0, dying: 0,
      bobPhase: Math.random() * Math.PI * 2,
    };
    this.views.set(key, view);
    return view;
  }

  private removeView(key: string) {
    const v = this.views.get(key);
    if (!v) return;
    this.scene.remove(v.root);
    v.root.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Sprite) {
        const m = o.material as THREE.Material | THREE.Material[];
        (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
      }
    });
    this.views.delete(key);
  }

  clearUnits() {
    for (const k of [...this.views.keys()]) this.removeView(k);
    this.combat = null;
  }

  /** Show a player's board and bench (prep phase, or scouting someone else). */
  showPlayer(p: Player) {
    this.combat = null;
    const seen = new Set<string>();
    const place = (uid: number, defId: string, star: Star, pos: THREE.Vector3) => {
      const key = `u${uid}`;
      seen.add(key);
      let v = this.views.get(key);
      if (v && v.star !== star) {
        this.removeView(key);
        v = undefined;
        this.burst(pos, FACTION_COLORS[UNIT_BY_ID[defId].faction].glow, 1.2);
      }
      if (!v) v = this.addView(key, UNIT_BY_ID[defId], star, true, pos);
      v.home.copy(pos);
      v.root.position.copy(pos);
      this.setBarsVisible(v, false);
    };
    p.board.forEach((u, i) => u && place(u.uid, u.defId, u.star, boardIndexToWorld(i)));
    p.bench.forEach((u, i) => u && place(u.uid, u.defId, u.star, benchToWorld(i)));
    for (const k of [...this.views.keys()]) if (!seen.has(k)) this.removeView(k);
  }

  private setBarsVisible(v: UnitView, on: boolean) {
    for (const c of v.bars.children) if (c !== v.bars.children[3]) c.visible = on;
  }

  /** Client (screen) coordinates of a board slot or bench slot — used by tests and tutorials. */
  screenOf(loc: Loc): { x: number; y: number } {
    const w = loc.area === 'board' ? boardIndexToWorld(loc.index) : benchToWorld(loc.index);
    const p = w.project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height };
  }

  /** Sync only the bench (used during combat, when the board shows the fight). */
  showBench(p: Player) {
    const seen = new Set<string>();
    p.bench.forEach((u, i) => {
      if (!u) return;
      const key = `u${u.uid}`;
      seen.add(key);
      let v = this.views.get(key);
      if (v && v.star !== u.star) {
        this.removeView(key);
        v = undefined;
      }
      const pos = benchToWorld(i);
      if (!v) v = this.addView(key, UNIT_BY_ID[u.defId], u.star, true, pos);
      this.setBarsVisible(v, false);
      v.home.copy(pos);
    });
    for (const k of [...this.views.keys()]) if (k.startsWith('u') && !seen.has(k)) this.removeView(k);
  }

  startCombat(combat: Combat) {
    this.clearUnits();
    this.combat = combat;
    for (const u of combat.units) this.addView(`c${u.id}`, u.def, u.star, u.side === 0, tileToWorld(u.x, u.y));
  }

  combatEvents(events: CombatEvent[]) {
    const c = this.combat;
    if (!c) return;
    for (const e of events) {
      const v = this.views.get(`c${e.id}`);
      if (!v) continue;
      switch (e.type) {
        case 'attack': {
          const t = this.views.get(`c${e.target}`);
          if (!t) break;
          const dir = t.root.position.clone().sub(v.root.position).setY(0).normalize();
          if (e.ranged) this.projectile(v, t);
          else {
            v.lunge = 1;
            v.lungeDir.copy(dir);
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
            this.ring(v.root.position, '#6dff9a', 0.6, 0.5);
          }
          break;
        case 'cast': {
          const glow = FACTION_COLORS[v.def.faction].glow;
          const center = tileToWorld(e.x, e.y);
          if (e.kind === 'nova') this.ring(center, glow, e.radius + 0.5, 0.55);
          else if (e.kind === 'strike' || e.kind === 'volley') {
            for (const id of e.targets) {
              const t = this.views.get(`c${id}`);
              if (t) this.projectile(v, t, glow, 0.13);
            }
          } else this.ring(v.root.position, glow, 0.7, 0.5);
          // Only legendaries announce their ability; otherwise big fights get too noisy.
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

  private projectile(from: UnitView, to: UnitView, color = '#fff3c4', size = 0.07) {
    const m = new THREE.Mesh(projectileGeo, new THREE.MeshBasicMaterial({ color }));
    m.scale.setScalar(size);
    const a = from.root.position.clone().setY(0.55);
    this.scene.add(m);
    this.fx.push({
      obj: m, t: 0, dur: 0.2,
      update: (k) => {
        const b = to.root.position.clone().setY(0.5);
        m.position.lerpVectors(a, b, k);
        m.position.y += Math.sin(k * Math.PI) * 0.25;
      },
    });
  }

  private ring(center: THREE.Vector3, color: string, radius: number, dur: number) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false });
    const m = new THREE.Mesh(ringGeo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.copy(center).setY(0.05);
    this.scene.add(m);
    this.fx.push({
      obj: m, t: 0, dur,
      update: (k) => {
        m.scale.setScalar(0.2 + k * radius);
        mat.opacity = 0.9 * (1 - k);
      },
    });
  }

  /** Celebration burst used for merges and level-ups. */
  burst(center: THREE.Vector3, color: string, radius = 1) {
    this.ring(center, color, radius, 0.6);
    this.ring(center, '#ffffff', radius * 0.6, 0.45);
  }

  private floatText(world: THREE.Vector3, text: string, cls: string) {
    const p = world.clone().setY(1.1).project(this.camera);
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
    const hits = rc.intersectObjects(roots, true);
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o && !roots.includes(o as THREE.Group)) o = o.parent;
      if (o) for (const v of this.views.values()) if (v.root === o) return v.key;
    }
    // Forgiving touch: fall back to the nearest unit within ~half a tile of the ground point.
    const g = this.groundPoint(clientX, clientY);
    if (!g) return null;
    let best: string | null = null;
    let bestD = 0.55;
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

  /** Board tile (own half only) or bench slot nearest to a ground point. */
  dropTarget(p: THREE.Vector3): Loc | null {
    if (Math.abs(p.z - BENCH_Z) < 0.75) {
      const i = Math.round(p.x / BENCH_STEP + (BENCH_SIZE - 1) / 2);
      if (i >= 0 && i < BENCH_SIZE) return { area: 'bench', index: i };
      return null;
    }
    const x = Math.round(p.x + (BOARD_W - 1) / 2);
    const y = Math.round(HALF_H - 0.5 - p.z);
    if (x < 0 || x >= BOARD_W || y < 0 || y >= HALF_H) return null;
    const row = HALF_H - 1 - y;
    return { area: 'board', index: row * BOARD_W + x };
  }

  setDragPosition(key: string, p: THREE.Vector3 | null) {
    const v = this.views.get(key);
    if (!v) return;
    if (p) {
      v.root.position.set(p.x, 0.35, p.z);
      v.home.copy(v.root.position);
    }
  }

  highlight(loc: Loc | null, valid = true) {
    this.highlightMesh.visible = !!loc;
    if (!loc) return;
    const pos = loc.area === 'board' ? boardIndexToWorld(loc.index) : benchToWorld(loc.index);
    this.highlightMesh.position.set(pos.x, 0.012, pos.z);
    (this.highlightMesh.material as THREE.MeshBasicMaterial).color.set(valid ? '#7dffb0' : '#ff7d7d');
  }

  unitDefAt(key: string): { def: UnitDef; star: Star } | null {
    const v = this.views.get(key);
    return v ? { def: v.def, star: v.star } : null;
  }

  worldOf(key: string): THREE.Vector3 | null {
    return this.views.get(key)?.root.position.clone() ?? null;
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
      const bob = Math.sin(this.time * 3 + v.bobPhase) * 0.025;
      v.lunge = Math.max(0, v.lunge - dt * 6);
      const lunge = Math.sin(v.lunge * Math.PI) * 0.22;
      v.root.position.set(v.home.x + v.lungeDir.x * lunge, v.home.y, v.home.z + v.lungeDir.z * lunge);
      v.figure.position.y = bob;
      v.flash = Math.max(0, v.flash - dt * 5);
      for (const m of v.flashMats) {
        m.emissive.setRGB(v.flash * 0.9, v.flash * 0.15, v.flash * 0.1);
      }
      v.stunLeft = Math.max(0, v.stunLeft - dt);
      v.stun.visible = v.stunLeft > 0;
      v.stun.rotation.z += dt * 6;
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

