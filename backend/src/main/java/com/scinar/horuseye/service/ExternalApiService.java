package com.scinar.horuseye.service;

import com.scinar.horuseye.entity.Country;

import java.util.Optional;

public interface ExternalApiService {
    void syncAllCountries();
    Optional<Country> syncCountryByCode(String isoCode);
}
