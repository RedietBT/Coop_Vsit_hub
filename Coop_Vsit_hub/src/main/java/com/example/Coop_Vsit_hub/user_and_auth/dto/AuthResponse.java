package com.example.coop_vsit_hub.user_and_auth.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

/**
 * Authentication response returned on login and token refresh.
 * NOTE: rawRefreshToken is NEVER serialized to JSON — it is carried internally
 * so AuthController can set it as an HttpOnly cookie on the response.
 */
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

    /**
     * Internal carrier only — NOT serialized to the client.
     * AuthController extracts this and sets it as an HttpOnly cookie.
     */
    @JsonIgnore
    private String rawRefreshToken;

    private boolean isEmailVerified;

    private boolean mustChangePassword;

    private String message;

    private UserProfileResponse user;
}
