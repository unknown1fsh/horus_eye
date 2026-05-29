package com.scinar.horuseye.service.impl;

import com.scinar.horuseye.entity.Continent;
import com.scinar.horuseye.entity.Country;
import com.scinar.horuseye.exception.ExternalApiException;
import com.scinar.horuseye.repository.ContinentRepository;
import com.scinar.horuseye.repository.CountryRepository;
import com.scinar.horuseye.service.ExternalApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExternalApiServiceImpl implements ExternalApiService {

    private final WebClient webClient;
    private final CountryRepository countryRepository;
    private final ContinentRepository continentRepository;

    @Value("${app.external-api.rest-countries.url}")
    private String apiBaseUrl;

    @Value("${app.external-api.timeout-seconds:30}")
    private long timeoutSeconds;

    private static final Map<String, String> REGION_TO_CONTINENT = Map.of(
            "Africa", "AF",
            "Antarctica", "AN",
            "Asia", "AS",
            "Europe", "EU",
            "Oceania", "OC"
    );

    private static final Set<String> NORTH_AMERICA_SUBREGIONS = Set.of(
            "North America", "Central America", "Caribbean"
    );

    @Override
    @Transactional
    public void syncAllCountries() {
        log.info("REST Countries API'den tüm ülkeler senkronize ediliyor");

        try {
            var batch1 = fetchBatch("name,cca2,cca3,ccn3,capital,region,subregion,latlng,population,area,flags");
            var batch2 = fetchBatch("name,cca2,currencies,idd,languages,borders,timezones");

            var merged = mergeBatches(batch1, batch2);
            log.info("{} ülke verisi alındı, veritabanına kaydediliyor", merged.size());

            var continentCache = new HashMap<String, Continent>();
            continentRepository.findAll().forEach(c -> continentCache.put(c.getCode(), c));

            int saved = 0;
            for (var raw : merged) {
                try {
                    var country = mapToEntity(raw, continentCache);
                    if (country != null) {
                        countryRepository.save(country);
                        saved++;
                    }
                } catch (Exception e) {
                    log.warn("Ülke dönüştürülemedi: {} - {}", raw.get("cca2"), e.getMessage());
                }
            }

            log.info("{} ülke başarıyla kaydedildi", saved);

            if (saved == 0) {
                log.warn("Hiç ülke kaydedilemedi. Continent tablosunda {} kayıt var.", continentCache.size());
            }

        } catch (WebClientResponseException e) {
            log.error("REST Countries API hatası: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ExternalApiException("Dış API servisine erişilemiyor: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("External API çağrısı başarısız: {}", e.getMessage());
            throw new ExternalApiException("Ülkeler senkronize edilirken hata: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> mergeBatches(List<Map<String, Object>> batch1, List<Map<String, Object>> batch2) {
        var map = new HashMap<String, Map<String, Object>>();

        for (var item : batch1) {
            String cca2 = (String) item.get("cca2");
            if (cca2 != null) {
                map.put(cca2, new HashMap<>(item));
            }
        }

        for (var item : batch2) {
            String cca2 = (String) item.get("cca2");
            if (cca2 != null && map.containsKey(cca2)) {
                map.get(cca2).putAll(item);
            }
        }

        return new ArrayList<>(map.values());
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchBatch(String fields) {
        List<?> response = webClient.get()
                .uri(apiBaseUrl + "/all?fields={fields}", fields)
                .retrieve()
                .bodyToFlux(Map.class)
                .collectList()
                .block(Duration.ofSeconds(timeoutSeconds));

        if (response == null) return Collections.emptyList();
        return response.stream()
                .map(m -> (Map<String, Object>) m)
                .toList();
    }

    @Override
    @Transactional
    public Optional<Country> syncCountryByCode(String isoCode) {
        log.info("REST Countries API'den ülke alınıyor: {}", isoCode);
        try {
            var response = webClient.get()
                    .uri(apiBaseUrl + "/alpha/{code}?fields=name,cca2,cca3,ccn3,capital,region,subregion,latlng,population,area,flags,currencies,idd,languages,borders,timezones",
                            isoCode.toUpperCase())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofSeconds(timeoutSeconds));

            if (response == null) {
                log.warn("API boş yanıt döndü: {}", isoCode);
                return Optional.empty();
            }

            var continentCache = new HashMap<String, Continent>();
            continentRepository.findAll().forEach(c -> continentCache.put(c.getCode(), c));

            var country = mapToEntity(response, continentCache);
            if (country == null) {
                log.warn("Ülke dönüştürülemedi: {}", isoCode);
                return Optional.empty();
            }

            var saved = countryRepository.save(country);
            log.info("Ülke kaydedildi: {} ({})", saved.getName(), saved.getIsoCode());
            return Optional.of(saved);

        } catch (WebClientResponseException.NotFound e) {
            log.warn("Ülke external API'de bulunamadı: {}", isoCode);
            return Optional.empty();
        } catch (WebClientResponseException e) {
            log.error("API hatası: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ExternalApiException("Dış API servisi hatası: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("Ülke senkronizasyonu başarısız: {}", e.getMessage());
            throw new ExternalApiException("Ülke senkronize edilirken hata: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Country mapToEntity(Map<String, Object> data, Map<String, Continent> continentCache) {
        try {
            Map<String, Object> nameData = (Map<String, Object>) data.get("name");
            if (nameData == null) return null;

            String commonName = (String) nameData.get("common");
            String officialName = (String) nameData.get("official");
            String cca2 = (String) data.get("cca2");
            if (commonName == null || cca2 == null) return null;

            var existing = countryRepository.findByIsoCode(cca2);
            if (existing.isPresent()) return null;

            List<Double> latLng = (List<Double>) data.get("latlng");
            Double latitude = latLng != null && latLng.size() > 0 ? latLng.get(0) : null;
            Double longitude = latLng != null && latLng.size() > 1 ? latLng.get(1) : null;

            String region = (String) data.get("region");
            String subregion = (String) data.get("subregion");

            Continent continent = resolveContinent(region, subregion, continentCache);
            if (continent == null) {
                log.warn("Kıta bulunamadı: region={}, subregion={}, country={}", region, subregion, cca2);
                return null;
            }

            Map<String, Object> currencies = (Map<String, Object>) data.get("currencies");
            String currencyCode = null;
            String currencyName = null;
            if (currencies != null && !currencies.isEmpty()) {
                var first = currencies.entrySet().iterator().next();
                currencyCode = first.getKey();
                Map<String, String> currData = (Map<String, String>) first.getValue();
                currencyName = currData != null ? currData.get("name") : null;
            }

            Map<String, Object> idd = (Map<String, Object>) data.get("idd");
            String phoneCode = null;
            if (idd != null) {
                String root = (String) idd.get("root");
                List<String> suffixes = (List<String>) idd.get("suffixes");
                if (root != null && suffixes != null && !suffixes.isEmpty()) {
                    phoneCode = root + suffixes.get(0);
                }
            }

            Map<String, String> languages = (Map<String, String>) data.get("languages");
            String languagesJson = languages != null
                    ? "[" + languages.values().stream().map(v -> "\"" + v + "\"").collect(Collectors.joining(",")) + "]"
                    : null;

            List<String> borders = (List<String>) data.get("borders");
            String bordersJson = borders != null && !borders.isEmpty()
                    ? "[" + borders.stream().map(b -> "\"" + b + "\"").collect(Collectors.joining(",")) + "]"
                    : null;

            Map<String, String> flags = (Map<String, String>) data.get("flags");
            String flagUrl = flags != null ? flags.get("png") : null;

            var country = new Country();
            country.setName(commonName);
            country.setNativeName(officialName);
            country.setCapital(safeString(data.get("capital")));
            country.setContinent(continent);
            country.setIsoCode(cca2);
            Object ccn3 = data.get("ccn3");
            country.setIsoNumeric(ccn3 != null ? String.valueOf(ccn3) : null);
            country.setPopulation(safeLong(data.get("population")));
            country.setAreaKm2(safeDouble(data.get("area")));
            country.setCurrencyCode(currencyCode);
            country.setCurrencyName(currencyName);
            country.setPhoneCode(phoneCode);
            country.setLanguages(languagesJson);
            country.setFlagUrl(flagUrl);
            country.setLatitude(latitude);
            country.setLongitude(longitude);
            country.setTimezone(safeFirstString(data.get("timezones")));
            country.setBorderCountries(bordersJson);

            Long pop = safeLong(data.get("population"));
            if (pop != null && pop > 0) {
                country.setCityLightsDensity(Math.min(1.0, pop / 50_000_000.0));
            } else {
                country.setCityLightsDensity(0.0);
            }

            return country;

        } catch (Exception e) {
            log.warn("API yanıtı dönüştürülemedi: {}", e.getMessage());
            return null;
        }
    }

    private Continent resolveContinent(String region, String subregion, Map<String, Continent> cache) {
        if (region == null) return null;

        if ("Americas".equals(region)) {
            if (subregion != null && !NORTH_AMERICA_SUBREGIONS.contains(subregion)) {
                return cache.get("SA");
            }
            return cache.get("NA");
        }

        String code = REGION_TO_CONTINENT.get(region);
        return code != null ? cache.get(code) : null;
    }

    private String safeString(Object obj) {
        if (obj instanceof List<?> list && !list.isEmpty()) {
            return String.valueOf(list.get(0));
        }
        return obj != null ? String.valueOf(obj) : null;
    }

    private String safeFirstString(Object obj) {
        if (obj instanceof List<?> list && !list.isEmpty()) {
            return String.valueOf(list.get(0));
        }
        return obj != null ? String.valueOf(obj) : null;
    }

    private Long safeLong(Object obj) {
        if (obj instanceof Number n) return n.longValue();
        if (obj instanceof String s) {
            try { return Long.parseLong(s); } catch (NumberFormatException e) { return null; }
        }
        return null;
    }

    private Double safeDouble(Object obj) {
        if (obj instanceof Number n) return n.doubleValue();
        if (obj instanceof String s) {
            try { return Double.parseDouble(s); } catch (NumberFormatException e) { return null; }
        }
        return null;
    }
}
