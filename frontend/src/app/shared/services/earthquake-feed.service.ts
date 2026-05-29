import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { EarthquakeItem, EarthquakePeriod, parseUsgsFeed } from '../models/earthquake.model';
import { LayerStateService } from './layer-state.service';

const REFRESH_INTERVAL_MS = 60_000;

const ENDPOINTS: Record<EarthquakePeriod, string> = {
  hour: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
  day: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
  week: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'
};

@Injectable({ providedIn: 'root' })
export class EarthquakeFeedService {
  private readonly layerState = inject(LayerStateService);

  private readonly _items = signal<EarthquakeItem[]>([]);
  private readonly _period = signal<EarthquakePeriod>('day');
  private timerId: ReturnType<typeof setInterval> | null = null;
  private currentFetchAbort: AbortController | null = null;

  readonly items = this._items.asReadonly();
  readonly period = this._period.asReadonly();
  readonly count = computed(() => this._items().length);

  // Primitive-equality computed — only re-emits when `enabled` actually flips.
  // Critical: reading layerState.state() directly inside effect() caused an
  // infinite loop because refresh() writes setLoading/setCount which mutates
  // the same state signal, re-triggering the effect (=> thousands of aborted
  // fetches that freeze the browser).
  private readonly enabled = computed(() => this.layerState.state()['earthquakes'].enabled);

  constructor() {
    effect(() => {
      const enabled = this.enabled();
      if (enabled) {
        void this.refresh();
        this.startTimer();
      } else {
        this.stopTimer();
        this.currentFetchAbort?.abort();
      }
    });
  }

  setPeriod(period: EarthquakePeriod): void {
    if (this._period() === period) return;
    this._period.set(period);
    if (this.layerState.state()['earthquakes'].enabled) {
      void this.refresh();
    }
  }

  async refresh(): Promise<void> {
    const period = this._period();
    const url = ENDPOINTS[period];

    this.currentFetchAbort?.abort();
    const controller = new AbortController();
    this.currentFetchAbort = controller;

    this.layerState.setLoading('earthquakes', true);
    try {
      const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      if (!res.ok) throw new Error(`USGS ${period} fetch failed: ${res.status}`);
      const json = await res.json();
      const items = parseUsgsFeed(json);
      this._items.set(items);
      this.layerState.setCount('earthquakes', items.length);
      this.layerState.setError('earthquakes', null);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      this.layerState.setError('earthquakes', err instanceof Error ? err.message : 'USGS fetch hatası');
    }
  }

  private startTimer(): void {
    if (this.timerId !== null) return;
    this.timerId = setInterval(() => void this.refresh(), REFRESH_INTERVAL_MS);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
