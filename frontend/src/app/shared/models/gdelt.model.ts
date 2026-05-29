export interface GdeltEvent {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly source: string;
  readonly time: number;
  readonly tone: number;
  readonly lat: number;
  readonly lng: number;
  readonly language: string | null;
}

interface GdeltArticle {
  url?: string;
  url_mobile?: string;
  title?: string;
  seendate?: string;
  sourcecountry?: string;
  domain?: string;
  language?: string;
  tone?: number | string;
  lat?: number | string;
  lon?: number | string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

function parseSeenDate(raw: string): number {
  // Format: 20260528T143012Z
  if (!raw || raw.length < 15) return 0;
  const y = Number(raw.slice(0, 4));
  const mo = Number(raw.slice(4, 6)) - 1;
  const d = Number(raw.slice(6, 8));
  const h = Number(raw.slice(9, 11));
  const mi = Number(raw.slice(11, 13));
  const s = Number(raw.slice(13, 15));
  return Date.UTC(y, mo, d, h, mi, s);
}

export function parseGdeltArticles(raw: GdeltResponse): GdeltEvent[] {
  const items: GdeltEvent[] = [];
  for (const a of raw.articles ?? []) {
    const lat = typeof a.lat === 'string' ? parseFloat(a.lat) : a.lat;
    const lng = typeof a.lon === 'string' ? parseFloat(a.lon) : a.lon;
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) continue;
    const tone = typeof a.tone === 'string' ? parseFloat(a.tone) : (a.tone ?? 0);
    items.push({
      id: a.url ?? `${lat},${lng},${a.title}`,
      title: a.title ?? '',
      url: a.url ?? '',
      source: a.domain ?? a.sourcecountry ?? '',
      time: parseSeenDate(a.seendate ?? ''),
      tone: Number.isNaN(tone) ? 0 : tone,
      lat,
      lng,
      language: a.language ?? null
    });
  }
  return items;
}
