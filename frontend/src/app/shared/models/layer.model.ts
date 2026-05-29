import type { Locale } from '../i18n/dictionary';

export type LayerId =
  | 'cameras'
  | 'earthquakes'
  | 'wildfires'
  | 'storms'
  | 'aircraft'
  | 'iss'
  | 'gdelt';

export type LayerTier = 'free' | 'premium';

export function layerName(def: LayerDefinition, locale: Locale): string {
  return locale === 'en' ? def.nameEn : def.nameTr;
}

export interface LayerDefinition {
  readonly id: LayerId;
  readonly nameTr: string;
  readonly nameEn: string;
  readonly icon: string;
  readonly accentColor: string;
  readonly description: string;
  readonly tier: LayerTier;
  readonly defaultEnabled: boolean;
  readonly defaultOpacity: number;
}

export interface LayerRuntimeState {
  enabled: boolean;
  opacity: number;
  count: number | null;
  lastUpdate: number | null;
  loading: boolean;
  error: string | null;
}

export const LAYER_DEFINITIONS: readonly LayerDefinition[] = [
  {
    id: 'cameras',
    nameTr: 'Canlı Kameralar',
    nameEn: 'Live Cameras',
    icon: '◉',
    accentColor: '#ff5fa2',
    description: 'Halka açık embed izinli canlı kameralar',
    tier: 'free',
    defaultEnabled: false,
    defaultOpacity: 0.9
  },
  {
    id: 'earthquakes',
    nameTr: 'Depremler',
    nameEn: 'Earthquakes',
    icon: '◈',
    accentColor: '#ff7043',
    description: 'USGS son 24 saat global depremler',
    tier: 'free',
    defaultEnabled: true,
    defaultOpacity: 0.85
  },
  {
    id: 'wildfires',
    nameTr: 'Orman Yangınları',
    nameEn: 'Wildfires',
    icon: '▲',
    accentColor: '#ffb300',
    description: 'NASA FIRMS aktif yangın hotspot',
    tier: 'free',
    defaultEnabled: false,
    defaultOpacity: 0.8
  },
  {
    id: 'storms',
    nameTr: 'Tropikal Fırtınalar',
    nameEn: 'Tropical Storms',
    icon: '✺',
    accentColor: '#7c4dff',
    description: 'NHC aktif fırtına izi ve tahminleri',
    tier: 'free',
    defaultEnabled: false,
    defaultOpacity: 0.85
  },
  {
    id: 'aircraft',
    nameTr: 'Uçaklar',
    nameEn: 'Aircraft',
    icon: '✈',
    accentColor: '#4fc3f7',
    description: 'OpenSky ADS-B canlı uçak konumları',
    tier: 'free',
    defaultEnabled: false,
    defaultOpacity: 0.9
  },
  {
    id: 'iss',
    nameTr: 'ISS Konumu',
    nameEn: 'ISS Position',
    icon: '◊',
    accentColor: '#00e5ff',
    description: 'Uluslararası Uzay İstasyonu canlı konum',
    tier: 'free',
    defaultEnabled: true,
    defaultOpacity: 1
  },
  {
    id: 'gdelt',
    nameTr: 'Jeopolitik Olaylar',
    nameEn: 'Geopolitical Events',
    icon: '◆',
    accentColor: '#80deea',
    description: 'GDELT küresel haber olayları + tone',
    tier: 'free',
    defaultEnabled: false,
    defaultOpacity: 0.75
  }
] as const;
