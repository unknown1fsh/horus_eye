package com.scinar.horuseye.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "countries")
@Getter
@Setter
@NoArgsConstructor
public class Country {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "native_name", length = 200)
    private String nativeName;

    @Column(length = 100)
    private String capital;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "continent_id", nullable = false)
    private Continent continent;

    @Column(name = "iso_code", nullable = false, unique = true, length = 2)
    private String isoCode;

    @Column(name = "iso_numeric", length = 3)
    private String isoNumeric;

    private Long population;

    @Column(name = "area_km2")
    private Double areaKm2;

    @Column(name = "currency_code", length = 3)
    private String currencyCode;

    @Column(name = "currency_name", length = 100)
    private String currencyName;

    @Column(name = "phone_code", length = 10)
    private String phoneCode;

    @Column(columnDefinition = "TEXT")
    private String languages;

    @Column(name = "flag_url")
    private String flagUrl;

    private Double latitude;

    private Double longitude;

    @Column(length = 50)
    private String timezone;

    @Column(name = "border_countries", columnDefinition = "TEXT")
    private String borderCountries;

    @Column(name = "city_lights_density")
    private Double cityLightsDensity = 0.0;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
