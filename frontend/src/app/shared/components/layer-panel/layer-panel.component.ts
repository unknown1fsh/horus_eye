import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { LayerStateService } from '../../services/layer-state.service';
import { LocaleService } from '../../services/locale.service';
import { TranslatePipe } from '../../i18n/t.pipe';
import { LayerId, layerName } from '../../models/layer.model';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-layer-panel',
  imports: [DatePipe, DecimalPipe, TranslatePipe, SkeletonComponent],
  template: `
    <aside class="panel" [class.collapsed]="collapsed()" [attr.aria-expanded]="!collapsed()">
      <button
        type="button"
        class="toggle-btn"
        (click)="collapsed.set(!collapsed())"
        [attr.aria-label]="(collapsed() ? 'panel.layers.toggleOpen' : 'panel.layers.toggleClose') | t"
        [title]="'panel.layers.title' | t"
      >
        @if (collapsed()) {
          <span class="toggle-icon">≡</span>
        } @else {
          <span class="toggle-icon">×</span>
        }
      </button>

      @if (!collapsed()) {
        <header class="panel-header">
          <h2 class="title">{{ 'panel.layers.title' | t }}</h2>
          <span class="subtitle">
            {{ enabledCount() }} {{ 'panel.layers.activeCount' | t }} ·
            {{ totalLayers }} {{ 'panel.layers.totalCount' | t }}
          </span>
        </header>

        <ul class="layer-list" role="list">
          @for (def of definitions; track def.id) {
            <li
              class="layer-row"
              [class.enabled]="state()[def.id].enabled"
              [style.--accent]="def.accentColor"
            >
              <div class="row-main">
                <button
                  type="button"
                  class="row-toggle"
                  role="switch"
                  [attr.aria-checked]="state()[def.id].enabled"
                  (click)="onToggle(def.id)"
                >
                  <span class="icon" aria-hidden="true">{{ def.icon }}</span>
                  <span class="label">{{ layerLabel(def.id) }}</span>
                  <span class="switch" [class.on]="state()[def.id].enabled">
                    <span class="switch-thumb"></span>
                  </span>
                </button>
              </div>

              @if (state()[def.id].enabled) {
                <div class="row-detail">
                  <div class="opacity-row">
                    <label class="opacity-label" [for]="def.id + '-opacity'">{{ 'panel.layers.opacity' | t }}</label>
                    <input
                      [id]="def.id + '-opacity'"
                      type="range"
                      min="0"
                      max="100"
                      [value]="state()[def.id].opacity * 100"
                      (input)="onOpacity(def.id, $event)"
                    />
                    <span class="opacity-value">{{ (state()[def.id].opacity * 100) | number:'1.0-0' }}%</span>
                  </div>

                  <div class="meta-row">
                    @if (state()[def.id].loading) {
                      <span class="meta loading">
                        {{ 'panel.layers.loading' | t }}
                        <app-skeleton shape="chip" />
                      </span>
                    } @else if (state()[def.id].error; as err) {
                      <span class="meta error" [title]="err">{{ 'panel.layers.error' | t }}</span>
                    } @else if (state()[def.id].count != null) {
                      <span class="meta count">{{ state()[def.id].count }} {{ 'panel.layers.records' | t }}</span>
                    } @else {
                      <span class="meta pending">{{ 'panel.layers.waiting' | t }}</span>
                    }
                    @if (state()[def.id].lastUpdate; as ts) {
                      <span class="meta timestamp" [title]="ts | date:'medium'">
                        {{ relativeTime(ts) }}
                      </span>
                    }
                  </div>
                </div>
              }
            </li>
          }
        </ul>

        <footer class="panel-footer">
          <button type="button" class="reset-btn" (click)="onReset()">{{ 'panel.layers.reset' | t }}</button>
        </footer>
      }
    </aside>
  `,
  styles: [`
    .panel {
      position: absolute;
      top: 80px;
      left: 16px;
      width: 320px;
      max-height: calc(100vh - 120px);
      display: flex;
      flex-direction: column;
      background: var(--panel-bg, rgba(8, 14, 26, 0.78));
      backdrop-filter: blur(18px);
      border: 1px solid var(--panel-border, rgba(0, 212, 255, 0.12));
      border-radius: 14px;
      box-shadow: var(--panel-shadow, 0 8px 32px rgba(0, 0, 0, 0.4));
      color: var(--fg-base, #e8eef5);
      z-index: 12;
      transition: width 0.18s ease, max-height 0.18s ease, background 0.28s, border-color 0.28s, color 0.28s;
      overflow: hidden;
    }
    .panel.collapsed {
      width: 44px;
      max-height: 44px;
    }
    .toggle-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cfe2ee;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
      z-index: 2;
    }
    .toggle-btn:hover { background: rgba(0, 212, 255, 0.18); color: #fff; }
    .toggle-icon { font-size: 16px; line-height: 1; }

    .panel-header {
      padding: 16px 18px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .title {
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent-cyan, #00d4ff);
      font-weight: 600;
      margin: 0;
    }
    .subtitle { font-size: 12px; color: var(--fg-muted, #8a9aae); }

    .layer-list {
      list-style: none;
      margin: 0;
      padding: 4px 10px 6px;
      overflow-y: auto;
      flex: 1;
    }
    .layer-row {
      border-radius: 10px;
      margin: 4px 0;
      padding: 6px 8px;
      transition: background 0.15s;
    }
    .layer-row.enabled {
      background: linear-gradient(180deg, rgba(0, 212, 255, 0.06), transparent 70%);
      box-shadow: inset 0 0 0 1px var(--accent, rgba(0, 212, 255, 0.18));
    }
    .row-toggle {
      width: 100%;
      background: transparent;
      border: 0;
      color: inherit;
      cursor: pointer;
      display: grid;
      grid-template-columns: 24px 1fr auto;
      align-items: center;
      gap: 10px;
      padding: 6px 4px;
      border-radius: 8px;
      font-size: 14px;
      text-align: left;
    }
    .row-toggle:hover { background: rgba(255, 255, 255, 0.04); }
    .icon {
      font-size: 16px;
      color: var(--accent, #00d4ff);
      text-align: center;
    }
    .label { color: var(--fg-base, #e6edf3); }
    .switch {
      width: 32px;
      height: 18px;
      background: rgba(255, 255, 255, 0.12);
      border-radius: 999px;
      position: relative;
      transition: background 0.15s;
    }
    .switch.on { background: var(--accent, #00d4ff); }
    .switch-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #fff;
      transition: transform 0.15s ease;
    }
    .switch.on .switch-thumb { transform: translateX(14px); }

    .row-detail {
      padding: 6px 6px 4px 36px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .opacity-row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 8px;
      align-items: center;
      font-size: 11px;
    }
    .opacity-label { color: #8a9aae; text-transform: uppercase; letter-spacing: 0.05em; }
    .opacity-row input[type="range"] {
      accent-color: var(--accent, #00d4ff);
      width: 100%;
    }
    .opacity-value { color: #cfe2ee; min-width: 36px; text-align: right; }

    .meta-row {
      display: flex;
      gap: 8px;
      font-size: 11px;
      color: #8a9aae;
    }
    .meta { display: inline-flex; align-items: center; }
    .meta.loading { color: #ffd54f; }
    .meta.error { color: #ff5252; }
    .meta.count { color: var(--accent, #00d4ff); font-weight: 500; }
    .meta.timestamp::before { content: '· '; }

    .panel-footer {
      padding: 8px 16px 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .reset-btn {
      width: 100%;
      padding: 6px 8px;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #8a9aae;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.15s;
    }
    .reset-btn:hover { color: #fff; border-color: rgba(0, 212, 255, 0.3); }

    @media (max-width: 768px) {
      .panel {
        top: auto;
        bottom: 16px;
        left: 16px;
        right: 16px;
        width: auto;
        max-height: 45vh;
      }
    }
  `]
})
export class LayerPanelComponent {
  private readonly layerState = inject(LayerStateService);
  private readonly localeService = inject(LocaleService);

  readonly definitions = this.layerState.definitions;
  readonly totalLayers = this.layerState.definitions.length;
  readonly state = this.layerState.state;
  readonly enabledCount = computed(() => this.layerState.enabledLayers().length);

  readonly collapsed = signal(false);

  layerLabel(id: LayerId): string {
    const def = this.definitions.find(d => d.id === id);
    return def ? layerName(def, this.localeService.locale()) : id;
  }

  onToggle(id: LayerId): void {
    this.layerState.toggle(id);
  }

  onOpacity(id: LayerId, event: Event): void {
    const raw = (event.target as HTMLInputElement).valueAsNumber;
    this.layerState.setOpacity(id, raw / 100);
  }

  onReset(): void {
    this.layerState.resetDefaults();
  }

  relativeTime(ts: number): string {
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    const t = (k: string) => this.localeService.t(k);
    if (diffSec < 5) return t('panel.layers.now');
    if (diffSec < 60) return `${diffSec}${t('panel.layers.secondsAgo')}`;
    const min = Math.floor(diffSec / 60);
    if (min < 60) return `${min}${t('panel.layers.minutesAgo')}`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}${t('panel.layers.hoursAgo')}`;
    return `${Math.floor(hr / 24)}${t('panel.layers.daysAgo')}`;
  }
}
