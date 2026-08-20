package com.example.coop_vsit_hub.user_and_auth.controller;

import com.example.coop_vsit_hub.user_and_auth.dto.*;
import com.example.coop_vsit_hub.user_and_auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "1. Authentication & User Management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(
            summary = "Register Bank Staff Account (Admin Only)",
            description = "Onboards a new CoopBank user. Accessible only by authenticated Administrators with ROLE_ADMIN.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest
    ) {
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        AuthResponse response = authService.register(request, ipAddress, userAgent);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate & Obtain JWT", description = "Authenticates bank staff with username/email and password. Returns JWT access token and refresh token.")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        AuthResponse response = authService.login(request, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh JWT Access Token", description = "Rotates access token using active Redis-backed refresh token.")
    public ResponseEntity<AuthResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest
    ) {
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        AuthResponse response = authService.refreshToken(request, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(
            summary = "Logout & Revoke Token Session",
            description = "Blacklists access token in Redis and revokes active refresh token session.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<Void> logout(
            @RequestHeader(value = "Authorization", required = false) String accessToken,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        String username = authentication != null ? authentication.getName() : null;
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        authService.logout(accessToken, username, ipAddress, userAgent);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @Operation(
            summary = "Get Authenticated Staff Profile",
            description = "Retrieves profile and active roles for currently logged-in user.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<UserProfileResponse> getCurrentUserProfile(Authentication authentication) {
        String username = authentication.getName();
        UserProfileResponse profile = authService.getUserProfile(username);
        return ResponseEntity.ok(profile);
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Change Staff Account Password",
            description = "Allows an authenticated user to change their account password. Revokes active sessions in Redis upon completion.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        String username = authentication.getName();
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        authService.changePassword(username, request, ipAddress, userAgent);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Password changed successfully. Active sessions have been invalidated for security.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    @Operation(
            summary = "Request Password Reset Link (Public)",
            description = "Initiates a password reset request. Accepts Username, Email, or Phone Number. Sends HTML email with 15-minute token via MailHog."
    )
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest
    ) {
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        authService.forgotPassword(request, ipAddress, userAgent);

        Map<String, String> response = new HashMap<>();
        response.put("message", "If an account matches the provided information, a password reset link has been dispatched to the registered email address.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    @Operation(
            summary = "Complete Password Reset (Public)",
            description = "Resets user password using single-use Redis-backed token received via email."
    )
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest
    ) {
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        authService.resetPassword(request, ipAddress, userAgent);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Password reset successfully. You may now sign in with your new password.");
        return ResponseEntity.ok(response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
