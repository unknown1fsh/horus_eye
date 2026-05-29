import { Component, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { WildfireItem } from '../../models/wildfire.model';
import { TranslatePipe } from '../../i18n/t.pipe';

@Component({
  selector: 'app-wildfire-popup',
  imports: [DatePipe, DecimalPipe, TranslatePipe],
  template: `
    @if (event(); as fire) {
      <aside class="popup" role="dialog" aria-modal="false">
        <header class="head">
          <span class="icon" aria-hidden="true">▲</span>
          <h3 class="title">{{ fire.title }}</h3>
          <button type="button" class="close" (click)="close.emit()" [attr.aria-label]="'popup.close' | t">×</button>
        </header>

        <div class="grid">
          <div class="cell">
            <span class="label">{{ 'popup.time' | t }}</span>
            <span class="value">{{ fire.time | date:'medium' }}</span>
          </div>
          <div class="cell">
            <span class="label">{{ 'popup.location' | t }}</span>
            <span class="value">{{ fire.lat | number:'1.2-2' }}, {{ fire.lng | number:'1.2-2' }}</span>
          </div>
        </div>

        @if (fire.sources.length > 0) {
          <div class="sources">
            <span class="label">{{ 'popup.fire.sources' | t }}</span>
            <ul>
              @for (src of fire.sources; track src.id) {
                <li><a [href]="src.url" target="_blank" rel="noopener">{{ src.id }} ↗</a></li>
              }
            </ul>
          </div>
        }

        <p class="footnote">{{ 'popup.fire.footnote' | t }}</p>
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
      background: rgba(28, 18, 6, 0.92);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 179, 0, 0.32);
      border-radius: 14px;
      color: #fff2d6;
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
    .icon { color: #ffb300; font-size: 14px; }
    .title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #fff2d6;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .close {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #fff2d6;
      border-radius: 6px;
      width: 28px;
      height: 28px;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
    }
    .close:hover { background: rgba(255, 179, 0, 0.18); }
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
      color: #ffb300;
    }
    .value { font-size: 13px; color: #fff7e0; }
    .sources ul {
      list-style: none;
      padding: 0;
      margin: 6px 0 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sources a {
      color: #ffc966;
      text-decoration: none;
      font-size: 12px;
    }
    .sources a:hover { text-decoration: underline; }
    .footnote {
      margin: 10px 0 0;
      font-size: 10px;
      color: #b39062;
      font-style: italic;
    }
  `]
})
export class WildfirePopupComponent {
  readonly event = input<WildfireItem | null>(null);
  readonly close = output<void>();
}
