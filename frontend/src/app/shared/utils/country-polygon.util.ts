import * as THREE from 'three';
import earcut from 'earcut';
import {
  CountryFeature,
  CountryFeatureProperties,
  GeoMultiPolygon,
  GeoPolygon,
  GeoRing
} from '../models/geo-feature.model';

export interface CountryMeshUserData extends CountryFeatureProperties {
  readonly isCountryPolygon: true;
}

export interface BuildOptions {
  readonly radius?: number;
  readonly color?: THREE.ColorRepresentation;
  readonly opacity?: number;
}

const DEFAULT_RADIUS = 1.001;
const DEFAULT_COLOR = 0x1f6fa6;
const DEFAULT_OPACITY = 0.18;

export function buildCountryMesh(feature: CountryFeature, opts: BuildOptions = {}): THREE.Mesh | null {
  const radius = opts.radius ?? DEFAULT_RADIUS;
  const polygons = extractPolygons(feature);
  if (polygons.length === 0) return null;

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  for (const polygon of polygons) {
    const triangulated = triangulatePolygon(polygon);
    if (!triangulated) continue;

    for (const [lng, lat] of triangulated.ringVertices) {
      const v = latLngToVector3(lat, lng, radius);
      positions.push(v.x, v.y, v.z);
      const n = v.clone().normalize();
      normals.push(n.x, n.y, n.z);
    }
    for (const idx of triangulated.indices) {
      indices.push(idx + vertexOffset);
    }
    vertexOffset += triangulated.ringVertices.length;
  }

  if (positions.length === 0 || indices.length === 0) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);

  const material = new THREE.MeshStandardMaterial({
    color: opts.color ?? DEFAULT_COLOR,
    transparent: true,
    opacity: opts.opacity ?? DEFAULT_OPACITY,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    depthWrite: false,
    metalness: 0.05,
    roughness: 0.85,
    emissive: 0x000000,
    emissiveIntensity: 0
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = {
    ...feature.properties,
    isCountryPolygon: true
  } satisfies CountryMeshUserData;
  return mesh;
}

export function buildCountryOutline(
  feature: CountryFeature,
  opts: { radius?: number; color?: THREE.ColorRepresentation; opacity?: number } = {}
): THREE.LineSegments | null {
  const radius = opts.radius ?? DEFAULT_RADIUS + 0.0005;
  const polygons = extractPolygons(feature);
  if (polygons.length === 0) return null;

  const positions: number[] = [];
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (let i = 0; i < ring.length - 1; i++) {
        const a = ring[i];
        const b = ring[i + 1];
        const va = latLngToVector3(a[1], a[0], radius);
        const vb = latLngToVector3(b[1], b[0], radius);
        positions.push(va.x, va.y, va.z, vb.x, vb.y, vb.z);
      }
    }
  }

  if (positions.length === 0) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: opts.color ?? 0x66ccff,
    transparent: true,
    opacity: opts.opacity ?? 0.45
  });
  const line = new THREE.LineSegments(geometry, material);
  line.userData = { iso: feature.properties.iso, name: feature.properties.name, isCountryOutline: true };
  return line;
}

const MAX_EDGE_DEGREES = 3;

function extractPolygons(feature: CountryFeature): GeoPolygon[] {
  const g = feature.geometry;
  let raw: GeoPolygon[] = [];
  if (g.type === 'Polygon') raw = [g.coordinates];
  else if (g.type === 'MultiPolygon') raw = g.coordinates as GeoMultiPolygon;
  return raw.map(polygon => polygon.map(densifyRing));
}

function densifyRing(ring: GeoRing): GeoRing {
  if (ring.length < 2) return ring;
  const out: GeoRing = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i];
    const b = ring[i + 1];
    out.push([a[0], a[1]]);
    const dLng = b[0] - a[0];
    const dLat = b[1] - a[1];
    const dist = Math.max(Math.abs(dLng), Math.abs(dLat));
    if (dist > MAX_EDGE_DEGREES) {
      const steps = Math.ceil(dist / MAX_EDGE_DEGREES);
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        out.push([a[0] + dLng * t, a[1] + dLat * t]);
      }
    }
  }
  out.push([...ring[ring.length - 1]]);
  return out;
}

interface TriangulatedPolygon {
  ringVertices: GeoRing;
  indices: number[];
}

function triangulatePolygon(polygon: GeoPolygon): TriangulatedPolygon | null {
  if (polygon.length === 0) return null;
  const outer = stripClosing(polygon[0]);
  if (outer.length < 3) return null;

  const holes: GeoRing[] = [];
  const holeStartIndices: number[] = [];
  let cursor = outer.length;
  for (let i = 1; i < polygon.length; i++) {
    const hole = stripClosing(polygon[i]);
    if (hole.length < 3) continue;
    holes.push(hole);
    holeStartIndices.push(cursor);
    cursor += hole.length;
  }

  const ringVertices: GeoRing = [...outer, ...holes.flat()];
  const flatCoords: number[] = [];
  for (const [lng, lat] of ringVertices) {
    flatCoords.push(lng, lat);
  }

  const indices = earcut(flatCoords, holeStartIndices.length > 0 ? holeStartIndices : undefined, 2);
  if (indices.length === 0) return null;
  return { ringVertices, indices };
}

function stripClosing(ring: GeoRing): GeoRing {
  if (ring.length < 2) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring.slice(0, -1);
  return ring;
}

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}
