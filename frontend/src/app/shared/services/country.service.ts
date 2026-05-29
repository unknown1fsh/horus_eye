import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { ApiResponse, ErrorResponse } from '../models/api-response.model';
import { Country, CountryDetail } from '../models/country.model';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CountryService {
  private readonly apiUrl = '/api/v1/countries';

  private _countries = signal<Country[]>([]);
  private _selectedCountry = signal<CountryDetail | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  readonly countries = this._countries.asReadonly();
  readonly selectedCountry = this._selectedCountry.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor(private http: HttpClient) {}

  async loadAll(search?: string, continent?: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      let params = new HttpParams();
      if (search) params = params.set('search', search);
      if (continent) params = params.set('continent', continent);
      const response = await lastValueFrom(
        this.http.get<ApiResponse<Country[]>>(this.apiUrl, { params })
      );
      this._countries.set(response.data);
    } catch (e: any) {
      this._error.set(this.extractError(e));
      this._countries.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  async loadById(id: number): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const response = await lastValueFrom(
        this.http.get<ApiResponse<CountryDetail>>(`${this.apiUrl}/${id}`)
      );
      this._selectedCountry.set(response.data);
    } catch (e: any) {
      this._error.set(this.extractError(e));
    } finally {
      this._loading.set(false);
    }
  }

  async loadByCode(isoCode: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const response = await lastValueFrom(
        this.http.get<ApiResponse<CountryDetail>>(`${this.apiUrl}/code/${isoCode}`)
      );
      this._selectedCountry.set(response.data);
    } catch (e: any) {
      this._error.set(this.extractError(e));
    } finally {
      this._loading.set(false);
    }
  }

  clearSelection(): void {
    this._selectedCountry.set(null);
  }

  private extractError(e: any): string {
    if (e instanceof HttpErrorResponse && e.error) {
      const body = e.error as ErrorResponse;
      if (body.message) return body.message;
    }
    if (e instanceof HttpErrorResponse) {
      if (e.status === 0) return 'Sunucuya bağlanılamıyor. Lütfen bağlantınızı kontrol edin.';
      if (e.status === 502) return 'Dış veri kaynağına erişilemiyor. Lütfen daha sonra tekrar deneyin.';
      if (e.status >= 500) return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
    }
    return 'Beklenmeyen bir hata oluştu';
  }
}
