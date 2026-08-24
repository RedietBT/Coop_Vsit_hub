package com.example.coop_vsit_hub.analytics_management.controller;

import com.example.coop_vsit_hub.analytics_management.dto.ExecutiveDashboardResponse;
import com.example.coop_vsit_hub.analytics_management.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API Controller for Bank Executive Analytics & Real-Time Cockpit.
 */
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "5. Executive Analytics", description = "Pipeline financial valuation ($M), conversion ratios, and executive reporting")
@SecurityRequirement(name = "bearerAuth")
public class AnalyticsDashboardController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN, T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).BUSINESS_SPONSOR, T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).APPROVER, T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).RELATIONSHIP_MANAGER)")
    @Operation(summary = "Executive Cockpit & Bank Analytics Dashboard", description = "Retrieves unified executive KPIs: pipeline valuation ($M USD), conversion rates, CSAT/NPS scores, lifecycle status distribution, and upcoming schedule.")
    public ResponseEntity<ExecutiveDashboardResponse> getExecutiveDashboard() {
        return ResponseEntity.ok(analyticsService.getExecutiveDashboard());
    }
}
