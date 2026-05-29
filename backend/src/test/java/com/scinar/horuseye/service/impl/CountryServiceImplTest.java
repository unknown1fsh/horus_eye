package com.scinar.horuseye.service.impl;

import com.scinar.horuseye.dto.request.CountryFilterRequest;
import com.scinar.horuseye.entity.Continent;
import com.scinar.horuseye.entity.Country;
import com.scinar.horuseye.repository.CountryRepository;
import com.scinar.horuseye.service.ExternalApiService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CountryServiceImplTest {

    @Mock
    private CountryRepository countryRepository;

    @Mock
    private ExternalApiService externalApiService;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private CountryServiceImpl countryService;

    @Test
    void getAll_returnsCountriesWithContinentData() {
        when(countryRepository.count()).thenReturn(1L);
        when(countryRepository.findAllActive()).thenReturn(List.of(sampleCountry()));

        var response = countryService.getAll(new CountryFilterRequest(null, null));

        assertThat(response.data()).hasSize(1);
        assertThat(response.data().get(0).continentCode()).isEqualTo("AS");
        assertThat(response.data().get(0).name()).isEqualTo("Turkey");
    }

    @Test
    void getAll_syncsWhenDatabaseEmpty() {
        when(countryRepository.count()).thenReturn(0L, 1L);
        when(countryRepository.findAllActive()).thenReturn(List.of(sampleCountry()));

        countryService.getAll(new CountryFilterRequest(null, null));

        verify(externalApiService).syncAllCountries();
        verify(entityManager).flush();
        verify(entityManager).clear();
    }

    @Test
    void getAll_usesSearchRepository() {
        when(countryRepository.count()).thenReturn(2L);
        when(countryRepository.searchByName("TR")).thenReturn(List.of(sampleCountry()));

        var response = countryService.getAll(new CountryFilterRequest("TR", null));

        verify(countryRepository).searchByName("TR");
        verify(countryRepository, never()).findAllActive();
        assertThat(response.data()).hasSize(1);
    }

    @Test
    void getGlobeData_syncsWhenDatabaseEmpty() {
        when(countryRepository.count()).thenReturn(0L, 1L);
        when(countryRepository.findAllActive()).thenReturn(List.of(sampleCountry()));

        var response = countryService.getGlobeData();

        verify(externalApiService).syncAllCountries();
        assertThat(response.data()).hasSize(1);
        assertThat(response.data().get(0).isoCode()).isEqualTo("TR");
    }

    private Country sampleCountry() {
        var continent = new Continent();
        continent.setId(3L);
        continent.setName("Asia");
        continent.setCode("AS");

        var country = new Country();
        country.setId(1L);
        country.setName("Turkey");
        country.setIsoCode("TR");
        country.setContinent(continent);
        country.setLatitude(39.0);
        country.setLongitude(35.0);
        country.setPopulation(85_000_000L);
        country.setCityLightsDensity(0.8);
        return country;
    }
}
