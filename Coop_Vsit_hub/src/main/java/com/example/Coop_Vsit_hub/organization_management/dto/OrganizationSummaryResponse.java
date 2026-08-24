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
    private Instant createdAt;

    public static OrganizationSummaryResponse from(Organization org) {
        return OrganizationSummaryResponse.builder()
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
                .createdAt(org.getCreatedAt())
                .build();
    }
}
