import { Component, input } from '@angular/core';

export type SkeletonShape = 'bar' | 'chip' | 'block' | 'circle';

@Component({
  selector: 'app-skeleton',
  imports: [],
  template: `
    <span
      class="skeleton"
      [class.bar]="shape() === 'bar'"
      [class.chip]="shape() === 'chip'"
      [class.block]="shape() === 'block'"
      [class.circle]="shape() === 'circle'"
      [style.width]="width()"
      [style.height]="height()"
      [attr.aria-hidden]="true"
    ></span>
  `,
  styles: [`
    .skeleton {
      display: inline-block;
      position: relative;
      overflow: hidden;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.04) 0%,
        rgba(0, 212, 255, 0.10) 50%,
        rgba(255, 255, 255, 0.04) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
      border-radius: 6px;
      vertical-align: middle;
    }
    .bar    { width: 100%;  height: 10px; }
    .chip   { width: 48px;  height: 14px; border-radius: 999px; }
    .block  { width: 100%;  height: 100%; border-radius: 12px; }
    .circle { width: 14px;  height: 14px; border-radius: 50%; }

    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton { animation-duration: 0s; }
    }
  `]
})
export class SkeletonComponent {
  readonly shape = input<SkeletonShape>('bar');
  readonly width = input<string | null>(null);
  readonly height = input<string | null>(null);
}
