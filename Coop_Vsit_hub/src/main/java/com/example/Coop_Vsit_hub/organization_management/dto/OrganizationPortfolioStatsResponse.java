package com.example.coop_vsit_hub.organization_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Portfolio Intelligence & Analytics response DTO.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationPortfolioStatsResponse {

    private long totalOrganizations;
    private double averageRelationshipScore;
    private Map<String, Long> organizationsByCategory;
    private Map<String, Long> organizationsByCountry;
    private Map<String, Long> organizationsByIndustry;
}
