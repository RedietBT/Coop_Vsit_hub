package com.example.coop_vsit_hub.user_and_auth.controller;

import com.example.coop_vsit_hub.user_and_auth.dto.*;
import com.example.coop_vsit_hub.user_and_auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "1. Authentication & User Management")
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "coop_refresh_token";

    private final AuthService authService;

    @Value("${coopbank.security.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${coopbank.security.cookie.same-site:Strict}")
    private String cookieSameSite;

    @Value("${coopbank.security.cookie.max-age-seconds:604800}")
    private long cookieMaxAgeSeconds;

    // ─────────────────────────────────────────────────────────────────────────
    // REGISTER
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/register")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(
            summary = "Register Bank Staff Account (Admin Only)",
            description = "Onboards a new CoopBank user. System auto-generates temporary password and dispatches MailHog onboarding email with 24-hour verification link.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        AuthResponse response = authService.register(request, ipAddress, userAgent);
        setRefreshTokenCookie(httpRequest, httpResponse, response.getRawRefreshToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EMAIL VERIFICATION
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/verify-email")
    @Operation(
            summary = "Verify Email Address via Link (Public)",
            description = "Confirms staff email address using token link received via MailHog email."
    )
    public ResponseEntity<Map<String, String>> verifyEmailGet(@RequestParam("token") String token) {
        authService.verifyEmail(token);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Email verified successfully! You may now log in with your temporary password and update your initial password.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-email")
    @Operation(
            summary = "Verify Email Address via JSON Body (Public)",
            description = "Confirms staff email address using JSON token payload."
    )
    public ResponseEntity<Map<String, String>> verifyEmailPost(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request.getToken());
        Map<String, String> response = new HashMap<>();
        response.put("message", "Email verified successfully! You may now log in with your temporary password and update your initial password.");
        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOGIN — sets HttpOnly refresh-token cookie
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/login")
    @Operation(summary = "Authenticate & Obtain JWT",
            description = "Authenticates bank staff with username/email and password. "
                    + "Returns JWT access token in JSON body. Refresh token is stored in an "
                    + "HttpOnly secure cookie (never exposed to JavaScript).")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        AuthResponse response = authService.login(request, ipAddress, userAgent);

        // Write refresh token to HttpOnly cookie — never in the response body
        setRefreshTokenCookie(httpRequest, httpResponse, response.getRawRefreshToken());

        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REFRESH — reads cookie, issues new access token + rotates cookie
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/refresh")
    @Operation(summary = "Refresh JWT Access Token",
            description = "Rotates access token using the HttpOnly refresh cookie. "
                    + "No request body needed — the browser sends the cookie automatically.")
    public ResponseEntity<AuthResponse> refreshToken(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        // Extract refresh token from HttpOnly cookie
        String rawRefreshToken = extractRefreshCookie(httpRequest);
        if (rawRefreshToken == null) {
            log.warn("Refresh attempt with no cookie present from IP: {}", ipAddress);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponse.builder()
                            .message("Session expired. Please sign in again.")
                            .build());
        }

        AuthResponse response = authService.refreshToken(rawRefreshToken, ipAddress, userAgent);

        // Rotate refresh token cookie (old one replaced by new one)
        setRefreshTokenCookie(httpRequest, httpResponse, response.getRawRefreshToken());

        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOGOUT — blacklists JWT + clears cookie
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/logout")
    @Operation(
            summary = "Logout & Revoke Token Session",
            description = "Blacklists access token in Redis, revokes active refresh token session, "
                    + "and clears the HttpOnly refresh cookie from the browser.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<Void> logout(
            @RequestHeader(value = "Authorization", required = false) String accessToken,
            Authentication authentication,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String username = authentication != null ? authentication.getName() : null;
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        authService.logout(accessToken, username, ipAddress, userAgent);

        // Clear the refresh token cookie from the browser
        clearRefreshTokenCookie(httpRequest, httpResponse);

        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROFILE
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
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

    // ─────────────────────────────────────────────────────────────────────────
    // CHANGE PASSWORD
    // ─────────────────────────────────────────────────────────────────────────

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
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String username = authentication.getName();
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        authService.changePassword(username, request, ipAddress, userAgent);

        // Clear refresh cookie since sessions are invalidated on password change
        clearRefreshTokenCookie(httpRequest, httpResponse);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Password changed successfully. Active sessions have been invalidated for security.");
        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FORGOT / RESET PASSWORD
    // ─────────────────────────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────────────────────────
    // COOKIE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Writes the refresh token as an HttpOnly cookie to the response.
     * Auto-detects HTTPS / reverse-proxy (e.g. Render/Cloudflare) and configures
     * SameSite=None; Secure=true so cross-site frontend requests (e.g. Vercel)
     * work seamlessly without dropping cookies, while remaining compatible with local HTTP dev.
     */
    private void setRefreshTokenCookie(HttpServletRequest request, HttpServletResponse response, String refreshToken) {
        if (refreshToken == null) return;

        boolean isHttps = (request != null && (request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"))))
                || cookieSecure;

        String effectiveSameSite = isHttps ? "None" : ("None".equalsIgnoreCase(cookieSameSite) ? "Lax" : cookieSameSite);
        boolean effectiveSecure = isHttps;

        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(effectiveSecure)
                .sameSite(effectiveSameSite)
                .path("/api/v1/auth")
                .maxAge(cookieMaxAgeSeconds)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        setRefreshTokenCookie(null, response, refreshToken);
    }

    /**
     * Clears (expires) the refresh token cookie by setting MaxAge=0.
     */
    private void clearRefreshTokenCookie(HttpServletRequest request, HttpServletResponse response) {
        boolean isHttps = (request != null && (request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"))))
                || cookieSecure;

        String effectiveSameSite = isHttps ? "None" : ("None".equalsIgnoreCase(cookieSameSite) ? "Lax" : cookieSameSite);
        boolean effectiveSecure = isHttps;

        ResponseCookie expiredCookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(effectiveSecure)
                .sameSite(effectiveSameSite)
                .path("/api/v1/auth")
                .maxAge(0)
                .build();

        response.addHeader("Set-Cookie", expiredCookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        clearRefreshTokenCookie(null, response);
    }

    /**
     * Extracts the refresh token value from the incoming request's cookie jar.
     */
    private String extractRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> REFRESH_COOKIE_NAME.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
