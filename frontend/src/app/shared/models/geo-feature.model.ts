export type GeoRing = number[][];
export type GeoPolygon = GeoRing[];
export type GeoMultiPolygon = GeoPolygon[];

export type GeoGeometry =
  | { type: 'Polygon'; coordinates: GeoPolygon }
  | { type: 'MultiPolygon'; coordinates: GeoMultiPolygon };

export interface CountryFeatureProperties {
  iso: string | null;
  iso3?: string;
  name: string;
  nameTr?: string;
  admin?: string;
  continent?: string;
  subregion?: string;
  popEst?: number;
  wikidata?: string;
  labelX?: number;
  labelY?: number;
}

export interface CountryFeature {
  type: 'Feature';
  properties: CountryFeatureProperties;
  geometry: GeoGeometry;
}

export interface CountryFeatureCollection {
  type: 'FeatureCollection';
  features: CountryFeature[];
}

export type GeoLod = '110m' | '50m' | '10m';
