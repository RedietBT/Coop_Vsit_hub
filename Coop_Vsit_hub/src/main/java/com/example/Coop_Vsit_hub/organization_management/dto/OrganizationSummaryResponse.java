package com.example.coop_vsit_hub.organization_management.dto;

import com.example.coop_vsit_hub.visit_management.model.Organization;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Lightweight DTO for Guest Organization register and dropdown selections.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationSummaryResponse {

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
    private long totalVisits;
    private Double starRating;
    private Instant createdAt;

    public static OrganizationSummaryResponse from(Organization org) {
        return from(org, 0);
    }

    public static OrganizationSummaryResponse from(Organization org, long totalVisits) {
        double stars = Math.round((Math.max(20, org.getRelationshipScore()) / 20.0) * 10.0) / 10.0;
        return OrganizationSummaryResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .category(org.getCategory())
                .marketCountry(org.getMarketCountry())
                .relationshipScore(org.getRelationshipScore())
                .starRating(stars)
                .contactPersonName(org.getContactPersonName())
                .contactEmail(org.getContactEmail())
                .contactPhone(org.getContactPhone())
                .website(org.getWebsite())
                .industrySector(org.getIndustrySector())
                .totalVisits(totalVisits)
                .createdAt(org.getCreatedAt())
                .build();
    }
}
