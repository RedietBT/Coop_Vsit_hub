package com.example.coop_vsit_hub.visit_management.dto;

import com.example.coop_vsit_hub.visit_management.enums.GuestCategory;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Public Customer / Visitor Booking Request DTO.
 * Submitted by external guests via public portal without logging in.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicBookingRequest {

    @NotBlank(message = "Visit topic / title is required.")
    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters.")
    @Schema(example = "FinTech Integration & API Sandbox Exploration")
    private String title;

    @NotBlank(message = "Purpose of visit is required.")
    @Size(min = 5, message = "Please describe the purpose of your visit in detail.")
    @Schema(example = "Explore CoopBank open banking APIs, merchant settlements, and payment gateway sandbox testing.")
    private String visitObjective;

    @NotNull(message = "Guest category is mandatory (ORGANIZATION or INDIVIDUAL).")
    @Schema(example = "ORGANIZATION")
    private GuestCategory guestCategory;

    @Schema(description = "Required if guestCategory is ORGANIZATION", example = "Chapa Financial Technologies")
    private String organizationName;

    @NotBlank(message = "First name is required.")
    @Pattern(
        regexp = "^[a-zA-Z\\s\\-']*$",
        message = "First name must contain only letters, spaces, hyphens, or apostrophes."
    )
    @Size(max = 50, message = "First name cannot exceed 50 characters.")
    @Schema(example = "Nael")
    private String contactPersonFirstName;

    @Pattern(
        regexp = "^[a-zA-Z\\s\\-']*$",
        message = "Middle name must contain only letters, spaces, hyphens, or apostrophes."
    )
    @Size(max = 50, message = "Middle name cannot exceed 50 characters.")
    @Schema(example = "Haile")
    private String contactPersonMiddleName;

    @NotBlank(message = "Last name is required.")
    @Pattern(
        regexp = "^[a-zA-Z\\s\\-']*$",
        message = "Last name must contain only letters, spaces, hyphens, or apostrophes."
    )
    @Size(max = 50, message = "Last name cannot exceed 50 characters.")
    @Schema(example = "Mariam")
    private String contactPersonLastName;

    @NotBlank(message = "Email address is required.")
    @Pattern(
        regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$",
        message = "Must provide a valid email format."
    )
    @Size(max = 100, message = "Email cannot exceed 100 characters.")
    @Schema(example = "nael@chapa.co")
    private String contactEmail;

    @NotBlank(message = "Phone number is required.")
    @Pattern(
        regexp = "^\\+?[0-9]{10,15}$",
        message = "Phone must be a valid international format (10-15 digits, optional +)."
    )
    @Schema(example = "+251911998877")
    private String contactPhone;

    @Size(max = 100, message = "Title / Position cannot exceed 100 characters.")
    @Schema(example = "Founder & CEO")
    private String guestTitle;

    @Size(max = 100, message = "Department cannot exceed 100 characters.")
    @Schema(example = "Digital Banking & FinTech Partnerships")
    private String requestedDepartment;

    @Min(value = 1, message = "Visitor count must be at least 1 person.")
    @Schema(example = "3")
    private Integer visitorCount;

    @NotNull(message = "Preferred start date/time is required.")
    @Schema(description = "Requested start time (ISO-8601 UTC)", example = "2026-09-15T09:00:00Z")
    private Instant preferredStartTime;

    @NotNull(message = "Preferred end date/time is required.")
    @Schema(description = "Requested end time (ISO-8601 UTC)", example = "2026-09-15T11:00:00Z")
    private Instant preferredEndTime;

    @Schema(example = "Requesting projector and technical liaison for live API demonstration.")
    private String additionalNotes;
}
