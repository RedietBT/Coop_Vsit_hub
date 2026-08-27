package com.example.coop_vsit_hub.user_and_auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @NotBlank(message = "Username or email is required.")
    @Schema(example = "dalemu@coopbank.local", description = "Staff AD username, corporate email, or admin username")
    private String identifier;

    @NotBlank(message = "Password is required.")
    @Schema(example = "CoopBank2026!", description = "Active Directory password or local password")
    private String password;

    @Schema(example = "ACTIVE_DIRECTORY", description = "Authentication mode: ACTIVE_DIRECTORY or LOCAL", allowableValues = {"ACTIVE_DIRECTORY", "LOCAL"})
    private String loginType;
}
