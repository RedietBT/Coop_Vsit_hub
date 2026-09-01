package com.example.coop_vsit_hub.config;

import com.example.coop_vsit_hub.user_and_auth.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

/**
 * Global Spring Security & Access Control Configuration.
 * Fully allows CORS preflight (OPTIONS), Swagger UI, MailHog, and public auth endpoints.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitingFilter rateLimitingFilter;
    private final SwaggerBasicAuthFilter swaggerBasicAuthFilter;

    @Value("${coopbank.security.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOriginsConfig;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .frameOptions(frame -> frame.disable()) // Allow Swagger UI embedded frames
                .contentTypeOptions(Customizer.withDefaults())
                .xssProtection(Customizer.withDefaults())
            )
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
                    "/api/v1/meeting-rooms/images/**"
                ).permitAll()
                // MailHog Web Dashboard
                .requestMatchers("/mailhog", "/mailhog/**").permitAll()
                // Health Check / Keep-Alive Pings
                .requestMatchers("/health", "/api/v1/health", "/ping").permitAll()
                // Static assets
                .requestMatchers("/error", "/favicon.ico").permitAll()
                // All other endpoints require JWT
                .anyRequest().authenticated()
            )
            .addFilterBefore(new CorsFilter(corsConfigurationSource()), UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(swaggerBasicAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        // Parse comma-separated origins from environment / application.properties
        List<String> allowedOrigins = Arrays.stream(allowedOriginsConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "Link", "X-Total-Count"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
