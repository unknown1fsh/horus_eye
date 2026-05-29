import { Component, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { EarthquakeItem } from '../../models/earthquake.model';
import { TranslatePipe } from '../../i18n/t.pipe';

@Component({
  selector: 'app-earthquake-popup',
  imports: [DatePipe, DecimalPipe, TranslatePipe],
  template: `
    @if (event(); as eq) {
      <aside class="popup" role="dialog" aria-modal="false">
        <header class="head">
          <span class="mag-badge" [style.background]="magnitudeColor(eq.magnitude)">
            M {{ eq.magnitude | number:'1.1-1' }}
          </span>
          <h3 class="title">{{ eq.place || ('popup.eq.unknownPlace' | t) }}</h3>
          <button type="button" class="close" (click)="close.emit()" [attr.aria-label]="'popup.close' | t">×</button>
        </header>

        <div class="grid">
          <div class="cell">
            <span class="label">{{ 'popup.time' | t }}</span>
            <span class="value">{{ eq.time | date:'medium' }}</span>
          </div>
          <div class="cell">
            <span class="label">{{ 'popup.eq.depth' | t }}</span>
            <span class="value">{{ eq.depthKm | number:'1.0-1' }} km</span>
          </div>
          <div class="cell">
            <span class="label">{{ 'popup.location' | t }}</span>
            <span class="value">{{ eq.lat | number:'1.2-2' }}, {{ eq.lng | number:'1.2-2' }}</span>
          </div>
          @if (eq.felt != null) {
            <div class="cell">
              <span class="label">{{ 'popup.eq.felt' | t }}</span>
              <span class="value">{{ eq.felt }} {{ 'popup.eq.reports' | t }}</span>
            </div>
          }
          @if (eq.significance != null) {
            <div class="cell">
              <span class="label">{{ 'popup.eq.significance' | t }}</span>
              <span class="value">{{ eq.significance }}</span>
            </div>
          }
        </div>

        @if (eq.tsunami) {
          <div class="tsunami-banner">{{ 'popup.eq.tsunamiWarning' | t }}</div>
        }

        <a [href]="eq.url" target="_blank" rel="noopener" class="usgs-link">
          {{ 'popup.eq.usgsLink' | t }}
        </a>
      </aside>
    }
  `,
  styles: [`
    .popup {
      position: absolute;
      top: 80px;
      right: 16px;
      width: 320px;
      padding: 16px;
      background: rgba(20, 14, 8, 0.92);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 112, 67, 0.3);
      border-radius: 14px;
      color: #ffd9c4;
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
      z-index: 14;
    }
    .head {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 10px;
      align-items: center;
      margin-bottom: 12px;
    }
    .mag-badge {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: #1a0a02;
      padding: 4px 10px;
      border-radius: 999px;
      white-space: nowrap;
    }
    .title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #fff2e6;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .close {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #ffd9c4;
      border-radius: 6px;
      width: 28px;
      height: 28px;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
    }
    .close:hover { background: rgba(255, 112, 67, 0.15); }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .cell { display: flex; flex-direction: column; gap: 2px; }
    .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #ff7043;
    }
    .value { font-size: 13px; color: #fff2e6; }

    .tsunami-banner {
      background: rgba(255, 71, 71, 0.18);
      border: 1px solid rgba(255, 71, 71, 0.4);
      color: #ff9a9a;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 12px;
      margin-bottom: 12px;
    }

    .usgs-link {
      display: inline-block;
      color: #ffb088;
      text-decoration: none;
      font-size: 12px;
    }
    .usgs-link:hover { text-decoration: underline; }
  `]
})
export class EarthquakePopupComponent {
  readonly event = input<EarthquakeItem | null>(null);
  readonly close = output<void>();

  protected magnitudeColor(mag: number): string {
    const t = Math.min(Math.max((mag - 1.5) / 6, 0), 1);
    const hue = 220 - t * 220;
    return `hsl(${hue.toFixed(0)}, 80%, 60%)`;
  }
}
