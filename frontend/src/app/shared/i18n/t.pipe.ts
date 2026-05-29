import { Pipe, PipeTransform, inject } from '@angular/core';
import { LocaleService } from '../services/locale.service';

/**
 * Reactive translation pipe. `pure: false` keeps it cheap because the
 * underlying signal already drives change detection — Angular will only
 * re-invoke `transform` when the template reads it during a CD cycle that
 * was scheduled by a signal write.
 */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly locale = inject(LocaleService);

  transform(key: string): string {
    // Force dependency on the locale signal so language switches re-render.
    this.locale.locale();
    return this.locale.t(key);
  }
}
