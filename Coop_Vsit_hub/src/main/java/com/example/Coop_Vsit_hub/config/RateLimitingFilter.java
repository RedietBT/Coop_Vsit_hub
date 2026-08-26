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
 * Self-contained In-Memory Rate Limiting Filter.
 * Limits API requests per client IP address per minute without requiring external Redis.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;

    @Value("${coopbank.security.rate-limit.requests-per-minute:60}")
    private int maxRequestsPerMinute;

    private static class RequestWindow {
        final AtomicInteger count = new AtomicInteger(0);
        final long windowStartEpochMinute;

        RequestWindow(long windowStartEpochMinute) {
            this.windowStartEpochMinute = windowStartEpochMinute;
        }
    }

    private final Map<String, RequestWindow> clientRateLimits = new ConcurrentHashMap<>();

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
        if (path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs") || path.startsWith("/swagger-resources") || path.equals("/favicon.ico") || path.startsWith("/mailhog")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        long currentEpochMinute = Instant.now().getEpochSecond() / 60;

        RequestWindow window = clientRateLimits.compute(clientIp, (key, existing) -> {
            if (existing == null || existing.windowStartEpochMinute != currentEpochMinute) {
                RequestWindow newWindow = new RequestWindow(currentEpochMinute);
                newWindow.count.incrementAndGet();
                return newWindow;
            }
            existing.count.incrementAndGet();
            return existing;
        });

        int currentCount = window.count.get();

        if (currentCount > maxRequestsPerMinute) {
            log.warn("RATE LIMIT EXCEEDED: Client IP [{}] exceeded {} requests/min threshold on path [{}]", clientIp, maxRequestsPerMinute, path);
            
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", "60");

            Map<String, Object> errorDetails = new HashMap<>();
            errorDetails.put("timestamp", Instant.now().toString());
            errorDetails.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
            errorDetails.put("error", "Too Many Requests");
            errorDetails.put("message", "Global rate limit exceeded. Maximum " + maxRequestsPerMinute + " requests per minute permitted.");
            errorDetails.put("path", path);

            response.getWriter().write(objectMapper.writeValueAsString(errorDetails));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
