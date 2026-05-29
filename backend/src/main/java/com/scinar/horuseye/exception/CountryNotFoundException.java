package com.scinar.horuseye.exception;

public class CountryNotFoundException extends RuntimeException {
    private final String identifier;

    public CountryNotFoundException(Long id) {
        super("Ülke bulunamadı: " + id);
        this.identifier = String.valueOf(id);
    }

    public CountryNotFoundException(String isoCode) {
        super("Ülke bulunamadı: " + isoCode);
        this.identifier = isoCode;
    }

    public String getIdentifier() {
        return identifier;
    }
}
