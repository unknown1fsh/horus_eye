import { Component, OnInit, output, signal } from '@angular/core';
import { TranslatePipe } from '../../i18n/t.pipe';

const STORAGE_KEY = 'horus-eye.disclaimer-accepted.v1';

interface FeedSourceEntry {
  readonly name: string;
  readonly url: string;
  readonly license: string;
}

const FEED_SOURCES: readonly FeedSourceEntry[] = [
  { name: 'USGS Earthquakes', url: 'https://earthquake.usgs.gov/earthquakes/feed/', license: 'public-domain (US Gov)' },
  { name: 'NASA EONET — Natural Events', url: 'https://eonet.gsfc.nasa.gov/', license: 'public-domain (NASA)' },
  { name: 'OpenSky Network — ADS-B', url: 'https://opensky-network.org/', license: 'free non-commercial' },
  { name: 'wheretheiss.at — ISS', url: 'https://wheretheiss.at/', license: 'free public API' },
  { name: 'GDELT Project DOC 2.0', url: 'https://www.gdeltproject.org/', license: 'open data' },
  { name: 'Natural Earth — country borders', url: 'https://www.naturalearthdata.com/', license: 'public-domain' },
  { name: 'Public webcam catalog (curated)', url: '#', license: 'embed-permitted only' },
  { name: 'REST Countries v3.1', url: 'https://restcountries.com/', license: 'MPL 2.0' }
];

@Component({
  selector: 'app-disclaimer-modal',
  imports: [TranslatePipe],
  template: `
    @if (visible()) {
      <div class="backdrop" role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
        <div class="modal">
          <header>
            <span class="badge">{{ 'disclaimer.badge' | t }}</span>
            <h2 id="disclaimer-title">{{ 'disclaimer.title' | t }}</h2>
          </header>

          <div class="body">
            <p>{{ 'disclaimer.body' | t }}</p>

            <ul class="rules">
              <li>{{ 'disclaimer.rule1' | t }}</li>
              <li>{{ 'disclaimer.rule2' | t }}</li>
              <li>{{ 'disclaimer.rule3' | t }}</li>
              <li>{{ 'disclaimer.rule4' | t }}</li>
            </ul>

            <details class="sources">
              <summary>{{ 'disclaimer.sourcesSummary' | t }}</summary>
              <ul>
                @for (s of sources; track s.name) {
                  <li>
                    <span class="src-name">{{ s.name }}</span>
                    @if (s.url !== '#') {
                      <a [href]="s.url" target="_blank" rel="noopener">↗</a>
                    }
                    <span class="src-license">{{ s.license }}</span>
                  </li>
                }
              </ul>
            </details>
          </div>

          <footer>
            <label class="remember">
              <input type="checkbox" [checked]="remember()" (change)="onRememberChange($event)" />
              <span>{{ 'disclaimer.remember' | t }}</span>
            </label>
            <button type="button" class="accept" (click)="accept()">{{ 'disclaimer.accept' | t }}</button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 24px;
    }
    .modal {
      width: min(720px, 100%);
      max-height: calc(100vh - 48px);
      background: var(--bg-elev-2, linear-gradient(180deg, rgba(12, 22, 36, 0.96), rgba(6, 12, 22, 0.96)));
      border: 1px solid var(--panel-border, rgba(0, 212, 255, 0.22));
      border-radius: 16px;
      color: var(--fg-base, #e8eef5);
      box-shadow: var(--panel-shadow, 0 24px 64px rgba(0, 0, 0, 0.55));
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    header {
      padding: 22px 28px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent-cyan, #00d4ff);
      background: rgba(0, 212, 255, 0.12);
      padding: 4px 10px;
      border-radius: 999px;
      margin-bottom: 10px;
    }
    h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--fg-strong, #f3f8fb);
    }
    .body {
      padding: 18px 28px;
      overflow-y: auto;
      flex: 1;
      font-size: 14px;
      line-height: 1.55;
    }
    .body p { margin: 0 0 12px; color: #c5d2dd; }
    .body strong { color: #ffffff; }
    .rules {
      margin: 12px 0 18px;
      padding-left: 18px;
      color: #c5d2dd;
    }
    .rules li { margin-bottom: 6px; }
    .sources {
      margin-top: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 14px;
    }
    .sources summary {
      cursor: pointer;
      color: #00d4ff;
      font-weight: 600;
      font-size: 13px;
      letter-spacing: 0.03em;
    }
    .sources ul {
      list-style: none;
      padding: 12px 0 0;
      margin: 0;
      display: grid;
      grid-template-columns: 1fr;
      gap: 6px;
      font-size: 12px;
    }
    .sources li {
      display: flex;
      gap: 6px;
      align-items: center;
      color: #c5d2dd;
    }
    .src-name { font-weight: 500; color: #e8eef5; }
    .src-license {
      margin-left: auto;
      color: #7a90a3;
      font-size: 11px;
    }
    .sources a {
      color: #00d4ff;
      text-decoration: none;
    }
    footer {
      padding: 18px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      background: rgba(0, 0, 0, 0.18);
    }
    .remember {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #8a9aae;
      cursor: pointer;
    }
    .accept {
      background: linear-gradient(180deg, #00d4ff, #007aaa);
      border: 0;
      color: #002030;
      padding: 10px 22px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
      box-shadow: 0 6px 18px rgba(0, 212, 255, 0.28);
      transition: transform 0.12s ease;
    }
    .accept:hover { transform: translateY(-1px); }
    .accept:active { transform: translateY(0); }

    @media (max-width: 600px) {
      footer {
        flex-direction: column;
        align-items: stretch;
      }
      .accept { width: 100%; }
    }
  `]
})
export class DisclaimerModalComponent implements OnInit {
  readonly accepted = output<void>();

  protected readonly visible = signal(false);
  protected readonly remember = signal(true);
  protected readonly sources = FEED_SOURCES;

  ngOnInit(): void {
    if (typeof localStorage === 'undefined') {
      this.visible.set(true);
      return;
    }
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) this.visible.set(true);
  }

  protected onRememberChange(event: Event): void {
    this.remember.set((event.target as HTMLInputElement).checked);
  }

  protected accept(): void {
    if (this.remember() && typeof localStorage !== 'undefined') {
      try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()); } catch { /* ignore */ }
    }
    this.visible.set(false);
    this.accepted.emit();
  }
}
