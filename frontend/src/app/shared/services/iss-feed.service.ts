import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { IssPosition, parseIssPosition } from '../models/iss.model';
import { LayerStateService } from './layer-state.service';

const REFRESH_INTERVAL_MS = 5_000;
const MAX_TRAIL = 240;
const ENDPOINT = 'https://api.wheretheiss.at/v1/satellites/25544';

@Injectable({ providedIn: 'root' })
export class IssFeedService {
  private readonly layerState = inject(LayerStateService);

  private readonly _position = signal<IssPosition | null>(null);
  private readonly _trail = signal<readonly { lat: number; lng: number }[]>([]);
  private timerId: ReturnType<typeof setInterval> | null = null;
  private currentFetchAbort: AbortController | null = null;

  readonly position = this._position.asReadonly();
  readonly trail = this._trail.asReadonly();
  readonly count = computed(() => (this._position() ? 1 : 0));

  private readonly enabled = computed(() => this.layerState.state()['iss'].enabled);

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

    this.layerState.setLoading('iss', true);
    try {
      const res = await fetch(ENDPOINT, { signal: controller.signal, cache: 'no-store' });
      if (!res.ok) throw new Error(`ISS fetch failed: ${res.status}`);
      const json = await res.json();
      const pos = parseIssPosition(json);
      this._position.set(pos);
      const trail = [...this._trail(), { lat: pos.lat, lng: pos.lng }];
      if (trail.length > MAX_TRAIL) trail.splice(0, trail.length - MAX_TRAIL);
      this._trail.set(trail);
      this.layerState.setCount('iss', 1);
      this.layerState.setError('iss', null);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      this.layerState.setError('iss', err instanceof Error ? err.message : 'ISS fetch hatası');
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
