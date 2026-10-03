"""Prepara las mallas BodyParts3D locales (Python estándar, sin instalar paquetes).

Los STL originales se conservan. Se aplica una subdivisión Loop suave y una
rotación/escala uniforme para el visor. El archivo binario guarda vértices e
índices; sus tres grupos permiten seleccionar cuerpo, arco y apófisis espinosa.
"""
from pathlib import Path
import hashlib
import json
import math
import struct

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = (-0.784, -45.056, 1328.0)
SCALE = 0.07
MODELS = [
    ('t2', 'FJ3160', 'FMA9187', -54.005, 'Second'),
    ('t3', 'FJ3163', 'FMA9209', -45.056, 'Third'),
    ('t4', 'FJ3166', 'FMA9248', -38.016, 'Fourth'),
]


def read_stl(path):
    raw = path.read_bytes()
    count = struct.unpack_from('<I', raw, 80)[0]
    assert len(raw) == 84 + 50 * count, 'STL binario incompleto'
    points, faces, lookup = [], [], {}
    for number in range(count):
        values = struct.unpack_from('<12f', raw, 84 + number * 50)
        face = []
        for offset in (3, 6, 9):
            point = tuple(values[offset:offset + 3])
            key = tuple(round(value, 5) for value in point)
            if key not in lookup:
                lookup[key] = len(points)
                points.append(point)
            face.append(lookup[key])
        faces.append(tuple(face))
    return raw, points, faces


def subdivide(points, faces):
    neighbors = [set() for _ in points]
    edges = {}
    for a, b, c in faces:
        for i, j, opposite in ((a, b, c), (b, c, a), (c, a, b)):
            neighbors[i].add(j)
            neighbors[j].add(i)
            edges.setdefault(tuple(sorted((i, j))), []).append(opposite)
    assert all(len(adjacent) == 2 for adjacent in edges.values()), 'La superficie debe estar cerrada'
    refined = []
    for i, point in enumerate(points):
        ring = neighbors[i]
        n = len(ring)
        beta = (5 / 8 - (3 / 8 + math.cos(2 * math.pi / n) / 4) ** 2) / n
        refined.append(tuple((1 - n * beta) * point[k] + beta * sum(points[j][k] for j in ring) for k in range(3)))
    midpoints = {}
    for (a, b), (c, d) in edges.items():
        midpoints[(a, b)] = len(refined)
        refined.append(tuple(3 / 8 * (points[a][k] + points[b][k]) + 1 / 8 * (points[c][k] + points[d][k]) for k in range(3)))
    triangles = []
    for a, b, c in faces:
        ab, bc, ca = (midpoints[tuple(sorted(edge))] for edge in ((a, b), (b, c), (c, a)))
        triangles.extend(((a, ab, ca), (b, bc, ab), (c, ca, bc), (ab, bc, ca)))
    return refined, triangles


def transform(point):
    x, y, z = point
    return ((x - ORIGIN[0]) * SCALE, (z - ORIGIN[2]) * SCALE, -(y - ORIGIN[1]) * SCALE)


def endplates(raw, foramen_y):
    """Estima planos de los platillos centrales para ubicar discos esquemáticos."""
    count = struct.unpack_from('<I', raw, 80)[0]
    rows = []
    for number in range(count):
        values = struct.unpack_from('<12f', raw, 84 + number * 50)
        vertices = [values[3:6], values[6:9], values[9:12]]
        point = tuple(sum(vertex[axis] for vertex in vertices) / 3 for axis in range(3))
        if abs(point[0]) < 13 and point[1] < foramen_y - 8:
            rows.append((point, values[:3]))
    middle = (min(p[2] for p, _ in rows) + max(p[2] for p, _ in rows)) / 2
    result = {}
    for name, sign in [('topEndplate', 1), ('bottomEndplate', -1)]:
        selected = [(p, n) for p, n in rows if sign * n[2] > .72 and sign * (p[2] - middle) > 0]
        point = tuple(sum(p[axis] for p, _ in selected) / len(selected) for axis in range(3))
        normal = tuple(sign * sum(n[axis] for _, n in selected) / len(selected) for axis in range(3))
        result[name] = {'point': transform(point), 'normal': (normal[0], normal[2], -normal[1])}
    return result


manifest = {
    'dataset': 'BodyParts3D / Anatomography 4.3',
    'author': 'Database Center for Life Science (DBCLS)',
    'source': 'https://lifesciencedb.jp/bp3d/info_en/index.html',
    'license': 'CC BY-SA 2.1 Japan',
    'licenseURL': 'https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en',
    'changes': 'Una subdivisión Loop, normales suaves, rotación de ejes y escala uniforme. Grupos de selección aproximados.',
    'binaryFormat': 'Cinco uint32 LE: vértices, índices y número de índices de cuerpo/arco/espinosa. Después posiciones float32 xyz e índices uint32.',
    'nativeOrigin': ORIGIN, 'scale': SCALE, 'models': [],
    'limits': 'Mallas de atlas anatómico, no reconstrucción clínica de un paciente. Médula, canal, discos y selección regional son esquemáticos.'
}
for label, component, fma, foramen_y, ordinal in MODELS:
    raw, original, faces = read_stl(ROOT / 'assets/models/source' / f'{label}.stl')
    points, refined_faces = subdivide(original, faces)
    groups = [[], [], []]
    for face in refined_faces:
        x, y, z = (sum(points[i][axis] for i in face) / 3 for axis in range(3))
        region = 0 if y < foramen_y - 5 and abs(x) < 18 else (2 if y > foramen_y + 14 and abs(x) < 11 else 1)
        groups[region].extend(face)
    indices = sum(groups, [])
    positions = [value for point in points for value in transform(point)]
    output = ROOT / 'assets/models' / f'{label}.bin'
    output.write_bytes(struct.pack('<5I', len(points), len(indices), *(len(group) for group in groups)) + struct.pack(f'<{len(positions)}f', *positions) + struct.pack(f'<{len(indices)}I', *indices))
    body = [p for p in original if p[1] < foramen_y - 7]
    body_z_min, body_z_max = min(p[2] for p in body), max(p[2] for p in body)
    center_z = (body_z_min + body_z_max) / 2
    center_body_y = (min(p[1] for p in body) + max(p[1] for p in body)) / 2
    manifest['models'].append({
        'id': label, 'component': component, 'fma': fma, 'file': f'{label}.bin',
        'sourceFile': f'source/{label}.stl',
        'mirror': f'https://commons.wikimedia.org/wiki/File:BodyParts3D_{component}_{ordinal}_thoracic_vertebra.stl',
        'sourceSHA1': hashlib.sha1(raw).hexdigest(), 'preparedSHA256': hashlib.sha256(output.read_bytes()).hexdigest(),
        'sourceTriangles': len(faces), 'triangles': len(refined_faces), 'vertices': len(points),
        'foramenCenter': transform((-0.784, foramen_y, center_z)),
        'bodyCenter': transform((0, center_body_y, center_z)),
        'bodyBottom': (body_z_min - ORIGIN[2]) * SCALE,
        'bodyTop': (body_z_max - ORIGIN[2]) * SCALE,
        **endplates(raw, foramen_y),
    })
(ROOT / 'assets/models/manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'models': [{'id': m['id'], 'triangles': m['triangles'], 'foramenCenter': m['foramenCenter'], 'bodyCenter': m['bodyCenter']} for m in manifest['models']]}, indent=2))
