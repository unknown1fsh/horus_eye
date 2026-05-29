package com.scinar.horuseye.exception;

import com.scinar.horuseye.dto.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(CountryNotFoundException.class)
    public ResponseEntity<ErrorResponse> countryNotFound(CountryNotFoundException ex) {
        log.warn("Ülke bulunamadı: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of(ex.getMessage(), ErrorCode.COUNTRY_NOT_FOUND.name()));
    }

    @ExceptionHandler(ContinentNotFoundException.class)
    public ResponseEntity<ErrorResponse> continentNotFound(ContinentNotFoundException ex) {
        log.warn("Kıta bulunamadı: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of(ex.getMessage(), ErrorCode.CONTINENT_NOT_FOUND.name()));
    }

    @ExceptionHandler(ExternalApiException.class)
    public ResponseEntity<ErrorResponse> externalApiError(ExternalApiException ex) {
        log.warn("Dış API hatası: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(ErrorResponse.of(ex.getMessage(), ErrorCode.EXTERNAL_API_ERROR.name()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> validationError(MethodArgumentNotValidException ex) {
        List<ErrorResponse.FieldError> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> new ErrorResponse.FieldError(e.getField(), e.getDefaultMessage()))
                .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.validationError("Doğrulama hatası", errors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> generalError(Exception ex, HttpServletRequest request) {
        log.error("Beklenmeyen hata: path={}", request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Beklenmeyen bir hata oluştu", ErrorCode.INTERNAL_SERVER_ERROR.name()));
    }
}
