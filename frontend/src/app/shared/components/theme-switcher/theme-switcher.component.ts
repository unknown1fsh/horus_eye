import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

/**
 * Sun / moon toggle. Lives in the top-right dock next to the locale switcher.
 */
@Component({
  selector: 'app-theme-switcher',
  imports: [],
  template: `
    <button
      type="button"
      class="toggle"
      [class.dark]="theme.isDark()"
      (click)="theme.toggle()"
      [attr.aria-label]="theme.isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
      [title]="theme.isDark() ? 'Light' : 'Dark'"
    >
      <span class="icon" aria-hidden="true">{{ theme.isDark() ? '☾' : '☀' }}</span>
    </button>
  `,
  styles: [`
    .toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 28px;
      padding: 0;
      border-radius: 999px;
      background: var(--panel-bg, rgba(8, 14, 26, 0.78));
      backdrop-filter: blur(12px);
      border: 1px solid var(--panel-border, rgba(0, 212, 255, 0.12));
      color: var(--fg-base, #e8eef5);
      cursor: pointer;
      transition: background 0.18s ease, transform 0.12s ease, border-color 0.18s ease;
    }
    .toggle:hover { transform: translateY(-1px); border-color: var(--accent-cyan, #00d4ff); }
    .toggle.dark .icon  { color: #ffd54f; text-shadow: 0 0 8px rgba(255, 213, 79, 0.45); }
    .toggle:not(.dark) .icon { color: #ff9b3d; text-shadow: 0 0 6px rgba(255, 155, 61, 0.35); }
    .icon { font-size: 14px; line-height: 1; }
  `]
})
export class ThemeSwitcherComponent {
  protected readonly theme = inject(ThemeService);
}
