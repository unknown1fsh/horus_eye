import {
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CameraFeedItem } from '../../models/camera-feed.model';
import { LocaleService } from '../../services/locale.service';
import { TranslatePipe } from '../../i18n/t.pipe';
import { SkeletonComponent } from '../skeleton/skeleton.component';

interface HlsLike {
  loadSource(url: string): void;
  attachMedia(el: HTMLMediaElement): void;
  destroy(): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
}

interface HlsCtor {
  new (config?: Record<string, unknown>): HlsLike;
  isSupported(): boolean;
  Events: { ERROR: string; MANIFEST_PARSED: string };
}

@Component({
  selector: 'app-camera-popup',
  imports: [TranslatePipe, SkeletonComponent],
  template: `
    @if (camera(); as cam) {
      <div class="backdrop" (click)="onBackdropClick($event)">
        <div class="popup" role="dialog" aria-modal="true">
          <header class="head">
            <div class="title-block">
              <span class="dot" aria-hidden="true">●</span>
              <h3 class="title">{{ cameraLabel(cam) }}</h3>
              <span class="badge">{{ cam.source }}</span>
            </div>
            <button type="button" class="close" (click)="close.emit()" [attr.aria-label]="'popup.close' | t">×</button>
          </header>

          <div class="player">
            @switch (cam.type) {
              @case ('hls') {
                <video
                  #videoEl
                  controls
                  muted
                  autoplay
                  playsinline
                  class="video"
                  [poster]="cam.preview || ''"
                ></video>
                @if (status() === 'error') {
                  <div class="overlay error">
                    <span>{{ 'popup.camera.streamError' | t }}</span>
                    <a [href]="cam.streamUrl" target="_blank" rel="noopener">{{ 'popup.camera.openInTab' | t }}</a>
                  </div>
                } @else if (status() === 'loading') {
                  <div class="overlay loading">
                    <div class="skeleton-wrap">
                      <app-skeleton shape="block" />
                    </div>
                    <span class="loading-label">{{ 'popup.camera.streamLoading' | t }}</span>
                  </div>
                }
              }
              @case ('mjpeg') {
                <img [src]="cam.streamUrl" [alt]="cam.name" class="mjpeg" />
              }
              @case ('jpeg-refresh') {
                <img [src]="refreshUrl()" [alt]="cam.name" class="mjpeg" />
              }
              @case ('youtube') {
                <iframe
                  [src]="safeUrl()"
                  class="frame"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowfullscreen
                  referrerpolicy="strict-origin-when-cross-origin"
                ></iframe>
              }
              @case ('iframe') {
                <iframe
                  [src]="safeUrl()"
                  class="frame"
                  referrerpolicy="strict-origin-when-cross-origin"
                ></iframe>
              }
            }
          </div>

          <footer class="meta">
            <div class="meta-row">
              <span class="label">{{ 'popup.location' | t }}</span>
              <span>{{ cam.lat.toFixed(3) }}, {{ cam.lng.toFixed(3) }}</span>
              @if (cam.city) {
                <span>·</span>
                <span>{{ cam.city }}</span>
              }
              @if (cam.countryIso) {
                <span>·</span>
                <span>{{ cam.countryIso }}</span>
              }
            </div>
            <div class="meta-row">
              <span class="label">{{ 'popup.camera.license' | t }}</span>
              <span>{{ cam.tos }}</span>
            </div>
            @if (cam.tags && cam.tags.length > 0) {
              <div class="tags">
                @for (t of cam.tags; track t) {
                  <span class="tag">{{ t }}</span>
                }
              </div>
            }
            <a class="ext-link" [href]="cam.streamUrl" target="_blank" rel="noopener">
              {{ 'popup.camera.openSource' | t }}
            </a>
            <p class="disclaimer">{{ 'popup.camera.disclaimer' | t }}</p>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 60;
      padding: 24px;
    }
    .popup {
      width: min(840px, 100%);
      max-height: calc(100vh - 48px);
      background: linear-gradient(180deg, rgba(20, 8, 30, 0.96), rgba(8, 14, 26, 0.96));
      border: 1px solid rgba(255, 95, 162, 0.28);
      border-radius: 16px;
      color: #f0e7f4;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .title-block {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .dot { color: #ff5fa2; font-size: 12px; }
    .title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .badge {
      font-size: 11px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #ff8fc0;
      background: rgba(255, 95, 162, 0.12);
      padding: 2px 8px;
      border-radius: 999px;
    }
    .close {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #f0e7f4;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
    }
    .close:hover { background: rgba(255, 95, 162, 0.18); }

    .player {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #000;
    }
    .video, .frame, .mjpeg {
      width: 100%;
      height: 100%;
      display: block;
      border: 0;
    }
    .video { object-fit: contain; background: #000; }
    .overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      color: #ffd8ec;
    }
    .overlay.error { background: rgba(80, 8, 24, 0.6); }
    .overlay a { color: #fff; text-decoration: underline; }
    .overlay.loading { background: rgba(8, 6, 16, 0.55); }
    .overlay.loading .skeleton-wrap {
      position: absolute;
      inset: 12px;
      pointer-events: none;
      opacity: 0.5;
    }
    .overlay.loading .loading-label {
      position: relative;
      z-index: 1;
      padding: 6px 14px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 999px;
      font-size: 12px;
      letter-spacing: 0.04em;
    }

    .meta {
      padding: 12px 18px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      color: #c8b8d0;
    }
    .meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    .label {
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #ff8fc0;
      font-size: 10px;
      margin-right: 4px;
    }
    .tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .tag {
      background: rgba(255, 255, 255, 0.06);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
    }
    .ext-link {
      align-self: flex-start;
      color: #ff8fc0;
      text-decoration: none;
      font-size: 12px;
      padding: 6px 0 0;
    }
    .ext-link:hover { text-decoration: underline; }
    .disclaimer {
      margin: 6px 0 0;
      font-size: 10px;
      color: #8a7a92;
      font-style: italic;
    }
  `]
})
export class CameraPopupComponent implements OnDestroy {
  readonly camera = input<CameraFeedItem | null>(null);
  readonly close = output<void>();

  protected readonly videoEl = viewChild<ElementRef<HTMLVideoElement>>('videoEl');
  protected readonly status = signal<'idle' | 'loading' | 'error'>('idle');

  private readonly sanitizer = inject(DomSanitizer);
  private readonly localeService = inject(LocaleService);

  protected cameraLabel(cam: CameraFeedItem): string {
    return this.localeService.locale() === 'en'
      ? (cam.name ?? cam.nameTr ?? '')
      : (cam.nameTr ?? cam.name ?? '');
  }
  protected readonly safeUrl = computed<SafeResourceUrl | null>(() => {
    const cam = this.camera();
    if (!cam) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(cam.streamUrl);
  });
  protected readonly refreshUrl = computed(() => {
    const cam = this.camera();
    if (!cam) return '';
    const sep = cam.streamUrl.includes('?') ? '&' : '?';
    return `${cam.streamUrl}${sep}_t=${Math.floor(Date.now() / 5000)}`;
  });

  private hls: HlsLike | null = null;
  private hlsModulePromise: Promise<HlsCtor> | null = null;

  constructor() {
    effect(() => {
      const cam = this.camera();
      const video = this.videoEl()?.nativeElement;
      this.disposeHls();
      if (!cam || cam.type !== 'hls' || !video) return;
      this.status.set('loading');
      void this.attachHls(cam.streamUrl, video);
    });
  }

  ngOnDestroy(): void {
    this.disposeHls();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  private async attachHls(url: string, video: HTMLVideoElement): Promise<void> {
    try {
      const nativeHls = video.canPlayType('application/vnd.apple.mpegurl');
      if (nativeHls) {
        video.src = url;
        this.status.set('idle');
        return;
      }

      const Hls = await this.loadHls();
      if (!Hls.isSupported()) {
        this.status.set('error');
        return;
      }
      const hls = new Hls({ maxBufferLength: 30 });
      hls.on(Hls.Events.MANIFEST_PARSED, () => this.status.set('idle'));
      hls.on(Hls.Events.ERROR, (...args: unknown[]) => {
        const data = args[1] as { fatal?: boolean } | undefined;
        if (data?.fatal) this.status.set('error');
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      this.hls = hls;
    } catch {
      this.status.set('error');
    }
  }

  private async loadHls(): Promise<HlsCtor> {
    if (!this.hlsModulePromise) {
      this.hlsModulePromise = import('hls.js').then(m => (m.default ?? m) as unknown as HlsCtor);
    }
    return this.hlsModulePromise;
  }

  private disposeHls(): void {
    if (this.hls) {
      try { this.hls.destroy(); } catch { /* ignore */ }
      this.hls = null;
    }
  }
}
