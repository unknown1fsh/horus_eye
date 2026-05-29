package com.scinar.horuseye.service.impl;

import com.scinar.horuseye.dto.response.ApiResponse;
import com.scinar.horuseye.dto.response.ContinentResponse;
import com.scinar.horuseye.repository.ContinentRepository;
import com.scinar.horuseye.service.ContinentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContinentServiceImpl implements ContinentService {

    private final ContinentRepository continentRepository;

    @Override
    public ApiResponse<List<ContinentResponse>> getAll() {
        log.info("Tüm kıtalar listeleniyor");
        var continents = continentRepository.findAll();
        var response = continents.stream()
                .map(c -> new ContinentResponse(c.getId(), c.getName(), c.getCode(), c.getDescription()))
                .toList();
        return ApiResponse.basarili(response);
    }
}
