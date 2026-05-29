export interface IssPosition {
  readonly lat: number;
  readonly lng: number;
  readonly altitudeKm: number;
  readonly velocityKmh: number;
  readonly footprintKm: number;
  readonly timestamp: number;
}

interface WheretheissResponse {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  footprint: number;
  timestamp: number;
}

export function parseIssPosition(raw: WheretheissResponse): IssPosition {
  return {
    lat: raw.latitude,
    lng: raw.longitude,
    altitudeKm: raw.altitude,
    velocityKmh: raw.velocity,
    footprintKm: raw.footprint,
    timestamp: raw.timestamp * 1000
  };
}
