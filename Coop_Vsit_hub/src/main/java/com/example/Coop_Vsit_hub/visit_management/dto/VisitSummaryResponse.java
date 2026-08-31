package com.example.coop_vsit_hub.visit_management.dto;

import com.example.coop_vsit_hub.visit_management.enums.GuestCategory;
import com.example.coop_vsit_hub.visit_management.enums.VisitPriority;
import com.example.coop_vsit_hub.visit_management.enums.VisitStatus;
import com.example.coop_vsit_hub.visit_management.enums.VisitType;
import com.example.coop_vsit_hub.visit_management.model.Visit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Lightweight DTO for Visit registers, data grids, and search summaries.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitSummaryResponse {

    private UUID id;
    private String visitCode;
    private String title;
    private String requestingDepartment;
    private VisitType visitType;
    private VisitPriority priorityLevel;
    private VisitStatus status;
    private BigDecimal opportunityValue;
    private String currency;
    private String locationRoom;
    private int visitorCount;
    private String visitorBadgeNumber;
    private GuestCategory guestCategory;
    private String guestDisplayName;
    private String visitorPhone;
    private String visitorIdNumber;
    private String requesterName;
    private String sponsorName;
    private Instant scheduledStartTime;
    private Instant scheduledEndTime;
    private Instant actualCheckInTime;
    private Instant actualCheckOutTime;
    private Instant createdAt;

    // Guest Feedback & Satisfaction Rating
    private Boolean feedbackSubmitted;
    private Double guestRating;
    private String feedbackComments;

    public static VisitSummaryResponse from(Visit visit) {
        String phone = visit.getVisitorPhone();
        if (phone == null || phone.isBlank()) {
            phone = visit.getIndividualGuestPhone();
        }
        String idNum = visit.getVisitorIdNumber();
        if (idNum == null || idNum.isBlank()) {
            idNum = visit.getIndividualGuestIdNumber();
        }

        return VisitSummaryResponse.builder()
                .id(visit.getId())
                .visitCode(visit.getVisitCode())
                .title(visit.getTitle())
                .requestingDepartment(visit.getRequestingDepartment())
                .visitType(visit.getVisitType())
                .priorityLevel(visit.getPriorityLevel())
                .status(visit.getStatus())
                .opportunityValue(visit.getOpportunityValue())
                .currency(visit.getCurrency())
                .locationRoom(visit.getLocationRoom())
                .visitorCount(visit.getVisitorCount())
                .visitorBadgeNumber(visit.getVisitorBadgeNumber())
                .guestCategory(visit.getGuestCategory())
                .guestDisplayName(visit.getGuestDisplayName())
                .visitorPhone(phone)
                .visitorIdNumber(idNum)
                .requesterName(visit.getRequester() != null ? visit.getRequester().getFullName() : null)
                .sponsorName(visit.getSponsor() != null ? visit.getSponsor().getFullName() : null)
                .scheduledStartTime(visit.getScheduledStartTime())
                .scheduledEndTime(visit.getScheduledEndTime())
                .actualCheckInTime(visit.getActualCheckInTime())
                .actualCheckOutTime(visit.getActualCheckOutTime())
                .createdAt(visit.getCreatedAt())
                .build();
    }
}
