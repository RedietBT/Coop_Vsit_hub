package com.example.coop_vsit_hub.visit_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Executive Metrics & Analytics DTO for visits lifecycle tracking.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitStatsResponse {

    private long totalVisits;
    private BigDecimal activePipelineValue;
    private String pipelineCurrency;
    private long upcomingScheduledVisitsCount;
    private long inProgressVisitsCount;
    private long completedVisitsCount;
    private long awaitingApprovalCount;
    private Map<String, Long> visitsByStatus;
    private Map<String, Long> visitsByPriority;
    private Map<String, Long> visitsByDepartment;
}
