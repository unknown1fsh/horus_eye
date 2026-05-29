import { Injectable, OnDestroy, signal } from '@angular/core';

/** Connection status surfaced to the UI (status indicator pill). */
export type StreamConnectionState = 'connecting' | 'connected' | 'disconnected';

const ENDPOINT = '/api/v1/stream';
const RECONNECT_BASE_MS = 1_500;
const RECONNECT_MAX_MS = 30_000;
const STALE_HEARTBEAT_MS = 45_000;

/**
 * N1.11 — SSE channel for live server pushes.
 *
 * The native EventSource auto-reconnects, but only on the *network* layer and
 * with a UA-defined backoff. We layer our own monitored state on top so the
 * UI can render a status pill and surface stalls (e.g. heartbeats stop but
 * the socket stays half-open).
 */
@Injectable({ providedIn: 'root' })
export class RealtimeStreamService implements OnDestroy {
  private source: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private staleTimer: ReturnType<typeof setInterval> | null = null;
  private retryAttempt = 0;
  private started = false;

  private readonly _state = signal<StreamConnectionState>('disconnected');
  private readonly _lastHeartbeat = signal<number | null>(null);
  private readonly _subscribers = signal<number | null>(null);

  readonly state = this._state.asReadonly();
  readonly lastHeartbeat = this._lastHeartbeat.asReadonly();
  readonly subscribers = this._subscribers.asReadonly();

  start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;
    this.connect();
    this.staleTimer = setInterval(() => this.checkStale(), 5_000);
  }

  stop(): void {
    this.started = false;
    this.clearReconnectTimer();
    if (this.staleTimer !== null) { clearInterval(this.staleTimer); this.staleTimer = null; }
    this.closeSource();
    this._state.set('disconnected');
  }

  ngOnDestroy(): void { this.stop(); }

  private connect(): void {
    this.closeSource();
    this._state.set('connecting');
    try {
      const es = new EventSource(ENDPOINT);
      this.source = es;
      es.addEventListener('connected', (ev) => this.onConnected(ev as MessageEvent));
      es.addEventListener('heartbeat', (ev) => this.onHeartbeat(ev as MessageEvent));
      es.onopen = () => { this.retryAttempt = 0; this._state.set('connected'); };
      es.onerror = () => this.onError();
    } catch {
      this.onError();
    }
  }

  private onConnected(ev: MessageEvent): void {
    this.retryAttempt = 0;
    this._state.set('connected');
    this._lastHeartbeat.set(Date.now());
    this.parseSubscribers(ev.data);
  }

  private onHeartbeat(ev: MessageEvent): void {
    this._lastHeartbeat.set(Date.now());
    this._state.set('connected');
    this.parseSubscribers(ev.data);
  }

  private parseSubscribers(raw: string): void {
    try {
      const parsed = JSON.parse(raw) as { subscribers?: number };
      if (typeof parsed.subscribers === 'number') this._subscribers.set(parsed.subscribers);
    } catch {
      /* heartbeats are best-effort — non-JSON payloads are ignored */
    }
  }

  private onError(): void {
    this._state.set('disconnected');
    this.closeSource();
    if (!this.started) return;
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** this.retryAttempt, RECONNECT_MAX_MS);
    this.retryAttempt += 1;
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private checkStale(): void {
    const last = this._lastHeartbeat();
    if (last === null) return;
    if (Date.now() - last > STALE_HEARTBEAT_MS && this._state() === 'connected') {
      // socket is half-open: server is silent past the expected cadence — force reconnect
      this.onError();
    }
  }

  private closeSource(): void {
    if (this.source) {
      try { this.source.close(); } catch { /* ignore */ }
      this.source = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
