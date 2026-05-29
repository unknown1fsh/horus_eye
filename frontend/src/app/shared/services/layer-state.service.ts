import { Injectable, computed, signal } from '@angular/core';
import {
  LAYER_DEFINITIONS,
  LayerDefinition,
  LayerId,
  LayerRuntimeState
} from '../models/layer.model';

const STORAGE_KEY = 'horus-eye.layer-state.v1';

interface PersistedLayerState {
  enabled?: boolean;
  opacity?: number;
}

type PersistedSnapshot = Partial<Record<LayerId, PersistedLayerState>>;

@Injectable({ providedIn: 'root' })
export class LayerStateService {
  readonly definitions: readonly LayerDefinition[] = LAYER_DEFINITIONS;

  private readonly _state = signal<Record<LayerId, LayerRuntimeState>>(this.initialState());

  readonly state = this._state.asReadonly();
  readonly enabledLayers = computed(() =>
    this.definitions.filter(d => this._state()[d.id].enabled)
  );

  setEnabled(id: LayerId, enabled: boolean): void {
    this.update(id, prev => ({ ...prev, enabled }));
    this.persist();
  }

  toggle(id: LayerId): void {
    this.setEnabled(id, !this._state()[id].enabled);
  }

  setOpacity(id: LayerId, opacity: number): void {
    const clamped = Math.max(0, Math.min(1, opacity));
    this.update(id, prev => ({ ...prev, opacity: clamped }));
    this.persist();
  }

  setCount(id: LayerId, count: number | null): void {
    this.update(id, prev => ({ ...prev, count, lastUpdate: count == null ? prev.lastUpdate : Date.now() }));
  }

  setLoading(id: LayerId, loading: boolean): void {
    this.update(id, prev => ({ ...prev, loading }));
  }

  setError(id: LayerId, error: string | null): void {
    this.update(id, prev => ({ ...prev, error, loading: false }));
  }

  resetDefaults(): void {
    this._state.set(this.buildDefaults());
    this.persist();
  }

  private update(id: LayerId, fn: (prev: LayerRuntimeState) => LayerRuntimeState): void {
    this._state.update(current => ({ ...current, [id]: fn(current[id]) }));
  }

  private initialState(): Record<LayerId, LayerRuntimeState> {
    const defaults = this.buildDefaults();
    const persisted = this.readPersisted();
    if (!persisted) return defaults;

    for (const def of this.definitions) {
      const stored = persisted[def.id];
      if (!stored) continue;
      if (typeof stored.enabled === 'boolean') defaults[def.id].enabled = stored.enabled;
      if (typeof stored.opacity === 'number') defaults[def.id].opacity = stored.opacity;
    }
    return defaults;
  }

  private buildDefaults(): Record<LayerId, LayerRuntimeState> {
    const result = {} as Record<LayerId, LayerRuntimeState>;
    for (const def of this.definitions) {
      result[def.id] = {
        enabled: def.defaultEnabled,
        opacity: def.defaultOpacity,
        count: null,
        lastUpdate: null,
        loading: false,
        error: null
      };
    }
    return result;
  }

  private readPersisted(): PersistedSnapshot | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PersistedSnapshot;
    } catch {
      return null;
    }
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') return;
    const snapshot: PersistedSnapshot = {};
    const current = this._state();
    for (const def of this.definitions) {
      snapshot[def.id] = {
        enabled: current[def.id].enabled,
        opacity: current[def.id].opacity
      };
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // localStorage full or disabled — silently skip
    }
  }
}
