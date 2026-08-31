package com.example.coop_vsit_hub.visit_management.dto;

import com.example.coop_vsit_hub.individual_guest_management.dto.IndividualGuestSummaryResponse;
import com.example.coop_vsit_hub.user_and_auth.dto.UserDetailResponse;
import com.example.coop_vsit_hub.visit_management.enums.GuestCategory;
import com.example.coop_vsit_hub.visit_management.enums.VisitPriority;
import com.example.coop_vsit_hub.visit_management.enums.VisitStatus;
import com.example.coop_vsit_hub.visit_management.enums.VisitType;
import com.example.coop_vsit_hub.visit_management.model.Organization;
import com.example.coop_vsit_hub.visit_management.model.Visit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Detailed representation of an Executive Visit record.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitDetailResponse {

    private UUID id;
    private String visitCode;
    private String title;
    private String requestingDepartment;
    private VisitType visitType;
    private String visitObjective;
    private String expectedOutcome;
    private VisitPriority priorityLevel;
    private VisitStatus status;
    private BigDecimal opportunityValue;
    private String currency;
    private String presentationTheme;
    private String sensitiveTopics;
    private String locationRoom;
    private int visitorCount;
    private String visitorBadgeNumber;
    private String decisionNotes;

    // Guest Info
    private GuestCategory guestCategory;
    private String guestDisplayName;
    private Organization guestOrganization;
    private IndividualGuestSummaryResponse masterIndividualGuest;
    private String individualGuestFirstName;
    private String individualGuestMiddleName;
    private String individualGuestLastName;
    private String individualGuestEmail;
    private String individualGuestPhone;
    private String individualGuestTitle;
    private String individualGuestIdNumber;

    // Front Desk Visitor Demographics (Optional)
    private String visitorFirstName;
    private String visitorMiddleName;
    private String visitorSurname;
    private String visitorIdNumber;
    private String visitorPhone;
    private String visitorEmail;
    private LocalDate visitorDateOfBirth;
    private LocalDate visitorIssuedDate;
    private LocalDate visitorExpiredDate;
    private String visitorGender;
    private String visitorCitizenship;
    private String visitorRegion;
    private String visitorZone;
    private String visitorWoreda;
    private String visitorIdType;
    private String visitorIdPhotoUrl;

    // Staff Details
    private UserDetailResponse requester;
    private UserDetailResponse sponsor;
    private UserDetailResponse approver;

    // Timeline
    private Instant scheduledStartTime;
    private Instant scheduledEndTime;
    private Instant actualCheckInTime;
    private Instant actualCheckOutTime;
    private com.example.coop_vsit_hub.feedback_management.dto.FeedbackDetailResponse feedback;
    private Instant createdAt;
    private Instant updatedAt;

    public static VisitDetailResponse from(Visit visit) {
        return from(visit, null);
    }

    public static VisitDetailResponse from(Visit visit, com.example.coop_vsit_hub.feedback_management.dto.FeedbackDetailResponse feedback) {
        return VisitDetailResponse.builder()
                .id(visit.getId())
                .visitCode(visit.getVisitCode())
                .title(visit.getTitle())
                .requestingDepartment(visit.getRequestingDepartment())
                .visitType(visit.getVisitType())
                .visitObjective(visit.getVisitObjective())
                .expectedOutcome(visit.getExpectedOutcome())
                .priorityLevel(visit.getPriorityLevel())
                .status(visit.getStatus())
                .opportunityValue(visit.getOpportunityValue())
                .currency(visit.getCurrency())
                .presentationTheme(visit.getPresentationTheme())
                .sensitiveTopics(visit.getSensitiveTopics())
                .locationRoom(visit.getLocationRoom())
                .visitorCount(visit.getVisitorCount())
                .visitorBadgeNumber(visit.getVisitorBadgeNumber())
                .decisionNotes(visit.getDecisionNotes())
                .guestCategory(visit.getGuestCategory())
                .guestDisplayName(visit.getGuestDisplayName())
                .guestOrganization(visit.getGuestOrganization())
                .masterIndividualGuest(visit.getMasterIndividualGuest() != null ?
                        IndividualGuestSummaryResponse.from(visit.getMasterIndividualGuest()) : null)
                .individualGuestFirstName(visit.getIndividualGuestFirstName())
                .individualGuestMiddleName(visit.getIndividualGuestMiddleName())
                .individualGuestLastName(visit.getIndividualGuestLastName())
                .individualGuestEmail(visit.getIndividualGuestEmail())
                .individualGuestPhone(visit.getIndividualGuestPhone())
                .individualGuestTitle(visit.getIndividualGuestTitle())
                .individualGuestIdNumber(visit.getIndividualGuestIdNumber())
                .visitorFirstName(visit.getVisitorFirstName())
                .visitorMiddleName(visit.getVisitorMiddleName())
                .visitorSurname(visit.getVisitorSurname())
                .visitorIdNumber(visit.getVisitorIdNumber())
                .visitorPhone(visit.getVisitorPhone())
                .visitorEmail(visit.getVisitorEmail())
                .visitorDateOfBirth(visit.getVisitorDateOfBirth())
                .visitorIssuedDate(visit.getVisitorIssuedDate())
                .visitorExpiredDate(visit.getVisitorExpiredDate())
                .visitorGender(visit.getVisitorGender())
                .visitorCitizenship(visit.getVisitorCitizenship())
                .visitorRegion(visit.getVisitorRegion())
                .visitorZone(visit.getVisitorZone())
                .visitorWoreda(visit.getVisitorWoreda())
                .visitorIdType(visit.getVisitorIdType())
                .visitorIdPhotoUrl(visit.getVisitorIdPhotoUrl())
                .requester(visit.getRequester() != null ? UserDetailResponse.from(visit.getRequester()) : null)
                .sponsor(visit.getSponsor() != null ? UserDetailResponse.from(visit.getSponsor()) : null)
                .approver(visit.getApprover() != null ? UserDetailResponse.from(visit.getApprover()) : null)
                .scheduledStartTime(visit.getScheduledStartTime())
                .scheduledEndTime(visit.getScheduledEndTime())
                .actualCheckInTime(visit.getActualCheckInTime())
                .actualCheckOutTime(visit.getActualCheckOutTime())
                .feedback(feedback)
                .createdAt(visit.getCreatedAt())
                .updatedAt(visit.getUpdatedAt())
                .build();
    }
}
