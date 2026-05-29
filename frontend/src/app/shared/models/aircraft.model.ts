export interface AircraftItem {
  readonly icao24: string;
  readonly callsign: string;
  readonly originCountry: string;
  readonly lat: number;
  readonly lng: number;
  readonly altitudeM: number | null;
  readonly velocityMs: number | null;
  readonly headingDeg: number | null;
  readonly verticalRateMs: number | null;
  readonly onGround: boolean;
  readonly lastContact: number;
}

interface OpenSkyResponse {
  time: number;
  states: (string | number | boolean | null)[][] | null;
}

export function parseOpenSkyStates(raw: OpenSkyResponse, limit = 1500): AircraftItem[] {
  if (!raw.states) return [];
  const items: AircraftItem[] = [];
  for (const s of raw.states) {
    const lng = s[5] as number | null;
    const lat = s[6] as number | null;
    const onGround = s[8] as boolean;
    if (lat == null || lng == null || onGround) continue;
    items.push({
      icao24: String(s[0] ?? ''),
      callsign: ((s[1] as string | null) ?? '').trim(),
      originCountry: (s[2] as string | null) ?? '',
      lat,
      lng,
      altitudeM: (s[7] as number | null) ?? null,
      velocityMs: (s[9] as number | null) ?? null,
      headingDeg: (s[10] as number | null) ?? null,
      verticalRateMs: (s[11] as number | null) ?? null,
      onGround,
      lastContact: (s[4] as number) ?? 0
    });
    if (items.length >= limit) break;
  }
  return items;
}
