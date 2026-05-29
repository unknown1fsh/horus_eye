import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../i18n/t.pipe';

@Component({
  selector: 'app-error-state',
  imports: [TranslatePipe],
  template: `
    <div class="error-container">
      <div class="error-icon">!</div>
      <p class="error-message">{{ message() }}</p>
      <button class="retry-btn" (click)="retry.emit()">{{ 'status.retry' | t }}</button>
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 40px;
    }
    .error-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 77, 77, 0.1);
      border: 2px solid rgba(255, 77, 77, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ff4d4d;
      font-size: 24px;
      font-weight: 600;
    }
    .error-message {
      color: #ccddee;
      font-size: 14px;
      margin: 0;
      text-align: center;
    }
    .retry-btn {
      background: rgba(0, 212, 255, 0.1);
      border: 1px solid rgba(0, 212, 255, 0.3);
      color: #00d4ff;
      padding: 8px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-family: 'Inter', sans-serif;
      transition: all 0.2s;
    }
    .retry-btn:hover {
      background: rgba(0, 212, 255, 0.2);
    }
  `]
})
export class ErrorStateComponent {
  readonly message = input<string>('Bir hata oluştu');
  readonly retry = output<void>();
}
