import { Injectable, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'horus-eye.theme.v1';
const QUERY_PARAM = 'theme';
const SUPPORTED: readonly Theme[] = ['dark', 'light'] as const;

/**
 * Theme controller — mirrors LocaleService.
 *
 * Source of truth flows:
 *   URL ?theme=… → localStorage → OS prefers-color-scheme → default 'dark'
 *
 * Sets `<html data-theme="...">` so CSS variable selectors switch instantly;
 * components only need to read the signal when they branch logic outside CSS
 * (e.g. WebGL shader uniforms).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private userPicked = false;
  private readonly _theme = signal<Theme>(this.resolveInitial());

  readonly theme = this._theme.asReadonly();

  constructor() {
    this.applyAttribute(this._theme());
    this.watchSystemPreference();
  }

  setTheme(next: Theme): void {
    if (!SUPPORTED.includes(next) || next === this._theme()) return;
    this.userPicked = true;
    this._theme.set(next);
    this.applyAttribute(next);
    this.persist(next);
    this.updateQueryParam(next);
  }

  toggle(): void {
    this.setTheme(this._theme() === 'dark' ? 'light' : 'dark');
  }

  isDark(): boolean { return this._theme() === 'dark'; }

  private resolveInitial(): Theme {
    if (typeof window === 'undefined') return 'dark';
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get(QUERY_PARAM)?.toLowerCase();
      if (q && this.isSupported(q)) { this.userPicked = true; return q; }
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && this.isSupported(stored)) { this.userPicked = true; return stored; }
      const media = window.matchMedia?.('(prefers-color-scheme: light)');
      if (media?.matches) return 'light';
    } catch { /* SSR / storage disabled */ }
    return 'dark';
  }

  private isSupported(value: string): value is Theme {
    return (SUPPORTED as readonly string[]).includes(value);
  }

  private applyAttribute(theme: Theme): void {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
  }

  private persist(theme: Theme): void {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  }

  private updateQueryParam(theme: Theme): void {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(QUERY_PARAM, theme);
      window.history.replaceState({}, '', url);
    } catch { /* ignore */ }
  }

  /** Follow OS theme as long as the user hasn't picked one explicitly. */
  private watchSystemPreference(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: light)');
    media.addEventListener?.('change', e => {
      if (this.userPicked) return;
      const next: Theme = e.matches ? 'light' : 'dark';
      if (next !== this._theme()) {
        this._theme.set(next);
        this.applyAttribute(next);
      }
    });
  }
}
