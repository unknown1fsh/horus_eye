package com.scinar.horuseye.dto.response;

public record ApiResponse<T>(
    boolean success,
    String message,
    T data
) {
    public static <T> ApiResponse<T> basarili(T data) {
        return new ApiResponse<>(true, null, data);
    }

    public static <T> ApiResponse<T> basarili(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }
}
