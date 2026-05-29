import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AircraftItem } from '../../models/aircraft.model';
import { TranslatePipe } from '../../i18n/t.pipe';

@Component({
  selector: 'app-aircraft-popup',
  imports: [DecimalPipe, TranslatePipe],
  template: `
    @if (event(); as ac) {
      <aside class="popup" role="dialog">
        <header>
          <span class="icon">✈</span>
          <h3>{{ ac.callsign || ac.icao24 }}</h3>
          <button class="close" (click)="close.emit()" [attr.aria-label]="'popup.close' | t">×</button>
        </header>
        <div class="grid">
          <div><span class="label">{{ 'popup.aircraft.origin' | t }}</span><span>{{ ac.originCountry || '-' }}</span></div>
          <div><span class="label">{{ 'popup.aircraft.icao24' | t }}</span><span>{{ ac.icao24 }}</span></div>
          <div><span class="label">{{ 'popup.location' | t }}</span><span>{{ ac.lat | number:'1.2-2' }}, {{ ac.lng | number:'1.2-2' }}</span></div>
          @if (ac.altitudeM != null) {
            <div><span class="label">{{ 'popup.aircraft.altitude' | t }}</span><span>{{ ac.altitudeM | number:'1.0-0' }} m</span></div>
          }
          @if (ac.velocityMs != null) {
            <div><span class="label">{{ 'popup.aircraft.velocity' | t }}</span><span>{{ (ac.velocityMs * 3.6) | number:'1.0-0' }} km/h</span></div>
          }
          @if (ac.headingDeg != null) {
            <div><span class="label">{{ 'popup.aircraft.heading' | t }}</span><span>{{ ac.headingDeg | number:'1.0-0' }}°</span></div>
          }
        </div>
        <p class="footnote">{{ 'popup.aircraft.footnote' | t }}</p>
      </aside>
    }
  `,
  styles: [`
    .popup {
      position: absolute; top: 80px; right: 16px; width: 320px; padding: 16px;
      background: rgba(8, 18, 30, 0.92); backdrop-filter: blur(16px);
      border: 1px solid rgba(79, 195, 247, 0.32); border-radius: 14px;
      color: #d7eefa; z-index: 14; box-shadow: 0 8px 28px rgba(0,0,0,.45);
    }
    header { display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: center; margin-bottom: 12px; }
    header h3 { margin: 0; font-size: 14px; font-weight: 600; color: #e8f6ff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .icon { color: #4fc3f7; font-size: 14px; }
    .close { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); color: #d7eefa; border-radius: 6px; width: 28px; height: 28px; cursor: pointer; font-size: 16px; line-height: 1; }
    .close:hover { background: rgba(79,195,247,.18); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .grid > div { display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #4fc3f7; }
    .footnote { margin: 10px 0 0; font-size: 10px; color: #7798ad; font-style: italic; }
  `]
})
export class AircraftPopupComponent {
  readonly event = input<AircraftItem | null>(null);
  readonly close = output<void>();
}
