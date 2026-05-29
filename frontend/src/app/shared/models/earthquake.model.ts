export type EarthquakePeriod = 'hour' | 'day' | 'week';

export interface EarthquakeItem {
  readonly id: string;
  readonly magnitude: number;
  readonly place: string;
  readonly time: number;
  readonly depthKm: number;
  readonly lat: number;
  readonly lng: number;
  readonly url: string;
  readonly tsunami: boolean;
  readonly felt: number | null;
  readonly significance: number | null;
}

interface UsgsFeature {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number;
    url: string;
    tsunami?: number;
    felt?: number | null;
    sig?: number | null;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

interface UsgsGeoJson {
  features: UsgsFeature[];
}

export function parseUsgsFeed(raw: UsgsGeoJson): EarthquakeItem[] {
  return raw.features
    .map(f => {
      const [lng, lat, depthKm] = f.geometry.coordinates;
      if (typeof lat !== 'number' || typeof lng !== 'number' || f.properties.mag == null) return null;
      return {
        id: f.id,
        magnitude: f.properties.mag,
        place: f.properties.place ?? '',
        time: f.properties.time,
        depthKm,
        lat,
        lng,
        url: f.properties.url,
        tsunami: f.properties.tsunami === 1,
        felt: f.properties.felt ?? null,
        significance: f.properties.sig ?? null
      } satisfies EarthquakeItem;
    })
    .filter((item): item is EarthquakeItem => item !== null);
}
