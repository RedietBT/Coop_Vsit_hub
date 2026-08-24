package com.example.coop_vsit_hub.analytics_management.dto;

import com.example.coop_vsit_hub.organization_management.dto.OrganizationSummaryResponse;
import com.example.coop_vsit_hub.individual_guest_management.dto.IndividualGuestSummaryResponse;
import com.example.coop_vsit_hub.user_and_auth.dto.AuditLogResponse;
import com.example.coop_vsit_hub.visit_management.dto.VisitSummaryResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * High-Level Bank Executive Cockpit & Analytics Response DTO.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutiveDashboardResponse {

    // 1. Financial Pipeline KPIs ($M USD)
    private BigDecimal totalPipelineValue;
    private BigDecimal realizedCompletedValue;
    private BigDecimal activePipelineValue;
    private BigDecimal pendingReviewValue;
    private BigDecimal averageDealSize;
    private String currency;

    // 2. Conversion & Operational Rates
    private long totalVisitsCount;
    private long completedVisitsCount;
    private long approvedVisitsCount;
    private long inProgressVisitsCount;
    private long awaitingApprovalCount;
    private double conversionRatePercentage;
    private double approvalRatePercentage;
    private double averageVisitDurationMinutes;

    // 3. Customer Satisfaction & Feedback Intelligence
    private double csatScorePercentage;
    private int netPromoterScore;
    private double surveyResponseRatePercentage;
    private double averageHospitalityRating;
    private double averageFacilityRating;
    private double averageObjectiveRating;

    // 4. Partner & Guest Metrics
    private long totalPartnerOrganizations;
    private long totalIndividualGuests;
    private double averageOrganizationRelationshipScore;
    private double averageIndividualGuestRelationshipScore;

    // 5. Multi-Dimensional Distributions
    private Map<String, Long> visitsByStatus;
    private Map<String, Long> visitsByPriority;
    private Map<String, Long> visitsByDepartment;

    // 6. Top Entities & Timelines
    private List<OrganizationSummaryResponse> topPartnerOrganizations;
    private List<IndividualGuestSummaryResponse> topVipGuests;
    private List<VisitSummaryResponse> upcomingScheduledVisits;
    private List<AuditLogResponse> recentAuditActivities;
}
