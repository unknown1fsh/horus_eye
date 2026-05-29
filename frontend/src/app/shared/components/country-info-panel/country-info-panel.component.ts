import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CountryDetail } from '../../models/country.model';

@Component({
  selector: 'app-country-info-panel',
  imports: [DecimalPipe],
  template: `
    @if (country(); as c) {
      <div class="panel">
        <button class="close-btn" (click)="close.emit()">✕</button>

        @if (c.flagUrl) {
          <div class="flag-container">
            <img [src]="c.flagUrl" [alt]="c.name + ' bayrağı'" class="flag" />
          </div>
        }

        <h2 class="country-name">{{ c.name }}</h2>

        @if (c.nativeName) {
          <p class="native-name">{{ c.nativeName }}</p>
        }

        <div class="info-grid">
          @if (c.capital) {
            <div class="info-item">
              <span class="label">Başkent</span>
              <span class="value">{{ c.capital }}</span>
            </div>
          }

          @if (c.continentName) {
            <div class="info-item">
              <span class="label">Kıta</span>
              <span class="value">{{ c.continentName }}</span>
            </div>
          }

          @if (c.population) {
            <div class="info-item">
              <span class="label">Nüfus</span>
              <span class="value">{{ c.population | number }} </span>
            </div>
          }

          @if (c.areaKm2) {
            <div class="info-item">
              <span class="label">Yüzölçümü</span>
              <span class="value">{{ c.areaKm2 | number }} km²</span>
            </div>
          }

          @if (c.currencyName) {
            <div class="info-item">
              <span class="label">Para Birimi</span>
              <span class="value">{{ c.currencyName }} ({{ c.currencyCode }})</span>
            </div>
          }

          @if (c.phoneCode) {
            <div class="info-item">
              <span class="label">Telefon Kodu</span>
              <span class="value">{{ c.phoneCode }}</span>
            </div>
          }

          @if (c.timezone) {
            <div class="info-item">
              <span class="label">Zaman Dilimi</span>
              <span class="value">{{ c.timezone }}</span>
            </div>
          }
        </div>

        @if (c.languages.length > 0) {
          <div class="section">
            <h3 class="section-title">Diller</h3>
            <div class="tags">
              @for (lang of c.languages; track lang) {
                <span class="tag">{{ lang }}</span>
              }
            </div>
          </div>
        }

        @if (c.borderCountries.length > 0) {
          <div class="section">
            <h3 class="section-title">Sınır Komşuları</h3>
            <div class="tags">
              @for (border of c.borderCountries; track border) {
                <span class="tag">{{ border }}</span>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .panel {
      position: absolute;
      top: 0;
      right: 0;
      width: 360px;
      height: 100%;
      background: rgba(13, 27, 42, 0.92);
      backdrop-filter: blur(20px);
      border-left: 1px solid rgba(0, 212, 255, 0.15);
      padding: 24px;
      overflow-y: auto;
      color: #f0f4f8;
      z-index: 10;
    }
    .close-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      background: none;
      border: 1px solid rgba(255,255,255,0.1);
      color: #8899aa;
      font-size: 16px;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .close-btn:hover {
      background: rgba(255,255,255,0.05);
      color: #f0f4f8;
    }
    .flag-container {
      width: 100%;
      height: 160px;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 16px;
      background: rgba(255,255,255,0.05);
    }
    .flag {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .country-name {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: #f0f4f8;
    }
    .native-name {
      font-size: 14px;
      color: #8899aa;
      margin: 0 0 20px 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #00d4ff;
      font-weight: 500;
    }
    .value {
      font-size: 14px;
      color: #f0f4f8;
    }
    .section {
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #00d4ff;
      margin: 0 0 8px 0;
      font-weight: 500;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .tag {
      background: rgba(0, 212, 255, 0.1);
      border: 1px solid rgba(0, 212, 255, 0.2);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      color: #c0d0e0;
    }
    @media (max-width: 768px) {
      .panel {
        width: 100%;
        height: 50%;
        top: auto;
        bottom: 0;
        border-left: none;
        border-top: 1px solid rgba(0, 212, 255, 0.15);
      }
    }
  `]
})
export class CountryInfoPanelComponent {
  readonly country = input<CountryDetail | null>(null);
  readonly close = output<void>();
}
