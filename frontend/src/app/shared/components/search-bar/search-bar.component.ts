import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Country } from '../../models/country.model';
import { TranslatePipe } from '../../i18n/t.pipe';
import { LocaleService } from '../../services/locale.service';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-search-bar',
  imports: [FormsModule, TranslatePipe, SkeletonComponent],
  template: `
    <div class="search-container">
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          [(ngModel)]="searchTerm"
          (input)="onSearch()"
          (keydown)="onKeydown($event)"
          (focus)="dropdownOpen.set(true)"
          [placeholder]="placeholder()"
          class="search-input"
          autocomplete="off"
        />
        @if (loading()) {
          <span class="search-spinner" aria-hidden="true"></span>
        }
      </div>

      @if (dropdownOpen() && searchTerm.length > 0) {
        <ul class="search-results" role="listbox">
          @if (loading()) {
            <li class="search-result-item muted">{{ 'search.searching' | t }}</li>
            @for (i of [0,1,2]; track i) {
              <li class="search-result-item">
                <app-skeleton shape="bar" width="60%" height="12px" />
                <app-skeleton shape="bar" width="35%" height="10px" />
              </li>
            }
          } @else if (results().length === 0) {
            <li class="search-result-item muted">{{ 'search.noResults' | t }}</li>
          } @else {
            @for (country of results(); track country.isoCode; let i = $index) {
              <li
                role="option"
                class="search-result-item"
                [class.active]="i === highlightedIndex()"
                (mousedown)="selectCountry(country)"
              >
                <span class="country-name">{{ country.name }}</span>
                <span class="country-meta">{{ country.isoCode }} · {{ country.continentName }}</span>
              </li>
            }
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .search-container {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 20;
      width: 360px;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--panel-bg, rgba(13, 27, 42, 0.85));
      backdrop-filter: blur(12px);
      border: 1px solid var(--panel-border, rgba(0, 212, 255, 0.15));
      border-radius: 12px;
      padding: 10px 16px;
      transition: all 0.3s;
    }
    .search-box:focus-within {
      border-color: rgba(0, 212, 255, 0.5);
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.1);
    }
    .search-icon {
      color: #8899aa;
      flex-shrink: 0;
    }
    .search-input {
      background: none;
      border: none;
      outline: none;
      color: var(--fg-base, #f0f4f8);
      font-size: 14px;
      width: 100%;
      font-family: 'Inter', sans-serif;
    }
    .search-input::placeholder {
      color: var(--fg-muted, #556677);
    }
    .search-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(0, 212, 255, 0.2);
      border-top-color: #00d4ff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .search-results {
      list-style: none;
      margin: 8px 0 0;
      padding: 6px;
      background: var(--bg-elev-2, rgba(13, 27, 42, 0.95));
      border: 1px solid var(--panel-border, rgba(0, 212, 255, 0.15));
      border-radius: 12px;
      max-height: 280px;
      overflow-y: auto;
      backdrop-filter: blur(12px);
    }
    .search-result-item {
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .search-result-item:hover,
    .search-result-item.active {
      background: rgba(0, 212, 255, 0.12);
    }
    .search-result-item.muted {
      cursor: default;
      color: #8899aa;
      font-size: 13px;
    }
    .country-name {
      color: var(--fg-base, #f0f4f8);
      font-size: 14px;
      font-weight: 500;
    }
    .country-meta {
      color: var(--fg-muted, #8899aa);
      font-size: 12px;
    }
  `]
})
export class SearchBarComponent {
  readonly results = input<Country[]>([]);
  readonly loading = input(false);

  readonly searchChange = output<string>();
  readonly countrySelected = output<Country>();

  private readonly localeService = inject(LocaleService);

  protected searchTerm = '';
  protected readonly dropdownOpen = signal(false);
  protected readonly highlightedIndex = signal(0);

  protected placeholder(): string {
    // Read locale signal to make the placeholder reactive to language switches.
    this.localeService.locale();
    return this.localeService.t('search.placeholder');
  }

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  protected onSearch(): void {
    this.dropdownOpen.set(true);
    this.highlightedIndex.set(0);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.searchChange.emit(this.searchTerm);
    }, 300);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const items = this.results();
    if (!this.dropdownOpen() || items.length === 0) {
      if (event.key === 'Escape') {
        this.dropdownOpen.set(false);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlightedIndex.update(i => Math.min(i + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedIndex.update(i => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const idx = this.highlightedIndex();
      if (items[idx]) {
        this.selectCountry(items[idx]);
      }
    } else if (event.key === 'Escape') {
      this.dropdownOpen.set(false);
    }
  }

  protected selectCountry(country: Country): void {
    this.searchTerm = country.name;
    this.dropdownOpen.set(false);
    this.countrySelected.emit(country);
  }
}
