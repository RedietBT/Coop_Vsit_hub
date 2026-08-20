package com.example.coop_vsit_hub.user_and_auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisTokenService {

    private final StringRedisTemplate redisTemplate;

    private static final String BLACKLIST_PREFIX = "jwt:blacklist:";
    private static final String REFRESH_PREFIX = "jwt:refresh:";
    private static final String REFRESH_USER_PREFIX = "jwt:refresh_user:";
    private static final String FAILED_ATTEMPTS_PREFIX = "auth:failed:";
    private static final String RESET_TOKEN_PREFIX = "password_reset:";

    /**
     * Stores a single-use Password Reset Token in Redis with TTL.
     */
    public void storePasswordResetToken(String resetToken, String username, long ttlMinutes) {
        String key = RESET_TOKEN_PREFIX + resetToken;
        redisTemplate.opsForValue().set(key, username, ttlMinutes, TimeUnit.MINUTES);
        log.info("Password reset token stored in Redis for user: {}", username);
    }

    /**
     * Retrieves username associated with a Password Reset Token from Redis.
     */
    public String getUsernameFromResetToken(String resetToken) {
        String key = RESET_TOKEN_PREFIX + resetToken;
        return redisTemplate.opsForValue().get(key);
    }

    /**
     * Deletes a Password Reset Token from Redis after consumption.
     */
    public void deletePasswordResetToken(String resetToken) {
        String key = RESET_TOKEN_PREFIX + resetToken;
        redisTemplate.delete(key);
        log.info("Password reset token consumed and deleted from Redis.");
    }

    /**
     * Blacklists an Access JWT Token in Redis until its natural expiration.
     */
    public void blacklistToken(String token, long expirationMs) {
        if (expirationMs > 0) {
            String key = BLACKLIST_PREFIX + token;
            redisTemplate.opsForValue().set(key, "revoked", expirationMs, TimeUnit.MILLISECONDS);
            log.info("JWT Access Token blacklisted in Redis for {} ms", expirationMs);
        }
    }

    /**
     * Checks if an Access JWT Token is present in the Redis blacklist.
     */
    public boolean isTokenBlacklisted(String token) {
        String key = BLACKLIST_PREFIX + token;
        Boolean isBlacklisted = redisTemplate.hasKey(key);
        return Boolean.TRUE.equals(isBlacklisted);
    }

    /**
     * Stores a User Refresh Token in Redis with TTL (dual-index for fast lookup).
     */
    public void storeRefreshToken(String username, String refreshToken, long durationMs) {
        String userKey = REFRESH_PREFIX + username;
        String tokenKey = REFRESH_USER_PREFIX + refreshToken;
        
        // Clear any old token
        String oldToken = redisTemplate.opsForValue().get(userKey);
        if (oldToken != null) {
            redisTemplate.delete(REFRESH_USER_PREFIX + oldToken);
        }

        redisTemplate.opsForValue().set(userKey, refreshToken, durationMs, TimeUnit.MILLISECONDS);
        redisTemplate.opsForValue().set(tokenKey, username, durationMs, TimeUnit.MILLISECONDS);
        log.info("Refresh token stored in Redis for user: {}", username);
    }

    /**
     * Retrieves username associated with a Refresh Token from Redis.
     */
    public String getUsernameFromRefreshToken(String refreshToken) {
        String tokenKey = REFRESH_USER_PREFIX + refreshToken;
        return redisTemplate.opsForValue().get(tokenKey);
    }

    /**
     * Retrieves active Refresh Token for username from Redis.
     */
    public String getRefreshToken(String username) {
        String userKey = REFRESH_PREFIX + username;
        return redisTemplate.opsForValue().get(userKey);
    }

    /**
     * Removes Refresh Token from Redis upon logout or rotation.
     */
    public void deleteRefreshToken(String username) {
        String userKey = REFRESH_PREFIX + username;
        String oldToken = redisTemplate.opsForValue().get(userKey);
        if (oldToken != null) {
            redisTemplate.delete(REFRESH_USER_PREFIX + oldToken);
        }
        redisTemplate.delete(userKey);
        log.info("Refresh token deleted from Redis for user: {}", username);
    }

    /**
     * Increments brute-force failed login attempts counter in Redis.
     */
    public long incrementFailedAttempts(String identifier, long lockDurationMinutes) {
        String key = FAILED_ATTEMPTS_PREFIX + identifier;
        Long attempts = redisTemplate.opsForValue().increment(key);
        if (attempts != null && attempts == 1) {
            redisTemplate.expire(key, lockDurationMinutes, TimeUnit.MINUTES);
        }
        return attempts != null ? attempts : 1;
    }

    /**
     * Resets failed login attempts counter in Redis on successful authentication.
     */
    public void resetFailedAttempts(String identifier) {
        String key = FAILED_ATTEMPTS_PREFIX + identifier;
        redisTemplate.delete(key);
    }

    /**
     * Retrieves current failed login attempt count from Redis.
     */
    public int getFailedAttempts(String identifier) {
        String key = FAILED_ATTEMPTS_PREFIX + identifier;
        String count = redisTemplate.opsForValue().get(key);
        return count != null ? Integer.parseInt(count) : 0;
    }
}
