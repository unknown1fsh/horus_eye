import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { WildfireItem, parseEonetWildfires } from '../models/wildfire.model';
import { LayerStateService } from './layer-state.service';

const REFRESH_INTERVAL_MS = 5 * 60_000;
const ENDPOINT = 'https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open&limit=200';

@Injectable({ providedIn: 'root' })
export class WildfireFeedService {
  private readonly layerState = inject(LayerStateService);

  private readonly _items = signal<WildfireItem[]>([]);
  private timerId: ReturnType<typeof setInterval> | null = null;
  private currentFetchAbort: AbortController | null = null;

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);

  // Primitive-equality computed: only re-emits on actual enabled flips,
  // immune to refresh()-driven state writes (see N1.4 incident note).
  private readonly enabled = computed(() => this.layerState.state()['wildfires'].enabled);

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

    this.layerState.setLoading('wildfires', true);
    try {
      const res = await fetch(ENDPOINT, { signal: controller.signal, cache: 'no-store' });
      if (!res.ok) throw new Error(`EONET wildfires fetch failed: ${res.status}`);
      const json = await res.json();
      const items = parseEonetWildfires(json);
      this._items.set(items);
      this.layerState.setCount('wildfires', items.length);
      this.layerState.setError('wildfires', null);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      this.layerState.setError('wildfires', err instanceof Error ? err.message : 'EONET fetch hatası');
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
