import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AircraftItem, parseOpenSkyStates } from '../models/aircraft.model';
import { LayerStateService } from './layer-state.service';

const REFRESH_INTERVAL_MS = 30_000;
// Routed through backend (FeedProxyController) to bypass OpenSky's CORS policy.
const ENDPOINT = '/api/v1/feeds/aircraft';

@Injectable({ providedIn: 'root' })
export class AircraftFeedService {
  private readonly layerState = inject(LayerStateService);

  private readonly _items = signal<AircraftItem[]>([]);
  private timerId: ReturnType<typeof setInterval> | null = null;
  private currentFetchAbort: AbortController | null = null;

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);

  private readonly enabled = computed(() => this.layerState.state()['aircraft'].enabled);

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

  async refresh(): Promise<void> {
    this.currentFetchAbort?.abort();
    const controller = new AbortController();
    this.currentFetchAbort = controller;

    this.layerState.setLoading('aircraft', true);
    try {
      const res = await fetch(ENDPOINT, { signal: controller.signal, cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 429) throw new Error('OpenSky rate limit');
        throw new Error(`OpenSky fetch failed: ${res.status}`);
      }
      const json = await res.json();
      const items = parseOpenSkyStates(json);
      this._items.set(items);
      this.layerState.setCount('aircraft', items.length);
      this.layerState.setError('aircraft', null);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      this.layerState.setError('aircraft', err instanceof Error ? err.message : 'OpenSky fetch hatası');
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
