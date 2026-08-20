package com.example.coop_vsit_hub.user_and_auth.dto;

import com.example.coop_vsit_hub.user_and_auth.dto.validation.StrongPassword;
import com.example.coop_vsit_hub.user_and_auth.enums.RoleName;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "Username is required.")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters.")
    @Pattern(regexp = "^[a-zA-Z0-9_.-]+$", message = "Username contains invalid characters.")
    private String username;

    @NotBlank(message = "Email is required.")
    @Size(max = 100, message = "Email cannot exceed 100 characters.")
    @Pattern(
        regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$",
        message = "Email format must be a valid structured email address (e.g. user@coopbank.com.et)."
    )
    private String email;

    @NotBlank(message = "Password is required.")
    @StrongPassword
    private String password;

    @NotBlank(message = "First name is required.")
    @Size(max = 50, message = "First name cannot exceed 50 characters.")
    @Pattern(
        regexp = "^[a-zA-Z\\s\\-']+$",
        message = "First name must contain only alphabetic characters, spaces, hyphens, or apostrophes."
    )
    private String firstName;

    @Size(max = 50, message = "Middle name cannot exceed 50 characters.")
    @Pattern(
        regexp = "^[a-zA-Z\\s\\-']*$",
        message = "Middle name must contain only alphabetic characters, spaces, hyphens, or apostrophes."
    )
    private String middleName;

    @NotBlank(message = "Last name is required.")
    @Size(max = 50, message = "Last name cannot exceed 50 characters.")
    @Pattern(
        regexp = "^[a-zA-Z\\s\\-']+$",
        message = "Last name must contain only alphabetic characters, spaces, hyphens, or apostrophes."
    )
    private String lastName;

    @Size(max = 100, message = "Department cannot exceed 100 characters.")
    private String department;

    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Phone number must be a valid phone format (10-15 digits, optional + prefix).")
    private String phoneNumber;

    private Set<RoleName> roles;
}
