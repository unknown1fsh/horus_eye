import { Component, computed, inject } from '@angular/core';
import { RealtimeStreamService } from '../../services/realtime-stream.service';
import { LocaleService } from '../../services/locale.service';

/**
 * Live connection pill. Reads `RealtimeStreamService` state and surfaces
 * the SSE channel health (cyan = connected, amber = connecting, red = down).
 */
@Component({
  selector: 'app-stream-status',
  imports: [],
  template: `
    <div class="pill" [class.connected]="state() === 'connected'"
                       [class.connecting]="state() === 'connecting'"
                       [class.down]="state() === 'disconnected'"
         [title]="tooltip()">
      <span class="dot" aria-hidden="true"></span>
      <span class="label">{{ labelText() }}</span>
    </div>
  `,
  styles: [`
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      border-radius: 999px;
      background: var(--panel-bg, rgba(8, 14, 26, 0.78));
      backdrop-filter: blur(12px);
      border: 1px solid var(--panel-border, rgba(255, 255, 255, 0.06));
      color: var(--fg-muted, #8a9aae);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #888;
      box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
      transition: background 0.2s, box-shadow 0.4s;
    }
    .pill.connected {
      color: #00d4ff;
      border-color: rgba(0, 212, 255, 0.28);
    }
    .pill.connected .dot {
      background: #00d4ff;
      animation: live-pulse 1.6s ease-in-out infinite;
    }
    .pill.connecting {
      color: #ffd54f;
      border-color: rgba(255, 213, 79, 0.28);
    }
    .pill.connecting .dot { background: #ffd54f; }
    .pill.down {
      color: #ff5252;
      border-color: rgba(255, 82, 82, 0.28);
    }
    .pill.down .dot { background: #ff5252; }

    @keyframes live-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(0, 212, 255, 0.55); }
      50%      { box-shadow: 0 0 0 6px rgba(0, 212, 255, 0); }
    }
  `]
})
export class StreamStatusComponent {
  private readonly stream = inject(RealtimeStreamService);
  private readonly locale = inject(LocaleService);

  protected readonly state = this.stream.state;
  protected readonly labelText = computed(() => {
    this.locale.locale();
    switch (this.state()) {
      case 'connected':    return this.locale.t('status.live');
      case 'connecting':   return this.locale.t('panel.layers.loading').replace('…', '');
      default:             return this.locale.t('status.disconnected');
    }
  });
  protected readonly tooltip = computed(() => {
    const subs = this.stream.subscribers();
    const last = this.stream.lastHeartbeat();
    const parts: string[] = [];
    if (subs != null) parts.push(`subscribers=${subs}`);
    if (last != null) parts.push(`last=${new Date(last).toLocaleTimeString()}`);
    return parts.join(' · ');
  });
}
