package com.example.coop_vsit_hub.user_and_auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserStatusRequest {

    @Schema(description = "Enable or disable account access", example = "true")
    private Boolean isEnabled;

    @Schema(description = "Unlock or lock account (setting true clears failed login counter)", example = "true")
    private Boolean isAccountNonLocked;
}
