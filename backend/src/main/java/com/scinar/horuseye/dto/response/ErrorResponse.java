package com.scinar.horuseye.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
    boolean success,
    String message,
    String errorCode,
    LocalDateTime timestamp,
    List<FieldError> errors
) {
    public record FieldError(String field, String message) {}

    public static ErrorResponse of(String message, String errorCode) {
        return new ErrorResponse(false, message, errorCode, LocalDateTime.now(), null);
    }

    public static ErrorResponse validationError(String message, List<FieldError> errors) {
        return new ErrorResponse(false, message, "VALIDATION_ERROR", LocalDateTime.now(), errors);
    }
}
