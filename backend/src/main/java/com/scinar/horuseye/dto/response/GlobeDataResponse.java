package com.scinar.horuseye.dto.response;

public record GlobeDataResponse(
    Long id,
    String name,
    String isoCode,
    Double latitude,
    Double longitude,
    Long population,
    Double cityLightsDensity
) {}
