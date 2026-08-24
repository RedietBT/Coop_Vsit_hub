package com.example.coop_vsit_hub.visit_management.dto;

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
    private String individualGuestFirstName;
    private String individualGuestMiddleName;
    private String individualGuestLastName;
    private String individualGuestEmail;
    private String individualGuestPhone;
    private String individualGuestTitle;
    private String individualGuestIdNumber;

    // Staff Details
    private UserDetailResponse requester;
    private UserDetailResponse sponsor;
    private UserDetailResponse approver;

    // Timeline
    private Instant scheduledStartTime;
    private Instant scheduledEndTime;
    private Instant actualCheckInTime;
    private Instant actualCheckOutTime;
    private Instant createdAt;
    private Instant updatedAt;

    public static VisitDetailResponse from(Visit visit) {
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
                .individualGuestFirstName(visit.getIndividualGuestFirstName())
                .individualGuestMiddleName(visit.getIndividualGuestMiddleName())
                .individualGuestLastName(visit.getIndividualGuestLastName())
                .individualGuestEmail(visit.getIndividualGuestEmail())
                .individualGuestPhone(visit.getIndividualGuestPhone())
                .individualGuestTitle(visit.getIndividualGuestTitle())
                .individualGuestIdNumber(visit.getIndividualGuestIdNumber())
                .requester(visit.getRequester() != null ? UserDetailResponse.from(visit.getRequester()) : null)
                .sponsor(visit.getSponsor() != null ? UserDetailResponse.from(visit.getSponsor()) : null)
                .approver(visit.getApprover() != null ? UserDetailResponse.from(visit.getApprover()) : null)
                .scheduledStartTime(visit.getScheduledStartTime())
                .scheduledEndTime(visit.getScheduledEndTime())
                .actualCheckInTime(visit.getActualCheckInTime())
                .actualCheckOutTime(visit.getActualCheckOutTime())
                .createdAt(visit.getCreatedAt())
                .updatedAt(visit.getUpdatedAt())
                .build();
    }
}
