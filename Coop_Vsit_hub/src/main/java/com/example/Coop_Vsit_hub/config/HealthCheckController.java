package com.example.coop_vsit_hub.config;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Lightweight public health-check ping endpoint.
 * Perfect for free uptime monitor pings (e.g. Cron-job.org / UptimeRobot)
 * to keep Render free tier awake 24/7 without hitting sleep timeouts.
 */
@RestController
public class HealthCheckController {

    @GetMapping({"/health", "/api/v1/health", "/ping"})
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "CoopBank Visit Hub API",
                "environment", "Render Cloud",
                "timestamp", Instant.now().toString()
        ));
    }
}
