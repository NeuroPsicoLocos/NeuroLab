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
    const startRadius = Math.max(0.018, section.nodes[0].radius * scale * 1.4);
    const endRadius = Math.max(0.006, section.nodes.at(-1).radius * scale * 1.2);
    const branch = createOrganicBranch(organicizePath(points, index + 200, 0.025), {
      color,
      startRadius,
      endRadius,
      seed: index + 211,
      radialSegments: 16,
      tubularSegments: Math.min(96, Math.max(28, points.length * 10)),
      rootFlare: index < 6 ? 1.85 : 1.25,
      membraneRelief: 0.05
    });
    branch.name = `swc-${section.kind}-${index + 1}`;
    branch.userData.swcType = section.swcType;
    layers.dendrites.add(branch);

    addOrganicSpines(points, layers.spines, config.colors.spine, spineDensity * spineMultiplier(section, isPyramidal, isPurkinje, config), index + 300, isPyramidal || isPurkinje);
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

export function createEditableDendrite(index, color, spineColor) {
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
        fbm(unit.x * 2.8 + seed, unit.y * 3.1 - seed, unit.z * 2.6 + seed * 0.3) * 0.075 +
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

function addOrganicSpines(points, target, color, density, seed, isDetailed) {
  if (density <= 0) return;
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.45);
  const spineCount = Math.round((isDetailed ? 34 : 20) * density);
  const material = createCellMaterial(color, 0.86);

  for (let i = 0; i < spineCount; i += 1) {
    const t = 0.12 + (i + pseudo(seed, i, 2) * 0.8) / spineCount * 0.82;
    const center = curve.getPointAt(Math.min(0.98, t));
    const tangent = curve.getTangentAt(Math.min(0.98, t)).normalize();
    const outward = arbitraryNormal(tangent).applyAxisAngle(tangent, pseudo(seed, i, 7) * TAU).normalize();
    const neckLength = 0.055 + pseudo(seed, i, 3) * (isDetailed ? 0.15 : 0.07);
    const headRadius = 0.014 + pseudo(seed, i, 4) * (isDetailed ? 0.045 : 0.02);
    const neckRadius = 0.005 + pseudo(seed, i, 5) * 0.006;
    const curved = [
      center.clone().add(outward.clone().multiplyScalar(0.035)),
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
