import { Injectable, computed, inject, signal } from '@angular/core';
import { CameraFeedCollection, CameraFeedItem } from '../models/camera-feed.model';
import { LayerStateService } from './layer-state.service';

@Injectable({ providedIn: 'root' })
export class CameraFeedService {
  private readonly layerState = inject(LayerStateService);
  private readonly manifestUrl = 'feeds/cameras.json';

  private readonly _items = signal<CameraFeedItem[]>([]);
  private readonly _disclaimer = signal<string | null>(null);
  private loadPromise: Promise<void> | null = null;

  readonly items = this._items.asReadonly();
  readonly disclaimer = this._disclaimer.asReadonly();
  readonly count = computed(() => this._items().length);

  async load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    this.layerState.setLoading('cameras', true);

    this.loadPromise = fetch(this.manifestUrl, { cache: 'force-cache' })
      .then(r => {
        if (!r.ok) throw new Error(`Camera manifest fetch failed: ${r.status}`);
        return r.json() as Promise<CameraFeedCollection>;
      })
      .then(collection => {
        this._items.set([...collection.items]);
        this._disclaimer.set(collection.disclaimer);
        this.layerState.setCount('cameras', collection.items.length);
        this.layerState.setError('cameras', null);
      })
      .catch(err => {
        this.layerState.setError('cameras', err instanceof Error ? err.message : 'Manifest yüklenemedi');
        this._items.set([]);
        this.loadPromise = null;
        throw err;
      });

    return this.loadPromise;
  }

  findById(id: string): CameraFeedItem | null {
    return this._items().find(c => c.id === id) ?? null;
  }
}
