package com.example.coop_vsit_hub.individual_guest_management.dto;

import com.example.coop_vsit_hub.individual_guest_management.enums.IdentityDocumentType;
import com.example.coop_vsit_hub.individual_guest_management.enums.VipTier;
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
public class CreateIndividualGuestRequest {

    @NotBlank(message = "First name is required.")
    @Pattern(
        regexp = "^[a-zA-Z\\s\\-']*$",
        message = "First name must contain only letters, spaces, hyphens, or apostrophes."
    )
    @Size(max = 50, message = "First name cannot exceed 50 characters.")
    @Schema(example = "Dawit")
    private String firstName;

    @Pattern(
        regexp = "^[a-zA-Z\\s\\-']*$",
        message = "Middle name must contain only letters, spaces, hyphens, or apostrophes."
    )
    @Size(max = 50, message = "Middle name cannot exceed 50 characters.")
    @Schema(example = "Tadesse")
    private String middleName;

    @NotBlank(message = "Last name is required.")
    @Pattern(
        regexp = "^[a-zA-Z\\s\\-']*$",
        message = "Last name must contain only letters, spaces, hyphens, or apostrophes."
    )
    @Size(max = 50, message = "Last name cannot exceed 50 characters.")
    @Schema(example = "Alemu")
    private String lastName;

    @NotBlank(message = "Email address is required.")
    @Pattern(
        regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$",
        message = "Must provide a valid email format."
    )
    @Size(max = 100, message = "Email cannot exceed 100 characters.")
    @Schema(example = "dawit.alemu@advisory.et")
    private String email;

    @Pattern(
        regexp = "^$|^\\+?[0-9]{10,15}$",
        message = "Phone must be a valid international format (10-15 digits, optional +)."
    )
    @Schema(example = "+251911223344")
    private String phoneNumber;

    @Size(max = 50, message = "ID document number cannot exceed 50 characters.")
    @Schema(example = "EP2948194")
    private String idNumber;

    @Builder.Default
    @NotNull(message = "Identity document type is mandatory.")
    @Schema(example = "PASSPORT")
    private IdentityDocumentType idType = IdentityDocumentType.NATIONAL_ID;

    @Size(max = 100, message = "Guest title cannot exceed 100 characters.")
    @Schema(example = "Principal Financial Sector Advisor")
    private String guestTitle;

    @Size(max = 150, message = "Organization affiliation cannot exceed 150 characters.")
    @Schema(example = "East Africa FinTech Council")
    private String organizationAffiliation;

    @Builder.Default
    @Size(max = 100, message = "Country cannot exceed 100 characters.")
    @Schema(example = "Ethiopia")
    private String countryOfResidence = "Ethiopia";

    @Builder.Default
    @NotNull(message = "VIP Tier is mandatory.")
    @Schema(example = "VIP_TIER_1")
    private VipTier vipTier = VipTier.STANDARD;

    @Builder.Default
    @Min(value = 0, message = "Relationship score must be at least 0.")
    @Max(value = 100, message = "Relationship score cannot exceed 100.")
    @Schema(example = "85")
    private Integer relationshipScore = 50;

    @Schema(example = "Key advisor on digital banking regulations and cross-border remittance frameworks.")
    private String notes;
}
