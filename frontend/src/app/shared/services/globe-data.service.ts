import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ApiResponse, ErrorResponse } from '../models/api-response.model';
import { GlobeData } from '../models/globe-data.model';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GlobeDataService {
  private readonly apiUrl = '/api/v1/globe';

  private _coordinates = signal<GlobeData[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  readonly coordinates = this._coordinates.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor(private http: HttpClient) {}

  async loadCoordinates(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const response = await lastValueFrom(
        this.http.get<ApiResponse<GlobeData[]>>(`${this.apiUrl}/coordinates`)
      );
      this._coordinates.set(response.data);
    } catch (e: any) {
      this._error.set(this.extractError(e));
      this._coordinates.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  private extractError(e: any): string {
    if (e instanceof HttpErrorResponse && e.error) {
      const body = e.error as ErrorResponse;
      if (body.message) return body.message;
    }
    if (e instanceof HttpErrorResponse) {
      if (e.status === 0) return 'Sunucuya bağlanılamıyor.';
      if (e.status === 502) return 'Dış veri kaynağına erişilemiyor.';
      if (e.status >= 500) return 'Sunucu hatası.';
    }
    return 'Beklenmeyen bir hata';
  }
}
