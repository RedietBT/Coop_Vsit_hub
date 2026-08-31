package com.example.coop_vsit_hub.visit_management.dto;

import com.example.coop_vsit_hub.visit_management.enums.GuestCategory;
import com.example.coop_vsit_hub.visit_management.enums.VisitPriority;
import com.example.coop_vsit_hub.visit_management.enums.VisitType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Visit Creation Request.
 * All visitor demographic and parameter fields are optional to facilitate rapid registration.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVisitRequest {

    @Schema(example = "Strategic FinTech Session with Ethio Telecom")
    private String title;

    @Schema(example = "Digital Banking & FinTech Partnerships")
    private String requestingDepartment;

    @Schema(example = "EXTERNAL")
    private VisitType visitType;

    @Schema(example = "Executive Discussion & Facility Tour")
    private String visitObjective;

    @Schema(example = "Signed Partnership Agreement")
    private String expectedOutcome;

    @Schema(example = "MEDIUM")
    private VisitPriority priorityLevel;

    @Schema(example = "0.0")
    private BigDecimal opportunityValue;

    @Schema(example = "ETB")
    private String currency;

    @Schema(example = "Omnichannel Integration")
    private String presentationTheme;

    @Schema(example = "Confidential")
    private String sensitiveTopics;

    @Schema(example = "Executive Boardroom - 4th Floor")
    private String locationRoom;

    @Schema(example = "3")
    private Integer visitorCount;

    @Schema(example = "ORGANIZATION")
    private GuestCategory guestCategory;

    @Schema(description = "Optional existing organization UUID", example = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
    private UUID guestOrganizationId;

    @Schema(description = "Direct or newly typed organization name (auto-saved to organizations table)", example = "Safaricom Telecommunications")
    private String organizationName;

    @Schema(description = "Optional company primary contact person", example = "Anwar Soussa")
    private String organizationContactPerson;

    @Schema(description = "Optional company phone number", example = "+251970000000")
    private String organizationPhone;

    @Schema(description = "Optional company email address", example = "corporate@partner.et")
    private String organizationEmail;

    @Schema(description = "Optional company industry sector", example = "Telecommunications")
    private String organizationSector;

    @Schema(description = "Optional UUID of registered Individual VIP Guest")
    private UUID individualGuestId;

    // Visitor Demographic Details matching Reference Image (All Optional)
    @Schema(example = "Yusuf")
    private String individualGuestFirstName;

    @Schema(example = "Hassen")
    private String individualGuestMiddleName;

    @Schema(example = "Hassen")
    private String individualGuestLastName;

    @Schema(example = "Hassen")
    private String individualGuestSurname;

    @Schema(example = "0910149192")
    private String individualGuestPhone;

    @Schema(example = "yusuf.hassen@example.com")
    private String individualGuestEmail;

    @Schema(example = "1990-05-15")
    private LocalDate dateOfBirth;

    @Schema(example = "2022-01-10")
    private LocalDate issuedDate;

    @Schema(example = "2027-01-10")
    private LocalDate expiredDate;

    @Schema(example = "Male")
    private String gender;

    @Schema(example = "Ethiopian")
    private String citizenship;

    @Schema(example = "Oromia")
    private String region;

    @Schema(example = "Finfinnee Special Zone")
    private String zone;

    @Schema(example = "Bole")
    private String woreda;

    @Schema(example = "National ID")
    private String idType;

    @Schema(example = "EP2948194")
    private String individualGuestIdNumber;

    @Schema(example = "Chief Technology Officer")
    private String individualGuestTitle;

    @Schema(description = "Executive business sponsor UUID")
    private UUID sponsorId;

    @Schema(description = "Scheduled start date & time (UTC/ISO-8601)", example = "2026-09-01T09:00:00Z")
    private Instant scheduledStartTime;

    @Schema(description = "Scheduled end date & time (UTC/ISO-8601)", example = "2026-09-01T11:30:00Z")
    private Instant scheduledEndTime;

    @Builder.Default
    @Schema(description = "Set true to save as DRAFT without immediate submission", example = "false")
    private Boolean isDraft = false;

    @Builder.Default
    @Schema(description = "Direct booking flag", example = "false")
    private Boolean directBooking = false;

    @Schema(description = "UUID of linked room booking if selected")
    private UUID linkedBookingId;

    @Schema(description = "Guest VIP classification tier (NORMAL_GUEST, VIP, VVIP)", example = "VIP")
    private String guestTier;
}
