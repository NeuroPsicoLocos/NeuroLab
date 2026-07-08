import * as THREE from "three";
import { parseSwc } from "./swcParser.js";

const TAU = Math.PI * 2;

const organicMaterialOptions = {
  roughness: 0.78,
  metalness: 0.01,
  transparent: true,
  opacity: 0.84,
  clearcoat: 0.12,
  clearcoatRoughness: 0.86
};

export function createCellModel(config, options = {}) {
  if (config.reconstruction?.format === "SWC" && config.reconstruction.text) {
    return createSwcCellModel(config, options);
  }
  if (config.morphologyStyle === "microglia-surveillance") {
    return createMicrogliaModel(config, options);
  }

  const group = new THREE.Group();
  group.name = "cell-model";

  const layers = {
    soma: new THREE.Group(),
    dendrites: new THREE.Group(),
    spines: new THREE.Group(),
    axon: new THREE.Group(),
    activity: new THREE.Group(),
    context: new THREE.Group()
  };

  Object.values(layers).forEach((layer) => group.add(layer));

  const labelAnchors = [];
  const complexity = options.complexity ?? config.dendrites.length;
  const spineDensity = options.spineDensity ?? 0.55;
  const isNeuron = config.axon.length > 0;
  const isPyramidal = config.morphologyStyle === "pyramidal-realistic";

  const soma = createOrganicSoma(config, isPyramidal ? "pyramidal" : "round", 11);
  layers.soma.add(soma);
  labelAnchors.push({ key: "soma", text: "Soma", position: new THREE.Vector3(0, 0.95, 0) });

  const dendriteCount = Math.min(complexity, config.dendrites.length);
  config.dendrites.slice(0, dendriteCount).forEach((points, index) => {
    const branchColor = getBranchColor(config, index);
    const baseRadius = isPyramidal ? (index === 0 ? 0.12 : 0.095) : 0.082;
    const terminalRadius = isPyramidal ? 0.012 : 0.018;
    const organicPoints = organicizePath(points.map(toVector), index + 1, isPyramidal ? 0.11 : 0.08);

    const dendrite = createOrganicBranch(organicPoints, {
      color: branchColor,
      startRadius: baseRadius,
      endRadius: terminalRadius,
      seed: index + 17,
      radialSegments: 16,
      tubularSegments: isPyramidal ? 76 : 58,
      rootFlare: 1.95,
      membraneRelief: 0.055
    });
    dendrite.name = `organic-dendrite-${index + 1}`;
    layers.dendrites.add(dendrite);

    addOrganicCollaterals(organicPoints, layers.dendrites, branchColor, index, isPyramidal);
    addOrganicSpines(organicPoints, layers.spines, config.colors.spine, spineDensity, index, isPyramidal);
    addSynapticSites(organicPoints, layers.activity, config, index);
  });

  if (isNeuron) {
    const axonPoints = organicizePath(config.axon.map(toVector), 41, 0.055);
    const axon = createOrganicBranch(axonPoints, {
      color: config.colors.axon,
      startRadius: isPyramidal ? 0.065 : 0.058,
      endRadius: 0.026,
      seed: 53,
      radialSegments: 14,
      tubularSegments: 64,
      rootFlare: 1.65,
      membraneRelief: 0.035
    });
    axon.name = "organic-axon";
    layers.axon.add(axon);

    addAxonInitialSegment(axonPoints, layers.axon, config);
    addAxonPulse(axonPoints, layers.activity, config.colors.spike ?? config.colors.axon);
    labelAnchors.push({ key: "axon", text: config.layerLabels?.axon ?? "Axón", position: axonPoints.at(-1).clone() });
    if (isPyramidal) {
      labelAnchors.push({ key: "ais", text: "Segmento inicial", position: axonPoints[1].clone() });
    }
  }

  if (isPyramidal) {
    addAstrocyticProcess(layers.context, config);
    labelAnchors.push({ key: "apical", text: "Dendrita apical", position: toVector(config.dendrites[0]?.at(-1) ?? [0, 0, 0]) });
    labelAnchors.push({ key: "basal", text: "Dendritas basales", position: toVector(config.dendrites[3]?.at(-1) ?? [-2, -0.5, 0]) });
    labelAnchors.push({ key: "astro", text: "Proceso astrocítico", position: new THREE.Vector3(2.15, 1.1, 0.35) });
  } else {
    labelAnchors.push({ key: "dendrites", text: config.layerLabels?.branches ?? "Dendritas", position: toVector(config.dendrites[0]?.at(-1) ?? [0, 0, 0]) });
  }
  labelAnchors.push({ key: "spines", text: config.layerLabels?.spines ?? "Espinas", position: toVector(config.dendrites[1]?.at(-1) ?? [1, 1, 0]) });

  group.userData = { layers, labelAnchors, activityElements: collectActivityElements(layers.activity) };
  return group;
}

function createMicrogliaModel(config, options = {}) {
  const isActivated = options.microgliaState === "activated";
  const isDark = options.microgliaState === "dark";
  const renderConfig = isActivated
    ? {
        ...config,
        colors: {
          ...config.colors,
          soma: 0xc97848,
          dendrite: 0xd69352,
          spine: 0xf0b35c,
          excitation: 0xff8a4c
        }
      }
    : isDark
    ? {
        ...config,
        colors: {
          ...config.colors,
          soma: 0x3f3435,
          dendrite: 0x4f4841,
          spine: 0x8a7a54,
          excitation: 0x9b6f88
        }
      }
    : config;
  const group = new THREE.Group();
  group.name = isActivated ? "microglia-activated-model" : isDark ? "microglia-dark-model" : "microglia-surveillance-model";

  const layers = {
    soma: new THREE.Group(),
    dendrites: new THREE.Group(),
    spines: new THREE.Group(),
    axon: new THREE.Group(),
    activity: new THREE.Group(),
    context: new THREE.Group()
  };
  Object.values(layers).forEach((layer) => group.add(layer));

  const labelAnchors = [];
  const somaConfig = isActivated
    ? { ...renderConfig, somaScale: renderConfig.somaScale.map((value) => value * 1.42) }
    : isDark
    ? { ...renderConfig, somaScale: renderConfig.somaScale.map((value, index) => value * [0.92, 0.78, 0.9][index]) }
    : renderConfig;
  const soma = createOrganicSoma(somaConfig, isActivated ? "microgliaActivated" : isDark ? "microgliaDark" : "microglia", 133);
  layers.soma.add(soma);

  const baseProcesses = buildMicroglialProcesses(renderConfig, isActivated, isDark);
  const requestedComplexity = options.complexity ?? baseProcesses.length;
  const complexity = isActivated
    ? Math.min(baseProcesses.length, Math.max(5, Math.round(requestedComplexity * 0.55)))
    : isDark
    ? Math.min(baseProcesses.length, Math.max(9, requestedComplexity + 2))
    : Math.min(baseProcesses.length, Math.max(10, requestedComplexity + 4));
  const tipDensity = options.spineDensity ?? 0.55;
  baseProcesses.slice(0, complexity).forEach((path, index) => {
    const points = organicizePath(path.map(toVector), 160 + index, isActivated ? 0.12 : isDark ? 0.34 : 0.24);
    const process = createOrganicBranch(points, {
      color: renderConfig.colors.dendrite,
      startRadius: isActivated ? 0.03 : isDark ? 0.01 : 0.012,
      endRadius: isActivated ? 0.008 : isDark ? 0.0018 : 0.0024,
      seed: 180 + index,
      radialSegments: isActivated ? 11 : 8,
      tubularSegments: isActivated ? 46 : isDark ? 112 : 96,
      rootFlare: isActivated ? 1.18 : isDark ? 1.02 : 1.04,
      membraneRelief: isActivated ? 0.16 : isDark ? 0.22 : 0.12,
      opacity: isActivated ? 0.86 : isDark ? 0.88 : 0.78
    });
    process.name = `microglial-process-${index + 1}`;
    layers.dendrites.add(process);

    if (isActivated) {
      addSurveillanceTip(points.at(-1), layers.spines, renderConfig.colors.spine, 320 + index, 0.018);
    } else if (isDark) {
      addMicroglialRamules(points, layers.dendrites, layers.spines, renderConfig, index, tipDensity * 0.72);
      addSurveillanceTip(points.at(-1), layers.spines, renderConfig.colors.spine, 320 + index, 0.0065);
    } else {
      addMicroglialRamules(points, layers.dendrites, layers.spines, renderConfig, index, tipDensity);
      addMicroglialProximalSprouts(points, layers.dendrites, renderConfig, index);
      addSurveillanceTip(points.at(-1), layers.spines, renderConfig.colors.spine, 320 + index, 0.01);
    }
  });

  addMicroglialMotilitySignals(layers.activity, renderConfig);
  if (isActivated) addMicroglialInflammatoryHalo(layers.activity, renderConfig);
  if (isDark) addMicroglialDarkStressSignals(layers.activity, renderConfig);

  const firstTip = toVector(baseProcesses[0]?.at(-1) ?? [0, 0, 0]);
  if (isActivated) {
    labelAnchors.push({ key: "soma", text: "Soma ameboide", position: new THREE.Vector3(0.34, 0.72, 0.1) });
    labelAnchors.push({ key: "dendrites", text: "Procesos retraídos", position: new THREE.Vector3(-0.82, 1.02, 0.12) });
    labelAnchors.push({ key: "spines", text: "Señal inflamatoria", position: new THREE.Vector3(0.95, -0.34, 0.18) });
  } else if (isDark) {
    labelAnchors.push({ key: "soma", text: "Microglía dark", position: new THREE.Vector3(0.24, 0.62, 0.1) });
    labelAnchors.push({ key: "dendrites", text: "Procesos hiperfinos", position: firstTip.clone().add(new THREE.Vector3(-0.28, 0.22, 0)) });
    labelAnchors.push({ key: "spines", text: "Estrés perisináptico", position: new THREE.Vector3(0.86, -0.18, 0.22) });
  } else {
    labelAnchors.push({ key: "soma", text: "Soma microglial", position: new THREE.Vector3(0.2, 0.48, 0.12) });
    labelAnchors.push({ key: "dendrites", text: renderConfig.layerLabels?.branches ?? "Procesos", position: firstTip.clone().add(new THREE.Vector3(-0.35, 0.28, 0)) });
    labelAnchors.push({ key: "spines", text: renderConfig.layerLabels?.spines ?? "Puntas", position: toVector(baseProcesses[2]?.at(-1) ?? [1, -1, 0]).add(new THREE.Vector3(0.28, -0.16, 0)) });
  }

  group.userData = {
    layers,
    labelAnchors,
    activityElements: collectActivityElements(layers.activity, layers.spines)
  };
  return group;
}

function buildMicroglialProcesses(config, isActivated = false, isDark = false) {
  const generated = [];
  const count = isActivated ? 8 : isDark ? 11 : 12;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / 12) * TAU + (i % 2) * 0.16;
    const radius = isActivated
      ? 0.56 + pseudo(i, 37, 1) * 0.32
      : isDark
      ? 0.9 + pseudo(i, 37, 1) * 0.46
      : 1.18 + pseudo(i, 37, 1) * 0.56;
    const elevation = (pseudo(i, 37, 2) - 0.5) * (isActivated ? 0.45 : isDark ? 0.94 : 1.22);
    const zRadius = isActivated
      ? 0.48 + pseudo(i, 37, 3) * 0.28
      : isDark
      ? 0.78 + pseudo(i, 37, 3) * 0.42
      : 1.05 + pseudo(i, 37, 3) * 0.54;
    generated.push([
      [Math.cos(angle) * 0.16, elevation * 0.08, Math.sin(angle) * 0.14],
      [Math.cos(angle + 0.34) * radius * 0.36, elevation * 0.5 + Math.sin(angle) * 0.22, Math.sin(angle - 0.24) * zRadius * 0.36],
      [Math.cos(angle - 0.28) * radius * 0.7, elevation * 0.78, Math.sin(angle + 0.32) * zRadius * 0.7],
      [Math.cos(angle) * radius, elevation, Math.sin(angle) * zRadius]
    ]);
  }
  if (isActivated || isDark) return generated;
  return [...config.dendrites, ...generated];
}

function createSwcCellModel(config, options = {}) {
  const reconstruction = parseSwc(config.reconstruction.text);
  const group = new THREE.Group();
  group.name = "swc-cell-model";

  const layers = {
    soma: new THREE.Group(),
    dendrites: new THREE.Group(),
    spines: new THREE.Group(),
    axon: new THREE.Group(),
    activity: new THREE.Group(),
    context: new THREE.Group()
  };
  Object.values(layers).forEach((layer) => group.add(layer));

  const scale = 0.032;
  const labelAnchors = [];
  const isPyramidal = config.morphologyStyle === "pyramidal-realistic";
  const isPurkinje = config.morphologyStyle === "purkinje-realistic";
  const somaConfig = {
    ...config,
    somaScale: [
      Math.max(0.78, reconstruction.soma.radius * scale * 2.15),
      Math.max(0.95, reconstruction.soma.radius * scale * (isPyramidal || isPurkinje ? 2.55 : 2.1)),
      Math.max(0.72, reconstruction.soma.radius * scale * (isPurkinje ? 1.65 : 2.0))
    ]
  };

  const soma = createOrganicSoma(somaConfig, isPyramidal ? "pyramidal" : (isPurkinje ? "purkinje" : "round"), 31);
  layers.soma.add(soma);
  labelAnchors.push({ key: "soma", text: "Soma SWC", position: new THREE.Vector3(0, 0.95, 0) });

  const dendriticSections = reconstruction.sections.filter((section) => section.kind !== "axon" && section.swcType !== 1);
  const axonSections = reconstruction.sections.filter((section) => section.kind === "axon");
  const complexity = options.complexity ?? dendriticSections.length;
  const spineDensity = options.spineDensity ?? 0.55;
  const dendriticLimit = Math.min(
    dendriticSections.length,
    config.rendering?.maxDendriticSections ?? dendriticSections.length,
    Math.max(complexity * (config.rendering?.sectionMultiplier ?? 2), complexity * 2)
  );

  dendriticSections.slice(0, dendriticLimit).forEach((section, index) => {
    const points = swcSectionPoints(section, reconstruction.soma.center, scale, config, 18);
    if (points.length < 2) return;
    const color = getSwcDendriteColor(config, section);
    const startRadius = swcBranchRadius(section.nodes[0], scale, isPurkinje, true);
    const endRadius = swcBranchRadius(section.nodes.at(-1), scale, isPurkinje, false);
    const branch = createOrganicBranch(organicizePath(points, index + 200, isPurkinje ? 0.012 : 0.025), {
      color,
      startRadius,
      endRadius,
      seed: index + 211,
      radialSegments: isPurkinje ? 18 : 16,
      tubularSegments: Math.min(isPurkinje ? 112 : 96, Math.max(28, points.length * 10)),
      rootFlare: isPurkinje ? (index < 10 ? 1.08 : 1.02) : (index < 6 ? 1.85 : 1.25),
      membraneRelief: isPurkinje ? 0.035 : 0.05
    });
    branch.name = `swc-${section.kind}-${index + 1}`;
    branch.userData.swcType = section.swcType;
    layers.dendrites.add(branch);

    addOrganicSpines(points, layers.spines, config.colors.spine, spineDensity * spineMultiplier(section, isPyramidal, isPurkinje, config), index + 300, isPyramidal || isPurkinje, isPurkinje ? 0.38 : 1);
    addSynapticSites(points, layers.activity, config, index);
  });

  axonSections.slice(0, Math.max(8, complexity * 3)).forEach((section, index) => {
    const points = swcSectionPoints(section, reconstruction.soma.center, scale, config, 16);
    if (points.length < 2) return;
    const axon = createOrganicBranch(organicizePath(points, index + 500, 0.018), {
      color: config.colors.axon,
      startRadius: Math.max(0.026, section.nodes[0].radius * scale * 1.05),
      endRadius: Math.max(0.012, section.nodes.at(-1).radius * scale * 0.95),
      seed: index + 521,
      radialSegments: 14,
      tubularSegments: Math.min(84, Math.max(30, points.length * 8)),
      rootFlare: index === 0 ? 1.55 : 1.12,
      membraneRelief: 0.035
    });
    axon.name = `swc-axon-${index + 1}`;
    layers.axon.add(axon);

    if (index === 0) {
      addAxonInitialSegment(points.slice(0, 3), layers.axon, config);
      addAxonPulse(points, layers.activity, config.colors.spike ?? config.colors.axon);
      labelAnchors.push({ key: "axon", text: config.layerLabels?.axon ?? "Axón", position: points.at(-1).clone() });
      labelAnchors.push({ key: "ais", text: "Segmento inicial", position: points[Math.min(1, points.length - 1)].clone() });
    }

    if (!isPyramidal && index < 14) {
      addInhibitoryBoutons(points, layers.spines, config.colors.spine, index + 620);
    }
  });

  if (isPyramidal) {
    addAstrocyticProcess(layers.context, config);
    const apicalTip = findSectionTip(dendriticSections, "apical", reconstruction.soma.center, scale, config);
    const basalTip = findSectionTip(dendriticSections, "basal", reconstruction.soma.center, scale, config);
    labelAnchors.push({ key: "apical", text: "Dendrita apical SWC", position: apicalTip });
    labelAnchors.push({ key: "basal", text: "Dendritas basales SWC", position: basalTip });
    labelAnchors.push({ key: "spines", text: config.layerLabels?.spines ?? "Espinas", position: apicalTip.clone().lerp(new THREE.Vector3(0, 0, 0), 0.35) });
    labelAnchors.push({ key: "astro", text: "Proceso astrocítico", position: new THREE.Vector3(2.15, 1.1, 0.35) });
  } else if (isPurkinje) {
    const dendriteTip = findSectionTip(dendriticSections, null, reconstruction.soma.center, scale, config);
    labelAnchors.push({ key: "dendrites", text: "Árbol dendrítico planar SWC", position: dendriteTip });
    labelAnchors.push({ key: "spines", text: config.layerLabels?.spines ?? "Espinas dendríticas", position: dendriteTip.clone().lerp(new THREE.Vector3(0, 0.4, 0), 0.42) });
  } else {
    const dendriteTip = findSectionTip(dendriticSections, "dendrite", reconstruction.soma.center, scale, config);
    labelAnchors.push({ key: "dendrites", text: config.layerLabels?.branches ?? "Dendritas", position: dendriteTip });
    labelAnchors.push({ key: "spines", text: config.layerLabels?.spines ?? "Contactos", position: dendriteTip.clone().lerp(new THREE.Vector3(0, 0, 0), 0.35) });
  }

  group.userData = {
    layers,
    labelAnchors,
    activityElements: collectActivityElements(layers.activity, layers.spines),
    reconstruction: {
      ...config.reconstruction,
      stats: reconstruction.stats
    }
  };
  return group;
}

export function createEditableDendrite(index, color, spineColor, options = {}) {
  if (options.morphologyStyle === "purkinje-realistic") {
    return createEditablePurkinjeBranch(index, color, spineColor, options);
  }
  if (options.morphologyStyle === "microglia-surveillance") {
    return createEditableMicroglialProcess(index, color, spineColor, options);
  }

  const angle = index * 0.74;
  const end = new THREE.Vector3(
    Math.cos(angle) * (3.0 + (index % 3) * 0.35),
    Math.sin(angle) * 2.0,
    Math.sin(angle * 0.7) * 0.85
  );
  const points = organicizePath([
    new THREE.Vector3(0, 0.16, 0),
    end.clone().multiplyScalar(0.32),
    end.clone().multiplyScalar(0.68),
    end
  ], index + 101, 0.12);

  const group = new THREE.Group();
  group.name = "editable-organic-dendrite";
  group.add(createOrganicBranch(points, {
    color,
    startRadius: 0.082,
    endRadius: 0.014,
    seed: index + 113,
    rootFlare: 1.7,
    tubularSegments: 72,
    radialSegments: 16,
    membraneRelief: 0.045
  }));
  addOrganicSpines(points, group, spineColor, 0.45, index + 20, true);
  return group;
}

function createEditableMicroglialProcess(index, color, tipColor, options) {
  const group = new THREE.Group();
  group.name = "editable-microglial-process";
  const isActivated = options.microgliaState === "activated";
  const isDark = options.microgliaState === "dark";
  const addedIndex = Math.max(0, index - (options.baseDendriteCount ?? 0) - 1);
  const angle = addedIndex * 1.17 + 0.35;
  const elevation = Math.sin(addedIndex * 0.9) * (isActivated ? 0.24 : isDark ? 0.42 : 0.55);
  const radialReach = isActivated
    ? 0.62 + pseudo(index, 1, 1) * 0.28
    : isDark
    ? 1.0 + pseudo(index, 1, 1) * 0.44
    : 1.65 + pseudo(index, 1, 1) * 0.75;
  const depthReach = isActivated
    ? 0.54 + pseudo(index, 1, 2) * 0.22
    : isDark
    ? 0.86 + pseudo(index, 1, 2) * 0.38
    : 1.45 + pseudo(index, 1, 2) * 0.65;
  const terminal = new THREE.Vector3(
    Math.cos(angle) * radialReach,
    elevation,
    Math.sin(angle) * depthReach
  );
  const path = organicizePath([
    new THREE.Vector3(Math.cos(angle) * 0.22, elevation * 0.12, Math.sin(angle) * 0.2),
    terminal.clone().multiplyScalar(0.44).add(new THREE.Vector3(0, 0.22 * Math.cos(angle), 0)),
    terminal.clone().multiplyScalar(0.76),
    terminal
  ], 470 + index, isActivated ? 0.07 : isDark ? 0.24 : 0.14);

  group.add(createOrganicBranch(path, {
    color,
    startRadius: isActivated ? 0.04 : isDark ? 0.012 : 0.026,
    endRadius: isActivated ? 0.011 : isDark ? 0.002 : 0.004,
    seed: 490 + index,
    radialSegments: isActivated ? 11 : 9,
    tubularSegments: isActivated ? 38 : isDark ? 82 : 66,
    rootFlare: isActivated ? 1.18 : 1.1,
    membraneRelief: isActivated ? 0.13 : isDark ? 0.18 : 0.09,
    opacity: isActivated ? 0.86 : isDark ? 0.88 : 0.82
  }));
  if (!isActivated) {
    addMicroglialRamules(path, group, group, { colors: { dendrite: color, spine: tipColor } }, index + 19, isDark ? 0.35 : 0.55);
  }
  addSurveillanceTip(path.at(-1), group, tipColor, 510 + index, isActivated ? 0.013 : isDark ? 0.007 : 0.02);
  return group;
}

function createEditablePurkinjeBranch(index, color, spineColor, options) {
  const group = new THREE.Group();
  group.name = "editable-purkinje-planar-branch";
  const addedIndex = Math.max(0, index - (options.baseDendriteCount ?? 0) - 1);
  const side = addedIndex % 2 === 0 ? -1 : 1;
  const tier = Math.floor(addedIndex / 2);
  const lateral = side * (0.58 + tier * 0.22);
  const rootY = 1.55 + Math.min(0.5, tier * 0.16);
  const height = 2.38 + (tier % 3) * 0.28 + Math.min(0.35, tier * 0.07);
  const sweep = side * (1.0 + (tier % 4) * 0.18);
  const zPlane = side * 0.035;

  const trunk = organicizePath([
    new THREE.Vector3(lateral * 0.32, rootY, zPlane),
    new THREE.Vector3(lateral * 0.52, rootY + 0.28, zPlane * 0.7),
    new THREE.Vector3(lateral * 0.8, rootY + 0.54, -zPlane),
    new THREE.Vector3(sweep, height, zPlane * 0.35)
  ], index + 701, 0.055);

  group.add(createOrganicBranch(trunk, {
    color,
    startRadius: 0.032,
    endRadius: 0.0065,
    seed: index + 719,
    rootFlare: 1.08,
    tubularSegments: 92,
    radialSegments: 18,
    membraneRelief: 0.05
  }));

  const tip = trunk.at(-1);
  const branchAngles = [-0.34, 0.3];
  branchAngles.forEach((offset, branchIndex) => {
    const branchSide = side * (branchIndex === 0 ? 1 : -0.72);
    const terminal = new THREE.Vector3(
      tip.x + branchSide * (0.7 + tier * 0.08),
      tip.y + 0.36 + branchIndex * 0.16,
      tip.z + branchSide * 0.045
    );
    const childPoints = organicizePath([
      tip.clone().lerp(trunk[Math.max(0, trunk.length - 3)], 0.2),
      tip.clone().add(new THREE.Vector3(branchSide * 0.24, 0.18, offset * 0.06)),
      terminal
    ], index + branchIndex + 741, 0.045);

    group.add(createOrganicBranch(childPoints, {
      color,
      startRadius: 0.014,
      endRadius: 0.0045,
      seed: index + branchIndex + 751,
      rootFlare: 1.04,
      tubularSegments: 54,
      radialSegments: 14,
      membraneRelief: 0.045
    }));
    addOrganicSpines(childPoints, group, spineColor, 0.22, index + branchIndex + 780, true, 0.42);
  });

  addOrganicSpines(trunk, group, spineColor, 0.14, index + 760, true, 0.42);
  return group;
}

function createOrganicSoma(config, somaType, seed) {
  const latSegments = 36;
  const lonSegments = 56;
  const vertices = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const scale = new THREE.Vector3(...config.somaScale).multiplyScalar(0.62);

  for (let y = 0; y <= latSegments; y += 1) {
    const v = y / latSegments;
    const theta = v * Math.PI;
    for (let x = 0; x <= lonSegments; x += 1) {
      const u = x / lonSegments;
      const phi = u * TAU;
      const unit = new THREE.Vector3(
        Math.sin(theta) * Math.cos(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phi)
      );
      const directionalTaper = somaType === "pyramidal" || somaType === "purkinje" ? 1 + unit.y * 0.16 - Math.max(0, -unit.y) * 0.08 : 1;
      const basalFlare = somaType === "pyramidal" && unit.y < 0.15 ? 1 + (0.15 - unit.y) * 0.18 : 1;
      const relief =
        1 +
        fbm(unit.x * 2.8 + seed, unit.y * 3.1 - seed, unit.z * 2.6 + seed * 0.3) * (somaType === "microglia" || somaType === "microgliaActivated" || somaType === "microgliaDark" ? 0.13 : 0.075) +
        Math.sin(phi * 5 + theta * 3.2 + seed) * 0.018;
      const position = unit.clone().multiply(scale).multiplyScalar(directionalTaper * basalFlare * relief);
      if (somaType === "pyramidal") {
        position.y += Math.max(0, unit.y) * 0.1;
        position.x *= 1 + Math.max(0, -unit.y) * 0.22;
        position.z *= 1 + Math.max(0, -unit.y) * 0.14;
      } else if (somaType === "purkinje") {
        position.y += Math.max(0, unit.y) * 0.08 - Math.max(0, -unit.y) * 0.06;
        position.x *= 1 + Math.max(0, unit.y) * 0.1;
        position.z *= 0.86 + Math.max(0, -unit.y) * 0.08;
      } else if (somaType === "microglia" || somaType === "microgliaActivated" || somaType === "microgliaDark") {
        const activatedBulge = somaType === "microgliaActivated" ? 1.18 : somaType === "microgliaDark" ? 0.98 : 1;
        position.x *= activatedBulge * (1.14 + Math.sin(phi * 3 + seed) * 0.04);
        position.y *= (somaType === "microgliaActivated" ? 0.98 : somaType === "microgliaDark" ? 0.72 : 0.86) + Math.cos(phi * 2.2 + theta) * 0.035;
        position.z *= activatedBulge * (0.96 + Math.sin(theta * 4 + seed) * 0.045);
      }
      vertices.push(position.x, position.y, position.z);
      normals.push(unit.x, unit.y, unit.z);
      uvs.push(u, v);
    }
  }

  for (let y = 0; y < latSegments; y += 1) {
    for (let x = 0; x < lonSegments; x += 1) {
      const a = y * (lonSegments + 1) + x;
      const b = a + lonSegments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = createCellMaterial(config.colors.soma, 0.86, true);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "organic-soma";
  return mesh;
}

function createOrganicBranch(points, options) {
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.45);
  const tubularSegments = options.tubularSegments ?? 96;
  const radialSegments = options.radialSegments ?? 18;
  const frames = computeFrames(curve, tubularSegments);
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const seed = options.seed ?? 1;

  for (let i = 0; i <= tubularSegments; i += 1) {
    const t = i / tubularSegments;
    const center = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const normal = frames.normals[i];
    const binormal = frames.binormals[i];
    const taper = Math.pow(1 - t, 1.42);
    let baseRadius = THREE.MathUtils.lerp(options.endRadius, options.startRadius, taper);
    baseRadius *= 1 + Math.max(0, 1 - t * 7) * ((options.rootFlare ?? 1) - 1);
    baseRadius *= 1 + Math.sin(t * Math.PI * 5 + seed) * 0.035;

    for (let j = 0; j < radialSegments; j += 1) {
      const a = (j / radialSegments) * TAU;
      const radial = normal.clone().multiplyScalar(Math.cos(a)).add(binormal.clone().multiplyScalar(Math.sin(a))).normalize();
      const relief = 1 + membraneNoise(t, a, seed) * (options.membraneRelief ?? 0.04);
      const ovality = 1 + Math.sin(a * 2 + seed * 0.7 + t * 8) * 0.045;
      const radius = baseRadius * relief * ovality;
      const position = center.clone().add(radial.multiplyScalar(radius));
      positions.push(position.x, position.y, position.z);
      normals.push(radial.x, radial.y, radial.z);
      uvs.push(j / radialSegments, t);
    }
  }

  for (let i = 0; i < tubularSegments; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const a = i * radialSegments + j;
      const b = i * radialSegments + ((j + 1) % radialSegments);
      const c = (i + 1) * radialSegments + j;
      const d = (i + 1) * radialSegments + ((j + 1) % radialSegments);
      indices.push(a, c, b, b, c, d);
    }
  }

  capTube(indices, positions, normals, uvs, radialSegments, 0);
  capTube(indices, positions, normals, uvs, radialSegments, tubularSegments);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return new THREE.Mesh(geometry, createCellMaterial(options.color, options.opacity ?? 0.84));
}

function addOrganicCollaterals(points, target, color, seed, isPyramidal) {
  const count = isPyramidal ? 3 : 2;
  for (let i = 1; i < points.length - 1; i += 1) {
    if ((i + seed) % 2 !== 0) continue;
    for (let k = 0; k < count; k += 1) {
      const origin = points[i];
      const phase = seed * 1.37 + i * 0.91 + k * 2.1;
      const direction = new THREE.Vector3(
        Math.sin(phase) * 0.55,
        0.18 + Math.cos(phase * 0.7) * 0.22,
        Math.cos(phase) * 0.5
      ).normalize();
      const length = isPyramidal ? 0.58 + pseudo(seed, i, k) * 0.45 : 0.42 + pseudo(seed, i, k) * 0.28;
      const branch = organicizePath([
        origin.clone(),
        origin.clone().add(direction.clone().multiplyScalar(length * 0.48)),
        origin.clone().add(direction.clone().multiplyScalar(length))
      ], seed + i + k * 5, 0.055);
      target.add(createOrganicBranch(branch, {
        color,
        startRadius: 0.026,
        endRadius: 0.007,
        seed: seed + i * 3 + k,
        tubularSegments: 38,
        radialSegments: 12,
        rootFlare: 1.28,
        membraneRelief: 0.05
      }));
    }
  }
}

function addMicroglialRamules(points, processLayer, tipLayer, config, processIndex, density) {
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.45);
  const count = Math.max(4, Math.round(4 + density * 7));
  for (let i = 0; i < count; i += 1) {
    const t = 0.22 + (i / Math.max(1, count - 1)) * 0.58 + (pseudo(processIndex, i, 21) - 0.5) * 0.08;
    const origin = curve.getPointAt(THREE.MathUtils.clamp(t, 0.16, 0.9));
    const tangent = curve.getTangentAt(THREE.MathUtils.clamp(t, 0.16, 0.9)).normalize();
    const outward = arbitraryNormal(tangent).applyAxisAngle(tangent, pseudo(processIndex, i, 22) * TAU).normalize();
    const length = 0.2 + pseudo(processIndex, i, 23) * 0.32;
    const terminal = origin.clone()
      .add(outward.clone().multiplyScalar(length))
      .add(tangent.clone().multiplyScalar((pseudo(processIndex, i, 24) - 0.45) * 0.2));
    const ramule = organicizePath([
      origin,
      origin.clone().lerp(terminal, 0.52).add(outward.clone().multiplyScalar(0.05)),
      terminal
    ], 240 + processIndex * 17 + i, 0.045);

    processLayer.add(createOrganicBranch(ramule, {
      color: config.colors.dendrite,
      startRadius: 0.0065,
      endRadius: 0.0018,
      seed: 260 + processIndex * 19 + i,
      radialSegments: 8,
      tubularSegments: 34,
      rootFlare: 1.04,
      membraneRelief: 0.1,
      opacity: 0.72
    }));

    if (pseudo(processIndex, i, 25) > 0.28) {
      addSurveillanceTip(terminal, tipLayer, config.colors.spine, 360 + processIndex * 13 + i, 0.006 + pseudo(processIndex, i, 26) * 0.008);
    }
    if (pseudo(processIndex, i, 27) > 0.48) {
      addMicroglialTerminalTuft(terminal, outward, tangent, processLayer, tipLayer, config, processIndex * 31 + i);
    }
  }
}

function addMicroglialProximalSprouts(points, target, config, processIndex) {
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.45);
  for (let i = 0; i < 2; i += 1) {
    const t = 0.18 + i * 0.14 + pseudo(processIndex, i, 41) * 0.04;
    const origin = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const outward = arbitraryNormal(tangent).applyAxisAngle(tangent, pseudo(processIndex, i, 42) * TAU).normalize();
    const terminal = origin.clone()
      .add(outward.multiplyScalar(0.16 + pseudo(processIndex, i, 43) * 0.18))
      .add(tangent.clone().multiplyScalar(-0.04 + pseudo(processIndex, i, 44) * 0.1));
    const sprout = organicizePath([
      origin,
      origin.clone().lerp(terminal, 0.55),
      terminal
    ], 720 + processIndex * 5 + i, 0.025);
    target.add(createOrganicBranch(sprout, {
      color: config.colors.dendrite,
      startRadius: 0.0048,
      endRadius: 0.0016,
      seed: 740 + processIndex * 5 + i,
      radialSegments: 7,
      tubularSegments: 20,
      rootFlare: 1.02,
      membraneRelief: 0.1,
      opacity: 0.68
    }));
  }
}

function addMicroglialTerminalTuft(origin, outward, tangent, processLayer, tipLayer, config, seed) {
  for (let k = 0; k < 2; k += 1) {
    const direction = outward.clone()
      .applyAxisAngle(tangent, (k === 0 ? -0.42 : 0.42) + (pseudo(seed, k, 1) - 0.5) * 0.36)
      .normalize();
    const terminal = origin.clone()
      .add(direction.multiplyScalar(0.12 + pseudo(seed, k, 2) * 0.16))
      .add(tangent.clone().multiplyScalar((pseudo(seed, k, 3) - 0.5) * 0.08));
    const tuft = organicizePath([
      origin.clone(),
      origin.clone().lerp(terminal, 0.55),
      terminal
    ], 620 + seed + k, 0.022);
    processLayer.add(createOrganicBranch(tuft, {
      color: config.colors.dendrite,
      startRadius: 0.0035,
      endRadius: 0.0012,
      seed: 640 + seed + k,
      radialSegments: 7,
      tubularSegments: 18,
      rootFlare: 1.02,
      membraneRelief: 0.1,
      opacity: 0.68
    }));
    addSurveillanceTip(terminal, tipLayer, config.colors.spine, 660 + seed + k, 0.0055);
  }
}

function addSurveillanceTip(position, target, color, seed, radius) {
  const tip = createOrganicBlob(position, radius, color, seed, 10, 12);
  tip.name = "surveillance-tip";
  tip.material.opacity = 0.72;
  target.add(tip);
}

function addMicroglialMotilitySignals(target, config) {
  const color = config.colors.excitation ?? config.colors.spine;
  const sites = [
    new THREE.Vector3(-0.62, 0.22, 0.34),
    new THREE.Vector3(0.72, -0.18, -0.28),
    new THREE.Vector3(0.15, 0.68, 0.44)
  ];
  sites.forEach((position, index) => {
    const site = createOrganicBlob(position, 0.026, color, 410 + index, 9, 12);
    site.name = "synaptic-site";
    site.material.emissive = new THREE.Color(color);
    site.material.emissiveIntensity = 0;
    site.material.opacity = 0;
    site.visible = false;
    target.add(site);
  });
}

function addOrganicSpines(points, target, color, density, seed, isDetailed, sizeScale = 1) {
  if (density <= 0) return;
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.45);
  const spineCount = Math.round((isDetailed ? 34 : 20) * density);
  const material = createCellMaterial(color, 0.86);

  for (let i = 0; i < spineCount; i += 1) {
    const t = 0.12 + (i + pseudo(seed, i, 2) * 0.8) / spineCount * 0.82;
    const center = curve.getPointAt(Math.min(0.98, t));
    const tangent = curve.getTangentAt(Math.min(0.98, t)).normalize();
    const outward = arbitraryNormal(tangent).applyAxisAngle(tangent, pseudo(seed, i, 7) * TAU).normalize();
    const neckLength = (0.055 + pseudo(seed, i, 3) * (isDetailed ? 0.15 : 0.07)) * sizeScale;
    const headRadius = (0.014 + pseudo(seed, i, 4) * (isDetailed ? 0.045 : 0.02)) * sizeScale;
    const neckRadius = (0.005 + pseudo(seed, i, 5) * 0.006) * sizeScale;
    const curved = [
      center.clone().add(outward.clone().multiplyScalar(0.035 * sizeScale)),
      center.clone().add(outward.clone().multiplyScalar(neckLength * 0.68)).add(tangent.clone().multiplyScalar((pseudo(seed, i, 6) - 0.5) * 0.045)),
      center.clone().add(outward.clone().multiplyScalar(neckLength))
    ];
    const spine = new THREE.Group();
    spine.name = pseudo(seed, i, 8) > 0.42 ? "spine-mushroom" : "spine-thin";
    spine.add(createOrganicBranch(curved, {
      color,
      startRadius: neckRadius,
      endRadius: neckRadius * 0.72,
      seed: seed + i,
      tubularSegments: 12,
      radialSegments: 8,
      rootFlare: 1.08,
      membraneRelief: 0.08,
      opacity: 0.88
    }));
    spine.add(createOrganicBlob(curved.at(-1), headRadius, color, seed + i * 11, 14, 18));
    target.add(spine);
  }
}

function addSynapticSites(points, target, config, seed) {
  if (!config.colors.excitation || seed % 2 !== 0) return;
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.45);
  for (let i = 0; i < 2; i += 1) {
    const t = 0.35 + i * 0.19 + pseudo(seed, i, 1) * 0.06;
    const site = createOrganicBlob(curve.getPointAt(Math.min(0.96, t)), 0.026, config.colors.excitation, seed + i * 3, 10, 12);
    site.name = "synaptic-site";
    site.material.emissive = new THREE.Color(config.colors.excitation);
    site.material.emissiveIntensity = 0;
    site.material.opacity = 0;
    site.visible = false;
    target.add(site);
  }
}

function addAxonInitialSegment(points, target, config) {
  if (config.morphologyStyle !== "pyramidal-realistic" || points.length < 3) return;
  const segment = createOrganicBranch(points.slice(0, 3), {
    color: config.colors.axonInitial ?? config.colors.axon,
    startRadius: 0.078,
    endRadius: 0.045,
    seed: 71,
    tubularSegments: 46,
    radialSegments: 16,
    rootFlare: 1.5,
    membraneRelief: 0.06
  });
  segment.name = "axon-initial-segment";
  target.add(segment);
}

function addAstrocyticProcess(target, config) {
  const color = config.colors.astrocyteProcess ?? 0x93c6ad;
  const processes = [
    [new THREE.Vector3(1.1, 0.35, 0.35), new THREE.Vector3(1.62, 0.8, 0.38), new THREE.Vector3(2.12, 1.05, 0.35), new THREE.Vector3(2.62, 1.2, 0.28)],
    [new THREE.Vector3(-1.0, 0.22, -0.35), new THREE.Vector3(-1.45, 0.52, -0.42), new THREE.Vector3(-1.95, 0.68, -0.48)]
  ];
  processes.forEach((points, index) => {
    const organic = organicizePath(points, index + 90, 0.06);
    target.add(createOrganicBranch(organic, {
      color,
      startRadius: 0.04,
      endRadius: 0.013,
      seed: 80 + index,
      tubularSegments: 54,
      radialSegments: 12,
      rootFlare: 1.22,
      membraneRelief: 0.05,
      opacity: 0.46
    }));
  });
}

function addMicroglialInflammatoryHalo(target, config) {
  const color = config.colors.excitation ?? config.colors.spine;
  for (let i = 0; i < 14; i += 1) {
    const angle = (i / 14) * TAU;
    const radius = 0.38 + pseudo(i, 71, 1) * 0.28;
    const position = new THREE.Vector3(
      Math.cos(angle) * radius,
      (pseudo(i, 71, 2) - 0.5) * 0.24,
      Math.sin(angle) * radius * 0.76
    );
    const marker = createOrganicBlob(position, 0.006 + pseudo(i, 71, 3) * 0.006, color, 760 + i, 7, 8);
    marker.name = "inflammatory-signal";
    marker.material.emissive = new THREE.Color(color);
    marker.material.emissiveIntensity = 0.28;
    marker.material.opacity = 0.24;
    target.add(marker);
  }
}

function addMicroglialDarkStressSignals(target, config) {
  const color = config.colors.excitation ?? 0x9b6f88;
  for (let i = 0; i < 18; i += 1) {
    const angle = (i / 18) * TAU + pseudo(i, 83, 1) * 0.18;
    const radius = 0.24 + pseudo(i, 83, 2) * 0.62;
    const position = new THREE.Vector3(
      Math.cos(angle) * radius,
      (pseudo(i, 83, 3) - 0.5) * 0.48,
      Math.sin(angle) * radius * 0.84
    );
    const marker = createOrganicBlob(position, 0.004 + pseudo(i, 83, 4) * 0.004, color, 820 + i, 7, 8);
    marker.name = "dark-stress-signal";
    marker.material.emissive = new THREE.Color(color);
    marker.material.emissiveIntensity = 0.34;
    marker.material.opacity = 0.32;
    target.add(marker);
  }
}

function addAxonPulse(points, target, color) {
  const pulse = createOrganicBlob(points[0].clone(), 0.08, color, 231, 12, 16);
  pulse.name = "axon-pulse";
  pulse.userData.path = points.map((point) => point.clone());
  pulse.material.emissive = new THREE.Color(color);
  pulse.material.emissiveIntensity = 0.75;
  pulse.material.opacity = 0;
  pulse.visible = false;
  target.add(pulse);
}

function addInhibitoryBoutons(points, target, color, seed) {
  if (points.length < 3) return;
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.45);
  const boutonCount = Math.min(5, Math.max(2, Math.floor(points.length / 4)));
  for (let i = 0; i < boutonCount; i += 1) {
    const t = 0.16 + (i + pseudo(seed, i, 2) * 0.35) / boutonCount * 0.72;
    const center = curve.getPointAt(Math.min(0.96, t));
    const radius = 0.035 + pseudo(seed, i, 4) * 0.035;
    const bouton = createOrganicBlob(center, radius, color, seed + i * 17, 12, 16);
    bouton.name = "inhibitory-bouton";
    bouton.material.opacity = 0.76;
    bouton.material.emissive = new THREE.Color(color);
    bouton.material.emissiveIntensity = 0.08;
    target.add(bouton);
  }
}

function createOrganicBlob(center, radius, color, seed, latSegments = 18, lonSegments = 24) {
  const vertices = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let y = 0; y <= latSegments; y += 1) {
    const v = y / latSegments;
    const theta = v * Math.PI;
    for (let x = 0; x <= lonSegments; x += 1) {
      const u = x / lonSegments;
      const phi = u * TAU;
      const unit = new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi));
      const relief = 1 + fbm(unit.x * 2 + seed, unit.y * 2.4, unit.z * 2 - seed) * 0.18;
      const position = center.clone().add(unit.clone().multiplyScalar(radius * relief));
      vertices.push(position.x, position.y, position.z);
      normals.push(unit.x, unit.y, unit.z);
      uvs.push(u, v);
    }
  }

  for (let y = 0; y < latSegments; y += 1) {
    for (let x = 0; x < lonSegments; x += 1) {
      const a = y * (lonSegments + 1) + x;
      const b = a + lonSegments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, createCellMaterial(color, 0.82));
}

function createCellMaterial(color, opacity = 0.84, soma = false) {
  return new THREE.MeshPhysicalMaterial({
    color,
    ...organicMaterialOptions,
    opacity,
    transmission: soma ? 0.12 : 0.04,
    thickness: soma ? 0.8 : 0.28,
    clearcoat: soma ? 0.18 : 0.1,
    sheen: 0.2,
    sheenRoughness: 0.85
  });
}

function organicizePath(points, seed, amplitude) {
  return points.map((point, index) => {
    if (index === 0) return point.clone();
    const t = index / Math.max(1, points.length - 1);
    const offset = new THREE.Vector3(
      (pseudo(seed, index, 1) - 0.5) * amplitude,
      Math.sin(seed * 0.7 + index * 1.3) * amplitude * 0.45,
      (pseudo(seed, index, 2) - 0.5) * amplitude
    ).multiplyScalar(0.35 + t);
    return point.clone().add(offset);
  });
}

function computeFrames(curve, segments) {
  const tangents = [];
  const normals = [];
  const binormals = [];
  let normal = new THREE.Vector3(0, 0, 1);

  for (let i = 0; i <= segments; i += 1) {
    const tangent = curve.getTangentAt(i / segments).normalize();
    if (Math.abs(tangent.dot(normal)) > 0.92) normal = new THREE.Vector3(1, 0, 0);
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();
    tangents.push(tangent);
    normals.push(normal.clone());
    binormals.push(binormal.clone());
  }

  return { tangents, normals, binormals };
}

function capTube(indices, positions, normals, uvs, radialSegments, ringIndex) {
  const centerIndex = positions.length / 3;
  const base = ringIndex * radialSegments;
  const center = new THREE.Vector3();
  for (let j = 0; j < radialSegments; j += 1) {
    center.x += positions[(base + j) * 3];
    center.y += positions[(base + j) * 3 + 1];
    center.z += positions[(base + j) * 3 + 2];
  }
  center.multiplyScalar(1 / radialSegments);
  positions.push(center.x, center.y, center.z);
  normals.push(0, ringIndex === 0 ? -1 : 1, 0);
  uvs.push(0.5, 0.5);

  for (let j = 0; j < radialSegments; j += 1) {
    const a = base + j;
    const b = base + ((j + 1) % radialSegments);
    if (ringIndex === 0) indices.push(centerIndex, b, a);
    else indices.push(centerIndex, a, b);
  }
}

function membraneNoise(t, angle, seed) {
  return (
    Math.sin(t * 42 + angle * 3.1 + seed) * 0.45 +
    Math.sin(t * 19 - angle * 5.3 + seed * 1.7) * 0.28 +
    (pseudo(seed, Math.floor(t * 80), Math.floor(angle * 10)) - 0.5) * 0.54
  );
}

function fbm(x, y, z) {
  return (
    Math.sin(x * 1.7 + y * 2.1 + z * 1.3) * 0.5 +
    Math.sin(x * 3.4 - y * 1.2 + z * 2.8) * 0.3 +
    Math.sin(x * 6.1 + y * 5.2 - z * 2.4) * 0.2
  );
}

function pseudo(a, b, c) {
  const value = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453123;
  return value - Math.floor(value);
}

function arbitraryNormal(tangent) {
  const reference = Math.abs(tangent.y) < 0.85 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  return new THREE.Vector3().crossVectors(tangent, reference).normalize();
}

function getBranchColor(config, index) {
  if (config.morphologyStyle !== "pyramidal-realistic") return config.colors.dendrite;
  if (index <= 2) return config.colors.apical ?? config.colors.dendrite;
  return config.colors.basal ?? config.colors.dendrite;
}

function swcNodeToVector(node, center, scale, config = null) {
  const vector = new THREE.Vector3(
    (node.x - center.x) * scale,
    (node.y - center.y) * scale,
    (node.z - center.z) * scale
  );
  return transformSwcVector(vector, config);
}

function transformSwcVector(vector, config) {
  const transform = config?.rendering?.transform;
  if (!transform) return vector;
  vector.x *= transform.xScale ?? 1;
  vector.y = vector.y * (transform.yScale ?? 1) + (transform.yOffset ?? 0);
  vector.z *= transform.zScale ?? 1;
  return vector;
}

function swcSectionPoints(section, center, scale, config, maxPoints) {
  const points = section.nodes.map((node) => swcNodeToVector(node, center, scale, config));
  return resamplePoints(points, maxPoints);
}

function swcBranchRadius(node, scale, isPurkinje, isStart) {
  const radius = node.radius * scale * (isStart ? 1.4 : 1.2);
  if (!isPurkinje) return Math.max(isStart ? 0.018 : 0.006, radius);
  const lower = isStart ? 0.018 : 0.0055;
  const upper = isStart ? 0.064 : 0.018;
  return THREE.MathUtils.clamp(radius, lower, upper);
}

function getSwcDendriteColor(config, section) {
  if (config.morphologyStyle === "purkinje-realistic") return config.colors.dendrite;
  if (config.morphologyStyle !== "pyramidal-realistic") return config.colors.dendrite;
  return section.kind === "apical" ? (config.colors.apical ?? config.colors.dendrite) : (config.colors.basal ?? config.colors.dendrite);
}

function spineMultiplier(section, isPyramidal, isPurkinje, config) {
  if (isPurkinje) return config.rendering?.spineMultiplier ?? 1.2;
  if (!isPyramidal) return 0.34;
  if (section.kind === "axon") return 0;
  if (section.kind === "apical") return 1.1;
  if (section.kind === "basal") return 0.86;
  return 0.7;
}

function findSectionTip(sections, kind, center, scale, config = null) {
  const matching = kind ? sections.filter((section) => section.kind === kind) : [];
  const candidates = matching.length ? matching : sections;
  const selected = candidates
    .slice()
    .sort((a, b) => sectionTipDistance(b, center, scale, config) - sectionTipDistance(a, center, scale, config))[0];
  if (!selected) return new THREE.Vector3();
  return swcNodeToVector(selected.nodes.at(-1), center, scale, config);
}

function sectionTipDistance(section, center, scale, config) {
  const tip = swcNodeToVector(section.nodes.at(-1), center, scale, config);
  return tip.length() + section.nodes.length * 0.002;
}

function resamplePoints(points, maxPoints) {
  if (points.length <= maxPoints) return points;
  const sampled = [];
  for (let i = 0; i < maxPoints; i += 1) {
    const sourceIndex = Math.round((i / (maxPoints - 1)) * (points.length - 1));
    sampled.push(points[sourceIndex]);
  }
  return sampled;
}

function collectActivityElements(activityLayer, synapticLayer = null) {
  const synapses = [];
  const boutons = [];
  let pulse = null;
  [activityLayer, synapticLayer].filter(Boolean).forEach((layer) => layer.traverse((child) => {
    if (child.name === "synaptic-site") synapses.push(child);
    if (child.name === "inhibitory-bouton") boutons.push(child);
    if (child.name === "axon-pulse") pulse = child;
  }));
  return { synapses, boutons, pulse };
}

function toVector(point) {
  return new THREE.Vector3(point[0], point[1], point[2]);
}
