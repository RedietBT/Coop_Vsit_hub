package com.example.coop_vsit_hub.report_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportSummaryDto {
    private long totalVisitors;
    private String topDepartment;
    private long topDepartmentVisitorsCount;
    private String topMeetingRoom;
    private long topMeetingRoomVisitorsCount;
    private BigDecimal totalOpportunityUSD;
    private long activeVisitorsCount;
    private long completedVisitorsCount;

    // Dynamic Tab 2: Room Activity & Dwell Durations
    private List<DepartmentActivityDto> roomDistribution;
    private List<DepartmentDwellDto> roomDwellStats;

    // Dynamic Department Activity & Dwell Durations
    private List<DepartmentActivityDto> departmentDistribution;
    private List<DepartmentDwellDto> departmentDwellStats;

    // Dynamic Tab 3: Strategic Opportunity & Financial Valuation
    private BigDecimal totalActivePipeline;
    private double conversionRate;
    private BigDecimal avgDealSize;
    private long totalDealsCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartmentActivityDto {
        private String name;
        private long count;
        private String pct;
        private String floor;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartmentDwellDto {
        private String name;
        private long avgMinutes;
        private String formattedDuration;
        private String subtitle;
    }
}
