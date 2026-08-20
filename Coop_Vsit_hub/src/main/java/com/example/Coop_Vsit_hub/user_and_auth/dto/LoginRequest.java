package com.example.coop_vsit_hub.user_and_auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @NotBlank(message = "Username or email is required.")
    private String identifier;

    @NotBlank(message = "Password is required.")
    private String password;
}
