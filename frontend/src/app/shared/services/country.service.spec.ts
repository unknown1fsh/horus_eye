import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CountryService } from './country.service';

describe('CountryService', () => {
  let service: CountryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CountryService]
    });
    service = TestBed.inject(CountryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loadAll should store countries from API', async () => {
    const promise = service.loadAll('tur');

    const req = httpMock.expectOne(r =>
      r.url === '/api/v1/countries' && r.params.get('search') === 'tur'
    );
    req.flush({
      success: true,
      data: [{
        id: 1,
        name: 'Turkey',
        capital: 'Ankara',
        isoCode: 'TR',
        continentCode: 'AS',
        continentName: 'Asia',
        population: 85000000,
        latitude: 39,
        longitude: 35,
        flagUrl: null
      }]
    });

    await promise;
    expect(service.countries().length).toBe(1);
    expect(service.countries()[0].isoCode).toBe('TR');
  });
});
