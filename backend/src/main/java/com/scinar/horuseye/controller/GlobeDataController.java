package com.scinar.horuseye.controller;

import com.scinar.horuseye.dto.response.ApiResponse;
import com.scinar.horuseye.dto.response.GlobeDataResponse;
import com.scinar.horuseye.service.CountryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/globe")
@RequiredArgsConstructor
public class GlobeDataController {

    private final CountryService countryService;

    @GetMapping("/coordinates")
    public ResponseEntity<ApiResponse<List<GlobeDataResponse>>> getCoordinates() {
        return ResponseEntity.ok(countryService.getGlobeData());
    }
}
