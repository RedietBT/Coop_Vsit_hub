package com.example.coop_vsit_hub.report_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportSummaryDto {
    private long totalVisitors;
    private String topDepartment;
    private long topDepartmentVisitorsCount;
    private BigDecimal totalOpportunityUSD;
    private long activeVisitorsCount;
    private long completedVisitorsCount;
}
