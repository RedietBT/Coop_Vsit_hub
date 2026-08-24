package com.example.coop_vsit_hub.visit_management.dto;

import com.example.coop_vsit_hub.visit_management.enums.GuestCategory;
import com.example.coop_vsit_hub.visit_management.enums.VisitPriority;
import com.example.coop_vsit_hub.visit_management.enums.VisitType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVisitRequest {

    @NotBlank(message = "Visit title is required.")
    @Size(min = 3, max = 200, message = "Visit title must be between 3 and 200 characters.")
    @Schema(example = "Updated Strategic Discussion with Ethio Telecom")
    private String title;

    @NotBlank(message = "Requesting department is required.")
    @Size(max = 100, message = "Requesting department cannot exceed 100 characters.")
    @Schema(example = "Digital Banking & FinTech Partnerships")
    private String requestingDepartment;

    @NotNull(message = "Visit type is mandatory.")
    @Schema(example = "EXTERNAL")
    private VisitType visitType;

    @NotBlank(message = "Visit objective is required.")
    @Schema(example = "Discuss API integration for telebirr merchant collections and digital lending syndicate.")
    private String visitObjective;

    @Schema(example = "Signed Memorandum of Understanding (MoU) on shared digital infrastructure.")
    private String expectedOutcome;

    @NotNull(message = "Priority level is mandatory.")
    @Schema(example = "HIGH")
    private VisitPriority priorityLevel;

    @DecimalMin(value = "0.0", message = "Opportunity value cannot be negative.")
    @Schema(example = "3000000.00")
    private BigDecimal opportunityValue;

    @Size(max = 10, message = "Currency code cannot exceed 10 characters.")
    @Schema(example = "USD")
    private String currency;

    @Size(max = 150, message = "Presentation theme cannot exceed 150 characters.")
    @Schema(example = "Next-Gen Omnichannel Payment Rails")
    private String presentationTheme;

    @Schema(example = "Confidential fee structure discussion and joint regulatory compliance.")
    private String sensitiveTopics;

    @Size(max = 100, message = "Location room cannot exceed 100 characters.")
    @Schema(example = "DxValley Executive Boardroom (4th Floor)")
    private String locationRoom;

    @Min(value = 1, message = "Visitor count must be at least 1 person.")
    @Schema(example = "6")
    private Integer visitorCount;

    @NotNull(message = "Guest category is mandatory (ORGANIZATION or INDIVIDUAL).")
    @Schema(example = "ORGANIZATION")
    private GuestCategory guestCategory;

    @Schema(description = "Required if guestCategory is ORGANIZATION", example = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
    private UUID guestOrganizationId;

    @Schema(description = "Optional UUID of registered Individual VIP Guest", example = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22")
    private UUID individualGuestId;

    // Individual Guest Details
    @Pattern(
        regexp = "^[a-zA-Z\\s\\-']*$",
        message = "Individual guest first name must contain only alphabetic characters, spaces, hyphens, or apostrophes."
    )
    @Size(max = 50, message = "First name cannot exceed 50 characters.")
    @Schema(example = "Dawit")
    private String individualGuestFirstName;

    @Pattern(
        regexp = "^[a-zA-Z\\s\\-']*$",
        message = "Individual guest middle name must contain only alphabetic characters, spaces, hyphens, or apostrophes."
    )
    @Size(max = 50, message = "Middle name cannot exceed 50 characters.")
    @Schema(example = "Tadesse")
    private String individualGuestMiddleName;

    @Pattern(
        regexp = "^[a-zA-Z\\s\\-']*$",
        message = "Individual guest last name must contain only alphabetic characters, spaces, hyphens, or apostrophes."
    )
    @Size(max = 50, message = "Last name cannot exceed 50 characters.")
    @Schema(example = "Alemu")
    private String individualGuestLastName;

    @Pattern(
        regexp = "^$|^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$",
        message = "Individual guest email must be a valid email format (e.g. guest@company.com)."
    )
    @Size(max = 100, message = "Email cannot exceed 100 characters.")
    @Schema(example = "dawit.alemu@ethiotelecom.et")
    private String individualGuestEmail;

    @Pattern(
        regexp = "^$|^\\+?[0-9]{10,15}$",
        message = "Individual guest phone must be a valid international phone format (10-15 digits, optional +)."
    )
    @Schema(example = "+251911223344")
    private String individualGuestPhone;

    @Size(max = 100, message = "Guest title cannot exceed 100 characters.")
    @Schema(example = "Chief Technology Officer")
    private String individualGuestTitle;

    @Size(max = 50, message = "ID Number cannot exceed 50 characters.")
    @Schema(example = "EP2948194")
    private String individualGuestIdNumber;

    @Schema(description = "Executive business sponsor UUID", example = "00000000-0000-0000-0000-000000000001")
    private UUID sponsorId;

    @Schema(description = "Scheduled start date & time (UTC/ISO-8601)", example = "2026-09-01T09:00:00Z")
    private Instant scheduledStartTime;

    @Schema(description = "Scheduled end date & time (UTC/ISO-8601)", example = "2026-09-01T11:30:00Z")
    private Instant scheduledEndTime;
}
