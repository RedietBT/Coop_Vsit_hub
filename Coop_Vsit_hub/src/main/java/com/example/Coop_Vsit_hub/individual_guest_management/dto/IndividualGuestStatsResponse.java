package com.example.coop_vsit_hub.individual_guest_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Aggregated individual guest statistics & VIP tier distribution.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndividualGuestStatsResponse {

    private long totalIndividualGuests;
    private double averageRelationshipScore;
    private Map<String, Long> guestsByVipTier;
    private Map<String, Long> guestsByCountry;
    private Map<String, Long> guestsByIdType;
}
