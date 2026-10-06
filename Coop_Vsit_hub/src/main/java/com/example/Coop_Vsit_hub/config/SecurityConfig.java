package com.example.coop_vsit_hub.config;

import com.example.coop_vsit_hub.user_and_auth.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Global Spring Security & Access Control Configuration.
 * Implements:
 *  - CORS restricted to env-configured origins (NFR: wildcard removed)
 *  - X-Frame-Options: SAMEORIGIN (Swagger UI served via same origin)
 *  - Content-Security-Policy header (NFR: XSS Defence in Depth)
 *  - HSTS header (NFR: HTTPS enforcement — also enforce at nginx level)
 *  - Referrer-Policy: strict-origin-when-cross-origin
 *  - Stateless JWT sessions, no form login, no HTTP Basic
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitingFilter rateLimitingFilter;
    private final SwaggerBasicAuthFilter swaggerBasicAuthFilter;

    @Value("${coopbank.security.cors.allowed-origins:http://localhost:3000,http://localhost:5173,http://localhost:4173,https://coop-vsit-hub.vercel.app,https://*.vercel.app,http://10.8.101.150,http://10.8.101.150:*,http://visit-hub.coopbank.local,http://visit-hub.coopbank.local:*}")
    private String allowedOriginsConfig;

    /** Set HSTS_ENABLED=true in production (HTTPS). Keep false for local HTTP dev. */
    @Value("${coopbank.security.hsts.enabled:false}")
    private boolean hstsEnabled;

    @Value("${coopbank.security.hsts.max-age-seconds:31536000}")
    private long hstsMaxAgeSeconds;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> {
                // ── X-Frame-Options: SAMEORIGIN ───────────────────────────────────────
                // Prevents clickjacking from external sites while allowing same-domain iframes
                // (Swagger UI is on the same origin so it still works)
                headers.frameOptions(frame -> frame.sameOrigin());

                // ── X-Content-Type-Options: nosniff ──────────────────────────────────
                headers.contentTypeOptions(Customizer.withDefaults());

                // ── X-XSS-Protection: 1; mode=block ──────────────────────────────────
                headers.xssProtection(Customizer.withDefaults());

                // ── Content-Security-Policy ───────────────────────────────────────────
                // Restricts script, style and connection sources to same-origin + known CDNs.
                // Google Fonts is allowed for the app's typography. Adjust as needed.
                headers.addHeaderWriter(new StaticHeadersWriter(
                    "Content-Security-Policy",
                    "default-src 'self'; " +
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +  // unsafe-eval needed for Vite dev / swagger-ui
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                    "font-src 'self' https://fonts.gstatic.com; " +
                    "img-src 'self' data: blob:; " +
                    "connect-src 'self'; " +
                    "frame-ancestors 'self'; " +
                    "object-src 'none'; " +
                    "base-uri 'self';"
                ));

                // ── Referrer-Policy ────────────────────────────────────────────────────
                headers.referrerPolicy(referrer ->
                    referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN));

                // ── HSTS (HTTP Strict Transport Security) ────────────────────────────
                // Only effective over HTTPS. Enable in production via HSTS_ENABLED=true.
                // Also configure in nginx: add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
                if (hstsEnabled) {
                    headers.httpStrictTransportSecurity(hsts -> hsts
                        .maxAgeInSeconds(hstsMaxAgeSeconds)
                        .includeSubDomains(true)
                        .preload(true));
                }
            })
            .authorizeHttpRequests(auth -> auth
                // Allow all CORS OPTIONS preflight requests globally
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Swagger UI & OpenAPI Documentation
                .requestMatchers(
                    "/swagger-ui.html",
                    "/swagger-ui/**",
                    "/v3/api-docs",
                    "/v3/api-docs/**",
                    "/swagger-resources/**",
                    "/webjars/**"
                ).permitAll()
                // Public Auth Endpoints
                .requestMatchers(
                    "/api/v1/auth/login",
                    "/api/v1/auth/refresh",
                    "/api/v1/auth/forgot-password",
                    "/api/v1/auth/reset-password",
                    "/api/v1/auth/verify-email/**"
                ).permitAll()
                // Public Feedback Endpoints & Room Images
                .requestMatchers(
                    "/api/v1/feedback/verify/**",
                    "/api/v1/feedback/submit",
                    "/api/v1/meeting-rooms/images/**",
                    "/api/v1/files/**"
                ).permitAll()
                // Health Check / Keep-Alive Pings
                .requestMatchers("/health", "/api/v1/health", "/ping").permitAll()
                // Static assets
                .requestMatchers("/error", "/favicon.ico").permitAll()
                // All other endpoints require JWT
                .anyRequest().authenticated()
            )
            .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(swaggerBasicAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }


    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = buildCorsConfiguration();
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /** Runs before Spring Security so preflight OPTIONS is never rejected as "Invalid CORS request". */
    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilterRegistration(CorsConfigurationSource corsConfigurationSource) {
        FilterRegistrationBean<CorsFilter> registration = new FilterRegistrationBean<>(new CorsFilter(corsConfigurationSource));
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }

    private CorsConfiguration buildCorsConfiguration() {
        CorsConfiguration configuration = new CorsConfiguration();
        applyAllowedOrigins(configuration, allowedOriginsConfig);

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "Link", "X-Total-Count"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        return configuration;
    }

    /**
     * Maps {@code coopbank.security.cors.allowed-origins} into Spring CORS origin rules.
     * Literal {@code *} cannot be used with {@code allowCredentials=true}; use explicit origins or patterns instead.
     */
    private static void applyAllowedOrigins(CorsConfiguration configuration, String allowedOriginsConfig) {
        Set<String> origins = new LinkedHashSet<>();
        Set<String> patterns = new LinkedHashSet<>();

        Arrays.stream(allowedOriginsConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .forEach(token -> addOriginToken(origins, patterns, token));

        if (origins.isEmpty() && patterns.isEmpty()) {
            addOriginToken(origins, patterns, "http://10.8.101.150");
            addOriginToken(origins, patterns, "http://10.8.101.150:*");
            addOriginToken(origins, patterns, "http://visit-hub.coopbank.local");
            addOriginToken(origins, patterns, "http://visit-hub.coopbank.local:*");
            addOriginToken(origins, patterns, "http://localhost:*");
            addOriginToken(origins, patterns, "https://*.vercel.app");
        }

        if (!origins.isEmpty()) {
            configuration.setAllowedOrigins(new ArrayList<>(origins));
        }
        if (!patterns.isEmpty()) {
            configuration.setAllowedOriginPatterns(new ArrayList<>(patterns));
        }
    }

    /**
     * {@code http://10.8.101.150:*} does not match browser Origin {@code http://10.8.101.150}
     * (default port is omitted). Expand host:port patterns to include the base origin.
     */
    private static void addOriginToken(Set<String> origins, Set<String> patterns, String token) {
        if ("*".equals(token)) {
            return;
        }
        if (token.contains("*")) {
            patterns.add(token);
            if (token.endsWith(":*")) {
                String base = token.substring(0, token.length() - 2);
                origins.add(base);
                if (base.startsWith("http://")) {
                    origins.add(base + ":80");
                } else if (base.startsWith("https://")) {
                    origins.add(base + ":443");
                }
            }
            return;
        }
        origins.add(token);
    }

}
