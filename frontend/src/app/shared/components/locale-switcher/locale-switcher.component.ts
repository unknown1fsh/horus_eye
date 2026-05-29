import { Component, inject } from '@angular/core';
import { LocaleService } from '../../services/locale.service';
import { TranslatePipe } from '../../i18n/t.pipe';
import { SUPPORTED_LOCALES, Locale } from '../../i18n/dictionary';

@Component({
  selector: 'app-locale-switcher',
  imports: [TranslatePipe],
  template: `
    <div class="switcher" role="group" [attr.aria-label]="'locale.switcher.label' | t">
      @for (loc of locales; track loc) {
        <button
          type="button"
          class="locale-btn"
          [class.active]="locale.locale() === loc"
          (click)="select(loc)"
          [attr.aria-pressed]="locale.locale() === loc"
        >
          {{ ('locale.switcher.' + loc) | t }}
        </button>
      }
    </div>
  `,
  styles: [`
    .switcher {
      display: inline-flex;
      gap: 2px;
      padding: 3px;
      background: var(--panel-bg, rgba(8, 14, 26, 0.78));
      backdrop-filter: blur(12px);
      border: 1px solid var(--panel-border, rgba(0, 212, 255, 0.12));
      border-radius: 999px;
    }
    .locale-btn {
      background: transparent;
      border: 0;
      color: var(--fg-muted, #8a9aae);
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .locale-btn:hover { color: var(--fg-strong, #e8eef5); }
    .locale-btn.active {
      background: linear-gradient(180deg, #00d4ff, #007aaa);
      color: #002030;
      box-shadow: 0 4px 12px rgba(0, 212, 255, 0.22);
    }
  `]
})
export class LocaleSwitcherComponent {
  protected readonly locale = inject(LocaleService);
  protected readonly locales = SUPPORTED_LOCALES;

  select(next: Locale): void {
    this.locale.setLocale(next);
  }
}
