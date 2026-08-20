package com.example.coop_vsit_hub.user_and_auth.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String accessToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private long expiresInMs;

    private String refreshToken;

    private boolean isEmailVerified;

    private boolean mustChangePassword;

    private String message;

    private UserProfileResponse user;
}
