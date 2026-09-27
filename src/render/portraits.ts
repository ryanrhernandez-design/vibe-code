// Renders figurine portraits for units that don't have a concept sheet yet, on the same
// cream studio background as the cropped concept portraits, so every card looks consistent.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { UNIT_BY_ID } from '../sim/data';
import { buildUnitModel } from './unitModel';

export function renderPortraits(ids: string[]): Record<string, { full: string; bust: string }> {
  const out: Record<string, { full: string; bust: string }> = {};
  if (!ids.length) return out;
  const canvas = document.createElement('canvas');
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  } catch {
    return out; // no WebGL: cards fall back to their emblem
  }
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#EDE0CE');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;
  const key = new THREE.DirectionalLight('#FFF1DC', 2.4);
  key.position.set(2, 4, 5);
  scene.add(new THREE.HemisphereLight('#FFF6E8', '#B99A76', 1.3), key);
  const camera = new THREE.PerspectiveCamera(30, 3 / 4, 0.1, 50);

  const shot = (w: number, h: number, look: THREE.Vector3, dist: number) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(look.x + dist * 0.35, look.y + dist * 0.18, look.z + dist);
    camera.lookAt(look);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    return canvas.toDataURL('image/webp', 0.85);
  };

  for (const id of ids) {
    const model = buildUnitModel(UNIT_BY_ID[id], 1, true);
    model.ring.visible = false;
    model.figure.rotation.y = 0.3;
    scene.add(model.root);
    const h = model.height;
    out[id] = {
      full: shot(360, 480, new THREE.Vector3(0, h * 0.5, 0), h * 2.55),
      bust: shot(256, 256, new THREE.Vector3(0, h * 0.62, 0), h * 1.75),
    };
    scene.remove(model.root);
  }
  renderer.dispose();
  pmrem.dispose();
  return out;
}
