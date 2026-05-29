import { Injectable, computed, signal } from '@angular/core';
import { DEFAULT_LOCALE, DICTIONARIES, Locale, SUPPORTED_LOCALES } from '../i18n/dictionary';

const STORAGE_KEY = 'horus-eye.locale.v1';
const QUERY_PARAM = 'lang';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly _locale = signal<Locale>(this.resolveInitialLocale());

  readonly locale = this._locale.asReadonly();
  readonly dictionary = computed(() => DICTIONARIES[this._locale()]);

  setLocale(next: Locale): void {
    if (!SUPPORTED_LOCALES.includes(next) || next === this._locale()) return;
    this._locale.set(next);
    this.persist(next);
    this.updateQueryParam(next);
  }

  toggle(): void {
    this.setLocale(this._locale() === 'tr' ? 'en' : 'tr');
  }

  /**
   * Translate a key against the active locale. Falls back to the TR dictionary
   * and finally to the key itself so missing entries surface visually instead
   * of silently rendering blanks.
   */
  t(key: string): string {
    return this.dictionary()[key] ?? DICTIONARIES.tr[key] ?? key;
  }

  private resolveInitialLocale(): Locale {
    if (typeof window === 'undefined') return DEFAULT_LOCALE;
    try {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get(QUERY_PARAM)?.toLowerCase();
      if (fromQuery && this.isSupported(fromQuery)) return fromQuery;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && this.isSupported(stored)) return stored;
    } catch {
      /* SSR / storage disabled — fall through */
    }
    return DEFAULT_LOCALE;
  }

  private isSupported(value: string): value is Locale {
    return (SUPPORTED_LOCALES as readonly string[]).includes(value);
  }

  private persist(locale: Locale): void {
    try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* ignore */ }
  }

  private updateQueryParam(locale: Locale): void {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(QUERY_PARAM, locale);
      window.history.replaceState({}, '', url);
    } catch { /* ignore */ }
  }
}
