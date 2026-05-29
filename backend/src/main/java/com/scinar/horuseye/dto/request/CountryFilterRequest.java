package com.scinar.horuseye.dto.request;

public record CountryFilterRequest(
    String search,
    String continentCode
) {}
