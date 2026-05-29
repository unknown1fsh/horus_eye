export interface StormTrackPoint {
  readonly time: number;
  readonly lat: number;
  readonly lng: number;
}

export interface StormItem {
  readonly id: string;
  readonly title: string;
  readonly lat: number;
  readonly lng: number;
  readonly time: number;
  readonly track: readonly StormTrackPoint[];
  readonly sources: readonly { id: string; url: string }[];
}

interface EonetGeometry {
  date: string;
  type: string;
  coordinates: number[];
}

interface EonetEvent {
  id: string;
  title: string;
  closed?: string | null;
  geometry: EonetGeometry[];
  sources?: { id: string; url: string }[];
}

interface EonetResponse {
  events: EonetEvent[];
}

export function parseEonetStorms(raw: EonetResponse): StormItem[] {
  const items: StormItem[] = [];
  for (const event of raw.events) {
    if (event.closed) continue;
    const points = event.geometry.filter(g => g.type === 'Point' && Array.isArray(g.coordinates) && g.coordinates.length >= 2);
    if (points.length === 0) continue;
    const track: StormTrackPoint[] = points.map(p => ({
      time: new Date(p.date).getTime(),
      lat: p.coordinates[1],
      lng: p.coordinates[0]
    }));
    const latest = track[track.length - 1];
    items.push({
      id: event.id,
      title: event.title,
      lat: latest.lat,
      lng: latest.lng,
      time: latest.time,
      track,
      sources: (event.sources ?? []).map(s => ({ id: s.id, url: s.url }))
    });
  }
  return items;
}
