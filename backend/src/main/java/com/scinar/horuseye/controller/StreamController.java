package com.scinar.horuseye.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * N1.11 — Server-Sent Events channel.
 *
 * Provides a low-latency push channel for live status updates. Currently emits:
 *   - `connected` once per subscription with the server clock
 *   - `heartbeat` every 15 seconds (also acts as proxy/CDN keep-alive)
 *
 * Future feed pushes (earthquakes, ISS, etc.) will land here so the frontend
 * can drop per-feed setInterval polling. The infrastructure is intentionally
 * thread-safe + dead-emitter pruning so we can fan out to many tabs.
 */
@RestController
@RequestMapping("/api/v1/stream")
public class StreamController {

    private static final Logger LOG = LoggerFactory.getLogger(StreamController.class);
    private static final long HEARTBEAT_MS = 15_000L;
    private static final long SUBSCRIPTION_TIMEOUT_MS = Duration.ofHours(2).toMillis();

    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final AtomicLong nextId = new AtomicLong(1);

    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        final long id = nextId.getAndIncrement();
        final SseEmitter emitter = new SseEmitter(SUBSCRIPTION_TIMEOUT_MS);

        emitter.onCompletion(() -> { emitters.remove(id); LOG.debug("SSE {} completed", id); });
        emitter.onTimeout(()    -> { emitter.complete(); emitters.remove(id); LOG.debug("SSE {} timed out", id); });
        emitter.onError(err     -> { emitters.remove(id); LOG.debug("SSE {} error: {}", id, err.getMessage()); });

        emitters.put(id, emitter);
        send(emitter, "connected", Map.of(
                "id", id,
                "serverTime", Instant.now().toString(),
                "subscribers", emitters.size()
        ));
        return emitter;
    }

    /**
     * Heartbeat tick — also lets the client detect a stalled connection
     * (the EventSource `onerror` fires when this stops arriving).
     */
    @Scheduled(fixedDelay = HEARTBEAT_MS)
    public void heartbeat() {
        if (emitters.isEmpty()) return;
        final String now = Instant.now().toString();
        emitters.forEach((id, emitter) -> {
            if (!send(emitter, "heartbeat", Map.of("serverTime", now, "subscribers", emitters.size()))) {
                emitters.remove(id);
            }
        });
    }

    /**
     * Broadcast a feed update to every subscriber. Reserved for future feed
     * fan-out; safe to call from any ingest worker.
     */
    public void publish(String topic, Object payload) {
        emitters.forEach((id, emitter) -> {
            if (!send(emitter, topic, payload)) emitters.remove(id);
        });
    }

    private boolean send(SseEmitter emitter, String event, Object data) {
        try {
            emitter.send(SseEmitter.event().name(event).data(data));
            return true;
        } catch (IOException | IllegalStateException ex) {
            try { emitter.complete(); } catch (Exception ignored) { /* already closed */ }
            return false;
        }
    }
}
