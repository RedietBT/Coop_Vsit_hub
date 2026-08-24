package com.example.coop_vsit_hub.feedback_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Aggregated Customer Satisfaction (CSAT) and Net Promoter Score (NPS) Analytics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackAnalyticsResponse {

    private long totalSurveysSent;
    private long totalSurveysCompleted;
    private double responseRatePercentage;
    private double averageHospitalityRating;
    private double averageFacilityRating;
    private double averageObjectiveRating;
    private double averageOverallRating;
    private double csatPercentage;
    private int netPromoterScore;
    private Map<String, Long> npsBreakdown; // Promoters (9-10), Passives (7-8), Detractors (0-6)
    private List<FeedbackDetailResponse> recentFeedbackReviews;
}
