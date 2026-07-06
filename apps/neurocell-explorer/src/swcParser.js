const SWC_TYPE = {
  soma: 1,
  axon: 2,
  basal: 3,
  apical: 4
};

export function parseSwc(text) {
  const nodes = new Map();
  const children = new Map();

  text.split(/\r?\n/).forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) return;
    const columns = line.split(/\s+/).map(Number);
    if (columns.length < 7 || columns.some(Number.isNaN)) {
      throw new Error(`Linea SWC invalida ${lineIndex + 1}: ${rawLine}`);
    }

    const [id, type, x, y, z, radius, parent] = columns;
    nodes.set(id, { id, type, x, y, z, radius, parent });
    if (!children.has(id)) children.set(id, []);
    if (parent !== -1) {
      if (!children.has(parent)) children.set(parent, []);
      children.get(parent).push(id);
    }
  });

  if (nodes.size === 0) {
    throw new Error("El archivo SWC no contiene nodos validos.");
  }

  const somaNodes = [...nodes.values()].filter((node) => node.type === SWC_TYPE.soma);
  const soma = summarizeSoma(somaNodes.length ? somaNodes : [...nodes.values()].slice(0, 1));
  const sections = extractSections(nodes, children);

  return {
    soma,
    sections,
    stats: {
      nodes: nodes.size,
      sections: sections.length,
      dendrites: sections.filter((section) => section.kind !== "axon").length,
      axon: sections.filter((section) => section.kind === "axon").length
    }
  };
}

function summarizeSoma(nodes) {
  const center = nodes.reduce((sum, node) => {
    sum.x += node.x;
    sum.y += node.y;
    sum.z += node.z;
    return sum;
  }, { x: 0, y: 0, z: 0 });
  center.x /= nodes.length;
  center.y /= nodes.length;
  center.z /= nodes.length;

  const radius = nodes.reduce((sum, node) => sum + Math.max(node.radius, 1), 0) / nodes.length;
  return { center, radius };
}

function extractSections(nodes, children) {
  const sections = [];
  const roots = [...nodes.values()].filter((node) => node.parent === -1 || !nodes.has(node.parent));

  roots.forEach((root) => {
    const firstChildren = children.get(root.id) ?? [];
    firstChildren.forEach((childId) => walkSection(root.id, childId, nodes, children, sections));
  });

  return sections.filter((section) => section.nodes.length >= 2);
}

function walkSection(parentId, startId, nodes, children, sections) {
  const sectionNodes = [nodes.get(parentId)];
  let current = nodes.get(startId);
  let previousType = current.type;

  while (current) {
    sectionNodes.push(current);
    const nextChildren = children.get(current.id) ?? [];
    const isBranchPoint = nextChildren.length !== 1;
    const typeChanges = nextChildren.length === 1 && nodes.get(nextChildren[0])?.type !== previousType;

    if (isBranchPoint || typeChanges) {
      sections.push({
        kind: sectionKind(previousType),
        swcType: previousType,
        nodes: sectionNodes.slice()
      });
      nextChildren.forEach((childId) => walkSection(current.id, childId, nodes, children, sections));
      return;
    }

    previousType = current.type;
    current = nodes.get(nextChildren[0]);
  }
}

function sectionKind(type) {
  if (type === SWC_TYPE.axon) return "axon";
  if (type === SWC_TYPE.apical) return "apical";
  if (type === SWC_TYPE.basal) return "basal";
  return "dendrite";
}

