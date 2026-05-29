import { Component } from '@angular/core';
import { TranslatePipe } from '../../i18n/t.pipe';

@Component({
  selector: 'app-loading-state',
  imports: [TranslatePipe],
  template: `
    <div class="loading-container">
      <div class="spinner"></div>
      <p class="loading-text">{{ 'status.loading' | t }}</p>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 40px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(0, 212, 255, 0.1);
      border-top-color: #00d4ff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading-text {
      color: #8899aa;
      font-size: 14px;
      margin: 0;
    }
  `]
})
export class LoadingStateComponent {}
