// Procedural placeholder unit models. Each role has a distinct silhouette (shield, blade,
// bow, orb) so units read at phone size before the real art from docs/art-prompts.md exists.

import * as THREE from 'three';
import { FACTION_COLORS, type Star, type UnitDef } from '../sim/data';
import type { SceneSkin } from '../ui/skins';
import { TEAM_COLORS } from '../ui/skins';

export interface UnitModel {
  root: THREE.Group;
  /** Materials that flash when hit. */
  flashMats: THREE.MeshStandardMaterial[];
  height: number;
}

const geo = {
  body: new THREE.CapsuleGeometry(0.19, 0.3, 6, 14),
  head: new THREE.SphereGeometry(0.14, 18, 14),
  shield: new THREE.BoxGeometry(0.34, 0.4, 0.06),
  blade: new THREE.BoxGeometry(0.05, 0.5, 0.05),
  hilt: new THREE.BoxGeometry(0.16, 0.04, 0.05),
  bow: new THREE.TorusGeometry(0.22, 0.022, 6, 16, Math.PI),
  orb: new THREE.SphereGeometry(0.08, 14, 10),
  hat: new THREE.ConeGeometry(0.15, 0.3, 14),
  crown: new THREE.CylinderGeometry(0.13, 0.15, 0.08, 10, 1, true),
  ring: new THREE.RingGeometry(0.3, 0.38, 32),
  shoulder: new THREE.SphereGeometry(0.09, 10, 8),
};

function mat(color: string, skin: SceneSkin, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: skin.roughness, metalness: skin.metalness, ...extra });
}

export function buildUnitModel(def: UnitDef, star: Star, ally: boolean, skin: SceneSkin): UnitModel {
  const root = new THREE.Group();
  const figure = new THREE.Group();
  root.add(figure);
  const c = FACTION_COLORS[def.faction];
  const bodyMat = mat(c.primary, skin);
  const trimMat = mat(c.secondary, skin, { metalness: Math.min(1, skin.metalness + 0.4), roughness: skin.roughness * 0.7 });
  const glowMat = new THREE.MeshStandardMaterial({ color: c.glow, emissive: c.glow, emissiveIntensity: 1.6 });
  const flashMats = [bodyMat, trimMat];

  const add = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    figure.add(mesh);
    return mesh;
  };

  const body = add(geo.body, bodyMat, 0, 0.36, 0);
  add(geo.head, trimMat, 0, 0.72, 0);
  if (def.role === 'guardian') {
    body.scale.set(1.35, 1.05, 1.2);
    add(geo.shoulder, trimMat, -0.24, 0.55, 0);
    add(geo.shoulder, trimMat, 0.24, 0.55, 0);
    const shield = add(geo.shield, trimMat, -0.2, 0.38, 0.2);
    shield.rotation.y = 0.3;
    add(geo.orb, glowMat, -0.22, 0.42, 0.24).scale.setScalar(0.6);
  } else if (def.role === 'striker') {
    body.scale.set(0.95, 1, 0.95);
    const blade = add(geo.blade, glowMat, 0.26, 0.5, 0.12);
    blade.rotation.x = 0.5;
    add(geo.hilt, trimMat, 0.26, 0.3, 0.02).rotation.x = 0.5;
  } else if (def.role === 'marksman') {
    body.scale.set(0.9, 1, 0.9);
    const bow = add(geo.bow, trimMat, -0.24, 0.45, 0.08);
    bow.rotation.set(0, Math.PI / 2, Math.PI / 2);
    add(geo.orb, glowMat, -0.24, 0.45, 0.12).scale.setScalar(0.4);
  } else {
    add(geo.hat, bodyMat, 0, 0.92, 0).rotation.z = 0.12;
    add(geo.orb, glowMat, 0.28, 0.62, 0.1);
  }
  if (def.legendary) add(geo.crown, glowMat, 0, 0.86, 0);

  const scale = (def.legendary ? 1.75 : 1.25 + def.tier * 0.05) * [1, 1, 1.12, 1.25][star];
  figure.scale.setScalar(scale);

  const ring = new THREE.Mesh(
    geo.ring,
    new THREE.MeshBasicMaterial({ color: ally ? TEAM_COLORS.ally : TEAM_COLORS.enemy, transparent: true, opacity: 0.85 }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  root.add(ring);

  return { root, flashMats, height: 1.0 * scale };
}
