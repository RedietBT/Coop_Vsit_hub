package com.example.coop_vsit_hub.user_and_auth.dto;

import com.example.coop_vsit_hub.user_and_auth.dto.validation.StrongPassword;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangePasswordRequest {

    @NotBlank(message = "Current password is required.")
    private String currentPassword;

    @NotBlank(message = "New password is required.")
    @StrongPassword
    private String newPassword;

    @NotBlank(message = "Confirmation password is required.")
    private String confirmNewPassword;
}
