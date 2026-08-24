package com.example.coop_vsit_hub.individual_guest_management.service;

import com.example.coop_vsit_hub.individual_guest_management.dto.*;
import com.example.coop_vsit_hub.individual_guest_management.enums.IdentityDocumentType;
import com.example.coop_vsit_hub.individual_guest_management.enums.VipTier;
import com.example.coop_vsit_hub.user_and_auth.dto.PageResponse;

import java.util.UUID;

/**
 * Service contract for VIP & Individual Guest Intelligence.
 */
public interface IndividualGuestService {

    /**
     * Paginated and filtered search across individual guest profiles.
     */
    PageResponse<IndividualGuestSummaryResponse> getAllIndividualGuests(
            String search,
            VipTier vipTier,
            IdentityDocumentType idType,
            String country,
            String affiliation,
            Integer minScore,
            Integer maxScore,
            int page,
            int size,
            String sortBy,
            String sortDirection
    );

    /**
     * Fetch complete guest profile, identity verification, and visit history.
     */
    IndividualGuestDetailResponse getIndividualGuestById(UUID id);

    /**
     * Portfolio statistics, VIP tier breakdown, and country distribution.
     */
    IndividualGuestStatsResponse getIndividualGuestStats();

    /**
     * Register a new VIP or independent guest.
     */
    IndividualGuestDetailResponse createIndividualGuest(CreateIndividualGuestRequest request, String createdBy);

    /**
     * Update individual guest profile, VIP tier, and relationship score.
     */
    IndividualGuestDetailResponse updateIndividualGuest(UUID id, UpdateIndividualGuestRequest request, String updatedBy);

    /**
     * Remove individual guest profile (safeguarded against guests with active visits).
     */
    void deleteIndividualGuest(UUID id, String deletedBy);
}
