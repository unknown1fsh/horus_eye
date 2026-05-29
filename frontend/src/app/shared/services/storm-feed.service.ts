import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { StormItem, parseEonetStorms } from '../models/storm.model';
import { LayerStateService } from './layer-state.service';

const REFRESH_INTERVAL_MS = 10 * 60_000;
const ENDPOINT = 'https://eonet.gsfc.nasa.gov/api/v3/events?category=severeStorms&status=open&limit=100';

@Injectable({ providedIn: 'root' })
export class StormFeedService {
  private readonly layerState = inject(LayerStateService);

  private readonly _items = signal<StormItem[]>([]);
  private timerId: ReturnType<typeof setInterval> | null = null;
  private currentFetchAbort: AbortController | null = null;

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);

  private readonly enabled = computed(() => this.layerState.state()['storms'].enabled);

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

    this.layerState.setLoading('storms', true);
    try {
      const res = await fetch(ENDPOINT, { signal: controller.signal, cache: 'no-store' });
      if (!res.ok) throw new Error(`EONET storms fetch failed: ${res.status}`);
      const json = await res.json();
      const items = parseEonetStorms(json);
      this._items.set(items);
      this.layerState.setCount('storms', items.length);
      this.layerState.setError('storms', null);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      this.layerState.setError('storms', err instanceof Error ? err.message : 'EONET storms fetch hatası');
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
