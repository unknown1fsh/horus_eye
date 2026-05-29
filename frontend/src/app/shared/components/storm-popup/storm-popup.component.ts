import { Component, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { StormItem } from '../../models/storm.model';
import { TranslatePipe } from '../../i18n/t.pipe';

@Component({
  selector: 'app-storm-popup',
  imports: [DatePipe, DecimalPipe, TranslatePipe],
  template: `
    @if (event(); as storm) {
      <aside class="popup" role="dialog" aria-modal="false">
        <header class="head">
          <span class="icon" aria-hidden="true">✺</span>
          <h3 class="title">{{ storm.title }}</h3>
          <button type="button" class="close" (click)="close.emit()" [attr.aria-label]="'popup.close' | t">×</button>
        </header>

        <div class="grid">
          <div class="cell">
            <span class="label">{{ 'popup.storm.lastPosition' | t }}</span>
            <span class="value">{{ storm.lat | number:'1.2-2' }}, {{ storm.lng | number:'1.2-2' }}</span>
          </div>
          <div class="cell">
            <span class="label">{{ 'popup.storm.lastUpdate' | t }}</span>
            <span class="value">{{ storm.time | date:'medium' }}</span>
          </div>
          <div class="cell">
            <span class="label">{{ 'popup.storm.trackPoints' | t }}</span>
            <span class="value">{{ storm.track.length }}</span>
          </div>
        </div>

        @if (storm.sources.length > 0) {
          <div class="sources">
            <span class="label">{{ 'popup.storm.sources' | t }}</span>
            <ul>
              @for (src of storm.sources; track src.id) {
                <li><a [href]="src.url" target="_blank" rel="noopener">{{ src.id }} ↗</a></li>
              }
            </ul>
          </div>
        }

        <p class="footnote">{{ 'popup.storm.footnote' | t }}</p>
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
      background: rgba(20, 14, 30, 0.92);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(124, 77, 255, 0.32);
      border-radius: 14px;
      color: #ece0ff;
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
    .icon { color: #9c7dff; font-size: 14px; }
    .title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #f3eaff;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .close {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #ece0ff;
      border-radius: 6px;
      width: 28px;
      height: 28px;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
    }
    .close:hover { background: rgba(124, 77, 255, 0.18); }
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
      color: #9c7dff;
    }
    .value { font-size: 13px; color: #f3eaff; }
    .sources ul {
      list-style: none;
      padding: 0;
      margin: 6px 0 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sources a { color: #c4a8ff; text-decoration: none; font-size: 12px; }
    .sources a:hover { text-decoration: underline; }
    .footnote {
      margin: 10px 0 0;
      font-size: 10px;
      color: #8e7ab1;
      font-style: italic;
    }
  `]
})
export class StormPopupComponent {
  readonly event = input<StormItem | null>(null);
  readonly close = output<void>();
}
