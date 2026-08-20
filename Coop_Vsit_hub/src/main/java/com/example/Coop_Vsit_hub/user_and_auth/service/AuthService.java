package com.example.coop_vsit_hub.user_and_auth.service;

import com.example.coop_vsit_hub.user_and_auth.dto.*;

public interface AuthService {

    AuthResponse register(
            RegisterRequest request,
            String ipAddress,
            String userAgent
    );

    AuthResponse login(
            LoginRequest request,
            String ipAddress,
            String userAgent
    );

    AuthResponse refreshToken(
            RefreshTokenRequest request,
            String ipAddress,
            String userAgent
    );

    void logout(
            String accessToken,
            String username,
            String ipAddress,
            String userAgent
    );

    UserProfileResponse getUserProfile(
        String username
    );

    void changePassword(
            String username,
            ChangePasswordRequest request,
            String ipAddress,
            String userAgent
    );

    void forgotPassword(
            ForgotPasswordRequest request,
            String ipAddress,
            String userAgent
    );

    void resetPassword(
            ResetPasswordRequest request,
            String ipAddress,
            String userAgent
    );

    void verifyEmail(String token);
}
