package com.example.coop_vsit_hub.feedback_management.model;

import com.example.coop_vsit_hub.visit_management.model.Visit;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Visitor & Customer Post-Visit Satisfaction Survey Entity.
 * Mapped to table 'visit_feedbacks'.
 */
@Entity
@Table(name = "visit_feedbacks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visit_id", nullable = false, unique = true)
    private Visit visit;

    @Column(name = "survey_token", length = 255, nullable = false, unique = true)
    private String surveyToken;

    @Column(name = "token_expires_at", nullable = false)
    private Instant tokenExpiresAt;

    @Builder.Default
    @Column(name = "is_submitted", nullable = false)
    private boolean isSubmitted = false;

    @Column(name = "hospitality_rating")
    private Integer hospitalityRating;

    @Column(name = "facility_rating")
    private Integer facilityRating;

    @Column(name = "objective_rating")
    private Integer objectiveRating;

    @Column(name = "nps_score")
    private Integer npsScore;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Checks if the survey token has expired.
     */
    public boolean isExpired() {
        return tokenExpiresAt != null && Instant.now().isAfter(tokenExpiresAt);
    }
}
