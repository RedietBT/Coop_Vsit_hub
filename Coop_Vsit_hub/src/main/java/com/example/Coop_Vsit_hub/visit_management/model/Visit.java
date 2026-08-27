package com.example.coop_vsit_hub.visit_management.model;

import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.visit_management.enums.GuestCategory;
import com.example.coop_vsit_hub.visit_management.enums.VisitPriority;
import com.example.coop_vsit_hub.visit_management.enums.VisitStatus;
import com.example.coop_vsit_hub.visit_management.enums.VisitType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Executive Visit Request & Master Lifecycle Tracking Entity.
 * Cooperative Bank of Oromia (CoopBank DxValley).
 */
@Entity
@Table(name = "visits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Visit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "visit_code", length = 30, nullable = false, unique = true)
    private String visitCode;

    @Column(length = 200, nullable = false)
    private String title;

    @Column(name = "requesting_department", length = 100, nullable = false)
    private String requestingDepartment;

    @Enumerated(EnumType.STRING)
    @Column(name = "visit_type", length = 50, nullable = false)
    @Builder.Default
    private VisitType visitType = VisitType.EXTERNAL;

    @Column(name = "visit_objective", columnDefinition = "TEXT", nullable = false)
    private String visitObjective;

    @Column(name = "expected_outcome", columnDefinition = "TEXT")
    private String expectedOutcome;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority_level", length = 20, nullable = false)
    @Builder.Default
    private VisitPriority priorityLevel = VisitPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    @Builder.Default
    private VisitStatus status = VisitStatus.SUBMITTED;

    @Builder.Default
    @Column(name = "opportunity_value", precision = 15, scale = 2)
    private BigDecimal opportunityValue = BigDecimal.ZERO;

    @Builder.Default
    @Column(length = 10, nullable = false)
    private String currency = "USD";

    @Column(name = "presentation_theme", length = 150)
    private String presentationTheme;

    @Column(name = "sensitive_topics", columnDefinition = "TEXT")
    private String sensitiveTopics;

    @Column(name = "location_room", length = 100)
    private String locationRoom;

    @Builder.Default
    @Column(name = "visitor_count", nullable = false)
    private int visitorCount = 1;

    @Column(name = "visitor_badge_number", length = 50)
    private String visitorBadgeNumber;

    @Column(name = "decision_notes", columnDefinition = "TEXT")
    private String decisionNotes;

    // Guest Classification
    @Enumerated(EnumType.STRING)
    @Column(name = "guest_category", length = 30, nullable = false)
    @Builder.Default
    private GuestCategory guestCategory = GuestCategory.ORGANIZATION;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guest_organization_id")
    private Organization guestOrganization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "individual_guest_id")
    private com.example.coop_vsit_hub.individual_guest_management.model.IndividualGuest masterIndividualGuest;

    // Individual Guest Details (When guestCategory = INDIVIDUAL or primary guest contact)
    @Column(name = "individual_guest_first_name", length = 50)
    private String individualGuestFirstName;

    @Column(name = "individual_guest_middle_name", length = 50)
    private String individualGuestMiddleName;

    @Column(name = "individual_guest_last_name", length = 50)
    private String individualGuestLastName;

    @Column(name = "individual_guest_email", length = 100)
    private String individualGuestEmail;

    @Column(name = "individual_guest_phone", length = 30)
    private String individualGuestPhone;

    @Column(name = "individual_guest_title", length = 100)
    private String individualGuestTitle;

    @Column(name = "individual_guest_id_number", length = 50)
    private String individualGuestIdNumber;

    // Front Desk Visitor Demographics (From Visitor Registration Modal)
    @Column(name = "visitor_first_name", length = 100)
    private String visitorFirstName;

    @Column(name = "visitor_middle_name", length = 100)
    private String visitorMiddleName;

    @Column(name = "visitor_surname", length = 100)
    private String visitorSurname;

    @Column(name = "visitor_id_number", length = 100)
    private String visitorIdNumber;

    @Column(name = "visitor_phone", length = 50)
    private String visitorPhone;

    @Column(name = "visitor_email", length = 100)
    private String visitorEmail;

    @Column(name = "visitor_date_of_birth")
    private LocalDate visitorDateOfBirth;

    @Column(name = "visitor_issued_date")
    private LocalDate visitorIssuedDate;

    @Column(name = "visitor_expired_date")
    private LocalDate visitorExpiredDate;

    @Column(name = "visitor_gender", length = 20)
    private String visitorGender;

    @Column(name = "visitor_citizenship", length = 100)
    @Builder.Default
    private String visitorCitizenship = "Ethiopian";

    @Column(name = "visitor_region", length = 100)
    private String visitorRegion;

    @Column(name = "visitor_zone", length = 100)
    private String visitorZone;

    @Column(name = "visitor_woreda", length = 100)
    private String visitorWoreda;

    @Column(name = "visitor_id_type", length = 50)
    @Builder.Default
    private String visitorIdType = "National ID";

    @Column(name = "visitor_id_photo_url", columnDefinition = "TEXT")
    private String visitorIdPhotoUrl;

    // Staff Associations
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sponsor_id")
    private User sponsor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private User approver;

    // Timing & Schedule Tracking
    @Column(name = "scheduled_start_time")
    private Instant scheduledStartTime;

    @Column(name = "scheduled_end_time")
    private Instant scheduledEndTime;

    @Column(name = "actual_check_in_time")
    private Instant actualCheckInTime;

    @Column(name = "actual_check_out_time")
    private Instant actualCheckOutTime;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Resolves the display name of the visiting party.
     */
    public String getGuestDisplayName() {
        if (visitorFirstName != null && !visitorFirstName.isBlank()) {
            StringBuilder sb = new StringBuilder(visitorFirstName);
            if (visitorMiddleName != null && !visitorMiddleName.isBlank()) {
                sb.append(" ").append(visitorMiddleName);
            }
            if (visitorSurname != null && !visitorSurname.isBlank()) {
                sb.append(" ").append(visitorSurname);
            }
            return sb.toString();
        }
        if (guestCategory == GuestCategory.ORGANIZATION && guestOrganization != null) {
            return guestOrganization.getName();
        }
        if (individualGuestFirstName != null) {
            if (individualGuestMiddleName != null && !individualGuestMiddleName.isBlank()) {
                return individualGuestFirstName + " " + individualGuestMiddleName + " " + individualGuestLastName;
            }
            return individualGuestFirstName + " " + (individualGuestLastName != null ? individualGuestLastName : "");
        }
        return "Unspecified Guest";
    }
}
