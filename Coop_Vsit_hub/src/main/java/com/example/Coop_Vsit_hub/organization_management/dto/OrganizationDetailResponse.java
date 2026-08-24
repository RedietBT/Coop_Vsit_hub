package com.example.coop_vsit_hub.organization_management.dto;

import com.example.coop_vsit_hub.visit_management.dto.VisitSummaryResponse;
import com.example.coop_vsit_hub.visit_management.model.Organization;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Detailed profile of a guest organization with past visit records & pipeline stats.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationDetailResponse {

    private UUID id;
    private String name;
    private String category;
    private String marketCountry;
    private int relationshipScore;
    private String contactPersonName;
    private String contactEmail;
    private String contactPhone;
    private String website;
    private String industrySector;
    private String notes;
    private long totalVisitsHosted;
    private BigDecimal totalOpportunityPipelineValue;
    private String currency;
    private List<VisitSummaryResponse> recentVisits;
    private Instant createdAt;
    private Instant updatedAt;

    public static OrganizationDetailResponse from(
            Organization org,
            long totalVisits,
            BigDecimal pipelineValue,
            List<VisitSummaryResponse> recentVisits
    ) {
        return OrganizationDetailResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .category(org.getCategory())
                .marketCountry(org.getMarketCountry())
                .relationshipScore(org.getRelationshipScore())
                .contactPersonName(org.getContactPersonName())
                .contactEmail(org.getContactEmail())
                .contactPhone(org.getContactPhone())
                .website(org.getWebsite())
                .industrySector(org.getIndustrySector())
                .notes(org.getNotes())
                .totalVisitsHosted(totalVisits)
                .totalOpportunityPipelineValue(pipelineValue != null ? pipelineValue : BigDecimal.ZERO)
                .currency("USD")
                .recentVisits(recentVisits)
                .createdAt(org.getCreatedAt())
                .updatedAt(org.getUpdatedAt())
                .build();
    }
}
