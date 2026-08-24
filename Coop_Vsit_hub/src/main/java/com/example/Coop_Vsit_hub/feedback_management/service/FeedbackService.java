package com.example.coop_vsit_hub.feedback_management.service;

import com.example.coop_vsit_hub.feedback_management.dto.FeedbackAnalyticsResponse;
import com.example.coop_vsit_hub.feedback_management.dto.FeedbackDetailResponse;
import com.example.coop_vsit_hub.feedback_management.dto.FeedbackVerifyResponse;
import com.example.coop_vsit_hub.feedback_management.dto.SubmitFeedbackRequest;
import com.example.coop_vsit_hub.visit_management.model.Visit;

import java.util.UUID;

/**
 * Service contract for Customer Feedback & Satisfaction Surveys.
 */
public interface FeedbackService {

    /**
     * Verify single-use survey token validity and expiration.
     */
    FeedbackVerifyResponse verifyFeedbackToken(String token);

    /**
     * Submit post-visit ratings and qualitative reviews.
     */
    FeedbackDetailResponse submitFeedback(SubmitFeedbackRequest request);

    /**
     * Compute aggregated CSAT, NPS score, and rating averages.
     */
    FeedbackAnalyticsResponse getFeedbackAnalytics();

    /**
     * Retrieve feedback record for a specific visit.
     */
    FeedbackDetailResponse getFeedbackByVisitId(UUID visitId);

    /**
     * Generate secure token and send survey invitation email via MailHog.
     */
    void createAndSendFeedbackInvitation(Visit visit);

    /**
     * Resend survey invitation for a completed visit.
     */
    void resendFeedbackInvitation(UUID visitId);
}
