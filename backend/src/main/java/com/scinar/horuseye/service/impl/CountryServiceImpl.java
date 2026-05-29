package com.scinar.horuseye.service.impl;

import com.scinar.horuseye.dto.request.CountryFilterRequest;
import com.scinar.horuseye.dto.response.ApiResponse;
import com.scinar.horuseye.dto.response.CountryDetailResponse;
import com.scinar.horuseye.dto.response.CountryResponse;
import com.scinar.horuseye.dto.response.GlobeDataResponse;
import com.scinar.horuseye.entity.Country;
import com.scinar.horuseye.exception.CountryNotFoundException;
import com.scinar.horuseye.repository.CountryRepository;
import com.scinar.horuseye.service.CountryService;
import com.scinar.horuseye.service.ExternalApiService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CountryServiceImpl implements CountryService {

    private final CountryRepository countryRepository;
    private final ExternalApiService externalApiService;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public ApiResponse<List<CountryResponse>> getAll(CountryFilterRequest filter) {
        log.info("Ülkeler listeleniyor: search={}, continentCode={}",
                filter.search(), filter.continentCode());

        if (countryRepository.count() == 0) {
            log.info("Veritabanı boş, external API'den veriler alınıyor");
            externalApiService.syncAllCountries();
            entityManager.flush();
            entityManager.clear();
        }

        List<Country> countries;

        if (filter.search() != null && !filter.search().isBlank()) {
            countries = countryRepository.searchByName(filter.search());
        } else {
            countries = countryRepository.findAllActive();
        }

        var response = countries.stream()
                .filter(c -> filter.continentCode() == null || filter.continentCode().isBlank()
                        || c.getContinent().getCode().equalsIgnoreCase(filter.continentCode()))
                .map(this::toCountryResponse)
                .toList();

        return ApiResponse.basarili(response);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<CountryDetailResponse> getById(Long id) {
        log.info("Ülke detayı: id={}", id);
        var country = countryRepository.findActiveById(id)
                .orElseThrow(() -> new CountryNotFoundException(id));
        return ApiResponse.basarili(toCountryDetailResponse(country));
    }

    @Override
    @Transactional
    public ApiResponse<CountryDetailResponse> getByIsoCode(String isoCode) {
        log.info("Ülke detayı: isoCode={}", isoCode);
        var country = countryRepository.findByIsoCode(isoCode.toUpperCase());

        if (country.isEmpty()) {
            log.info("Veritabanında bulunamadı, external API'den alınıyor: {}", isoCode);
            externalApiService.syncCountryByCode(isoCode);
            country = countryRepository.findByIsoCode(isoCode.toUpperCase());
        }

        if (country.isEmpty()) {
            throw new CountryNotFoundException(isoCode);
        }

        return ApiResponse.basarili(toCountryDetailResponse(country.get()));
    }

    @Override
    @Transactional
    public ApiResponse<List<GlobeDataResponse>> getGlobeData() {
        log.info("Küre verisi hazırlanıyor");
        if (countryRepository.count() == 0) {
            log.info("Veritabanı boş, küre verisi için external API senkronizasyonu");
            syncCountriesIfEmpty();
        }
        var countries = countryRepository.findAllActive();
        var response = countries.stream()
                .map(c -> new GlobeDataResponse(
                        c.getId(),
                        c.getName(),
                        c.getIsoCode(),
                        c.getLatitude(),
                        c.getLongitude(),
                        c.getPopulation(),
                        c.getCityLightsDensity()))
                .toList();
        return ApiResponse.basarili(response);
    }

    private void syncCountriesIfEmpty() {
        externalApiService.syncAllCountries();
        entityManager.flush();
        entityManager.clear();
    }

    private CountryResponse toCountryResponse(Country c) {
        return new CountryResponse(
                c.getId(),
                c.getName(),
                c.getCapital(),
                c.getIsoCode(),
                c.getContinent().getCode(),
                c.getContinent().getName(),
                c.getPopulation(),
                c.getLatitude(),
                c.getLongitude(),
                c.getFlagUrl());
    }

    private CountryDetailResponse toCountryDetailResponse(Country c) {
        return new CountryDetailResponse(
                c.getId(),
                c.getName(),
                c.getNativeName(),
                c.getCapital(),
                c.getContinent().getCode(),
                c.getContinent().getName(),
                c.getIsoCode(),
                c.getIsoNumeric(),
                c.getPopulation(),
                c.getAreaKm2(),
                c.getCurrencyCode(),
                c.getCurrencyName(),
                c.getPhoneCode(),
                parseJsonArray(c.getLanguages()),
                c.getFlagUrl(),
                c.getLatitude(),
                c.getLongitude(),
                c.getTimezone(),
                parseJsonArray(c.getBorderCountries()),
                c.getCityLightsDensity());
    }

    private List<String> parseJsonArray(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        var trimmed = json.trim();
        if (trimmed.startsWith("[")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }
        return Arrays.stream(trimmed.split(","))
                .map(s -> s.trim().replaceAll("^\"|\"$", ""))
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
