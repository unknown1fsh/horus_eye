package com.scinar.horuseye.dto.response;

import java.util.List;

public record CountryDetailResponse(
    Long id,
    String name,
    String nativeName,
    String capital,
    String continentCode,
    String continentName,
    String isoCode,
    String isoNumeric,
    Long population,
    Double areaKm2,
    String currencyCode,
    String currencyName,
    String phoneCode,
    List<String> languages,
    String flagUrl,
    Double latitude,
    Double longitude,
    String timezone,
    List<String> borderCountries,
    Double cityLightsDensity
) {}
