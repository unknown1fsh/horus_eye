package com.scinar.horuseye.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

/**
 * N1.15 — Thin wrapper over Redis for feed snapshot caching.
 *
 * Designed to be safe in dev environments where Redis isn't running:
 *  - autoconfiguration always creates the bean (Lettuce is lazy-connect),
 *  - the first operation is the one that fails,
 *  - every method swallows {@link DataAccessException} and returns
 *    "cache miss" so the caller falls through to a live fetch.
 *
 * That means an outage in Redis degrades performance but never causes
 * a request to fail.
 */
@Service
public class FeedCacheService {

    private static final Logger LOG = LoggerFactory.getLogger(FeedCacheService.class);
    private static final String KEY_PREFIX = "horus:feed:";

    private final StringRedisTemplate redis;
    private final Duration defaultTtl;
    private volatile boolean cacheAvailable = true;

    public FeedCacheService(StringRedisTemplate redis,
                            @Value("${app.cache.feed-ttl-seconds:60}") long defaultTtlSec) {
        this.redis = redis;
        this.defaultTtl = Duration.ofSeconds(defaultTtlSec);
    }

    public Optional<String> get(String feedId) {
        if (!cacheAvailable) return Optional.empty();
        try {
            return Optional.ofNullable(redis.opsForValue().get(KEY_PREFIX + feedId));
        } catch (DataAccessException ex) {
            markUnavailable(ex);
            return Optional.empty();
        }
    }

    public void put(String feedId, String payload) {
        put(feedId, payload, defaultTtl);
    }

    public void put(String feedId, String payload, Duration ttl) {
        if (!cacheAvailable) return;
        try {
            redis.opsForValue().set(KEY_PREFIX + feedId, payload, ttl);
        } catch (DataAccessException ex) {
            markUnavailable(ex);
        }
    }

    public boolean isAvailable() {
        return cacheAvailable;
    }

    /**
     * Probe Redis on demand — useful for the actuator health endpoint and
     * to recover after an outage without restarting the app.
     */
    public boolean probe() {
        try {
            redis.opsForValue().get(KEY_PREFIX + "__probe__");
            cacheAvailable = true;
            return true;
        } catch (DataAccessException ex) {
            cacheAvailable = false;
            return false;
        }
    }

    private void markUnavailable(DataAccessException ex) {
        if (cacheAvailable) {
            LOG.warn("Redis unavailable, falling back to direct fetch: {}", ex.getMostSpecificCause().getMessage());
        }
        cacheAvailable = false;
    }
}
