import { Component, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { IssPosition } from '../../models/iss.model';
import { TranslatePipe } from '../../i18n/t.pipe';

@Component({
  selector: 'app-iss-popup',
  imports: [DatePipe, DecimalPipe, TranslatePipe],
  template: `
    @if (event(); as iss) {
      <aside class="popup" role="dialog">
        <header>
          <span class="icon">◊</span>
          <h3>{{ 'popup.iss.title' | t }}</h3>
          <button class="close" (click)="close.emit()" [attr.aria-label]="'popup.close' | t">×</button>
        </header>
        <div class="grid">
          <div><span class="label">{{ 'popup.location' | t }}</span><span>{{ iss.lat | number:'1.2-2' }}, {{ iss.lng | number:'1.2-2' }}</span></div>
          <div><span class="label">{{ 'popup.iss.altitude' | t }}</span><span>{{ iss.altitudeKm | number:'1.0-1' }} km</span></div>
          <div><span class="label">{{ 'popup.iss.velocity' | t }}</span><span>{{ iss.velocityKmh | number:'1.0-0' }} km/h</span></div>
          <div><span class="label">{{ 'popup.iss.footprint' | t }}</span><span>{{ iss.footprintKm | number:'1.0-0' }} km</span></div>
          <div><span class="label">{{ 'popup.time' | t }}</span><span>{{ iss.timestamp | date:'medium' }}</span></div>
        </div>
        <p class="footnote">{{ 'popup.iss.footnote' | t }}</p>
      </aside>
    }
  `,
  styles: [`
    .popup {
      position: absolute; top: 80px; right: 16px; width: 320px; padding: 16px;
      background: rgba(6, 22, 32, 0.94); backdrop-filter: blur(16px);
      border: 1px solid rgba(0, 229, 255, 0.32); border-radius: 14px;
      color: #c0f4ff; z-index: 14; box-shadow: 0 8px 28px rgba(0,0,0,.45);
    }
    header { display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: center; margin-bottom: 12px; }
    header h3 { margin: 0; font-size: 14px; font-weight: 600; color: #e0fbff; }
    .icon { color: #00e5ff; font-size: 14px; }
    .close { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); color: #c0f4ff; border-radius: 6px; width: 28px; height: 28px; cursor: pointer; font-size: 16px; line-height: 1; }
    .close:hover { background: rgba(0,229,255,.18); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .grid > div { display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #00e5ff; }
    .footnote { margin: 10px 0 0; font-size: 10px; color: #5e95a3; font-style: italic; }
  `]
})
export class IssPopupComponent {
  readonly event = input<IssPosition | null>(null);
  readonly close = output<void>();
}
