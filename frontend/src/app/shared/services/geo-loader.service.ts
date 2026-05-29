import { Injectable, signal } from '@angular/core';
import { CountryFeature, CountryFeatureCollection, GeoLod } from '../models/geo-feature.model';

interface LodConfig {
  readonly url: string;
  readonly minDistance: number;
}

@Injectable({ providedIn: 'root' })
export class GeoLoaderService {
  private readonly lodConfig: Record<GeoLod, LodConfig> = {
    '110m': { url: 'geo/countries-110m.geojson', minDistance: 3.0 },
    '50m': { url: 'geo/countries-50m.geojson', minDistance: 1.8 },
    '10m': { url: 'geo/countries-10m.geojson', minDistance: 0 }
  };

  private readonly cache = new Map<GeoLod, CountryFeatureCollection>();
  private readonly inflight = new Map<GeoLod, Promise<CountryFeatureCollection>>();

  private readonly _loadedLods = signal<Set<GeoLod>>(new Set());
  readonly loadedLods = this._loadedLods.asReadonly();

  selectLodForDistance(cameraDistance: number): GeoLod {
    if (cameraDistance > this.lodConfig['110m'].minDistance) return '110m';
    if (cameraDistance > this.lodConfig['50m'].minDistance) return '50m';
    return '10m';
  }

  async loadLod(lod: GeoLod): Promise<CountryFeatureCollection> {
    const cached = this.cache.get(lod);
    if (cached) return cached;

    const pending = this.inflight.get(lod);
    if (pending) return pending;

    const config = this.lodConfig[lod];
    const promise = fetch(config.url, { cache: 'force-cache' })
      .then(r => {
        if (!r.ok) throw new Error(`GeoJSON ${lod} fetch failed: ${r.status}`);
        return r.json() as Promise<CountryFeatureCollection>;
      })
      .then(collection => {
        this.cache.set(lod, collection);
        this.inflight.delete(lod);
        const next = new Set(this._loadedLods());
        next.add(lod);
        this._loadedLods.set(next);
        return collection;
      })
      .catch(err => {
        this.inflight.delete(lod);
        throw err;
      });

    this.inflight.set(lod, promise);
    return promise;
  }

  getCached(lod: GeoLod): CountryFeatureCollection | null {
    return this.cache.get(lod) ?? null;
  }

  findByIso(lod: GeoLod, iso: string): CountryFeature | null {
    const collection = this.cache.get(lod);
    if (!collection) return null;
    const upper = iso.toUpperCase();
    return collection.features.find(f => f.properties.iso?.toUpperCase() === upper) ?? null;
  }
}
