import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { GlobeViewerComponent } from '../../shared/components/globe-viewer/globe-viewer.component';
import { CountryInfoPanelComponent } from '../../shared/components/country-info-panel/country-info-panel.component';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { LayerPanelComponent } from '../../shared/components/layer-panel/layer-panel.component';
import { CameraPopupComponent } from '../../shared/components/camera-popup/camera-popup.component';
import { EarthquakePopupComponent } from '../../shared/components/earthquake-popup/earthquake-popup.component';
import { CountryService } from '../../shared/services/country.service';
import { GlobeDataService } from '../../shared/services/globe-data.service';
import { CameraFeedService } from '../../shared/services/camera-feed.service';
import { EarthquakeFeedService } from '../../shared/services/earthquake-feed.service';
import { WildfireFeedService } from '../../shared/services/wildfire-feed.service';
import { StormFeedService } from '../../shared/services/storm-feed.service';
import { AircraftFeedService } from '../../shared/services/aircraft-feed.service';
import { IssFeedService } from '../../shared/services/iss-feed.service';
import { GdeltFeedService } from '../../shared/services/gdelt-feed.service';
import { LayerStateService } from '../../shared/services/layer-state.service';
import { GlobeData } from '../../shared/models/globe-data.model';
import { Country, CountryDetail } from '../../shared/models/country.model';
import { CameraFeedItem } from '../../shared/models/camera-feed.model';
import { EarthquakeItem } from '../../shared/models/earthquake.model';
import { WildfireItem } from '../../shared/models/wildfire.model';
import { WildfirePopupComponent } from '../../shared/components/wildfire-popup/wildfire-popup.component';
import { StormItem } from '../../shared/models/storm.model';
import { StormPopupComponent } from '../../shared/components/storm-popup/storm-popup.component';
import { AircraftItem } from '../../shared/models/aircraft.model';
import { AircraftPopupComponent } from '../../shared/components/feed-popups/aircraft-popup.component';
import { IssPosition } from '../../shared/models/iss.model';
import { IssPopupComponent } from '../../shared/components/feed-popups/iss-popup.component';
import { GdeltEvent } from '../../shared/models/gdelt.model';
import { GdeltPopupComponent } from '../../shared/components/feed-popups/gdelt-popup.component';
import { DisclaimerModalComponent } from '../../shared/components/disclaimer-modal/disclaimer-modal.component';
import { LocaleSwitcherComponent } from '../../shared/components/locale-switcher/locale-switcher.component';
import { StreamStatusComponent } from '../../shared/components/stream-status/stream-status.component';
import { RealtimeStreamService } from '../../shared/services/realtime-stream.service';
import { ThemeSwitcherComponent } from '../../shared/components/theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-globe-page',
  imports: [
    GlobeViewerComponent,
    CountryInfoPanelComponent,
    SearchBarComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    LayerPanelComponent,
    CameraPopupComponent,
    EarthquakePopupComponent,
    WildfirePopupComponent,
    StormPopupComponent,
    AircraftPopupComponent,
    IssPopupComponent,
    GdeltPopupComponent,
    DisclaimerModalComponent,
    LocaleSwitcherComponent,
    StreamStatusComponent,
    ThemeSwitcherComponent
  ],
  template: `
    <div class="globe-page">
      <app-disclaimer-modal />

      <div class="locale-dock">
        <app-stream-status />
        <app-theme-switcher />
        <app-locale-switcher />
      </div>

      <app-search-bar
        [results]="countryService.countries()"
        [loading]="countryService.loading()"
        (searchChange)="onSearch($event)"
        (countrySelected)="onSearchResultSelect($event)"
      />

      <app-globe-viewer
        #globeViewer
        [coordinates]="globeData()"
        [selectedIsoCode]="selectedIsoCode()"
        [cameras]="cameraFeedService.items()"
        [camerasVisible]="camerasVisible()"
        [cameraOpacity]="cameraOpacity()"
        [earthquakes]="earthquakeFeedService.items()"
        [earthquakesVisible]="earthquakesVisible()"
        [earthquakeOpacity]="earthquakeOpacity()"
        [wildfires]="wildfireFeedService.items()"
        [wildfiresVisible]="wildfiresVisible()"
        [wildfireOpacity]="wildfireOpacity()"
        [storms]="stormFeedService.items()"
        [stormsVisible]="stormsVisible()"
        [stormOpacity]="stormOpacity()"
        [aircraft]="aircraftFeedService.items()"
        [aircraftVisible]="aircraftVisible()"
        [aircraftOpacity]="aircraftOpacity()"
        [issPosition]="issFeedService.position()"
        [issTrail]="issFeedService.trail()"
        [issVisible]="issVisible()"
        [issOpacity]="issOpacity()"
        [gdeltEvents]="gdeltFeedService.items()"
        [gdeltVisible]="gdeltVisible()"
        [gdeltOpacity]="gdeltOpacity()"
        (countrySelect)="onCountrySelect($event)"
        (cameraSelect)="onCameraSelect($event)"
        (earthquakeSelect)="onEarthquakeSelect($event)"
        (wildfireSelect)="onWildfireSelect($event)"
        (stormSelect)="onStormSelect($event)"
        (aircraftSelect)="onAircraftSelect($event)"
        (issSelect)="onIssSelect($event)"
        (gdeltSelect)="onGdeltSelect($event)"
        class="globe-viewer"
      />

      @if (globeDataService.loading()) {
        <div class="status-overlay loading">
          <app-loading-state />
        </div>
      } @else if (globeDataService.error(); as error) {
        <div class="status-overlay error">
          <app-error-state [message]="error" (retry)="ngOnInit()" />
        </div>
      }

      <app-layer-panel />

      <app-camera-popup
        [camera]="selectedCamera()"
        (close)="onCloseCamera()"
      />

      <app-earthquake-popup
        [event]="selectedEarthquake()"
        (close)="onCloseEarthquake()"
      />

      <app-wildfire-popup
        [event]="selectedWildfire()"
        (close)="onCloseWildfire()"
      />

      <app-storm-popup
        [event]="selectedStorm()"
        (close)="onCloseStorm()"
      />

      <app-aircraft-popup
        [event]="selectedAircraft()"
        (close)="onCloseAircraft()"
      />

      <app-iss-popup
        [event]="selectedIss()"
        (close)="onCloseIss()"
      />

      <app-gdelt-popup
        [event]="selectedGdelt()"
        (close)="onCloseGdelt()"
      />


      @if (selectedCountry(); as country) {
        <app-country-info-panel
          [country]="country"
          (close)="onClosePanel()"
        />
      }
    </div>
  `,
  styles: [`
    .globe-page {
      width: 100%;
      height: 100vh;
      position: relative;
      background: var(--bg-base, #050510);
      overflow: hidden;
      transition: background 0.28s ease;
    }
    .globe-viewer {
      width: 100%;
      height: 100%;
      display: block;
    }
    .status-overlay {
      position: absolute;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 11;
      pointer-events: none;
      background: rgba(8, 14, 26, 0.86);
      backdrop-filter: blur(14px);
      border: 1px solid rgba(0, 212, 255, 0.15);
      border-radius: 12px;
      padding: 12px 18px;
      max-width: 360px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    .status-overlay.error {
      border-color: rgba(255, 82, 82, 0.3);
    }
    .status-overlay :is(button, a, app-error-state) {
      pointer-events: auto;
    }
    .locale-dock {
      position: absolute;
      top: 18px;
      right: 18px;
      z-index: 14;
      display: flex;
      align-items: center;
      gap: 10px;
    }
  `]
})
export class GlobePageComponent implements OnInit {
  private readonly globeViewer = viewChild<GlobeViewerComponent>('globeViewer');
  protected readonly cameraFeedService = inject(CameraFeedService);
  protected readonly earthquakeFeedService = inject(EarthquakeFeedService);
  protected readonly wildfireFeedService = inject(WildfireFeedService);
  protected readonly stormFeedService = inject(StormFeedService);
  protected readonly aircraftFeedService = inject(AircraftFeedService);
  protected readonly issFeedService = inject(IssFeedService);
  protected readonly gdeltFeedService = inject(GdeltFeedService);
  private readonly layerState = inject(LayerStateService);
  private readonly realtimeStream = inject(RealtimeStreamService);

  protected readonly globeData = signal<GlobeData[]>([]);
  protected readonly selectedIsoCode = signal<string | null>(null);
  protected readonly selectedCountry = signal<CountryDetail | null>(null);
  protected readonly selectedCamera = signal<CameraFeedItem | null>(null);
  protected readonly selectedEarthquake = signal<EarthquakeItem | null>(null);
  protected readonly selectedWildfire = signal<WildfireItem | null>(null);
  protected readonly selectedStorm = signal<StormItem | null>(null);
  protected readonly selectedAircraft = signal<AircraftItem | null>(null);
  protected readonly selectedIss = signal<IssPosition | null>(null);
  protected readonly selectedGdelt = signal<GdeltEvent | null>(null);

  protected readonly camerasVisible = computed(() => this.layerState.state()['cameras'].enabled);
  protected readonly cameraOpacity = computed(() => this.layerState.state()['cameras'].opacity);
  protected readonly earthquakesVisible = computed(() => this.layerState.state()['earthquakes'].enabled);
  protected readonly earthquakeOpacity = computed(() => this.layerState.state()['earthquakes'].opacity);
  protected readonly wildfiresVisible = computed(() => this.layerState.state()['wildfires'].enabled);
  protected readonly wildfireOpacity = computed(() => this.layerState.state()['wildfires'].opacity);
  protected readonly stormsVisible = computed(() => this.layerState.state()['storms'].enabled);
  protected readonly stormOpacity = computed(() => this.layerState.state()['storms'].opacity);
  protected readonly aircraftVisible = computed(() => this.layerState.state()['aircraft'].enabled);
  protected readonly aircraftOpacity = computed(() => this.layerState.state()['aircraft'].opacity);
  protected readonly issVisible = computed(() => this.layerState.state()['iss'].enabled);
  protected readonly issOpacity = computed(() => this.layerState.state()['iss'].opacity);
  protected readonly gdeltVisible = computed(() => this.layerState.state()['gdelt'].enabled);
  protected readonly gdeltOpacity = computed(() => this.layerState.state()['gdelt'].opacity);

  constructor(
    protected readonly countryService: CountryService,
    protected readonly globeDataService: GlobeDataService
  ) {}

  async ngOnInit(): Promise<void> {
    this.realtimeStream.start();
    void this.cameraFeedService.load();
    await this.countryService.loadAll();
    await this.globeDataService.loadCoordinates();
    this.globeData.set(this.globeDataService.coordinates());
  }

  protected onSearch(term: string): void {
    void this.countryService.loadAll(term || undefined);
  }

  protected async onSearchResultSelect(country: Country): Promise<void> {
    this.selectedIsoCode.set(country.isoCode);
    await this.countryService.loadByCode(country.isoCode);
    this.selectedCountry.set(this.countryService.selectedCountry());

    const lat = country.latitude ?? this.selectedCountry()?.latitude;
    const lng = country.longitude ?? this.selectedCountry()?.longitude;
    if (lat != null && lng != null) {
      this.globeViewer()?.flyTo(lat, lng);
    }
  }

  protected async onCountrySelect(event: { isoCode: string; name: string }): Promise<void> {
    this.selectedIsoCode.set(event.isoCode);
    await this.countryService.loadByCode(event.isoCode);
    this.selectedCountry.set(this.countryService.selectedCountry());

    const detail = this.selectedCountry();
    if (detail?.latitude != null && detail.longitude != null) {
      this.globeViewer()?.flyTo(detail.latitude, detail.longitude);
    }
  }

  protected onCameraSelect(cam: CameraFeedItem): void {
    this.selectedCamera.set(cam);
    this.globeViewer()?.flyTo(cam.lat, cam.lng, 1.8);
  }

  protected onCloseCamera(): void {
    this.selectedCamera.set(null);
  }

  protected onEarthquakeSelect(eq: EarthquakeItem): void {
    this.selectedEarthquake.set(eq);
    this.globeViewer()?.flyTo(eq.lat, eq.lng, 2.2);
  }

  protected onCloseEarthquake(): void {
    this.selectedEarthquake.set(null);
  }

  protected onWildfireSelect(fire: WildfireItem): void {
    this.selectedWildfire.set(fire);
    this.globeViewer()?.flyTo(fire.lat, fire.lng, 2.2);
  }

  protected onCloseWildfire(): void {
    this.selectedWildfire.set(null);
  }

  protected onStormSelect(storm: StormItem): void {
    this.selectedStorm.set(storm);
    this.globeViewer()?.flyTo(storm.lat, storm.lng, 2.2);
  }

  protected onCloseStorm(): void {
    this.selectedStorm.set(null);
  }

  protected onAircraftSelect(ac: AircraftItem): void {
    this.selectedAircraft.set(ac);
  }

  protected onCloseAircraft(): void {
    this.selectedAircraft.set(null);
  }

  protected onIssSelect(iss: IssPosition): void {
    this.selectedIss.set(iss);
  }

  protected onCloseIss(): void {
    this.selectedIss.set(null);
  }

  protected onGdeltSelect(ev: GdeltEvent): void {
    this.selectedGdelt.set(ev);
    this.globeViewer()?.flyTo(ev.lat, ev.lng, 2.0);
  }

  protected onCloseGdelt(): void {
    this.selectedGdelt.set(null);
  }

  protected onClosePanel(): void {
    this.selectedCountry.set(null);
    this.selectedIsoCode.set(null);
    this.countryService.clearSelection();
  }
}
