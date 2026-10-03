import * as THREE from 'three';
import { OrbitControls } from '../assets/vendor/OrbitControls.js';
import { loadAnatomicalBones } from './anatomical-bones.js?v=4';

/** T2, T3 y T4 de BodyParts3D. +Y superior, +Z anterior, +X izquierda. */
export async function createSpineScene(host, onStructureSelect) {
  const { models } = await loadAnatomicalBones();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .94;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  // Los huesos y las luces no se mueven: sus sombras se calculan solo al cambiar capas.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  host.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Vértebras T2 a T4 de BodyParts3D y médula esquemática');
  renderer.domElement.setAttribute('role', 'img');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 80);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, -.6, 0);
  controls.enableDamping = true;
  controls.dampingFactor = .08;
  controls.enablePan = false;
  controls.minDistance = 7;
  controls.maxDistance = 23;
  let orbiting = false, dirty = true;
  controls.addEventListener('start', () => { orbiting = true; });
  controls.addEventListener('end', () => { orbiting = false; });
  controls.addEventListener('change', () => {
    dirty = true;
    if (orbiting) host.dispatchEvent(new Event('model-orbit'));
  });
  scene.add(new THREE.HemisphereLight(0xf4f7ee, 0x30444b, 1.4));
  const key = new THREE.DirectionalLight(0xfff4de, 2.6);
  key.position.set(-5, 9, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -5; key.shadow.camera.right = 5;
  key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
  key.shadow.camera.near = .5; key.shadow.camera.far = 25;
  key.shadow.bias = -.0004;
  key.shadow.normalBias = .04;
  key.shadow.radius = 5;
  key.shadow.blurSamples = 8;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd6e6e2, .7);
  fill.position.set(7, 1, 3); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xb5cdd1, 1.5);
  rim.position.set(-2, 4, -7); scene.add(rim);

  // Grano reproducible y tenue. Es una textura estética, no una imagen histológica.
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = textureCanvas.height = 128;
  const context = textureCanvas.getContext('2d');
  const pixels = context.createImageData(128, 128);
  let seed = 37;
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const shade = 112 + (seed >>> 25);
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = shade;
    pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  const grain = new THREE.CanvasTexture(textureCanvas);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(3, 3);
  const materials = ['body', 'arch', 'spinous'].map(() => new THREE.MeshStandardMaterial({
    color: 0xd9c9ac, roughness: .79, metalness: 0,
    bumpMap: grain, bumpScale: .018
  }));
  const bones = new THREE.Group(); scene.add(bones);
  const pickables = [];
  for (const model of models) {
    const mesh = new THREE.Mesh(model.geometry, materials);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.userData.structure = 'vertebra';
    mesh.userData.level = model.id.toUpperCase();
    bones.add(mesh); pickables.push(mesh);
  }

  // Los discos son aproximados y mantienen las posiciones originales de los huesos.
  const discMaterial = new THREE.MeshStandardMaterial({ color: 0xb1b6af, roughness: .93 });
  const discs = new THREE.Group(); bones.add(discs);
  for (let i = 0; i < models.length - 1; i++) {
    const upper = models[i], lower = models[i + 1];
    const z = (upper.bodyCenter[2] + lower.bodyCenter[2]) / 2;
    function plateY(plate) {
      const [x, y, pz] = plate.point, [nx, ny, nz] = plate.normal;
      return y - (nx * -x + nz * (z - pz)) / ny;
    }
    const top = plateY(upper.bottomEndplate), bottom = plateY(lower.topEndplate);
    const half = Math.max(.09, Math.min(top - bottom + .04, .40)) / 2;
    const profile = [[0, -half], [.90, -half], [1.03, -half + .025], [1.06, 0], [1.03, half - .025], [.90, half], [0, half]].map(([r, y]) => new THREE.Vector2(r, y));
    const disc = new THREE.Mesh(new THREE.LatheGeometry(profile, 64), discMaterial);
    disc.position.set(0, (top + bottom) / 2, z);
    const normal = new THREE.Vector3(...upper.bottomEndplate.normal).add(new THREE.Vector3(...lower.topEndplate.normal)).normalize();
    disc.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    disc.scale.z = .79; disc.castShadow = disc.receiveShadow = true;
    discs.add(disc);
  }

  // Línea central curva estimada a partir de los forámenes, sin reconstruir tejido real.
  const centers = models.map(model => new THREE.Vector3(...model.foramenCenter));
  const first = centers[0].clone().add(centers[0].clone().sub(centers[1]).multiplyScalar(.65));
  const last = centers[2].clone().add(centers[2].clone().sub(centers[1]).multiplyScalar(.55));
  const pathPoints = [first, ...centers, last];
  const cordPath = new THREE.CatmullRomCurve3(pathPoints, false, 'centripetal');
  const canalMaterial = new THREE.MeshBasicMaterial({ color: 0x69b5a8, transparent: true, opacity: .075, side: THREE.DoubleSide, depthWrite: false });
  const canal = new THREE.Mesh(new THREE.TubeGeometry(cordPath, 80, .57, 32, false), canalMaterial);
  scene.add(canal);
  const cordMaterial = new THREE.MeshStandardMaterial({ color: 0xca8b77, roughness: .65, transparent: true, opacity: .84, depthWrite: false });
  const cord = new THREE.Mesh(new THREE.TubeGeometry(cordPath, 80, .30, 40, false), cordMaterial);
  cord.userData.structure = 'cord'; scene.add(cord); pickables.push(cord);

  // Un extremo medular pequeño da orientación al tubo y conserva la mariposa gris.
  const cap = new THREE.Group(); cap.position.copy(first);
  cap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), cordPath.getTangent(0).negate());
  cap.add(new THREE.Mesh(new THREE.CircleGeometry(.30, 48), new THREE.MeshStandardMaterial({ color: 0xe9d8b8, roughness: .9, side: THREE.DoubleSide })));
  const butterfly = new THREE.Shape();
  butterfly.moveTo(0, .035);
  butterfly.bezierCurveTo(-.03, .13, -.17, .19, -.12, .04);
  butterfly.bezierCurveTo(-.24, -.13, -.02, -.19, 0, -.045);
  butterfly.bezierCurveTo(.02, -.19, .24, -.13, .12, .04);
  butterfly.bezierCurveTo(.17, .19, .03, .13, 0, .035);
  const gray = new THREE.Mesh(new THREE.ShapeGeometry(butterfly, 16), new THREE.MeshStandardMaterial({ color: 0xbb7565, side: THREE.DoubleSide }));
  gray.position.z = .003; cap.add(gray); scene.add(cap);

  const tractLines = new THREE.Group(); scene.add(tractLines);
  const lineMaterial = new THREE.MeshStandardMaterial({ color: 0x488f80, roughness: .8 });
  const lines = [-1, 1].map(() => {
    const line = new THREE.Mesh(new THREE.BufferGeometry(), lineMaterial);
    tractLines.add(line); return line;
  });
  const plane = new THREE.Group(); scene.add(plane);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(5.3, 5.8), new THREE.MeshBasicMaterial({ color: 0x8bcebd, opacity: .10, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  sheet.rotation.x = -Math.PI / 2; sheet.position.y = centers[1].y;
  plane.add(sheet);
  const border = new THREE.LineSegments(new THREE.EdgesGeometry(sheet.geometry), new THREE.LineBasicMaterial({ color: 0x9dd6bf, opacity: .45, transparent: true }));
  border.rotation.copy(sheet.rotation); border.position.copy(sheet.position); plane.add(border);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: .22 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -3.65;
  floor.receiveShadow = true; scene.add(floor);
  const views = { oblique: [8.6, 5.2, 10.4], posterior: [0, 1, -14], superior: [0, 14.8, .7] };
  function view(name) {
    // Una vista fija cancela la inercia restante del giro manual.
    const damping = controls.enableDamping;
    controls.enableDamping = false; controls.update();
    camera.position.set(...(views[name] || views.oblique));
    controls.target.set(0, -.65, -.05); controls.update();
    controls.enableDamping = damping;
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
    dirty = true;
  }
  let frame = 0, active = true, disposed = false;
  function animate() {
    if (disposed) return;
    if (active) {
      controls.update();
      if (dirty) { renderer.render(scene, camera); dirty = false; }
    }
    frame = requestAnimationFrame(animate);
  }
  const observer = new ResizeObserver(resize); observer.observe(host);
  const visibilityObserver = new IntersectionObserver(entries => { active = entries[0].isIntersecting; if (active) dirty = true; });
  visibilityObserver.observe(host);

  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  let pointerStart = null;
  renderer.domElement.addEventListener('pointerdown', event => { pointerStart = [event.clientX, event.clientY]; });
  renderer.domElement.addEventListener('pointerup', event => {
    if (!pointerStart || Math.hypot(event.clientX - pointerStart[0], event.clientY - pointerStart[1]) > 5) return;
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickables.filter(item => item === cord || bones.visible))[0];
    if (!hit) return;
    const id = hit.object === cord ? 'cord' : ['body', 'arch', 'spinous'][hit.face.materialIndex];
    onStructureSelect(id);
  });
  view('oblique'); resize(); animate();
  host.querySelector('.canvas-loading')?.remove();
  host.dataset.modelSource = 'BodyParts3D';

  return {
    view,
    opacity(value) {
      dirty = true;
      const opacity = Math.max(.035, 1 - value / 100);
      [...materials, discMaterial].forEach(material => {
        const transparent = opacity < .99;
        const changed = material.transparent !== transparent;
        material.opacity = opacity;
        material.transparent = transparent;
        material.depthWrite = opacity >= .99;
        if (changed) material.needsUpdate = true;
      });
      if (key.castShadow !== (value < 15)) renderer.shadowMap.needsUpdate = true;
      key.castShadow = value < 15;
      bones.children.filter(item => item.isMesh).forEach(mesh => { mesh.castShadow = value < 15; });
    },
    bones(visible) { bones.visible = visible; dirty = true; renderer.shadowMap.needsUpdate = true; },
    canal(visible) { canal.visible = visible; dirty = true; },
    plane(visible) { plane.visible = visible; dirty = true; },
    selectStructure(id) {
      dirty = true;
      materials.forEach((material, index) => {
        const selected = ['body', 'arch', 'spinous'][index] === id;
        material.color.set(selected ? 0xe3cba0 : 0xd9c9ac);
        material.emissive.set(selected ? 0x241a08 : 0x000000);
        material.emissiveIntensity = .12;
      });
      canalMaterial.opacity = id === 'canal' ? .18 : .075;
      cordMaterial.color.set(id === 'cord' ? 0xdf9b82 : 0xca8b77);
    },
    selectTract(tract) {
      dirty = true;
      lineMaterial.color.set(tract.color);
      const horizontal = (tract.label[0] - 310) / 146;
      const vertical = (tract.label[1] - 247) / 128;
      const scale = Math.min(1, .88 / Math.max(.001, Math.hypot(horizontal, vertical)));
      lines.forEach((line, index) => {
        const x = (index === 0 ? -1 : 1) * horizontal * .30 * scale;
        const z = vertical * .25 * scale;
        const curve = new THREE.CatmullRomCurve3(pathPoints.map(point => point.clone().add(new THREE.Vector3(x, 0, z))));
        line.geometry.dispose(); line.geometry = new THREE.TubeGeometry(curve, 64, .022, 8, false);
      });
    },
    dispose() {
      disposed = true; cancelAnimationFrame(frame);
      observer.disconnect(); visibilityObserver.disconnect(); controls.dispose();
      const geometries = new Set(), sceneMaterials = new Set();
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => sceneMaterials.add(material));
      });
      geometries.forEach(geometry => geometry.dispose());
      sceneMaterials.forEach(material => material.dispose());
      grain.dispose(); renderer.dispose();
    }
  };
}
