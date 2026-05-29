import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { GdeltEvent, parseGdeltArticles } from '../models/gdelt.model';
import { LayerStateService } from './layer-state.service';

const REFRESH_INTERVAL_MS = 5 * 60_000;
// Routed through backend (FeedProxyController) to bypass GDELT's CORS policy.
const ENDPOINT = '/api/v1/feeds/gdelt';

@Injectable({ providedIn: 'root' })
export class GdeltFeedService {
  private readonly layerState = inject(LayerStateService);

  private readonly _items = signal<GdeltEvent[]>([]);
  private timerId: ReturnType<typeof setInterval> | null = null;
  private currentFetchAbort: AbortController | null = null;

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);

  private readonly enabled = computed(() => this.layerState.state()['gdelt'].enabled);

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

    this.layerState.setLoading('gdelt', true);
    try {
      const res = await fetch(ENDPOINT, { signal: controller.signal, cache: 'no-store' });
      if (!res.ok) throw new Error(`GDELT fetch failed: ${res.status}`);
      const json = await res.json();
      const items = parseGdeltArticles(json);
      this._items.set(items);
      this.layerState.setCount('gdelt', items.length);
      this.layerState.setError('gdelt', null);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      this.layerState.setError('gdelt', err instanceof Error ? err.message : 'GDELT fetch hatası');
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
