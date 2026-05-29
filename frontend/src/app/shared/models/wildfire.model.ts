export interface WildfireSource {
  readonly id: string;
  readonly url: string;
}

export interface WildfireItem {
  readonly id: string;
  readonly title: string;
  readonly lat: number;
  readonly lng: number;
  readonly time: number;
  readonly sources: readonly WildfireSource[];
}

interface EonetGeometry {
  date: string;
  type: string;
  coordinates: [number, number] | number[];
}

interface EonetEvent {
  id: string;
  title: string;
  closed?: string | null;
  geometry: EonetGeometry[];
  sources?: { id: string; url: string }[];
  categories?: { id: string; title: string }[];
}

interface EonetResponse {
  events: EonetEvent[];
}

export function parseEonetWildfires(raw: EonetResponse): WildfireItem[] {
  const items: WildfireItem[] = [];
  for (const event of raw.events) {
    if (event.closed) continue;
    const points = event.geometry.filter(g => g.type === 'Point');
    if (points.length === 0) continue;
    const latest = points[points.length - 1];
    const coords = latest.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;
    const [lng, lat] = coords;
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    items.push({
      id: event.id,
      title: event.title,
      lat,
      lng,
      time: new Date(latest.date).getTime(),
      sources: (event.sources ?? []).map(s => ({ id: s.id, url: s.url }))
    });
  }
  return items;
}
