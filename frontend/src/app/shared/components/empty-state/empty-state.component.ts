import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  imports: [],
  template: `
    <div class="empty-container">
      <div class="empty-icon">○</div>
      <p class="empty-message">{{ message() }}</p>
    </div>
  `,
  styles: [`
    .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 40px;
    }
    .empty-icon {
      font-size: 32px;
      color: #445566;
    }
    .empty-message {
      color: #667788;
      font-size: 14px;
      margin: 0;
    }
  `]
})
export class EmptyStateComponent {
  readonly message = input<string>('Veri bulunamadı');
}
