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
import com.example.coop_vsit_hub.user_and_auth.security.TemporaryPasswordGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Map;
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

    private final ActiveDirectoryAuthService activeDirectoryAuthService;

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

        boolean isAdStaff = Boolean.TRUE.equals(request.getIsAdUser());
        if (!isAdStaff && activeDirectoryAuthService.isAdEnabled()) {
            try {
                Map<String, Object> adCheck = activeDirectoryAuthService.lookupByEmail(request.getEmail());
                if (Boolean.TRUE.equals(adCheck.get("found"))) {
                    isAdStaff = true;
                }
            } catch (Exception ignored) {}
        }

        boolean hasExplicitPassword = org.springframework.util.StringUtils.hasText(request.getPassword());
        String effectivePassword;
        if (hasExplicitPassword) {
            effectivePassword = request.getPassword().trim();
        } else if (isAdStaff) {
            effectivePassword = UUID.randomUUID().toString();
        } else {
            effectivePassword = TemporaryPasswordGenerator.generateTemporaryPassword();
        }

        User user = User.builder()
                .username(request.getUsername().trim())
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(effectivePassword))
                .firstName(request.getFirstName().trim())
                .middleName(request.getMiddleName() != null ? request.getMiddleName().trim() : null)
                .lastName(request.getLastName().trim())
                .department(request.getDepartment() != null ? request.getDepartment().trim() : null)
                .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null)
                .isEnabled(true)
                .isAccountNonLocked(true)
                .isEmailVerified(true) // Staff onboarded by admin are immediately pre-verified
                .mustChangePassword(false)
                .failedLoginAttempts(0)
                .roles(roles)
                .build();

        User savedUser = userRepository.save(user);

        String roleSummary = savedUser.getRoles().stream()
                .map(r -> r.getName().name().replace("ROLE_", "").replace("_", " "))
                .collect(Collectors.joining(", "));

        String roleDetails = savedUser.getRoles().stream()
                .map(r -> "<strong>" + r.getName().name().replace("ROLE_", "").replace("_", " ") + "</strong>: "
                        + (r.getDescription() != null ? r.getDescription() : "Authorized access"))
                .collect(Collectors.joining("<br/>"));

        // Dispatch Onboarding Email with credentials and role explanation
        try {
            String emailPassword = isAdStaff ? "Use your official Active Directory password" : effectivePassword;
            emailService.sendStaffOnboardingEmail(
                    savedUser.getEmail(),
                    savedUser.getFullName(),
                    savedUser.getUsername(),
                    emailPassword,
                    roleSummary,
                    roleDetails
            );
        } catch (Exception e) {
            log.warn("Could not dispatch onboarding email for {}: {}", savedUser.getEmail(), e.getMessage());
        }

        auditLoggerService.logEvent(
                savedUser,
                savedUser.getUsername(),
                AuditEventType.LOGIN_SUCCESS,
                AuditStatus.SUCCESS,
                ipAddress,
                userAgent,
                isAdStaff ? "New AD staff registered. System roles assigned: " + request.getRoles()
                          : "New staff user registered with credentials and role permissions."
        );

        return AuthResponse.builder()
                .isEmailVerified(true)
                .mustChangePassword(false)
                .message("User registered successfully. Welcome email with account credentials and role details sent to " + savedUser.getEmail())
                .user(buildUserProfileResponse(savedUser))
                .build();
    }

    @Override
    @Transactional
    public void verifyEmail(String token) {
        log.info("Processing email verification request.");

        String rawToken = token.trim();
        String username = redisTokenService.getUsernameFromEmailVerificationToken(rawToken);

        if (username == null) {
            log.warn("Invalid or expired email verification token provided.");
            throw new IllegalArgumentException("Invalid or expired email verification link. Please contact CoopBank system administrator.");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User account associated with verification token not found."));

        user.setEmailVerified(true);
        userRepository.save(user);

        redisTokenService.deleteEmailVerificationToken(rawToken);

        auditLoggerService.logEvent(
                user,
                username,
                AuditEventType.LOGIN_SUCCESS,
                AuditStatus.SUCCESS,
                "127.0.0.1",
                "System Verification Link",
                "Email address verified successfully via verification token."
        );
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        String identifier = request.getIdentifier().trim();
        String loginType = request.getLoginType() != null ? request.getLoginType().trim().toUpperCase() : "";
        log.info("Processing authentication request for identifier: {} (type: {})", identifier, loginType);

        String cleanUsername = identifier.contains("@") ? identifier.substring(0, identifier.indexOf("@")).trim() : identifier;

        // Step 1: Check Local Database
        // Matches identifier (full email or username), clean username (e.g. "frontdesk" from "frontdesk@coopbank.local"), or phone
        User localUser = userRepository.findByUsernameOrEmailIgnoreCase(identifier)
                .or(() -> userRepository.findByUsernameOrEmailIgnoreCase(cleanUsername))
                .or(() -> userRepository.findByUsernameOrEmailOrPhoneNumber(identifier))
                .orElse(null);

        // If local user exists and password matches local BCrypt hash, authenticate locally
        if (localUser != null && passwordEncoder.matches(request.getPassword(), localUser.getPasswordHash())) {
            // Security Check 1: Brute Force Account Lockout
            if (bruteForceProtectionService.isAccountLocked(localUser)) {
                auditLoggerService.logEvent(
                        localUser,
                        identifier,
                        AuditEventType.LOGIN_FAILED,
                        AuditStatus.BLOCKED,
                        ipAddress,
                        userAgent,
                        "Locked account attempted login."
                );
                throw new IllegalStateException(String.format("Account is temporarily locked due to %d consecutive failed login attempts. Please try again after %d minutes.",
                        bruteForceProtectionService.getMaxAttempts(), bruteForceProtectionService.getLockDurationMinutes()));
            }

            // Security Check 2: Account Enabled Check
            if (!localUser.isEnabled()) {
                auditLoggerService.logEvent(localUser, identifier, AuditEventType.LOGIN_FAILED, AuditStatus.BLOCKED, ipAddress, userAgent, "Disabled account attempted login.");
                throw new IllegalStateException("User account is disabled. Please contact CoopBank system administrator.");
            }

            // Auto-verify email for onboarded staff upon successful credential verification
            if (!localUser.isEmailVerified()) {
                localUser.setEmailVerified(true);
                userRepository.save(localUser);
            }

            // Successful Authentication: Reset counters
            bruteForceProtectionService.recordSuccess(localUser, identifier);

            auditLoggerService.logEvent(
                    localUser,
                    localUser.getUsername(),
                    AuditEventType.LOGIN_SUCCESS,
                    AuditStatus.SUCCESS,
                    ipAddress,
                    userAgent,
                    "User authenticated successfully via credentials."
            );

            return buildAuthResponse(localUser);
        }

        // Step 2: If local credentials did not match or user is not local, attempt Active Directory
        if (activeDirectoryAuthService.isAdEnabled()) {
            try {
                User adUser = activeDirectoryAuthService.authenticateStaff(identifier, request.getPassword());
                auditLoggerService.logEvent(
                        adUser,
                        adUser.getUsername(),
                        AuditEventType.LOGIN_SUCCESS,
                        AuditStatus.SUCCESS,
                        ipAddress,
                        userAgent,
                        "Staff authenticated via CoopBank Active Directory (LDAPS)."
                );
                return buildAuthResponse(adUser);
            } catch (IllegalArgumentException e) {
                log.info("Active Directory authentication rejected for {}: {}", identifier, e.getMessage());
            } catch (Exception e) {
                log.warn("Active Directory authentication could not be completed for {}: {}", identifier, e.getMessage());
            }
        }

        // Step 3: If neither local nor AD authentication succeeded
        if (localUser != null) {
            bruteForceProtectionService.recordFailedAttempt(localUser, identifier);
        }
        throw new IllegalArgumentException("Invalid username/email or password.");
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(String rawRefreshToken, String ipAddress, String userAgent) {
        log.info("Processing token refresh request.");

        String username = redisTokenService.getUsernameFromRefreshToken(rawRefreshToken.trim());
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
        user.setMustChangePassword(false);
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
        user.setMustChangePassword(false);
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

        // refreshToken is NOT returned in the JSON body — it is set as HttpOnly cookie by AuthController
        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresInMs(jwtUtils.getJwtExpirationMs())
                .rawRefreshToken(refreshToken)   // temporary carrier: controller reads this and sets the cookie
                .isEmailVerified(user.isEmailVerified())
                .mustChangePassword(user.isMustChangePassword())
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
                .isEmailVerified(user.isEmailVerified())
                .mustChangePassword(user.isMustChangePassword())
                .roles(roles)
                .build();
    }
}
