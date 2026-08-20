package com.example.coop_vsit_hub.user_and_auth.security;

import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.user_and_auth.service.RedisTokenService;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtUtils {

    @Value("${coopbank.security.jwt.secret}")
    private String jwtSecret;

    @Value("${coopbank.security.jwt.access-token-expiration-ms}")
    private long jwtExpirationMs;

    private final RedisTokenService redisTokenService;

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generates a signed JWT Access Token for an authenticated user.
     */
    public String generateAccessToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId().toString());
        claims.put("email", user.getEmail());
        claims.put("fullName", user.getFullName());
        
        Set<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());
        claims.put("roles", roles);

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .claims(claims)
                .subject(user.getUsername())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Extracts username subject from JWT token.
     */
    public String getUsernameFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }

    /**
     * Extracts expiration timestamp from JWT token.
     */
    public Date getExpirationDateFromToken(String token) {
        return getClaimsFromToken(token).getExpiration();
    }

    /**
     * Calculates remaining lifespan in milliseconds for a JWT token.
     */
    public long getRemainingExpirationMs(String token) {
        Date expiration = getExpirationDateFromToken(token);
        long remaining = expiration.getTime() - System.currentTimeMillis();
        return Math.max(0, remaining);
    }

    /**
     * Validates JWT token signature, expiration, and checks Redis blacklist.
     */
    public boolean validateJwtToken(String authToken) {
        try {
            if (redisTokenService.isTokenBlacklisted(authToken)) {
                log.warn("JWT token is blacklisted in Redis");
                return false;
            }

            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(authToken);
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            log.error("Invalid JWT signature: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    private Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long getJwtExpirationMs() {
        return jwtExpirationMs;
    }
}
