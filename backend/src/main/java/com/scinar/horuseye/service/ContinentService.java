package com.scinar.horuseye.service;

import com.scinar.horuseye.dto.response.ApiResponse;
import com.scinar.horuseye.dto.response.ContinentResponse;

import java.util.List;

public interface ContinentService {
    ApiResponse<List<ContinentResponse>> getAll();
}
