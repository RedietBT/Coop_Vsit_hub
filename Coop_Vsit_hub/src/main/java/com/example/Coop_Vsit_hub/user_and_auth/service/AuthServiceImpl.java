package com.example.coop_vsit_hub.user_and_auth.service;

import com.example.coop_vsit_hub.user_and_auth.dto.*;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditEventType;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditStatus;
import com.example.coop_vsit_hub.user_and_auth.enums.RoleName;
import com.example.coop_vsit_hub.user_and_auth.model.Role;
import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.user_and_auth.repository.RoleRepository;
import com.example.coop_vsit_hub.user_and_auth.repository.UserRepository;
import com.example.coop_vsit_hub.user_and_auth.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final RedisTokenService redisTokenService;
    private final BruteForceProtectionService bruteForceProtectionService;
    private final AuditLoggerService auditLoggerService;
    private final EmailService emailService;

    @Value("${coopbank.security.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request, String ipAddress, String userAgent) {
        log.info("Processing user registration for username: {}, email: {}", request.getUsername(), request.getEmail());

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username '" + request.getUsername() + "' is already taken.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email address '" + request.getEmail() + "' is already registered.");
        }

        Set<Role> roles = new HashSet<>();
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            for (RoleName roleName : request.getRoles()) {
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleName));
                roles.add(role);
            }
        } else {
            // Default role assignment
            Role defaultRole = roleRepository.findByName(RoleName.ROLE_RELATIONSHIP_MANAGER)
                    .orElseThrow(() -> new IllegalStateException("Default ROLE_RELATIONSHIP_MANAGER not found in database."));
            roles.add(defaultRole);
        }

        User user = User.builder()
                .username(request.getUsername().trim())
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .middleName(request.getMiddleName() != null ? request.getMiddleName().trim() : null)
                .lastName(request.getLastName().trim())
                .department(request.getDepartment() != null ? request.getDepartment().trim() : null)
                .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null)
                .isEnabled(true)
                .isAccountNonLocked(true)
                .failedLoginAttempts(0)
                .roles(roles)
                .build();

        User savedUser = userRepository.save(user);

        // Audit Logging
        auditLoggerService.logEvent(
                savedUser,
                savedUser.getUsername(),
                AuditEventType.LOGIN_SUCCESS,
                AuditStatus.SUCCESS,
                ipAddress,
                userAgent,
                "New user registered successfully with roles: " + roles.stream().map(r -> r.getName().name()).collect(Collectors.joining(","))
        );

        return buildAuthResponse(savedUser);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        String identifier = request.getIdentifier().trim();
        log.info("Processing authentication request for identifier: {}", identifier);

        User user = userRepository.findByUsernameOrEmail(identifier)
                .orElse(null);

        // Security Check 1: Brute Force Account Lockout
        if (user != null && bruteForceProtectionService.isAccountLocked(user)) {
            auditLoggerService.logEvent(
                    user,
                    identifier,
                    AuditEventType.ACCOUNT_LOCKED,
                    AuditStatus.BLOCKED,
                    ipAddress,
                    userAgent,
                    "Login attempt rejected. Account is locked due to repeated failed attempts."
            );
            throw new IllegalStateException("Account is temporarily locked due to 5 consecutive failed login attempts. Please try again after 15 minutes.");
        }

        // Security Check 2: Invalid User or Password Match Failure
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            boolean isLockedNow = bruteForceProtectionService.recordFailedAttempt(user, identifier);

            auditLoggerService.logEvent(
                    user,
                    identifier,
                    AuditEventType.LOGIN_FAILED,
                    AuditStatus.FAILURE,
                    ipAddress,
                    userAgent,
                    isLockedNow ? "Invalid password. Account threshold exceeded and locked." : "Invalid credentials supplied."
            );

            if (isLockedNow) {
                throw new IllegalStateException("Account is now locked due to 5 consecutive failed login attempts. Try again after 15 minutes.");
            }

            throw new IllegalArgumentException("Invalid username/email or password.");
        }

        // Security Check 3: Account Enabled Check
        if (!user.isEnabled()) {
            auditLoggerService.logEvent(user, identifier, AuditEventType.LOGIN_FAILED, AuditStatus.BLOCKED, ipAddress, userAgent, "Disabled account attempted login.");
            throw new IllegalStateException("User account is disabled. Please contact CoopBank system administrator.");
        }

        // Successful Authentication: Reset counters & issue tokens
        bruteForceProtectionService.recordSuccess(user, identifier);

        auditLoggerService.logEvent(
                user,
                user.getUsername(),
                AuditEventType.LOGIN_SUCCESS,
                AuditStatus.SUCCESS,
                ipAddress,
                userAgent,
                "User authenticated successfully."
        );

        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request, String ipAddress, String userAgent) {
        String rawRefreshToken = request.getRefreshToken().trim();
        log.info("Processing token refresh request.");

        String username = redisTokenService.getUsernameFromRefreshToken(rawRefreshToken);
        if (username == null) {
            log.warn("Invalid or expired refresh token provided.");
            throw new IllegalArgumentException("Invalid or expired refresh token. Please sign in again.");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found for refresh token."));

        if (!user.isEnabled() || !user.isAccountNonLocked()) {
            redisTokenService.deleteRefreshToken(username);
            throw new IllegalStateException("User account is locked or disabled.");
        }

        auditLoggerService.logEvent(
                user,
                username,
                AuditEventType.TOKEN_REFRESH,
                AuditStatus.SUCCESS,
                ipAddress,
                userAgent,
                "Access token refreshed successfully using Redis session store."
        );

        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public void logout(String accessToken, String username, String ipAddress, String userAgent) {
        log.info("Processing logout for user: {}", username);

        User user = userRepository.findByUsername(username).orElse(null);

        // 1. Blacklist Access JWT in Redis for its remaining lifespan
        if (accessToken != null && accessToken.startsWith("Bearer ")) {
            String token = accessToken.substring(7);
            long remainingMs = jwtUtils.getRemainingExpirationMs(token);
            redisTokenService.blacklistToken(token, remainingMs);
        }

        // 2. Delete Refresh Token from Redis
        if (username != null) {
            redisTokenService.deleteRefreshToken(username);
        }

        // 3. Log Audit Event
        auditLoggerService.logEvent(
                user,
                username,
                AuditEventType.LOGOUT,
                AuditStatus.SUCCESS,
                ipAddress,
                userAgent,
                "User signed out successfully. Access token blacklisted in Redis."
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + username));
        return buildUserProfileResponse(user);
    }

    @Override
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request, String ipAddress, String userAgent) {
        log.info("Processing password change request for user: {}", username);

        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new IllegalArgumentException("New password and confirmation password do not match.");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found."));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            auditLoggerService.logEvent(user, username, AuditEventType.PASSWORD_CHANGE, AuditStatus.FAILURE, ipAddress, userAgent, "Current password validation failed.");
            throw new IllegalArgumentException("Incorrect current password.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("New password cannot be identical to your current password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(java.time.Instant.now());
        userRepository.save(user);

        // Revoke active refresh token in Redis to force clean session refresh
        redisTokenService.deleteRefreshToken(username);

        auditLoggerService.logEvent(
                user,
                username,
                AuditEventType.PASSWORD_CHANGE,
                AuditStatus.SUCCESS,
                ipAddress,
                userAgent,
                "Password changed successfully by authenticated user."
        );
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request, String ipAddress, String userAgent) {
        String identifier = request.getIdentifier().trim();
        log.info("Processing forgot password request for identifier: {}", identifier);

        User user = userRepository.findByUsernameOrEmailOrPhoneNumber(identifier).orElse(null);

        if (user != null && user.isEnabled() && user.isAccountNonLocked()) {
            String resetToken = UUID.randomUUID().toString();

            // Store single-use reset token in Redis for 15 minutes
            redisTokenService.storePasswordResetToken(resetToken, user.getUsername(), 15);

            // Send email notification via MailHog strictly to user's registered email
            emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), resetToken);

            auditLoggerService.logEvent(
                    user,
                    user.getUsername(),
                    AuditEventType.PASSWORD_CHANGE,
                    AuditStatus.SUCCESS,
                    ipAddress,
                    userAgent,
                    "Password reset token generated and email dispatched to: " + user.getEmail()
            );
        } else {
            auditLoggerService.logEvent(
                    null,
                    identifier,
                    AuditEventType.PASSWORD_CHANGE,
                    AuditStatus.FAILURE,
                    ipAddress,
                    userAgent,
                    "Forgot password requested for non-existent or locked account identifier."
            );
        }
        // Always return silently without revealing account existence to prevent user enumeration
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request, String ipAddress, String userAgent) {
        log.info("Processing reset password completion.");

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New password and confirmation password do not match.");
        }

        String rawToken = request.getToken().trim();
        String username = redisTokenService.getUsernameFromResetToken(rawToken);

        if (username == null) {
            log.warn("Invalid or expired password reset token supplied.");
            throw new IllegalArgumentException("Invalid or expired password reset link. Please request a new password reset.");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User account associated with reset token not found."));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(java.time.Instant.now());
        userRepository.save(user);

        // Delete single-use token from Redis
        redisTokenService.deletePasswordResetToken(rawToken);

        // Revoke active refresh token session
        redisTokenService.deleteRefreshToken(username);

        auditLoggerService.logEvent(
                user,
                username,
                AuditEventType.PASSWORD_CHANGE,
                AuditStatus.SUCCESS,
                ipAddress,
                userAgent,
                "Password reset completed successfully using reset token."
        );
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtils.generateAccessToken(user);
        String refreshToken = UUID.randomUUID().toString();

        // Store refresh token in Redis with 7-day TTL
        redisTokenService.storeRefreshToken(user.getUsername(), refreshToken, refreshTokenExpirationMs);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresInMs(jwtUtils.getJwtExpirationMs())
                .refreshToken(refreshToken)
                .user(buildUserProfileResponse(user))
                .build();
    }

    private UserProfileResponse buildUserProfileResponse(User user) {
        Set<String> roles = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toSet());

        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .middleName(user.getMiddleName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .department(user.getDepartment())
                .phoneNumber(user.getPhoneNumber())
                .isEnabled(user.isEnabled())
                .isAccountNonLocked(user.isAccountNonLocked())
                .roles(roles)
                .build();
    }
}
