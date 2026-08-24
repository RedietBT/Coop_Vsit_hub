package com.example.coop_vsit_hub.feedback_management.controller;

import com.example.coop_vsit_hub.feedback_management.dto.FeedbackAnalyticsResponse;
import com.example.coop_vsit_hub.feedback_management.dto.FeedbackDetailResponse;
import com.example.coop_vsit_hub.feedback_management.dto.FeedbackVerifyResponse;
import com.example.coop_vsit_hub.feedback_management.dto.SubmitFeedbackRequest;
import com.example.coop_vsit_hub.feedback_management.service.FeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * REST API Controller for Customer Feedback & Satisfaction Surveys.
 */
@RestController
@RequestMapping("/api/v1/feedback")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "4. Customer Feedback", description = "Post-visit guest satisfaction surveys, CSAT analytics, and Net Promoter Score (NPS) reviews")
public class FeedbackController {

    private final FeedbackService feedbackService;

    @GetMapping("/verify/{token}")
    @Operation(summary = "Verify Feedback Survey Token (Public)", description = "Validates if single-use survey token is valid, active, and not yet completed.")
    public ResponseEntity<FeedbackVerifyResponse> verifyFeedbackToken(@PathVariable String token) {
        return ResponseEntity.ok(feedbackService.verifyFeedbackToken(token));
    }

    @PostMapping("/submit")
    @Operation(summary = "Submit Customer Feedback Survey (Public)", description = "Guest submits ratings (1-5 stars) for Hospitality, Facility, Objectives, and NPS (0-10) with comments.")
    public ResponseEntity<FeedbackDetailResponse> submitFeedback(@Valid @RequestBody SubmitFeedbackRequest request) {
        return ResponseEntity.ok(feedbackService.submitFeedback(request));
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasAnyAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN, T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).BUSINESS_SPONSOR, T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).APPROVER)")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Executive Feedback & CSAT Analytics", description = "Computes aggregated CSAT percentage, Net Promoter Score (NPS), rating averages, and recent guest reviews.")
    public ResponseEntity<FeedbackAnalyticsResponse> getFeedbackAnalytics() {
        return ResponseEntity.ok(feedbackService.getFeedbackAnalytics());
    }

    @GetMapping("/visit/{visitId}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Fetch Feedback by Visit ID", description = "Fetches submitted survey details for a specific completed visit.")
    public ResponseEntity<FeedbackDetailResponse> getFeedbackByVisitId(@PathVariable UUID visitId) {
        return ResponseEntity.ok(feedbackService.getFeedbackByVisitId(visitId));
    }

    @PostMapping("/resend/{visitId}")
    @PreAuthorize("hasAnyAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN, T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).RELATIONSHIP_MANAGER)")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Resend Feedback Survey Invitation Email", description = "Re-sends survey invitation email via MailHog for a completed visit.")
    public ResponseEntity<Map<String, String>> resendFeedbackInvitation(@PathVariable UUID visitId) {
        feedbackService.resendFeedbackInvitation(visitId);
        return ResponseEntity.ok(Map.of(
                "message", "Feedback survey invitation successfully re-sent to guest email.",
                "visitId", visitId.toString()
        ));
    }
}
