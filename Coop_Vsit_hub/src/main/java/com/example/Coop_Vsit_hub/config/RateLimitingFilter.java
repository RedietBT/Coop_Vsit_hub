package com.example.coop_vsit_hub.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Two-tier In-Memory Rate Limiting Filter.
 *
 * Tier 1 — Global: Max 60 requests/minute per IP across all endpoints.
 * Tier 2 — Login: Max 5 login attempts/minute per IP on /api/v1/auth/login.
 *
 * Both limits are configurable via application.properties / environment variables.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;

    @Value("${coopbank.security.rate-limit.requests-per-minute:60}")
    private int maxRequestsPerMinute;

    @Value("${coopbank.security.rate-limit.login-attempts-per-minute:5}")
    private int maxLoginAttemptsPerMinute;

    private static final String LOGIN_PATH = "/api/v1/auth/login";

    // ── Window Tracking ───────────────────────────────────────────────────────

    private static class RequestWindow {
        final AtomicInteger count = new AtomicInteger(0);
        final long windowStartEpochMinute;

        RequestWindow(long windowStartEpochMinute) {
            this.windowStartEpochMinute = windowStartEpochMinute;
        }
    }

    /** Global per-IP request windows */
    private final Map<String, RequestWindow> globalRateLimits = new ConcurrentHashMap<>();

    /** Login-specific per-IP request windows */
    private final Map<String, RequestWindow> loginRateLimits = new ConcurrentHashMap<>();

    // ── Filter Logic ──────────────────────────────────────────────────────────

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Always bypass CORS preflight OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Bypass static assets, Swagger UI, and OpenAPI docs from rate limiting
        if (path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs")
                || path.startsWith("/swagger-resources") || path.equals("/favicon.ico")
                || path.startsWith("/mailhog")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        long currentEpochMinute = Instant.now().getEpochSecond() / 60;

        // ── Tier 2: Login-specific strict limit ──────────────────────────────
        if (LOGIN_PATH.equals(path) && "POST".equalsIgnoreCase(request.getMethod())) {
            RequestWindow loginWindow = loginRateLimits.compute(clientIp, (key, existing) -> {
                if (existing == null || existing.windowStartEpochMinute != currentEpochMinute) {
                    RequestWindow w = new RequestWindow(currentEpochMinute);
                    w.count.incrementAndGet();
                    return w;
                }
                existing.count.incrementAndGet();
                return existing;
            });

            if (loginWindow.count.get() > maxLoginAttemptsPerMinute) {
                log.warn("LOGIN RATE LIMIT: IP [{}] exceeded {} login attempts/min", clientIp, maxLoginAttemptsPerMinute);
                sendRateLimitResponse(response, path,
                        "Login rate limit exceeded. Maximum " + maxLoginAttemptsPerMinute
                                + " attempts per minute. Please wait before trying again.");
                return;
            }
        }

        // ── Tier 1: Global rate limit ─────────────────────────────────────────
        RequestWindow globalWindow = globalRateLimits.compute(clientIp, (key, existing) -> {
            if (existing == null || existing.windowStartEpochMinute != currentEpochMinute) {
                RequestWindow w = new RequestWindow(currentEpochMinute);
                w.count.incrementAndGet();
                return w;
            }
            existing.count.incrementAndGet();
            return existing;
        });

        if (globalWindow.count.get() > maxRequestsPerMinute) {
            log.warn("RATE LIMIT EXCEEDED: IP [{}] exceeded {} requests/min on path [{}]",
                    clientIp, maxRequestsPerMinute, path);
            sendRateLimitResponse(response, path,
                    "Global rate limit exceeded. Maximum " + maxRequestsPerMinute + " requests per minute permitted.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void sendRateLimitResponse(HttpServletResponse response, String path, String message) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", "60");

        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("timestamp", Instant.now().toString());
        errorDetails.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
        errorDetails.put("error", "Too Many Requests");
        errorDetails.put("message", message);
        errorDetails.put("path", path);

        response.getWriter().write(objectMapper.writeValueAsString(errorDetails));
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
