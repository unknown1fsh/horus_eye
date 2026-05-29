package com.scinar.horuseye.service;

import com.scinar.horuseye.dto.request.CountryFilterRequest;
import com.scinar.horuseye.dto.response.ApiResponse;
import com.scinar.horuseye.dto.response.CountryDetailResponse;
import com.scinar.horuseye.dto.response.CountryResponse;
import com.scinar.horuseye.dto.response.GlobeDataResponse;

import java.util.List;

public interface CountryService {
    ApiResponse<List<CountryResponse>> getAll(CountryFilterRequest filter);
    ApiResponse<CountryDetailResponse> getById(Long id);
    ApiResponse<CountryDetailResponse> getByIsoCode(String isoCode);
    ApiResponse<List<GlobeDataResponse>> getGlobeData();
}
