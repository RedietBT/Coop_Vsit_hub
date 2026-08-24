package com.example.coop_vsit_hub.organization_management.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrganizationRequest {

    @NotBlank(message = "Organization name is required.")
    @Size(min = 2, max = 150, message = "Organization name must be between 2 and 150 characters.")
    @Schema(example = "Ethio Telecom")
    private String name;

    @NotBlank(message = "Organization category is required.")
    @Size(max = 100, message = "Category cannot exceed 100 characters.")
    @Schema(example = "Strategic Partners")
    private String category;

    @NotBlank(message = "Market country is required.")
    @Size(max = 100, message = "Market country cannot exceed 100 characters.")
    @Schema(example = "Ethiopia")
    private String marketCountry;

    @NotNull(message = "Relationship score is required.")
    @Min(value = 0, message = "Relationship score must be at least 0.")
    @Max(value = 100, message = "Relationship score cannot exceed 100.")
    @Schema(example = "90")
    private Integer relationshipScore;

    @Pattern(
        regexp = "^[a-zA-Z\\s\\-']*$",
        message = "Contact person name must contain only letters, spaces, hyphens, or apostrophes."
    )
    @Size(max = 100, message = "Contact person name cannot exceed 100 characters.")
    @Schema(example = "Frehiwot Tamru")
    private String contactPersonName;

    @Pattern(
        regexp = "^$|^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$",
        message = "Contact email must be a valid email format (e.g. contact@domain.com)."
    )
    @Size(max = 100, message = "Contact email cannot exceed 100 characters.")
    @Schema(example = "corporate@ethiotelecom.et")
    private String contactEmail;

    @Pattern(
        regexp = "^$|^\\+?[0-9]{10,15}$",
        message = "Contact phone must be a valid international phone format (10-15 digits, optional +)."
    )
    @Schema(example = "+251115500000")
    private String contactPhone;

    @Size(max = 150, message = "Website URL cannot exceed 150 characters.")
    @Schema(example = "https://www.ethiotelecom.et")
    private String website;

    @Size(max = 100, message = "Industry sector cannot exceed 100 characters.")
    @Schema(example = "Telecommunications & Digital Services")
    private String industrySector;

    @Schema(example = "National telecommunications operator; strategic partner for telebirr interoperability and digital ecosystem.")
    private String notes;
}
