package com.example.coop_vsit_hub.organization_management.service;

import com.example.coop_vsit_hub.organization_management.dto.*;
import com.example.coop_vsit_hub.user_and_auth.dto.PageResponse;

import java.util.UUID;

/**
 * Service Contract for Guest & Partner Organizations Intelligence.
 */
public interface OrganizationService {

    /**
     * Search and list organizations with dynamic filtering and pagination.
     */
    PageResponse<OrganizationSummaryResponse> getAllOrganizations(
            String search,
            String category,
            String marketCountry,
            String industrySector,
            Integer minScore,
            Integer maxScore,
            int page,
            int size,
            String sortBy,
            String sortDirection
    );

    /**
     * Retrieve full organization intelligence profile including past visits and pipeline value.
     */
    OrganizationDetailResponse getOrganizationById(UUID id);

    /**
     * Compute portfolio statistics and categorization breakdowns.
     */
    OrganizationPortfolioStatsResponse getPortfolioStatistics();

    /**
     * Register a new guest partner organization.
     */
    OrganizationDetailResponse createOrganization(CreateOrganizationRequest request, String authenticatedUsername);

    /**
     * Update organization profile and relationship score.
     */
    OrganizationDetailResponse updateOrganization(UUID id, UpdateOrganizationRequest request, String authenticatedUsername);

    /**
     * Delete organization (with safeguard if referenced in active visits).
     */
    void deleteOrganization(UUID id, String authenticatedUsername);
}
