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
    private boolean submitted;
    private Integer hospitalityRating;
    private Integer facilityRating;
    private Integer objectiveRating;
    private Integer npsScore;
    private String comments;
    private Instant submittedAt;
    private Instant createdAt;

    public static FeedbackDetailResponse from(VisitFeedback fb) {
        return FeedbackDetailResponse.builder()
                .id(fb.getId())
                .visitId(fb.getVisit() != null ? fb.getVisit().getId() : null)
                .visitCode(fb.getVisit() != null ? fb.getVisit().getVisitCode() : null)
                .visitTitle(fb.getVisit() != null ? fb.getVisit().getTitle() : null)
                .guestDisplayName(fb.getVisit() != null ? fb.getVisit().getGuestDisplayName() : null)
                .submitted(fb.isSubmitted())
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
