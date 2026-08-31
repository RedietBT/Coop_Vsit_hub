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

    @org.springframework.beans.factory.annotation.Value("${coopbank.app.frontend-url:${app.frontend.url:http://localhost:3000}}")
    private String frontendUrl;

    @GetMapping("/verify/{token}")
    @Operation(summary = "Verify Feedback Survey Token (Public)", description = "Validates if single-use survey token is valid, active, and not yet completed.")
    public ResponseEntity<?> verifyFeedbackToken(
            @PathVariable String token,
            @RequestHeader(value = "Accept", required = false) String acceptHeader
    ) {
        FeedbackVerifyResponse response = feedbackService.verifyFeedbackToken(token);
        if (acceptHeader != null && acceptHeader.contains("text/html")) {
            String target = (org.springframework.util.StringUtils.hasText(frontendUrl) ? frontendUrl.trim() : "http://localhost:3000") + "/feedback/" + token;
            return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                    .location(java.net.URI.create(target))
                    .build();
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/submit")
    @Operation(summary = "Submit Customer Feedback Survey (Public)", description = "Guest submits ratings (1-5 stars) for Hospitality, Facility, Objectives, and NPS (0-10) with comments.")
    public ResponseEntity<FeedbackDetailResponse> submitFeedback(@Valid @RequestBody SubmitFeedbackRequest request) {
        return ResponseEntity.ok(feedbackService.submitFeedback(request));
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasAnyAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN, T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).APPROVER)")
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

    @PutMapping("/{id}/pin")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Toggle Admin Pin for Feedback", description = "Pins/unpins feedback comment to display on the Executive Analytics Cockpit.")
    public ResponseEntity<FeedbackDetailResponse> togglePinFeedback(
            @PathVariable UUID id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails
    ) {
        String adminUsername = userDetails != null ? userDetails.getUsername() : "admin";
        return ResponseEntity.ok(feedbackService.togglePinFeedback(id, adminUsername));
    }

    @GetMapping("/pinned")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get Pinned Feedback Reviews", description = "Retrieves all admin-pinned feedback comments for the Executive Analytics Cockpit.")
    public ResponseEntity<java.util.List<FeedbackDetailResponse>> getPinnedFeedbacks() {
        return ResponseEntity.ok(feedbackService.getPinnedFeedbacks());
    }

    @GetMapping("/guest/{guestId}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get Guest Feedbacks", description = "Retrieves all submitted feedback surveys for an individual guest.")
    public ResponseEntity<java.util.List<FeedbackDetailResponse>> getFeedbacksByGuestId(@PathVariable UUID guestId) {
        return ResponseEntity.ok(feedbackService.getFeedbacksByGuestId(guestId));
    }

    @GetMapping("/organization/{orgId}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get Organization Feedbacks", description = "Retrieves all submitted feedback surveys for an organization.")
    public ResponseEntity<java.util.List<FeedbackDetailResponse>> getFeedbacksByOrganizationId(@PathVariable UUID orgId) {
        return ResponseEntity.ok(feedbackService.getFeedbacksByOrganizationId(orgId));
    }
}
