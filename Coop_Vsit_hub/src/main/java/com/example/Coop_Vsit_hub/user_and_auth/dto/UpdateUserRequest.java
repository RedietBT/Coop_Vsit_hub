package com.example.coop_vsit_hub.user_and_auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    @NotBlank(message = "First name is required.")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters.")
    @Pattern(
        regexp = "^[a-zA-Z\\s\\-']+$",
        message = "First name must contain only alphabetic characters, spaces, hyphens, or apostrophes."
    )
    @Schema(example = "Abebe")
    private String firstName;

    @Size(max = 50, message = "Middle name cannot exceed 50 characters.")
    @Pattern(
        regexp = "^[a-zA-Z\\s\\-']*$",
        message = "Middle name must contain only alphabetic characters, spaces, hyphens, or apostrophes."
    )
    @Schema(example = "Bekele")
    private String middleName;

    @NotBlank(message = "Last name is required.")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters.")
    @Pattern(
        regexp = "^[a-zA-Z\\s\\-']+$",
        message = "Last name must contain only alphabetic characters, spaces, hyphens, or apostrophes."
    )
    @Schema(example = "Kebede")
    private String lastName;

    @NotBlank(message = "Email is required.")
    @Size(max = 100, message = "Email cannot exceed 100 characters.")
    @Pattern(
        regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$",
        message = "Email format must be a valid structured email address (e.g. user@coopbank.com.et)."
    )
    @Schema(example = "abebe.kebede@coopbank.com.et")
    private String email;

    @Size(max = 100, message = "Department cannot exceed 100 characters.")
    @Schema(example = "Corporate Banking Division")
    private String department;

    @Pattern(
        regexp = "^\\+?[0-9]{10,15}$",
        message = "Phone number must be a valid phone format (10-15 digits, optional + prefix)."
    )
    @Schema(example = "+251911223344")
    private String phoneNumber;
}
