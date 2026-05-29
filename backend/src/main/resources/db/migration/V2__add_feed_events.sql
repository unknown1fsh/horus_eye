-- =============================================================
-- V2 — Feed ingest audit table
-- =============================================================
-- Captures one row per successful (or failed) feed fetch so we can
-- (a) compute SLO cards in the dashboard,
-- (b) prove rate-limit budget compliance for OpenSky / FIRMS,
-- (c) replay history for the alert engine (N3.4).
--
-- This is a *log*, not a queue — keep the schema flat and append-only.
-- A retention job (out of scope for N1) prunes rows older than 14 days.
-- =============================================================

CREATE TABLE feed_event (
    id            BIGSERIAL    PRIMARY KEY,
    feed_id       VARCHAR(64)  NOT NULL,
    fetched_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    duration_ms   INTEGER      NOT NULL,
    record_count  INTEGER,
    http_status   INTEGER,
    cache_status  VARCHAR(16)  NOT NULL,
    error_message TEXT,
    -- optional viewport bbox the fetch covered (PostGIS arrives in Faz 2)
    bbox_min_lat  DOUBLE PRECISION,
    bbox_min_lng  DOUBLE PRECISION,
    bbox_max_lat  DOUBLE PRECISION,
    bbox_max_lng  DOUBLE PRECISION,

    CONSTRAINT feed_event_cache_status_chk
        CHECK (cache_status IN ('HIT', 'MISS', 'BYPASS', 'ERROR'))
);

CREATE INDEX idx_feed_event_feed_time ON feed_event(feed_id, fetched_at DESC);
CREATE INDEX idx_feed_event_recent    ON feed_event(fetched_at DESC);

COMMENT ON TABLE feed_event IS
    'Audit log of external feed fetches — one row per upstream call. Used by the SLO/alert pipelines.';
