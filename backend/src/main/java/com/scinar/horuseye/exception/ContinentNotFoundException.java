package com.scinar.horuseye.exception;

public class ContinentNotFoundException extends RuntimeException {
    public ContinentNotFoundException(Long id) {
        super("Kıta bulunamadı: " + id);
    }
}
