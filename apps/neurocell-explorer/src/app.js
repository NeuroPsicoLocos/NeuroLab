import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { cellTypes, scienceContent, quiz } from "./cellTypes.js";
import { createCellModel, createEditableDendrite } from "./cellFactory.js";

const sceneHost = document.querySelector("#scene");
const labelsHost = document.querySelector("#labels");
const modelLoading = document.querySelector("#modelLoading");
const controls = {
  cellType: document.querySelector("#cellType"),
  reconstructionSource: document.querySelector("#reconstructionSource"),
  provenancePanel: document.querySelector("#provenancePanel"),
  provenanceLink: document.querySelector("#provenanceLink"),
  provenanceId: document.querySelector("#provenanceId"),
  provenanceArchive: document.querySelector("#provenanceArchive"),
  provenanceSpecies: document.querySelector("#provenanceSpecies"),
  provenanceRegion: document.querySelector("#provenanceRegion"),
  provenanceDomain: document.querySelector("#provenanceDomain"),
  provenanceDoi: document.querySelector("#provenanceDoi"),
  provenanceStats: document.querySelector("#provenanceStats"),
  provenanceCaveat: document.querySelector("#provenanceCaveat"),
  atlasImagePanel: document.querySelector("#atlasImagePanel"),
  atlasFigure: document.querySelector("#atlasFigure"),
  atlasImage: document.querySelector("#atlasImage"),
  atlasCaption: document.querySelector("#atlasCaption"),
  toggleAtlasImage: document.querySelector("#toggleAtlasImage"),
  toggleSoma: document.querySelector("#toggleSoma"),
  toggleDendrites: document.querySelector("#toggleDendrites"),
  toggleSpines: document.querySelector("#toggleSpines"),
  toggleAxon: document.querySelector("#toggleAxon"),
  toggleActivity: document.querySelector("#toggleActivity"),
  toggleContext: document.querySelector("#toggleContext"),
  toggleLabels: document.querySelector("#toggleLabels"),
  lightingMode: document.querySelector("#lightingMode"),
  toggleTransparency: document.querySelector("#toggleTransparency"),
  pyramidalDetailPanel: document.querySelector("#pyramidalDetailPanel"),
  interneuronDetailPanel: document.querySelector("#interneuronDetailPanel"),
  functionPanel: document.querySelector("#functionPanel"),
  functionTitle: document.querySelector("#functionTitle"),
  potentialBar: document.querySelector("#potentialBar"),
  potentialValue: document.querySelector("#potentialValue"),
  activityStatus: document.querySelector("#activityStatus"),
  exciteNeuron: document.querySelector("#exciteNeuron"),
  inhibitNeuron: document.querySelector("#inhibitNeuron"),
  branchComplexity: document.querySelector("#branchComplexity"),
  spineDensity: document.querySelector("#spineDensity"),
  resetView: document.querySelector("#resetView"),
  addDendrite: document.querySelector("#addDendrite"),
  removeDendrite: document.querySelector("#removeDendrite"),
  studentMode: document.querySelector("#studentMode"),
  teacherMode: document.querySelector("#teacherMode"),
  branchLayerLabel: document.querySelector("#branchLayerLabel"),
  spineLayerLabel: document.querySelector("#spineLayerLabel"),
  axonLayerLabel: document.querySelector("#axonLayerLabel"),
  branchComplexityLabel: document.querySelector("#branchComplexityLabel"),
  spineDensityLabel: document.querySelector("#spineDensityLabel")
};

const state = {
  cellKey: "pyramidal",
  mode: "student",
  activeTopic: "anatomy",
  cell: null,
  editableDendrites: [],
  membranePotential: -70,
  excitation: 0,
  inhibition: 0,
  spikeTimer: 0,
  pulseProgress: 0,
  mountToken: 0
};

const reconstructionCache = new Map();
let neuromorphoManifest = null;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight);
renderer.shadowMap.enabled = true;
sceneHost.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 1.2, 8.5);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.target.set(0, 0.35, 0);

const root = new THREE.Group();
scene.add(root);

initializeInterface();

function initializeInterface() {
  addLights();
  addReferenceGrid();
  bindEvents();
  updateInfo();
  mountQuiz();
  resize();
  requestAnimationFrame(() => {
    void mountCell();
    animate();
  });
}

function addLights() {
  const hemisphere = new THREE.HemisphereLight(0xf2f8fb, 0x8f9699, 2.3);
  hemisphere.userData.baseIntensity = hemisphere.intensity;
  scene.add(hemisphere);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(3, 4, 6);
  keyLight.castShadow = true;
  keyLight.userData.baseIntensity = keyLight.intensity;
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0xc9f1ed, 1.2, 12);
  rimLight.position.set(-3, 2, -3);
  rimLight.userData.baseIntensity = rimLight.intensity;
  scene.add(rimLight);
}

function addReferenceGrid() {
  const grid = new THREE.GridHelper(8, 8, 0xc9d4db, 0xe2e8ee);
  grid.position.y = -1.25;
  grid.material.transparent = true;
  grid.material.opacity = 0.45;
  scene.add(grid);
}

async function mountCell() {
  const mountToken = state.mountToken + 1;
  state.mountToken = mountToken;
  modelLoading.hidden = false;
  if (state.cell) root.remove(state.cell);
  labelsHost.replaceChildren();
  state.editableDendrites = [];

  const config = cellTypes[state.cellKey];
  let renderConfig;
  try {
    renderConfig = await resolveReconstruction(config);
  } catch (error) {
    console.error(error);
    modelLoading.textContent = "No se pudo cargar la reconstrucción SWC.";
    return;
  }
  if (mountToken !== state.mountToken) return;
  modelLoading.textContent = "Generando reconstrucción orgánica...";

  try {
    state.cell = createCellModel(renderConfig, {
      complexity: Number(controls.branchComplexity.value),
      spineDensity: Number(controls.spineDensity.value)
    });
  } catch (error) {
    console.error(error);
    modelLoading.textContent = "No se pudo generar la malla 3D.";
    return;
  }
  root.add(state.cell);
  resetFunctionalState();
  updateLayerControlLabels(renderConfig);
  updateFunctionalCopy(renderConfig);
  updateAtlasImage(renderConfig);
  updateReconstructionSource(renderConfig);
  await updateProvenancePanel(renderConfig);
  applyLayerVisibility();
  cacheMaterialOpacity();
  updateTransparency();
  buildLabels();
  modelLoading.hidden = true;
}

async function resolveReconstruction(config) {
  const reconstruction = config.reconstruction;
  if (!reconstruction?.path || reconstruction.text) return config;

  if (!reconstructionCache.has(reconstruction.path)) {
    const response = await fetch(reconstruction.path);
    if (!response.ok) {
      throw new Error(`No se pudo cargar la reconstruccion SWC: ${reconstruction.path}`);
    }
    reconstructionCache.set(reconstruction.path, await response.text());
  }

  return {
    ...config,
    reconstruction: {
      ...reconstruction,
      text: reconstructionCache.get(reconstruction.path)
    }
  };
}

function cacheMaterialOpacity() {
  state.cell?.traverse((child) => {
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (material.userData.baseOpacity == null) {
        material.userData.baseOpacity = material.opacity;
      }
    });
  });
}

function bindEvents() {
  window.addEventListener("resize", resize);
  controls.cellType.addEventListener("change", () => {
    state.cellKey = controls.cellType.value;
    void mountCell();
    updateInfo();
  });

  ["toggleSoma", "toggleDendrites", "toggleSpines", "toggleAxon", "toggleActivity", "toggleContext", "toggleLabels"].forEach((key) => {
    controls[key].addEventListener("change", applyLayerVisibility);
  });

  controls.branchComplexity.addEventListener("input", () => void mountCell());
  controls.spineDensity.addEventListener("input", () => void mountCell());
  controls.resetView.addEventListener("click", resetView);
  controls.addDendrite.addEventListener("click", addEditableDendrite);
  controls.removeDendrite.addEventListener("click", removeEditableDendrite);
  controls.exciteNeuron.addEventListener("click", () => addFunctionalInput("excitation"));
  controls.inhibitNeuron.addEventListener("click", () => addFunctionalInput("inhibition"));
  controls.toggleAtlasImage.addEventListener("click", toggleAtlasFigure);
  controls.lightingMode.addEventListener("change", updateLightingMode);
  controls.toggleTransparency.addEventListener("change", updateTransparency);
  controls.studentMode.addEventListener("click", () => setMode("student"));
  controls.teacherMode.addEventListener("click", () => setMode("teacher"));

  document.querySelectorAll(".info-tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTopic = button.dataset.topic;
      updateInfo();
    });
  });
}

function updateTransparency() {
  const enabled = controls.toggleTransparency.checked;
  state.cell?.traverse((child) => {
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = enabled ? Math.min(material.opacity, 0.42) : (material.userData.baseOpacity ?? 0.9);
      material.needsUpdate = true;
    });
  });
}

function updateLightingMode() {
  const mode = controls.lightingMode.value;
  document.body.dataset.lighting = mode;
  scene.traverse((object) => {
    if (object.isLight) {
      object.intensity = mode === "darkfield" ? object.userData.baseIntensity * 0.75 : object.userData.baseIntensity;
      if (mode === "contrast" && object.type === "DirectionalLight") object.intensity *= 1.25;
    }
  });
}

function applyLayerVisibility() {
  const layers = state.cell?.userData.layers;
  if (!layers) return;
  layers.soma.visible = controls.toggleSoma.checked;
  layers.dendrites.visible = controls.toggleDendrites.checked;
  layers.spines.visible = controls.toggleSpines.checked;
  layers.axon.visible = controls.toggleAxon.checked;
  layers.activity.visible = controls.toggleActivity.checked;
  layers.context.visible = controls.toggleContext.checked;
  controls.toggleAxon.disabled = layers.axon.children.length === 0;
  controls.toggleActivity.disabled = layers.activity.children.length === 0;
  controls.toggleContext.disabled = layers.context.children.length === 0;
  labelsHost.hidden = !controls.toggleLabels.checked;
  controls.functionPanel.hidden = layers.axon.children.length === 0;
  controls.pyramidalDetailPanel.hidden = state.cellKey !== "pyramidal";
  controls.interneuronDetailPanel.hidden = state.cellKey !== "multipolar";
}

function updateLayerControlLabels(config) {
  const labels = config.layerLabels ?? {};
  controls.branchLayerLabel.textContent = labels.branches ?? "Dendritas";
  controls.spineLayerLabel.textContent = labels.spines ?? "Espinas dendríticas";
  controls.axonLayerLabel.textContent = labels.axon ?? "Axón";
  controls.addDendrite.textContent = labels.addBranch ?? "+ dendrita";
  controls.removeDendrite.textContent = labels.removeBranch ?? "- dendrita";
  controls.addDendrite.title = labels.addBranch?.replace("+", "Agregar") ?? "Agregar dendrita";
  controls.removeDendrite.title = labels.removeBranch?.replace("-", "Quitar última") ?? "Quitar última dendrita";
  controls.branchComplexityLabel.textContent = labels.complexity ?? "Complejidad dendrítica";
  controls.spineDensityLabel.textContent = labels.spineDensity ?? "Densidad de espinas";
}

function updateFunctionalCopy(config) {
  const isInterneuron = state.cellKey === "multipolar";
  const isPurkinje = state.cellKey === "purkinje";
  controls.functionTitle.textContent = isInterneuron ? "Función inhibitoria" : (isPurkinje ? "Integración cerebelosa" : "Función neuronal");
  controls.exciteNeuron.textContent = isInterneuron ? "Activar interneurona" : "Estímulo excitatorio";
  controls.inhibitNeuron.textContent = isInterneuron ? "Freno sináptico" : "Estímulo inhibitorio";
  controls.activityStatus.textContent = isPurkinje
    ? "Anatomía somatodendrítica: este SWC no incluye axón reconstruido."
    : isInterneuron
    ? "Reposo: interneurona SOM+ lista para inhibición dendrítica esquemática."
    : "Reposo: integración dendrítica esquemática.";
  controls.spineLayerLabel.textContent = config.layerLabels?.spines ?? (isInterneuron ? "Contactos sinápticos" : "Espinas dendríticas");
}

function updateAtlasImage(config) {
  const atlas = config.atlas;
  controls.atlasImagePanel.hidden = !atlas;
  if (!atlas) return;
  controls.atlasImage.src = atlas.image;
  controls.atlasImage.alt = `Lámina anatómica de referencia: ${config.name}`;
  controls.atlasCaption.textContent = atlas.caption;
  controls.toggleAtlasImage.textContent = controls.atlasFigure.hidden ? "Mostrar" : "Ocultar";
}

function updateReconstructionSource(config) {
  const reconstruction = state.cell?.userData.reconstruction ?? config.reconstruction;
  if (!reconstruction) {
    controls.reconstructionSource.textContent = "Fuente morfológica: generador educativo procedural.";
    return;
  }
  const stats = reconstruction.stats ? ` ${reconstruction.stats.nodes} nodos, ${reconstruction.stats.sections} segmentos.` : "";
  controls.reconstructionSource.textContent = `Fuente morfológica: ${reconstruction.format} - ${reconstruction.status}.${stats}`;
}

async function updateProvenancePanel(config) {
  const reconstruction = state.cell?.userData.reconstruction ?? config.reconstruction;
  if (!reconstruction?.neuronId) {
    controls.provenancePanel.hidden = true;
    return;
  }

  const entry = await findManifestEntry(reconstruction.neuronId).catch((error) => {
    console.warn(error);
    return null;
  });
  if (!entry) {
    controls.provenancePanel.hidden = true;
    return;
  }

  controls.provenancePanel.hidden = false;
  controls.provenanceLink.href = entry.metadata_url;
  controls.provenanceId.textContent = String(entry.neuron_id);
  controls.provenanceArchive.textContent = entry.archive;
  controls.provenanceSpecies.textContent = entry.species;
  controls.provenanceRegion.textContent = entry.brain_region.join(", ");
  controls.provenanceDomain.textContent = entry.domain;
  controls.provenanceDoi.textContent = entry.reference_doi.join("; ");
  controls.provenanceStats.textContent = `${entry.parser_stats.nodes} nodos SWC, ${entry.parser_stats.sections} segmentos reconstruidos, ${entry.parser_stats.dendrites} dendríticos y ${entry.parser_stats.axon} axonales.`;
  controls.provenanceCaveat.textContent = "Datos morfológicos reales: esqueleto SWC y radios locales. Render docente: superficie, membrana, suavizado y espinas interpoladas.";
}

async function findManifestEntry(neuronId) {
  if (!neuromorphoManifest) {
    const response = await fetch("data/neuromorpho/manifest.json");
    if (!response.ok) return null;
    neuromorphoManifest = await response.json();
  }
  return neuromorphoManifest.reconstructions.find((entry) => entry.neuron_id === neuronId);
}

function toggleAtlasFigure() {
  controls.atlasFigure.hidden = !controls.atlasFigure.hidden;
  controls.toggleAtlasImage.textContent = controls.atlasFigure.hidden ? "Mostrar" : "Ocultar";
}

function buildLabels() {
  state.cell.userData.labelAnchors.forEach((anchor) => {
    const label = document.createElement("div");
    label.className = "label";
    label.dataset.key = anchor.key;
    label.textContent = anchor.text;
    labelsHost.appendChild(label);
  });
}

function updateLabels() {
  const anchors = state.cell?.userData.labelAnchors ?? [];
  const hostRect = sceneHost.getBoundingClientRect();
  anchors.forEach((anchor) => {
    const label = labelsHost.querySelector(`[data-key="${anchor.key}"]`);
    if (!label) return;
    const position = anchor.position.clone().project(camera);
    const isBehind = position.z > 1;
    label.hidden = isBehind;
    label.style.left = `${(position.x * 0.5 + 0.5) * hostRect.width}px`;
    label.style.top = `${(-position.y * 0.5 + 0.5) * hostRect.height}px`;
  });
}

function addEditableDendrite() {
  const config = cellTypes[state.cellKey];
  const dendrite = createEditableDendrite(
    state.editableDendrites.length + config.dendrites.length + 1,
    config.colors.dendrite,
    config.colors.spine
  );
  state.editableDendrites.push(dendrite);
  state.cell.userData.layers.dendrites.add(dendrite);
}

function removeEditableDendrite() {
  const dendrite = state.editableDendrites.pop();
  if (!dendrite) return;
  state.cell.userData.layers.dendrites.remove(dendrite);
}

function setMode(mode) {
  state.mode = mode;
  controls.studentMode.classList.toggle("is-active", mode === "student");
  controls.teacherMode.classList.toggle("is-active", mode === "teacher");

  document.querySelectorAll(".teacher-only").forEach((element) => {
    element.hidden = mode !== "teacher";
  });
  document.querySelectorAll(".student-only").forEach((element) => {
    element.hidden = mode !== "student";
  });
}

function updateInfo() {
  const title = document.querySelector("#infoTitle");
  const body = document.querySelector("#infoBody");
  const topicNames = {
    anatomy: "Anatomía",
    connectivity: "Conectividad",
    function: "Función",
    clinic: "Clínica"
  };

  title.textContent = topicNames[state.activeTopic];
  body.textContent = scienceContent[state.cellKey][state.activeTopic];
  document.querySelectorAll(".info-tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.topic === state.activeTopic);
  });
}

function mountQuiz() {
  document.querySelector("#quizQuestion").textContent = quiz.question;
  const answerHost = document.querySelector("#quizAnswers");
  const feedback = document.querySelector("#quizFeedback");
  quiz.answers.forEach((answer) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = answer.text;
    button.addEventListener("click", () => {
      answerHost.querySelectorAll("button").forEach((item) => {
        item.classList.remove("is-correct", "is-wrong");
      });
      button.classList.add(answer.correct ? "is-correct" : "is-wrong");
      feedback.textContent = answer.correct
        ? "Correcto: las espinas dendríticas son sitios postsinápticos frecuentes."
        : "Revisa la diferencia entre prolongaciones dendríticas, axón y mielina.";
    });
    answerHost.appendChild(button);
  });
}

function addFunctionalInput(type) {
  const isInterneuron = state.cellKey === "multipolar";
  if (type === "excitation") {
    state.excitation = Math.min(1, state.excitation + 0.7);
    controls.activityStatus.textContent = isInterneuron
      ? "Activación SOM+: salida inhibitoria sobre compartimentos dendríticos."
      : "Entrada excitatoria: despolarización dendrítica esquemática.";
    if (state.excitation >= 0.7 && state.inhibition < 0.45) {
      triggerSpike();
    }
  } else {
    state.inhibition = Math.min(1, state.inhibition + 0.34);
    controls.activityStatus.textContent = isInterneuron
      ? "Freno local: reducción de la probabilidad de disparo interneuronal."
      : "Entrada inhibitoria: hiperpolarización o freno de integración.";
  }
}

function resetFunctionalState() {
  state.membranePotential = -70;
  state.excitation = 0;
  state.inhibition = 0;
  state.spikeTimer = 0;
  state.pulseProgress = 0;
  updatePotentialReadout();
}

function updateFunctionalState() {
  const isNeuron = cellTypes[state.cellKey].axon.length > 0;
  if (!isNeuron || !state.cell) return;

  state.excitation *= 0.982;
  state.inhibition *= 0.988;
  const targetPotential = -70 + state.excitation * 28 - state.inhibition * 18;
  state.membranePotential += (targetPotential - state.membranePotential) * 0.08;

  if (state.membranePotential >= -55 && state.spikeTimer <= 0) {
    triggerSpike();
  }

  if (state.spikeTimer > 0) {
    state.spikeTimer -= 0.018;
    state.pulseProgress = Math.min(1, state.pulseProgress + 0.018);
  }

  updatePotentialReadout();
  updateActivityMeshes();
}

function triggerSpike() {
  const isInterneuron = state.cellKey === "multipolar";
  state.spikeTimer = 1;
  state.pulseProgress = 0;
  state.membranePotential = Math.max(state.membranePotential, -54);
  state.excitation *= 0.28;
  controls.activityStatus.textContent = isInterneuron
    ? "Umbral alcanzado: descarga inhibitoria esquemática en varicosidades axonales."
    : "Umbral alcanzado: disparo axonal visual.";
}

function updatePotentialReadout() {
  const bounded = THREE.MathUtils.clamp(state.membranePotential, -80, -45);
  const percent = THREE.MathUtils.mapLinear(bounded, -80, -45, 4, 100);
  controls.potentialBar.style.width = `${percent}%`;
  controls.potentialValue.textContent = `${Math.round(state.membranePotential)} mV`;
}

function updateActivityMeshes() {
  const activity = state.cell.userData.activityElements;
  if (!activity) return;

  activity.synapses.forEach((site, index) => {
    const active = state.excitation > 0.08 || state.spikeTimer > 0;
    const signal = Math.max(state.excitation, state.spikeTimer);
    const phase = performance.now() * 0.004 + index;
    const scale = 0.8 + signal * 0.65 + (active ? Math.sin(phase) * 0.035 : 0);
    site.visible = active && controls.toggleActivity.checked;
    site.scale.setScalar(scale);
    site.material.emissiveIntensity = signal * 0.85;
    site.material.opacity = active ? 0.18 + signal * 0.42 : 0;
  });

  activity.boutons?.forEach((bouton, index) => {
    const phase = performance.now() * 0.006 + index * 0.7;
    const release = state.cellKey === "multipolar" ? Math.max(state.excitation, state.spikeTimer) : state.excitation;
    bouton.scale.setScalar(0.9 + release * 0.55 + Math.sin(phase) * 0.05);
    bouton.material.emissiveIntensity = 0.08 + release * 1.8;
    bouton.material.opacity = 0.52 + release * 0.38;
  });

  if (!activity.pulse) return;
  activity.pulse.visible = state.spikeTimer > 0 && controls.toggleActivity.checked;
  activity.pulse.material.opacity = Math.max(0, state.spikeTimer);
  if (activity.pulse.visible) {
    activity.pulse.position.copy(pointAlongPath(activity.pulse.userData.path, state.pulseProgress));
  }
}

function pointAlongPath(path, progress) {
  if (!path?.length) return new THREE.Vector3();
  const scaled = progress * (path.length - 1);
  const index = Math.min(path.length - 2, Math.floor(scaled));
  const local = scaled - index;
  return path[index].clone().lerp(path[index + 1], local);
}

function resetView() {
  camera.position.set(0, 1.2, 8.5);
  orbit.target.set(0, 0.35, 0);
  orbit.update();
}

function resize() {
  const { clientWidth, clientHeight } = sceneHost;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  root.rotation.y += 0.0012;
  updateFunctionalState();
  orbit.update();
  updateLabels();
  renderer.render(scene, camera);
}
