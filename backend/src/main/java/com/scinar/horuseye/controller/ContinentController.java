package com.scinar.horuseye.controller;

import com.scinar.horuseye.dto.response.ApiResponse;
import com.scinar.horuseye.dto.response.ContinentResponse;
import com.scinar.horuseye.service.ContinentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/continents")
@RequiredArgsConstructor
public class ContinentController {

    private final ContinentService continentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ContinentResponse>>> getAll() {
        return ResponseEntity.ok(continentService.getAll());
    }
}
