package com.example.coop_vsit_hub.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * HTTP Basic Authentication Filter securing Swagger UI and OpenAPI documentation.
 * Requires valid developer/admin credentials before exposing API specifications.
 */
@Component
@Slf4j
public class SwaggerBasicAuthFilter extends OncePerRequestFilter {

    @Value("${coopbank.security.swagger.username}")
    private String swaggerUsername;

    @Value("${coopbank.security.swagger.password}")
    private String swaggerPassword;

    private static final String REALM = "CoopBank API Documentation";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Always bypass CORS preflight OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }
        if (isSwaggerPath(path)) {
            String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

            if (StringUtils.hasText(authHeader) && authHeader.startsWith("Basic ")) {
                try {
                    String base64Credentials = authHeader.substring("Basic ".length()).trim();
                    byte[] credDecoded = Base64.getDecoder().decode(base64Credentials);
                    String credentials = new String(credDecoded, StandardCharsets.UTF_8);
                    String[] values = credentials.split(":", 2);

                    if (values.length == 2) {
                        String username = values[0];
                        String password = values[1];

                        if (swaggerUsername.equals(username) && swaggerPassword.equals(password)) {
                            // Valid credentials, proceed to Swagger documentation
                            filterChain.doFilter(request, response);
                            return;
                        }
                    }
                } catch (Exception e) {
                    log.warn("Invalid Basic Auth header format on Swagger endpoint: {}", e.getMessage());
                }
            }

            // Authentication required or failed
            log.warn("Unauthorized access attempt to Swagger documentation at '{}' from IP [{}]", path, request.getRemoteAddr());
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Basic realm=\"" + REALM + "\"");
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Authentication required to access CoopBank API documentation.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isSwaggerPath(String path) {
        return path.startsWith("/swagger-ui") ||
               path.startsWith("/v3/api-docs") ||
               path.startsWith("/swagger-resources") ||
               path.equals("/swagger-ui.html");
    }
}
