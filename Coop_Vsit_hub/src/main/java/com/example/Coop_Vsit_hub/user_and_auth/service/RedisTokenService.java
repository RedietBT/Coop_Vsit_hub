package com.example.coop_vsit_hub.user_and_auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * High-performance, self-contained In-Memory Token, Blacklist, and Brute-Force Store.
 * Replaces external Redis dependency for simplified cloud deployment (Render + Neon).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RedisTokenService {

    private static class ExpiringEntry {
        final String value;
        final Instant expiresAt;

        ExpiringEntry(String value, Instant expiresAt) {
            this.value = value;
            this.expiresAt = expiresAt;
        }

        boolean isExpired() {
            return expiresAt != null && Instant.now().isAfter(expiresAt);
        }
    }

    private final Map<String, ExpiringEntry> tokenStore = new ConcurrentHashMap<>();
    private final Map<String, ExpiringEntry> failedAttemptsStore = new ConcurrentHashMap<>();

    private static final String BLACKLIST_PREFIX = "jwt:blacklist:";
    private static final String REFRESH_PREFIX = "jwt:refresh:";
    private static final String REFRESH_USER_PREFIX = "jwt:refresh_user:";
    private static final String RESET_TOKEN_PREFIX = "password_reset:";
    private static final String EMAIL_VERIFY_PREFIX = "email_verify:";

    /**
     * Stores a single-use Email Verification Token with TTL.
     */
    public void storeEmailVerificationToken(String verifyToken, String username, long ttlHours) {
        String key = EMAIL_VERIFY_PREFIX + verifyToken;
        tokenStore.put(key, new ExpiringEntry(username, Instant.now().plusSeconds(ttlHours * 3600)));
        log.info("Email verification token stored in-memory for user: {}", username);
    }

    /**
     * Retrieves username associated with an Email Verification Token.
     */
    public String getUsernameFromEmailVerificationToken(String verifyToken) {
        String key = EMAIL_VERIFY_PREFIX + verifyToken;
        ExpiringEntry entry = tokenStore.get(key);
        if (entry != null && !entry.isExpired()) {
            return entry.value;
        }
        if (entry != null && entry.isExpired()) {
            tokenStore.remove(key);
        }
        return null;
    }

    /**
     * Deletes an Email Verification Token after verification.
     */
    public void deleteEmailVerificationToken(String verifyToken) {
        tokenStore.remove(EMAIL_VERIFY_PREFIX + verifyToken);
        log.info("Email verification token consumed and deleted.");
    }

    /**
     * Stores a single-use Password Reset Token with TTL.
     */
    public void storePasswordResetToken(String resetToken, String username, long ttlMinutes) {
        String key = RESET_TOKEN_PREFIX + resetToken;
        tokenStore.put(key, new ExpiringEntry(username, Instant.now().plusSeconds(ttlMinutes * 60)));
        log.info("Password reset token stored in-memory for user: {}", username);
    }

    /**
     * Retrieves username associated with a Password Reset Token.
     */
    public String getUsernameFromResetToken(String resetToken) {
        String key = RESET_TOKEN_PREFIX + resetToken;
        ExpiringEntry entry = tokenStore.get(key);
        if (entry != null && !entry.isExpired()) {
            return entry.value;
        }
        if (entry != null && entry.isExpired()) {
            tokenStore.remove(key);
        }
        return null;
    }

    /**
     * Deletes a Password Reset Token after consumption.
     */
    public void deletePasswordResetToken(String resetToken) {
        tokenStore.remove(RESET_TOKEN_PREFIX + resetToken);
        log.info("Password reset token consumed and deleted.");
    }

    /**
     * Blacklists an Access JWT Token until its natural expiration.
     */
    public void blacklistToken(String token, long expirationMs) {
        if (expirationMs > 0) {
            String key = BLACKLIST_PREFIX + token;
            tokenStore.put(key, new ExpiringEntry("revoked", Instant.now().plusMillis(expirationMs)));
            log.info("JWT Access Token blacklisted in-memory for {} ms", expirationMs);
        }
    }

    /**
     * Checks if an Access JWT Token is present in the blacklist.
     */
    public boolean isTokenBlacklisted(String token) {
        String key = BLACKLIST_PREFIX + token;
        ExpiringEntry entry = tokenStore.get(key);
        if (entry != null && !entry.isExpired()) {
            return true;
        }
        if (entry != null && entry.isExpired()) {
            tokenStore.remove(key);
        }
        return false;
    }

    /**
     * Stores a User Refresh Token with TTL (dual-index for fast lookup).
     */
    public void storeRefreshToken(String username, String refreshToken, long durationMs) {
        String userKey = REFRESH_PREFIX + username;
        String tokenKey = REFRESH_USER_PREFIX + refreshToken;
        
        // Clear any old token
        ExpiringEntry oldToken = tokenStore.get(userKey);
        if (oldToken != null) {
            tokenStore.remove(REFRESH_USER_PREFIX + oldToken.value);
        }

        Instant expiresAt = Instant.now().plusMillis(durationMs);
        tokenStore.put(userKey, new ExpiringEntry(refreshToken, expiresAt));
        tokenStore.put(tokenKey, new ExpiringEntry(username, expiresAt));
        log.info("Refresh token stored in-memory for user: {}", username);
    }

    /**
     * Retrieves username associated with a Refresh Token.
     */
    public String getUsernameFromRefreshToken(String refreshToken) {
        String tokenKey = REFRESH_USER_PREFIX + refreshToken;
        ExpiringEntry entry = tokenStore.get(tokenKey);
        if (entry != null && !entry.isExpired()) {
            return entry.value;
        }
        if (entry != null && entry.isExpired()) {
            tokenStore.remove(tokenKey);
        }
        return null;
    }

    /**
     * Retrieves active Refresh Token for username.
     */
    public String getRefreshToken(String username) {
        String userKey = REFRESH_PREFIX + username;
        ExpiringEntry entry = tokenStore.get(userKey);
        if (entry != null && !entry.isExpired()) {
            return entry.value;
        }
        if (entry != null && entry.isExpired()) {
            tokenStore.remove(userKey);
        }
        return null;
    }

    /**
     * Removes Refresh Token upon logout or rotation.
     */
    public void deleteRefreshToken(String username) {
        String userKey = REFRESH_PREFIX + username;
        ExpiringEntry oldToken = tokenStore.get(userKey);
        if (oldToken != null) {
            tokenStore.remove(REFRESH_USER_PREFIX + oldToken.value);
        }
        tokenStore.remove(userKey);
        log.info("Refresh token deleted from in-memory store for user: {}", username);
    }

    /**
     * Increments brute-force failed login attempts counter.
     */
    public synchronized long incrementFailedAttempts(String identifier, long lockDurationMinutes) {
        ExpiringEntry current = failedAttemptsStore.get(identifier);
        long newCount = 1;
        if (current != null && !current.isExpired()) {
            newCount = Long.parseLong(current.value) + 1;
        }
        Instant expiresAt = Instant.now().plusSeconds(lockDurationMinutes * 60);
        failedAttemptsStore.put(identifier, new ExpiringEntry(String.valueOf(newCount), expiresAt));
        return newCount;
    }

    /**
     * Resets failed login attempts counter on successful authentication.
     */
    public void resetFailedAttempts(String identifier) {
        failedAttemptsStore.remove(identifier);
    }

    /**
     * Retrieves current failed login attempt count.
     */
    public int getFailedAttempts(String identifier) {
        ExpiringEntry entry = failedAttemptsStore.get(identifier);
        if (entry != null && !entry.isExpired()) {
            return Integer.parseInt(entry.value);
        }
        return 0;
    }
}
