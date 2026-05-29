export interface GlobeData {
  id: number;
  name: string;
  isoCode: string;
  latitude: number;
  longitude: number;
  population: number | null;
  cityLightsDensity: number;
}
