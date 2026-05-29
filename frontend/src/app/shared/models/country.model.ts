export interface Country {
  id: number;
  name: string;
  capital: string | null;
  isoCode: string;
  continentCode: string;
  continentName: string;
  population: number | null;
  latitude: number | null;
  longitude: number | null;
  flagUrl: string | null;
}

export interface CountryDetail {
  id: number | null;
  name: string;
  nativeName: string | null;
  capital: string | null;
  continentCode: string;
  continentName: string;
  isoCode: string;
  isoNumeric: string | null;
  population: number | null;
  areaKm2: number | null;
  currencyCode: string | null;
  currencyName: string | null;
  phoneCode: string | null;
  languages: string[];
  flagUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  borderCountries: string[];
  cityLightsDensity: number;
}
