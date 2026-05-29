-- =============================================================
-- V1 — Initial Horus Eye schema (continents + countries)
-- =============================================================
-- Existing deployments are baselined at this version (see
-- spring.flyway.baseline-on-migrate=true), so this file mirrors the
-- pre-Flyway create-scripts.txt as a documentation source-of-truth.
-- Guarded with IF NOT EXISTS so a fresh DB and a baselined DB
-- converge to the same schema.
-- =============================================================

CREATE TABLE IF NOT EXISTS continents (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(2)   NOT NULL UNIQUE,
    description     TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_continents_code ON continents(code);

CREATE TABLE IF NOT EXISTS countries (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(100)     NOT NULL,
    native_name         VARCHAR(200),
    capital             VARCHAR(100),
    continent_id        BIGINT           NOT NULL REFERENCES continents(id),
    iso_code            VARCHAR(2)       NOT NULL UNIQUE,
    iso_numeric         VARCHAR(3),
    population          BIGINT,
    area_km2            DOUBLE PRECISION,
    currency_code       VARCHAR(3),
    currency_name       VARCHAR(100),
    phone_code          VARCHAR(10),
    languages           TEXT,
    flag_url            TEXT,
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
    timezone            VARCHAR(50),
    border_countries    TEXT,
    city_lights_density DOUBLE PRECISION DEFAULT 0,
    deleted_at          TIMESTAMP        NULL,
    created_at          TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_countries_continent_id       ON countries(continent_id);
CREATE INDEX IF NOT EXISTS idx_countries_iso_code           ON countries(iso_code);
CREATE INDEX IF NOT EXISTS idx_countries_name               ON countries(name);
CREATE INDEX IF NOT EXISTS idx_countries_deleted_at         ON countries(deleted_at);
CREATE INDEX IF NOT EXISTS idx_countries_continent_deleted  ON countries(continent_id, deleted_at);

-- Continent seed data. Idempotent — re-runs on baselined DBs do nothing.
INSERT INTO continents (name, code, description) VALUES
    ('Africa',        'AF', 'Afrika kıtası'),
    ('Antarctica',    'AN', 'Antarktika kıtası'),
    ('Asia',          'AS', 'Asya kıtası'),
    ('Europe',        'EU', 'Avrupa kıtası'),
    ('North America', 'NA', 'Kuzey Amerika kıtası'),
    ('Oceania',       'OC', 'Okyanusya kıtası'),
    ('South America', 'SA', 'Güney Amerika kıtası')
ON CONFLICT (code) DO NOTHING;
