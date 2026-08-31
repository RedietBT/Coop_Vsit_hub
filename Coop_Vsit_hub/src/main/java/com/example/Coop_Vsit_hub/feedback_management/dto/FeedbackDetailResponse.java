package com.example.coop_vsit_hub.feedback_management.dto;

import com.example.coop_vsit_hub.feedback_management.model.VisitFeedback;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackDetailResponse {

    private UUID id;
    private UUID visitId;
    private String visitCode;
    private String visitTitle;
    private String guestDisplayName;
    private String guestOrganizationName;
    private boolean submitted;
    private boolean pinned;
    private Double overallRating;
    private Integer hospitalityRating;
    private Integer facilityRating;
    private Integer objectiveRating;
    private Integer npsScore;
    private String comments;
    private Instant submittedAt;
    private Instant createdAt;

    public static FeedbackDetailResponse from(VisitFeedback fb) {
        int count = 0;
        int sum = 0;
        if (fb.getHospitalityRating() != null && fb.getHospitalityRating() > 0) { sum += fb.getHospitalityRating(); count++; }
        if (fb.getFacilityRating() != null && fb.getFacilityRating() > 0) { sum += fb.getFacilityRating(); count++; }
        if (fb.getObjectiveRating() != null && fb.getObjectiveRating() > 0) { sum += fb.getObjectiveRating(); count++; }
        double avg = count > 0 ? Math.round((sum / (double) count) * 10.0) / 10.0 : 5.0;

        return FeedbackDetailResponse.builder()
                .id(fb.getId())
                .visitId(fb.getVisit() != null ? fb.getVisit().getId() : null)
                .visitCode(fb.getVisit() != null ? fb.getVisit().getVisitCode() : null)
                .visitTitle(fb.getVisit() != null ? fb.getVisit().getTitle() : null)
                .guestDisplayName(fb.getVisit() != null ? fb.getVisit().getGuestDisplayName() : null)
                .guestOrganizationName(fb.getVisit() != null && fb.getVisit().getGuestOrganization() != null ? fb.getVisit().getGuestOrganization().getName() : null)
                .submitted(fb.isSubmitted())
                .pinned(fb.isPinned())
                .overallRating(avg)
                .hospitalityRating(fb.getHospitalityRating())
                .facilityRating(fb.getFacilityRating())
                .objectiveRating(fb.getObjectiveRating())
                .npsScore(fb.getNpsScore())
                .comments(fb.getComments())
                .submittedAt(fb.getSubmittedAt())
                .createdAt(fb.getCreatedAt())
                .build();
    }
}
