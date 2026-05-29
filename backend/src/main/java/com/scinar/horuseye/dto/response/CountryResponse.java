package com.scinar.horuseye.dto.response;

public record CountryResponse(
    Long id,
    String name,
    String capital,
    String isoCode,
    String continentCode,
    String continentName,
    Long population,
    Double latitude,
    Double longitude,
    String flagUrl
) {}
