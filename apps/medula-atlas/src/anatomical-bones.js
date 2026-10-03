import * as THREE from 'three';

/** Mallas locales preparadas desde BodyParts3D. No se consulta un servidor externo. */
export async function loadAnatomicalBones() {
  const directory = new URL('../assets/models/', import.meta.url);
  const response = await fetch(new URL('manifest.json?v=4', directory));
  if (!response.ok) throw new Error('No se pudo cargar el manifiesto de las vértebras');
  const manifest = await response.json();
  const models = await Promise.all(manifest.models.map(async model => {
    const resource = await fetch(new URL(model.file, directory));
    if (!resource.ok) throw new Error(`No se pudo cargar ${model.id}`);
    const data = await resource.arrayBuffer();
    const header = new Uint32Array(data, 0, 5);
    const [vertices, indices, body, arch, spinous] = header;
    if (data.byteLength !== 20 + vertices * 12 + indices * 4 || body + arch + spinous !== indices) {
      throw new Error('Malla incompleta');
    }
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(data, 20, vertices * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(data, 20 + vertices * 12, indices), 1));
    let start = 0;
    [body, arch, spinous].forEach((count, materialIndex) => {
      geometry.addGroup(start, count, materialIndex);
      start += count;
    });
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    // Coordenadas de textura para un grano muy fino, sin dibujar tejido histológico.
    const uv = new Float32Array(vertices * 2);
    for (let i = 0; i < vertices; i++) {
      uv[i * 2] = positions[i * 3] * .8 + positions[i * 3 + 2] * .35;
      uv[i * 2 + 1] = positions[i * 3 + 1] * .8;
    }
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return { ...model, geometry };
  }));
  return { manifest, models };
}
