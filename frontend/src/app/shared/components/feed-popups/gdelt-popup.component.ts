import { Component, computed, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { GdeltEvent } from '../../models/gdelt.model';
import { TranslatePipe } from '../../i18n/t.pipe';

@Component({
  selector: 'app-gdelt-popup',
  imports: [DatePipe, DecimalPipe, TranslatePipe],
  template: `
    @if (event(); as ev) {
      <aside class="popup" role="dialog" [style.--accent]="toneColor()">
        <header>
          <span class="dot"></span>
          <h3>{{ ev.title || ('popup.gdelt.untitled' | t) }}</h3>
          <button class="close" (click)="close.emit()" [attr.aria-label]="'popup.close' | t">×</button>
        </header>
        <div class="grid">
          <div><span class="label">{{ 'popup.location' | t }}</span><span>{{ ev.lat | number:'1.2-2' }}, {{ ev.lng | number:'1.2-2' }}</span></div>
          <div><span class="label">{{ 'popup.source' | t }}</span><span>{{ ev.source }}</span></div>
          <div><span class="label">{{ 'popup.gdelt.tone' | t }}</span><span>{{ ev.tone | number:'1.1-1' }}</span></div>
          @if (ev.language) {
            <div><span class="label">{{ 'popup.gdelt.language' | t }}</span><span>{{ ev.language }}</span></div>
          }
          @if (ev.time) {
            <div><span class="label">{{ 'popup.time' | t }}</span><span>{{ ev.time | date:'short' }}</span></div>
          }
        </div>
        @if (ev.url) {
          <a class="ext" [href]="ev.url" target="_blank" rel="noopener">{{ 'popup.gdelt.openArticle' | t }}</a>
        }
        <p class="footnote">{{ 'popup.gdelt.footnote' | t }}</p>
      </aside>
    }
  `,
  styles: [`
    .popup {
      position: absolute; top: 80px; right: 16px; width: 340px; padding: 16px;
      background: rgba(10, 22, 26, 0.94); backdrop-filter: blur(16px);
      border: 1px solid var(--accent, rgba(128, 222, 234, 0.32)); border-radius: 14px;
      color: #d2e9ec; z-index: 14; box-shadow: 0 8px 28px rgba(0,0,0,.45);
    }
    header { display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: flex-start; margin-bottom: 12px; }
    header h3 { margin: 0; font-size: 13px; font-weight: 600; color: #effaff; line-height: 1.3; max-height: 3.6em; overflow: hidden; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent, #80deea); margin-top: 3px; }
    .close { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); color: #d2e9ec; border-radius: 6px; width: 28px; height: 28px; cursor: pointer; font-size: 16px; line-height: 1; }
    .close:hover { background: rgba(128,222,234,.16); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .grid > div { display: flex; flex-direction: column; gap: 2px; font-size: 12px; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: var(--accent, #80deea); }
    .ext { display: inline-block; margin-top: 10px; color: var(--accent, #80deea); text-decoration: none; font-size: 12px; }
    .ext:hover { text-decoration: underline; }
    .footnote { margin: 10px 0 0; font-size: 10px; color: #6c8a8e; font-style: italic; }
  `]
})
export class GdeltPopupComponent {
  readonly event = input<GdeltEvent | null>(null);
  readonly close = output<void>();

  protected readonly toneColor = computed(() => {
    const ev = this.event();
    if (!ev) return '#80deea';
    const t = Math.max(-10, Math.min(10, ev.tone));
    const norm = (t + 10) / 20;
    const hue = norm * 120;
    return `hsl(${hue.toFixed(0)}, 60%, 55%)`;
  });
}
