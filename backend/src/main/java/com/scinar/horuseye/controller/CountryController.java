package com.scinar.horuseye.controller;

import com.scinar.horuseye.dto.request.CountryFilterRequest;
import com.scinar.horuseye.dto.response.ApiResponse;
import com.scinar.horuseye.dto.response.CountryDetailResponse;
import com.scinar.horuseye.dto.response.CountryResponse;
import com.scinar.horuseye.service.CountryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/countries")
@RequiredArgsConstructor
public class CountryController {

    private final CountryService countryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CountryResponse>>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(name = "continent", required = false) String continentCode) {
        var filter = new CountryFilterRequest(search, continentCode);
        return ResponseEntity.ok(countryService.getAll(filter));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CountryDetailResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(countryService.getById(id));
    }

    @GetMapping("/code/{isoCode}")
    public ResponseEntity<ApiResponse<CountryDetailResponse>> getByCode(@PathVariable String isoCode) {
        return ResponseEntity.ok(countryService.getByIsoCode(isoCode));
    }
}
