package com.example.coop_vsit_hub.user_and_auth.service;

import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.user_and_auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class BruteForceProtectionService {

    @Value("${coopbank.security.brute-force.max-attempts}")
    private int maxAttempts;

    @Value("${coopbank.security.brute-force.lock-duration-minutes}")
    private long lockDurationMinutes;

    private final RedisTokenService redisTokenService;
    private final UserRepository userRepository;

    /**
     * Records a failed login attempt in Redis and locks account if threshold exceeded.
     */
    @Transactional
    public boolean recordFailedAttempt(User user, String identifier) {
        long currentAttempts = redisTokenService.incrementFailedAttempts(identifier, lockDurationMinutes);
        log.warn("Failed login attempt #{} for identifier: {}", currentAttempts, identifier);

        if (user != null) {
            user.setFailedLoginAttempts((int) currentAttempts);

            if (currentAttempts >= maxAttempts) {
                user.setAccountNonLocked(false);
                user.setLockTime(Instant.now());
                userRepository.save(user);
                log.error("ACCOUNT LOCKED: User [{}] locked due to {} consecutive failed login attempts.", user.getUsername(), currentAttempts);
                return true; // Account is now locked
            } else {
                userRepository.save(user);
            }
        }
        return false;
    }

    /**
     * Resets failed login counters in Redis and DB upon successful login.
     */
    @Transactional
    public void recordSuccess(User user, String identifier) {
        redisTokenService.resetFailedAttempts(identifier);
        if (user != null && (user.getFailedLoginAttempts() > 0 || !user.isAccountNonLocked())) {
            user.setFailedLoginAttempts(0);
            user.setAccountNonLocked(true);
            user.setLockTime(null);
            userRepository.save(user);
            log.info("Reset login failure counters for user: {}", user.getUsername());
        }
    }

    /**
     * Checks if a locked account's cooldown period has expired and unlocks automatically.
     */
    @Transactional
    public boolean isAccountLocked(User user) {
        if (user == null || user.isAccountNonLocked()) {
            return false;
        }

        if (user.getLockTime() != null) {
            Instant unlockTime = user.getLockTime().plus(lockDurationMinutes, ChronoUnit.MINUTES);
            if (Instant.now().isAfter(unlockTime)) {
                // Cooldown period expired, unlock account
                user.setAccountNonLocked(true);
                user.setFailedLoginAttempts(0);
                user.setLockTime(null);
                userRepository.save(user);
                log.info("Account [{}] automatically unlocked after cooldown period.", user.getUsername());
                return false;
            }
        }
        return true;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public long getLockDurationMinutes() {
        return lockDurationMinutes;
    }
}
