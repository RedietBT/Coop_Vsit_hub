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
    private String decisionNotes;
    private GuestCategory guestCategory;
    private String guestDisplayName;
    private String visitorPhone;
    private String visitorIdNumber;
    private String requesterName;
    private String sponsorName;

    // Reserver Details & Linked Room Booking Parameters
    private String reserverName;
    private String reserverUsername;
    private String reserverEmail;
    private String reserverPhone;
    private String reserverDepartment;
    private String requestedItems;
    private String bookingCode;
    private UUID linkedBookingId;
    private String meetingAgenda;
    private Integer expectedAttendees;
    private String engagementType;
    private Instant scheduledStartTime;
    private Instant scheduledEndTime;
    private Instant actualCheckInTime;
    private Instant actualCheckOutTime;
    private Instant createdAt;

    // Guest Feedback & Satisfaction Rating
    private Boolean feedbackSubmitted;
    private Double guestRating;
    private String feedbackComments;

    // Executive Host / Director Review
    private Boolean directorReviewSubmitted;
    private Integer directorRating;
    private String directorOutcome;
    private String directorReviewNotes;
    private Instant directorReviewedAt;
    private String directorReviewerName;

    public static VisitSummaryResponse from(Visit visit) {
        String phone = visit.getVisitorPhone();
        if (phone == null || phone.isBlank()) {
            phone = visit.getIndividualGuestPhone();
        }
        String idNum = visit.getVisitorIdNumber();
        if (idNum == null || idNum.isBlank()) {
            idNum = visit.getIndividualGuestIdNumber();
        }

        String resName = null;
        String resUser = null;
        String resEmail = null;
        String resPhone = null;
        String resDept = visit.getRequestingDepartment();
        if (visit.getRequester() != null) {
            resName = visit.getRequester().getFullName();
            resUser = visit.getRequester().getUsername();
            resEmail = visit.getRequester().getEmail();
            resPhone = visit.getRequester().getPhoneNumber();
            if (resDept == null || resDept.isBlank()) {
                resDept = visit.getRequester().getDepartment();
            }
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
                .decisionNotes(visit.getDecisionNotes())
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
                .reserverName(resName)
                .reserverUsername(resUser)
                .reserverEmail(resEmail)
                .reserverPhone(resPhone)
                .reserverDepartment(resDept)
                .linkedBookingId(visit.getLinkedBookingId())
                .expectedAttendees(visit.getVisitorCount())
                .meetingAgenda(visit.getVisitObjective())
                .engagementType(visit.getVisitType() != null ? visit.getVisitType().name() : "INTERNAL")
                .directorReviewSubmitted(visit.getDirectorRating() != null)
                .directorRating(visit.getDirectorRating())
                .directorOutcome(visit.getDirectorOutcome())
                .directorReviewNotes(visit.getDirectorReviewNotes())
                .directorReviewedAt(visit.getDirectorReviewedAt())
                .directorReviewerName(visit.getDirectorReviewer() != null ? visit.getDirectorReviewer().getFullName() : null)
                .createdAt(visit.getCreatedAt())
                .build();
    }
}
