import * as THREE from 'three';

export type FaceType = 'pentagon' | 'hexagon';

export type FootballFace = {
  id: number;
  type: FaceType;
  points: THREE.Vector3[];
  centroid: THREE.Vector3;
  normal: THREE.Vector3;
  uAxis: THREE.Vector3;
  vAxis: THREE.Vector3;
};

const PHI = (1 + Math.sqrt(5)) / 2;

const ICO_VERTS: THREE.Vector3[] = [
  [-1, PHI, 0],
  [1, PHI, 0],
  [-1, -PHI, 0],
  [1, -PHI, 0],
  [0, -1, PHI],
  [0, 1, PHI],
  [0, -1, -PHI],
  [0, 1, -PHI],
  [PHI, 0, -1],
  [PHI, 0, 1],
  [-PHI, 0, -1],
  [-PHI, 0, 1],
].map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize());

const ICO_FACES: number[][] = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
];

function nearPoint(a: THREE.Vector3, b: THREE.Vector3): THREE.Vector3 {
  return a.clone().lerp(b, 1 / 3);
}

export function buildFootballFaces(radius = 1): FootballFace[] {
  const edgeSet = new Set<string>();

  ICO_FACES.forEach((face) => {
    for (let i = 0; i < 3; i += 1) {
      const a = face[i];
      const b = face[(i + 1) % 3];
      edgeSet.add(JSON.stringify([Math.min(a, b), Math.max(a, b)]));
    }
  });

  const vertexNeighbors = Array.from({ length: 12 }, () => new Set<number>());

  edgeSet.forEach((key) => {
    const [a, b] = JSON.parse(key) as [number, number];
    vertexNeighbors[a].add(b);
    vertexNeighbors[b].add(a);
  });

  const rawFaces: Array<{
    type: FaceType;
    points: THREE.Vector3[];
  }> = [];

  ICO_FACES.forEach((face) => {
    const [v0, v1, v2] = face.map((index) => ICO_VERTS[index]);

    const points = [
      nearPoint(v0, v1),
      nearPoint(v1, v0),
      nearPoint(v1, v2),
      nearPoint(v2, v1),
      nearPoint(v2, v0),
      nearPoint(v0, v2),
    ];

    rawFaces.push({ type: 'hexagon', points });
  });

  for (let vertex = 0; vertex < 12; vertex += 1) {
    const center = ICO_VERTS[vertex];
    const axis = center.clone().normalize();
    const neighbours = Array.from(vertexNeighbors[vertex]);
    const points = neighbours.map((neighbour) =>
      nearPoint(center, ICO_VERTS[neighbour]),
    );

    const reference = points[0]
      .clone()
      .sub(center)
      .addScaledVector(axis, -points[0].clone().sub(center).dot(axis))
      .normalize();
    const u = reference;
    const w = axis.clone().cross(u);

    const angleOf = (point: THREE.Vector3): number => {
      const direction = point
        .clone()
        .sub(center)
        .addScaledVector(
          axis,
          -point.clone().sub(center).dot(axis),
        );

      return Math.atan2(direction.dot(w), direction.dot(u));
    };

    const order = points
      .map((_, index) => index)
      .sort((a, b) => angleOf(points[a]) - angleOf(points[b]));

    rawFaces.push({
      type: 'pentagon',
      points: order.map((index) => points[index]),
    });
  }

  const WORLD_UP = new THREE.Vector3(0, 1, 0);

  return rawFaces.map((face, id): FootballFace => {
    const centroid = face.points
      .reduce(
        (accumulator, point) => accumulator.add(point),
        new THREE.Vector3(),
      )
      .divideScalar(face.points.length);

    const normal = centroid.clone().normalize();

    let vAxis = WORLD_UP.clone().addScaledVector(
      normal,
      -normal.dot(WORLD_UP),
    );

    if (vAxis.lengthSq() < 1e-6) {
      vAxis = new THREE.Vector3(0, 0, 1);
    }

    vAxis.normalize();
    const uAxis = vAxis.clone().cross(normal).normalize();

    return {
      id,
      type: face.type,
      points: face.points.map((point) => point.clone().multiplyScalar(radius)),
      centroid: centroid.clone().multiplyScalar(radius),
      normal,
      uAxis,
      vAxis,
    };
  });
}

export function buildEdgeNeighbors(
  faces: FootballFace[],
): number[][] {
  const key = (point: THREE.Vector3): string =>
    `${point.x.toFixed(4)},${point.y.toFixed(4)},${point.z.toFixed(4)}`;

  const edgeMap = new Map<
    string,
    Array<{ faceId: number; edgeIndex: number }>
  >();

  faces.forEach((face) => {
    const n = face.points.length;

    for (let i = 0; i < n; i += 1) {
      const a = key(face.points[i]);
      const b = key(face.points[(i + 1) % n]);
      const edgeKey = a < b ? `${a}|${b}` : `${b}|${a}`;

      if (!edgeMap.has(edgeKey)) edgeMap.set(edgeKey, []);
      edgeMap.get(edgeKey)!.push({ faceId: face.id, edgeIndex: i });
    }
  });

  const result = faces.map((face) =>
    new Array<number | null>(face.points.length).fill(null),
  );

  edgeMap.forEach((entries) => {
    if (entries.length !== 2) return;

    const [first, second] = entries;
    result[first.faceId][first.edgeIndex] = second.faceId;
    result[second.faceId][second.edgeIndex] = first.faceId;
  });

  return result.map((faceNeighbours) =>
    faceNeighbours.map((id) => id ?? -1),
  );
}

export function faceToGeometry(face: FootballFace): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const { points, centroid, normal } = face;

  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];

    [centroid, a, b].forEach((point) => {
      positions.push(point.x, point.y, point.z);
      normals.push(normal.x, normal.y, normal.z);
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute(
    'normal',
    new THREE.Float32BufferAttribute(normals, 3),
  );
  geometry.computeBoundingSphere();

  return geometry;
}