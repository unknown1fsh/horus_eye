package com.scinar.horuseye.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

/**
 * Server-side proxy for public feeds whose providers do not send permissive
 * CORS headers (OpenSky, GDELT). The browser cannot reach them directly so we
 * fetch from the backend instead. Responses are returned verbatim as JSON so
 * the existing frontend parsers keep working unchanged.
 *
 * Note: this is the minimal N1.10 milestone — orchestration (FeedSource/
 * Registry/Scheduler/Redis cache) lands in the follow-up commits.
 */
@RestController
@RequestMapping("/api/v1/feeds")
public class FeedProxyController {

    private static final String OPENSKY_URL = "https://opensky-network.org/api/states/all";
    // GDELT requires a valid query and surrounds OR'd terms in parentheses.
    // We ask for major English-language wire services to get geocoded global news.
    private static final String GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
            + "?query=%28domain%3Areuters.com%20OR%20domain%3Abbc.com%20OR%20domain%3Aaljazeera.com%29"
            + "&mode=ArtList&format=JSON&maxrecords=250&sort=DateDesc";

    private final WebClient webClient;
    private final String allowedOrigin;

    public FeedProxyController(@Value("${app.cors.allowed-origin:http://localhost:4200}") String allowedOrigin) {
        this.allowedOrigin = allowedOrigin;
        this.webClient = WebClient.builder()
                .codecs(c -> c.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
                .build();
    }

    @GetMapping(value = "/aircraft", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> aircraft() {
        return ResponseEntity.ok()
                .header("Access-Control-Allow-Origin", allowedOrigin)
                .header("Cache-Control", "public, max-age=10")
                .body(fetch(OPENSKY_URL));
    }

    @GetMapping(value = "/gdelt", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> gdelt() {
        return ResponseEntity.ok()
                .header("Access-Control-Allow-Origin", allowedOrigin)
                .header("Cache-Control", "public, max-age=300")
                .body(fetch(GDELT_URL));
    }

    private String fetch(String url) {
        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(20))
                .onErrorReturn("{\"error\":\"proxy fetch failed\"}")
                .block();
    }
}
