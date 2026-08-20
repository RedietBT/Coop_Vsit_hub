package com.example.coop_vsit_hub.user_and_auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForgotPasswordRequest {

    @NotBlank(message = "Username, Email, or Phone Number is required.")
    private String identifier;
}
